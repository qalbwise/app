import base64
import hashlib
import json
import os
import secrets
from typing import Any
from urllib.parse import urlencode

import httpx
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.redis import get_redis
from app.core.settings import get_settings
from app.models.user import User

OAUTH_STATE_PREFIX = "qf_oauth_state:"
SESSION_CODE_PREFIX = "qf_session_code:"


def base64url(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).decode().rstrip("=")


def generate_pkce_pair() -> tuple[str, str]:
    code_verifier = base64url(os.urandom(32))
    code_challenge = base64url(hashlib.sha256(code_verifier.encode()).digest())
    return code_verifier, code_challenge


def random_string(bytes_count: int = 16) -> str:
    return secrets.token_hex(bytes_count)


async def store_oauth_state(redis_conn, state: str, data: dict, ttl: int = 600) -> None:
    key = f"{OAUTH_STATE_PREFIX}{state}"
    await redis_conn.setex(key, ttl, json.dumps(data))


async def get_oauth_state(redis_conn, state: str) -> dict | None:
    key = f"{OAUTH_STATE_PREFIX}{state}"
    raw = await redis_conn.get(key)
    if raw is None:
        return None
    await redis_conn.delete(key)
    return json.loads(raw)


async def store_session_code(
    redis_conn, code: str, user_id: str, ttl: int = 120
) -> None:
    key = f"{SESSION_CODE_PREFIX}{code}"
    await redis_conn.setex(key, ttl, user_id)


async def consume_session_code(redis_conn, code: str) -> str | None:
    key = f"{SESSION_CODE_PREFIX}{code}"
    raw = await redis_conn.get(key)
    if raw is None:
        return None
    await redis_conn.delete(key)
    return raw


def _get_qf_config() -> dict:
    s = get_settings()
    return {
        "client_id": s.QF_CLIENT_ID,
        "client_secret": s.QF_CLIENT_SECRET,
        "auth_base_url": s.QF_AUTH_BASE_URL.rstrip("/"),
        "api_base_url": s.QF_API_BASE_URL.rstrip("/"),
    }


def build_authorization_url(
    client_id: str,
    auth_base_url: str,
    redirect_uri: str,
    scope: str,
    state: str,
    nonce: str,
    code_challenge: str,
) -> str:
    params = {
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "scope": scope,
        "state": state,
        "nonce": nonce,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
    }
    return f"{auth_base_url}/oauth2/auth?{urlencode(params)}"


async def exchange_code_for_tokens(
    code: str, code_verifier: str, redirect_uri: str
) -> dict[str, Any] | None:
    cfg = _get_qf_config()
    if not cfg["client_secret"]:
        logger.error("QF_CLIENT_SECRET is not configured")
        return None

    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": redirect_uri,
        "code_verifier": code_verifier,
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{cfg['auth_base_url']}/oauth2/token",
                data=data,
                auth=(cfg["client_id"], cfg["client_secret"]),
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            resp.raise_for_status()
            return resp.json()
    except httpx.HTTPError as e:
        logger.error("QF token exchange failed: {}", e)
        return None


