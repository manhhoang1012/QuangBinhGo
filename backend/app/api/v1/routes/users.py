from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import ChangePasswordRequest, MessageResponse, UserProfileUpdate, UserRead
from app.services.user_service import UserService

router = APIRouter()


def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(UserRepository(db))


@router.get("/me", response_model=UserRead)
def read_current_profile(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.patch("/me", response_model=UserRead)
def update_current_profile(
    profile_update: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
) -> User:
    return user_service.update_profile(
        current_user=current_user,
        profile_update=profile_update,
    )


@router.patch("/me/password", response_model=MessageResponse)
def change_current_password(
    password_update: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
) -> MessageResponse:
    return user_service.change_password(
        current_user=current_user,
        password_update=password_update,
    )
