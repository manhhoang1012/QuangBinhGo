from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth, OAuthError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import (
    AuthResponse,
    DevTokenResponse,
    ForgotPasswordRequest,
    LoginRequest,
    LogoutResponse,
    ResendVerificationRequest,
    ResetPasswordRequest,
    RefreshTokenRequest,
    UserCreate,
    VerifyEmailRequest,
)
from app.services.auth_service import AuthService
from app.services.oauth_service import OAuthService

router = APIRouter()
oauth = OAuth()

if settings.google_client_id and settings.google_client_secret:
    oauth.register(
        name="google",
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )

if settings.facebook_client_id and settings.facebook_client_secret:
    oauth.register(
        name="facebook",
        client_id=settings.facebook_client_id,
        client_secret=settings.facebook_client_secret,
        access_token_url="https://graph.facebook.com/v19.0/oauth/access_token",
        authorize_url="https://www.facebook.com/v19.0/dialog/oauth",
        api_base_url="https://graph.facebook.com/v19.0/",
        client_kwargs={"scope": "email public_profile"},
    )


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(UserRepository(db))


def get_oauth_service(db: Session = Depends(get_db)) -> OAuthService:
    return OAuthService(UserRepository(db))


def provider_redirect_uri(provider: str) -> str:
    return f"{settings.backend_url.rstrip('/')}{settings.api_v1_prefix}/auth/{provider}/callback"


def require_provider(provider: str):
    client = oauth.create_client(provider)
    if not client:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"{provider.title()} OAuth is not configured.")
    return client


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_create: UserCreate,
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    return auth_service.register(user_create)


@router.post("/login", response_model=AuthResponse)
def login(
    login_request: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    return auth_service.login(login_request)


@router.post("/logout", response_model=LogoutResponse)
def logout(
    request: RefreshTokenRequest | None = None,
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
) -> LogoutResponse:
    return auth_service.logout(refresh_token=request.refresh_token if request else None, current_user=current_user)


@router.post("/forgot-password", response_model=DevTokenResponse)
def forgot_password(
    request: ForgotPasswordRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> DevTokenResponse:
    return auth_service.forgot_password(request.email)


@router.post("/reset-password", response_model=LogoutResponse)
def reset_password(
    request: ResetPasswordRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> LogoutResponse:
    return auth_service.reset_password(request)


@router.post("/verify-email", response_model=LogoutResponse)
def verify_email(
    request: VerifyEmailRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> LogoutResponse:
    return auth_service.verify_email(request.token)


@router.post("/resend-verification-email", response_model=DevTokenResponse)
def resend_verification_email(
    request: ResendVerificationRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> DevTokenResponse:
    return auth_service.resend_verification_email(request.email)


@router.post("/refresh", response_model=AuthResponse)
@router.post("/refresh-token", response_model=AuthResponse)
def refresh_token(
    request: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    return auth_service.refresh_token(request.refresh_token)


@router.get("/google/login")
async def google_login(request: Request):
    client = require_provider("google")
    return await client.authorize_redirect(request, provider_redirect_uri("google"))


@router.get("/google/callback")
async def google_callback(
    request: Request,
    oauth_service: OAuthService = Depends(get_oauth_service),
):
    try:
        client = require_provider("google")
        token = await client.authorize_access_token(request)
        user_info = token.get("userinfo") or await client.parse_id_token(request, token)
        user = oauth_service.authenticate(
            provider="google",
            provider_id=str(user_info.get("sub")),
            email=user_info.get("email"),
            email_verified=user_info.get("email_verified"),
            full_name=user_info.get("name"),
            avatar_url=user_info.get("picture"),
        )
        return RedirectResponse(oauth_service.frontend_success_url(user))
    except (OAuthError, HTTPException) as exc:
        message = exc.detail if isinstance(exc, HTTPException) else "Google OAuth failed."
        return RedirectResponse(oauth_service.frontend_error_url(str(message)))


@router.get("/facebook/login")
async def facebook_login(request: Request):
    client = require_provider("facebook")
    return await client.authorize_redirect(request, provider_redirect_uri("facebook"))


@router.get("/facebook/callback")
async def facebook_callback(
    request: Request,
    oauth_service: OAuthService = Depends(get_oauth_service),
):
    try:
        client = require_provider("facebook")
        token = await client.authorize_access_token(request)
        response = await client.get("me", token=token, params={"fields": "id,name,email,picture.type(large)"})
        profile = response.json()
        picture = profile.get("picture", {}).get("data", {}).get("url")
        user = oauth_service.authenticate(
            provider="facebook",
            provider_id=str(profile.get("id")),
            email=profile.get("email"),
            email_verified=True if profile.get("email") else None,
            full_name=profile.get("name"),
            avatar_url=picture,
        )
        return RedirectResponse(oauth_service.frontend_success_url(user))
    except (OAuthError, HTTPException) as exc:
        message = exc.detail if isinstance(exc, HTTPException) else "Facebook OAuth failed."
        return RedirectResponse(oauth_service.frontend_error_url(str(message)))