async def refresh_qf_access_token(
    qf_refresh_token: str,
) -> dict[str, Any] | None:
    cfg = _get_qf_config()
    if not cfg["client_secret"]:
        logger.error("QF_CLIENT_SECRET is not configured")
        return None

    data = {
        "grant_type": "refresh_token",
        "refresh_token": qf_refresh_token,
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{cfg['auth_base_url']}/oauth2/token",
                data=data,
                auth=(cfg["client_id"], cfg["client_secret"]),
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            resp.raise_for_status()
            return resp.json()
    except httpx.HTTPError as e:
        logger.error("QF token refresh failed: {}", e)
        return None


async def call_qf_api(
    access_token: str,
    path: str,
    *,
    method: str = "GET",
    params: dict[str, Any] | None = None,
    json_body: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    cfg = _get_qf_config()
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.request(
                method,
                f"{cfg['api_base_url']}{path}",
                params=params,
                json=json_body,
                headers={
                    "x-auth-token": access_token,
                    "x-client-id": cfg["client_id"],
                },
            )
            resp.raise_for_status()
            if resp.status_code == 204:
                return {"success": True}
            return resp.json()
    except httpx.HTTPStatusError as e:
        logger.error(
            "QF User API call failed: {} {} {} - {}",
            method,
            path,
            e.response.status_code,
            e.response.text,
        )
        return None
    except httpx.HTTPError as e:
        logger.error("QF User API call failed: {} {} {}", method, path, e)
        return None


async def get_valid_qf_access_token(db: AsyncSession, user: User) -> str | None:
    if not user.qf_refresh_token:
        return None

    redis_conn = await get_redis()
    cache_key = f"{_USER_TOKEN_PREFIX}{user.id}"
    cached = await redis_conn.get(cache_key)
    if cached:
        return cached.decode() if isinstance(cached, bytes) else cached

    token_data = await refresh_qf_access_token(user.qf_refresh_token)
    if token_data is None:
        return None

    new_access = token_data.get("access_token")
    new_refresh = token_data.get("refresh_token")
    expires_in = token_data.get("expires_in", 3600)

    if new_refresh:
        user.qf_refresh_token = new_refresh
        await db.commit()

    if new_access:
        await redis_conn.setex(cache_key, expires_in - 60, new_access)

    return new_access


async def login_or_create_user(
    db: AsyncSession,
    qf_sub: str,
    email: str | None,
    first_name: str | None,
    last_name: str | None,
    qf_refresh_token: str | None,
    qf_id_token: str | None = None,
) -> User:
    result = await db.execute(select(User).where(User.qf_sub == qf_sub))
    user = result.scalar_one_or_none()

    if user:
        if qf_refresh_token:
            user.qf_refresh_token = qf_refresh_token
        if qf_id_token:
            user.qf_id_token = qf_id_token
        await db.commit()
        await db.refresh(user)
        return user

    if email:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user:
            user.qf_sub = qf_sub
            if qf_refresh_token:
                user.qf_refresh_token = qf_refresh_token
            if qf_id_token:
                user.qf_id_token = qf_id_token
            await db.commit()
            await db.refresh(user)
            return user

    full_name = f"{first_name or ''} {last_name or ''}".strip() or email or qf_sub
    user = User(
        email=email or f"{qf_sub}@qf.user",
        full_name=full_name,
        qf_sub=qf_sub,
        qf_refresh_token=qf_refresh_token,
        qf_id_token=qf_id_token,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


_CONTENT_TOKEN_KEY = "qf_content_token"
_CHAPTERS_CACHE_KEY = "qf_chapters"
_USER_TOKEN_PREFIX = "qf_user_token:"


async def get_content_api_token() -> str | None:
    redis_conn = await get_redis()
    cached = await redis_conn.get(_CONTENT_TOKEN_KEY)
    if cached:
        return cached.decode() if isinstance(cached, bytes) else cached

    cfg = _get_qf_config()
    if not cfg["client_secret"]:
        return None

    data = {
        "grant_type": "client_credentials",
        "scope": "content",
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{cfg['auth_base_url']}/oauth2/token",
                data=data,
                auth=(cfg["client_id"], cfg["client_secret"]),
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            resp.raise_for_status()
            result = resp.json()
            access_token = result.get("access_token")
            expires_in = result.get("expires_in", 3600)
            if access_token:
                await redis_conn.setex(
                    _CONTENT_TOKEN_KEY, expires_in - 60, access_token
                )
            return access_token
    except httpx.HTTPError as e:
        logger.error("QF content API token request failed: {}", e)
        return None


async def fetch_chapters(language: str = "en") -> dict[int, str] | None:
    redis_conn = await get_redis()
    cached = await redis_conn.get(_CHAPTERS_CACHE_KEY)
    if cached:
        raw = cached.decode() if isinstance(cached, bytes) else cached
        return json.loads(raw)

    token = await get_content_api_token()
    if not token:
        return None

    cfg = _get_qf_config()
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{cfg['api_base_url']}/content/api/v4/chapters",
                params={"language": language},
                headers={
                    "x-auth-token": token,
                    "x-client-id": cfg["client_id"],
                },
            )
            resp.raise_for_status()
            data = resp.json()

        chapters = {ch["id"]: ch["name_simple"] for ch in data.get("chapters", [])}
        await redis_conn.setex(_CHAPTERS_CACHE_KEY, 86400, json.dumps(chapters))
        return chapters
    except httpx.HTTPError as e:
        logger.error("QF chapters fetch failed: {}", e)
        return None


async def fetch_verses_by_keys(
    verse_keys: list[str],
    mushaf_id: int = 4,
) -> dict[str, dict[str, Any]]:
    result = {}
    try:
        async with httpx.AsyncClient() as client:
            for key in verse_keys:
                url = f"https://api.quran.com/api/v4/verses/by_key/{key}"
                resp = await client.get(
                    url,
                    params={
                        "words": "false",
                        "translations": "131,20",
                        "fields": "text_uthmani",
                    },
                )
                if resp.status_code != 200:
                    logger.warning(
                        "Quran.com API verse fetch failed for {}: {}",
                        key,
                        resp.status_code,
                    )
                    continue

                data = resp.json()
                v = data.get("verse", {})
                translations = v.get("translations", [])
                translation_text = ""
                if translations and isinstance(translations, list):
                    translation_text = translations[0].get("text", "")

                result[key] = {
                    "arabic_text": v.get("text_uthmani", ""),
                    "translation": translation_text,
                }
    except httpx.HTTPError as e:
        logger.error("Quran.com API verse fetch failed: {}", e)

    return result
