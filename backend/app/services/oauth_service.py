import re
import secrets
from urllib.parse import urlencode

from fastapi import HTTPException, status

from app.core.config import settings
from app.core.security import create_access_token, get_password_hash
from app.models.user import User
from app.repositories.user_repository import UserRepository


class OAuthService:
    def __init__(self, user_repository: UserRepository) -> None:
        self.user_repository = user_repository

    def authenticate(
        self,
        *,
        provider: str,
        provider_id: str,
        email: str | None,
        email_verified: bool | None,
        full_name: str | None,
        avatar_url: str | None,
    ) -> User:
        if not email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OAuth provider did not return an email.")
        if email_verified is False:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="OAuth email is not verified.")

        user = self.user_repository.get_by_oauth_account(provider=provider, provider_id=provider_id)
        if not user:
            user = self.user_repository.get_by_email(email)

        if user:
            if not user.is_active:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account is inactive.")
            if user.deleted_at is not None:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account has been deleted.")
            return self.user_repository.attach_oauth_account(
                user,
                provider=provider,
                provider_id=provider_id,
                avatar_url=avatar_url,
                email_verified=email_verified,
            )

        username = self._unique_username(full_name or email)
        return self.user_repository.create(
            email=email,
            username=username,
            full_name=full_name or email.split("@", 1)[0],
            hashed_password=get_password_hash(secrets.token_urlsafe(32)),
            avatar_url=avatar_url,
            email_verified=email_verified is not False,
            oauth_provider=provider,
            oauth_provider_id=provider_id,
        )

    def frontend_success_url(self, user: User) -> str:
        token = create_access_token(subject=str(user.id))
        return f"{settings.frontend_url.rstrip('/')}/oauth/callback?{urlencode({'token': token})}"

    def frontend_error_url(self, message: str) -> str:
        return f"{settings.frontend_url.rstrip('/')}/oauth/callback?{urlencode({'error': message})}"

    def _unique_username(self, source: str) -> str:
        base_source = source.split("@", 1)[0]
        base = re.sub(r"[^a-zA-Z0-9_-]", "-", base_source).strip("-_").lower()
        if len(base) < 3:
            base = f"user-{secrets.token_hex(3)}"
        base = base[:40]
        username = base
        suffix = 1
        while self.user_repository.get_by_username(username):
            suffix += 1
            username = f"{base[:40]}-{suffix}"
        return username[:50]
