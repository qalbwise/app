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
            return resp.json()
    except httpx.HTTPError as e:
        logger.error("QF User API call failed: {} {} {}", method, path, e)
        return None


async def get_valid_qf_access_token(db: AsyncSession, user: User) -> str | None:
    if not user.qf_refresh_token:
        return None

    token_data = await refresh_qf_access_token(user.qf_refresh_token)
    if token_data is None:
        return None

    new_access = token_data.get("access_token")
    new_refresh = token_data.get("refresh_token")

    if new_refresh:
        user.qf_refresh_token = new_refresh
        await db.commit()

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
