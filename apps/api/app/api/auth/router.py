from uuid import UUID

import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from loguru import logger
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.datastructures import URL

from app.api.auth.serializer import (
    GoogleLoginRequest,
    QfAuthorizeResponse,
    QfExchangeRequest,
    RefreshRequest,
    TokenResponse,
    UserResponse,
)
from app.core.database import get_db
from app.core.redis import get_redis
from app.core.security.jwt import (
    create_access_token,
    create_refresh_token,
    verify_token,
)
from app.models.user import User
from app.modules.auth import qf_service, service
from app.modules.users import service as users_service

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()
limiter = Limiter(key_func=get_remote_address)


class GoogleAccessTokenRequest(BaseModel):
    access_token: str


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/15minutes")
async def login(
    req: GoogleLoginRequest, request: Request, db: AsyncSession = Depends(get_db)
):
    tokens = await service.login_google(db, req.id_token)
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        )
    access, refresh = tokens
    return TokenResponse(access_token=access, refresh_token=refresh)


@router.post("/login/access-token", response_model=TokenResponse)
@limiter.limit("5/15minutes")
async def login_with_access_token(
    req: GoogleAccessTokenRequest, request: Request, db: AsyncSession = Depends(get_db)
):
    tokens = await service.login_google_access_token(db, req.access_token)
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google access token",
        )
    access, refresh = tokens
    return TokenResponse(access_token=access, refresh_token=refresh)


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("5/15minutes")
async def refresh(
    req: RefreshRequest, request: Request, db: AsyncSession = Depends(get_db)
):
    tokens = await service.refresh(db, req.refresh_token)
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    access, refresh = tokens
    return TokenResponse(access_token=access, refresh_token=refresh)


@router.post("/logout")
async def logout():
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return users_service.build_user_response(current_user)


# ─── Quran Foundation OAuth2 ─────────────────────────────────────────────────


@router.post("/qf/authorize", response_model=QfAuthorizeResponse)
async def qf_authorize(request: Request):
    from app.core.settings import get_settings

    settings = get_settings()

    if not settings.QF_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Quran Foundation OAuth2 is not configured",
        )

    code_verifier, code_challenge = qf_service.generate_pkce_pair()
    state = qf_service.random_string(16)
    nonce = qf_service.random_string(16)

    callback_url = settings.QF_REDIRECT_URI or str(
        URL.replace(
            request.url,
            path=request.app.url_path_for("qf_callback"),
        )
    )

    scope = "openid offline_access user collection bookmark"

    oauth_data = {
        "code_verifier": code_verifier,
        "nonce": nonce,
        "redirect_uri": callback_url,
        "scope": scope,
    }

    redis_conn = await get_redis()
    await qf_service.store_oauth_state(redis_conn, state, oauth_data)

    auth_url = qf_service.build_authorization_url(
        client_id=settings.QF_CLIENT_ID,
        auth_base_url=settings.QF_AUTH_BASE_URL,
        redirect_uri=callback_url,
        scope=scope,
        state=state,
        nonce=nonce,
        code_challenge=code_challenge,
    )

    return QfAuthorizeResponse(auth_url=auth_url, state=state)


@router.get("/qf/callback", name="qf_callback")
async def qf_callback(
    code: str,
    state: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    redis_conn = await get_redis()
    oauth_data = await qf_service.get_oauth_state(redis_conn, state)

    if oauth_data is None:
        logger.warning("QF OAuth state not found or already used (state={})", state)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired state parameter",
        )

    token_data = await qf_service.exchange_code_for_tokens(
        code=code,
        code_verifier=oauth_data["code_verifier"],
        redirect_uri=oauth_data["redirect_uri"],
    )

    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to exchange authorization code with Quran Foundation",
        )

    id_token_str = token_data.get("id_token", "")
    qf_refresh_token = token_data.get("refresh_token", "")

    id_claims: dict = {}
    if id_token_str:
        try:
            id_claims = jwt.decode(id_token_str, options={"verify_signature": False})
        except Exception:
            logger.warning("Failed to decode QF id_token")

    qf_sub = id_claims.get("sub", "")
    if not qf_sub:
        logger.error("QF token response missing `sub` claim")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Invalid token response from Quran Foundation",
        )

    user = await qf_service.login_or_create_user(
        db=db,
        qf_sub=qf_sub,
        email=id_claims.get("email"),
        first_name=id_claims.get("first_name"),
        last_name=id_claims.get("last_name"),
        qf_refresh_token=qf_refresh_token or None,
        qf_id_token=id_token_str or None,
    )

    session_code = qf_service.random_string(16)
    await qf_service.store_session_code(redis_conn, session_code, str(user.id))

    frontend_url = getattr(request.app.state, "frontend_url", None)
    if not frontend_url:
        from app.core.settings import get_settings

        frontend_url = get_settings().FRONTEND_URL

    redirect_to = f"{frontend_url.rstrip('/')}/qf-callback?session_code={session_code}"
    return RedirectResponse(url=redirect_to, status_code=302)


@router.post("/qf/exchange", response_model=TokenResponse)
@limiter.limit("5/15minutes")
async def qf_exchange(
    req: QfExchangeRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    redis_conn = await get_redis()
    user_id_str = await qf_service.consume_session_code(redis_conn, req.session_code)

    if user_id_str is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired session code",
        )

    result = await db.execute(select(User).where(User.id == UUID(user_id_str)))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    access = create_access_token(user.id)
    refresh = create_refresh_token(user.id)
    return TokenResponse(access_token=access, refresh_token=refresh)


@router.get("/qf/user")
async def qf_get_user(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    access_token = await qf_service.get_valid_qf_access_token(db, current_user)
    if access_token is None:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to obtain QF access token",
        )

    data = await qf_service.call_qf_api(access_token, "/auth/v1/users/me")
    if data is None:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to fetch user from Quran Foundation",
        )

    return data
