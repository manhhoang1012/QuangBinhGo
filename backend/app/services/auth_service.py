from datetime import datetime, timedelta, timezone
import secrets
import re

from fastapi import HTTPException, status

from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import AuthResponse, DevTokenResponse, LoginRequest, ResetPasswordRequest, UserCreate
from app.services.email_service import EmailService


class AuthService:
    def __init__(self, user_repository: UserRepository, email_service: EmailService | None = None) -> None:
        self.user_repository = user_repository
        self.email_service = email_service or EmailService()

    def register(self, user_create: UserCreate) -> AuthResponse:
        existing_user = self.user_repository.get_by_email(user_create.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this email already exists.",
            )

        username = user_create.username or self._username_from_email(user_create.email)
        get_by_username = getattr(self.user_repository, "get_by_username", None)
        if get_by_username and get_by_username(username):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this username already exists.",
            )

        try:
            user = self.user_repository.create(
                email=user_create.email,
                username=username,
                full_name=user_create.full_name,
                hashed_password=get_password_hash(user_create.password),
            )
        except TypeError:
            user = self.user_repository.create(
                email=user_create.email,
                full_name=user_create.full_name,
                hashed_password=get_password_hash(user_create.password),
            )
            user.username = username

        if hasattr(self.user_repository, "create_auth_token"):
            self.create_verification_token(user)
        return self._build_auth_response(user)

    def login(self, login_request: LoginRequest) -> AuthResponse:
        user = self.user_repository.get_by_email(login_request.email)
        if not user or not verify_password(login_request.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if user.deleted_at is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account has been deleted.",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account is inactive.",
            )

        return self._build_auth_response(user)

    def logout(self) -> dict[str, str]:
        return {"message": "Logged out successfully."}

    def forgot_password(self, email: str) -> DevTokenResponse:
        user = self.user_repository.get_by_email(email)
        if not user:
            return DevTokenResponse(message="If the email exists, password reset instructions were sent.")

        token = self._create_token(user=user, purpose="password_reset", minutes=30)
        dev_url = self.email_service.send_password_reset_email(email=user.email, token=token)
        return DevTokenResponse(
            message="If the email exists, password reset instructions were sent.",
            dev_token=token if dev_url else None,
            dev_url=dev_url,
        )

    def reset_password(self, request: ResetPasswordRequest) -> dict[str, str]:
        if request.new_password != request.confirm_password:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password and confirmation do not match.")

        auth_token = self.user_repository.get_valid_auth_token(token=request.token, purpose="password_reset")
        if not auth_token:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token.")

        user = self.user_repository.get(auth_token.user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reset token.")

        self.user_repository.update_password(user, get_password_hash(request.new_password))
        self.user_repository.mark_token_used(auth_token)
        return {"message": "Password reset successfully."}

    def create_verification_token(self, user: User) -> tuple[str, str | None]:
        token = self._create_token(user=user, purpose="email_verification", minutes=60 * 24)
        dev_url = self.email_service.send_verification_email(email=user.email, token=token)
        return token, dev_url

    def verify_email(self, token: str) -> dict[str, str]:
        auth_token = self.user_repository.get_valid_auth_token(token=token, purpose="email_verification")
        if not auth_token:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification token.")

        user = self.user_repository.get(auth_token.user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification token.")

        user.email_verified = True
        self.user_repository.db.add(user)
        self.user_repository.db.commit()
        self.user_repository.mark_token_used(auth_token)
        return {"message": "Email verified successfully."}

    def resend_verification_email(self, email: str) -> DevTokenResponse:
        user = self.user_repository.get_by_email(email)
        if not user:
            return DevTokenResponse(message="If the email exists, verification instructions were sent.")
        if user.email_verified:
            return DevTokenResponse(message="Email is already verified.")

        token, dev_url = self.create_verification_token(user)
        return DevTokenResponse(
            message="If the email exists, verification instructions were sent.",
            dev_token=token if dev_url else None,
            dev_url=dev_url,
        )

    def refresh_token(self, current_user: User) -> AuthResponse:
        return self._build_auth_response(current_user)

    def _build_auth_response(self, user: User) -> AuthResponse:
        if not getattr(user, "role", None):
            user.role = "admin" if getattr(user, "is_admin", False) else "user"
        if getattr(user, "email_verified", None) is None:
            user.email_verified = False
        access_token = create_access_token(subject=str(user.id))
        return AuthResponse(access_token=access_token, user=user)

    def _create_token(self, *, user: User, purpose: str, minutes: int) -> str:
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=minutes)
        self.user_repository.create_auth_token(user_id=user.id, token=token, purpose=purpose, expires_at=expires_at)
        return token

    def _username_from_email(self, email: str) -> str:
        base = email.split("@", 1)[0]
        normalized = re.sub(r"[^a-zA-Z0-9_-]", "-", base).strip("-_").lower()
        if len(normalized) < 3:
            normalized = f"user-{secrets.token_hex(3)}"
        return normalized[:50]
