from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.repositories.review_post_repository import ReviewPostRepository
from app.repositories.user_repository import UserRepository
from app.schemas.review_post import PlaceReviewRead, ReviewPostRead
from app.schemas.user import ChangePasswordRequest, ImageUrlUpdate, MessageResponse, PublicUserRead, UserProfileUpdate, UserRead
from app.services.review_post_service import ReviewPostService
from app.services.user_service import UserService

router = APIRouter()


def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(UserRepository(db))


def get_review_post_service(db: Session = Depends(get_db)) -> ReviewPostService:
    from app.repositories.place_repository import PlaceRepository

    return ReviewPostService(ReviewPostRepository(db), PlaceRepository(db))


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


@router.delete("/me", response_model=MessageResponse)
def delete_current_account(
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
) -> MessageResponse:
    return user_service.delete_account(current_user=current_user)


@router.get("/me/posts", response_model=list[ReviewPostRead])
def list_current_user_posts(
    current_user: User = Depends(get_current_user),
    review_post_service: ReviewPostService = Depends(get_review_post_service),
) -> list[ReviewPostRead]:
    return review_post_service.get_user_posts(user_id=current_user.id)


@router.get("/me/saved-posts", response_model=list[ReviewPostRead])
def list_current_user_saved_posts(
    current_user: User = Depends(get_current_user),
    review_post_service: ReviewPostService = Depends(get_review_post_service),
) -> list[ReviewPostRead]:
    return review_post_service.get_saved_posts(user_id=current_user.id)


@router.get("/me/reviews", response_model=list[PlaceReviewRead])
def list_current_user_reviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[PlaceReviewRead]:
    return list(ReviewPostRepository(db).list_place_reviews_by_user(user_id=current_user.id))


@router.patch("/me/avatar", response_model=UserRead)
def update_current_avatar(
    image_update: ImageUrlUpdate,
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
) -> User:
    return user_service.update_avatar(current_user=current_user, image_update=image_update)


@router.patch("/me/cover-image", response_model=UserRead)
def update_current_cover_image(
    image_update: ImageUrlUpdate,
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
) -> User:
    return user_service.update_cover_image(current_user=current_user, image_update=image_update)


@router.get("/{username}", response_model=PublicUserRead)
def read_public_profile(
    username: str,
    user_service: UserService = Depends(get_user_service),
) -> User:
    return user_service.get_public_profile(username)


@router.get("/{username}/posts", response_model=list[ReviewPostRead])
def list_public_user_posts(
    username: str,
    user_service: UserService = Depends(get_user_service),
    review_post_service: ReviewPostService = Depends(get_review_post_service),
) -> list[ReviewPostRead]:
    user = user_service.get_public_profile(username)
    return review_post_service.get_user_posts(user_id=user.id)
