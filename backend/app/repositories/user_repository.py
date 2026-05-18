from datetime import datetime, timezone

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.user import AuthToken, User
from app.schemas.user import UserProfileUpdate


class UserRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_email(self, email: str) -> User | None:
        statement = select(User).where(User.email == email, User.deleted_at.is_(None))
        return self.db.scalar(statement)

    def get_by_username(self, username: str) -> User | None:
        statement = select(User).where(User.username == username, User.deleted_at.is_(None))
        return self.db.scalar(statement)

    def get(self, user_id: int) -> User | None:
        user = self.db.get(User, user_id)
        return user if user and user.deleted_at is None else None

    def get_by_oauth_account(self, *, provider: str, provider_id: str) -> User | None:
        statement = select(User).where(
            User.oauth_provider == provider,
            User.oauth_provider_id == provider_id,
            User.deleted_at.is_(None),
        )
        return self.db.scalar(statement)

    def create(
        self,
        *,
        email: str,
        username: str,
        full_name: str,
        hashed_password: str,
        avatar_url: str | None = None,
        email_verified: bool = False,
        oauth_provider: str | None = None,
        oauth_provider_id: str | None = None,
    ) -> User:
        user = User(
            email=email,
            username=username,
            full_name=full_name,
            hashed_password=hashed_password,
            avatar_url=avatar_url,
            role="user",
            is_active=True,
            email_verified=email_verified,
            oauth_provider=oauth_provider,
            oauth_provider_id=oauth_provider_id,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def attach_oauth_account(self, user: User, *, provider: str, provider_id: str, avatar_url: str | None = None, email_verified: bool | None = None) -> User:
        user.oauth_provider = provider
        user.oauth_provider_id = provider_id
        if avatar_url and not user.avatar_url:
            user.avatar_url = avatar_url
        if email_verified is True:
            user.email_verified = True
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def list_users(
        self,
        *,
        search: str | None = None,
        role: str | None = None,
        is_active: bool | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[User]:
        statement = select(User).where(User.deleted_at.is_(None)).order_by(User.created_at.desc()).offset(skip).limit(limit)
        if search:
            pattern = f"%{search}%"
            statement = statement.where(or_(User.email.ilike(pattern), User.username.ilike(pattern), User.full_name.ilike(pattern)))
        if role:
            statement = statement.where(User.role == role)
        if is_active is not None:
            statement = statement.where(User.is_active == is_active)
        return list(self.db.scalars(statement).all())

    def update_profile(self, user: User, profile_update: UserProfileUpdate) -> User:
        update_data = profile_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field in {"avatar_url", "cover_image_url"} and value is not None:
                value = str(value)
            if field == "social_links" and value is not None:
                value = {key: str(link) if link is not None else None for key, link in value.items()}
            setattr(user, field, value)
            if field == "phone_number":
                user.phone = value

        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def set_active(self, user: User, is_active: bool) -> User:
        user.is_active = is_active
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def set_role(self, user: User, role: str) -> User:
        user.role = role
        user.is_admin = role == "admin"
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def soft_delete(self, user: User) -> User:
        user.deleted_at = datetime.now(timezone.utc)
        user.is_active = False
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def create_auth_token(self, *, user_id: int, token: str, purpose: str, expires_at: datetime) -> AuthToken:
        auth_token = AuthToken(user_id=user_id, token=token, purpose=purpose, expires_at=expires_at)
        self.db.add(auth_token)
        self.db.commit()
        self.db.refresh(auth_token)
        return auth_token

    def revoke_auth_tokens(self, *, user_id: int, purpose: str) -> int:
        now = datetime.now(timezone.utc)
        tokens = list(self.db.scalars(select(AuthToken).where(AuthToken.user_id == user_id, AuthToken.purpose == purpose, AuthToken.used_at.is_(None))).all())
        for token in tokens:
            token.used_at = now
            self.db.add(token)
        self.db.commit()
        return len(tokens)

    def get_valid_auth_token(self, *, token: str, purpose: str) -> AuthToken | None:
        now = datetime.now(timezone.utc)
        statement = select(AuthToken).where(
            AuthToken.token == token,
            AuthToken.purpose == purpose,
            AuthToken.used_at.is_(None),
            AuthToken.expires_at > now,
        )
        return self.db.scalar(statement)

    def mark_token_used(self, auth_token: AuthToken) -> AuthToken:
        auth_token.used_at = datetime.now(timezone.utc)
        self.db.add(auth_token)
        self.db.commit()
        self.db.refresh(auth_token)
        return auth_token

    def update_password(self, user: User, hashed_password: str) -> User:
        user.hashed_password = hashed_password
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
