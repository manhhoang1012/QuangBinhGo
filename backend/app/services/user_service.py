from fastapi import HTTPException, status

from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import ChangePasswordRequest, MessageResponse, UserProfileUpdate


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

        return self.user_repository.update_profile(current_user, profile_update)

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
