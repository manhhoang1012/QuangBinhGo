from fastapi import HTTPException, status

from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import ImageUrlUpdate, ChangePasswordRequest, MessageResponse, UserProfileUpdate


class UserService:
    def __init__(self, user_repository: UserRepository) -> None:
        self.user_repository = user_repository

    def update_profile(self, *, current_user: User, profile_update: UserProfileUpdate) -> User:
        if profile_update.email and profile_update.email != current_user.email:
            existing_user = self.user_repository.get_by_email(profile_update.email)
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A user with this email already exists.",
                )

        if profile_update.username and profile_update.username != current_user.username:
            existing_user = self.user_repository.get_by_username(profile_update.username)
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A user with this username already exists.",
                )

        return self.user_repository.update_profile(current_user, profile_update)

    def update_avatar(self, *, current_user: User, image_update: ImageUrlUpdate) -> User:
        return self.user_repository.update_profile(
            current_user,
            UserProfileUpdate(avatar_url=image_update.url),
        )

    def update_cover_image(self, *, current_user: User, image_update: ImageUrlUpdate) -> User:
        return self.user_repository.update_profile(
            current_user,
            UserProfileUpdate(cover_image_url=image_update.url),
        )

    def change_password(
        self,
        *,
        current_user: User,
        password_update: ChangePasswordRequest,
    ) -> MessageResponse:
        if password_update.new_password != password_update.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password and confirmation do not match.",
            )

        if not verify_password(password_update.current_password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect.",
            )

        self.user_repository.update_password(
            current_user,
            get_password_hash(password_update.new_password),
        )
        return MessageResponse(message="Password changed successfully.")

    def delete_account(self, *, current_user: User) -> MessageResponse:
        self.user_repository.soft_delete(current_user)
        return MessageResponse(message="Account deleted successfully.")

    def get_public_profile(self, username: str) -> User:
        user = self.user_repository.get_by_username(username)
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
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
        return self.user_repository.list_users(search=search, role=role, is_active=is_active, skip=skip, limit=limit)

    def update_user_status(self, *, actor: User, target: User, is_active: bool) -> User:
        if actor.id == target.id and not is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot lock your own account.")
        if actor.role == "moderator" and target.role == "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Moderators cannot lock admin accounts.")
        return self.user_repository.set_active(target, is_active)

    def update_user_role(self, *, actor: User, target: User, role: str) -> User:
        if actor.role != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges are required.")
        if actor.id == target.id and role != "admin":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot remove your own admin role.")
        return self.user_repository.set_role(target, role)

    def admin_delete_user(self, *, actor: User, target: User) -> MessageResponse:
        if actor.id == target.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot delete your own account.")
        if actor.role == "moderator" and target.role == "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Moderators cannot delete admin accounts.")
        self.user_repository.soft_delete(target)
        return MessageResponse(message="User deactivated successfully.")
