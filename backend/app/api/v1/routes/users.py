from fastapi import APIRouter, Depends, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.security import get_token_subject
from app.db.session import get_db
from app.models.user import User
from app.repositories.review_post_repository import ReviewPostRepository
from app.repositories.user_repository import UserRepository
from app.schemas.review_post import PlaceReviewRead, ReviewPostRead
from app.schemas.user import ChangePasswordRequest, FollowActionResponse, FollowStatusRead, ImageUrlUpdate, MessageResponse, PaginatedUsersRead, PublicUserProfileRead, PublicUserRead, UserProfileUpdate, UserRead
from app.services.review_post_service import ReviewPostService
from app.services.user_service import UserService

router = APIRouter()
optional_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(UserRepository(db))


def get_review_post_service(db: Session = Depends(get_db)) -> ReviewPostService:
    from app.repositories.place_repository import PlaceRepository

    return ReviewPostService(ReviewPostRepository(db), PlaceRepository(db))


def get_optional_current_user(token: str | None = Depends(optional_oauth2_scheme), db: Session = Depends(get_db)) -> User | None:
    if not token:
        return None
    subject = get_token_subject(token)
    if subject is None:
        return None
    try:
        user_id = int(subject)
    except ValueError:
        return None
    user = UserRepository(db).get(user_id)
    return user if user and user.is_active else None


def build_user_read(user: User, repo: ReviewPostRepository, current_user: User | None = None) -> dict:
    is_following = False
    if current_user and current_user.id != user.id:
        is_following = repo.get_follow(follower_id=current_user.id, following_id=user.id) is not None
    return {
        **user.__dict__,
        "followers_count": repo.count_followers(user_id=user.id),
        "following_count": repo.count_following(user_id=user.id),
        "is_following": is_following,
        "is_self": bool(current_user and current_user.id == user.id),
    }


def paginate(total: int, page: int, limit: int) -> tuple[int, int]:
    total_pages = max(1, (total + limit - 1) // limit) if total else 0
    return (page - 1) * limit, total_pages


@router.get("/me", response_model=UserRead)
def read_current_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    return build_user_read(current_user, ReviewPostRepository(db), current_user)


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


@router.get("/suggestions/follow", response_model=PaginatedUsersRead)
def get_follow_suggestions(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=50),
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
) -> PaginatedUsersRead:
    repo = ReviewPostRepository(db)
    skip, _ = paginate(0, page, limit)
    users = repo.list_follow_suggestions(current_user_id=current_user.id if current_user else None, skip=skip, limit=limit)
    total = len(repo.list_follow_suggestions(current_user_id=current_user.id if current_user else None, skip=0, limit=1000))
    _, total_pages = paginate(total, page, limit)
    return PaginatedUsersRead(
        items=[PublicUserRead.model_validate(build_user_read(user, repo, current_user)) for user in users],
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )


@router.get("/{username}", response_model=PublicUserRead)
def read_public_profile(
    username: str,
    current_user: User | None = Depends(get_optional_current_user),
    user_service: UserService = Depends(get_user_service),
    db: Session = Depends(get_db),
) -> dict:
    user = user_service.get_public_profile(username)
    return build_user_read(user, ReviewPostRepository(db), current_user)


@router.get("/{username}/public-profile", response_model=PublicUserProfileRead)
def read_public_profile_detail(
    username: str,
    current_user: User | None = Depends(get_optional_current_user),
    user_service: UserService = Depends(get_user_service),
    review_post_service: ReviewPostService = Depends(get_review_post_service),
    db: Session = Depends(get_db),
) -> dict:
    user = user_service.get_public_profile(username)
    recent_posts = review_post_service.get_user_posts(user_id=user.id, current_user=current_user, skip=0, limit=5)
    return {
        **build_user_read(user, ReviewPostRepository(db), current_user),
        "cover_url": user.cover_image_url,
        "posts_count": len(review_post_service.get_user_posts(user_id=user.id, current_user=current_user, skip=0, limit=1000)),
        "recent_posts": recent_posts,
    }


@router.post("/{username}/follow")
def follow_public_user(
    username: str,
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
    review_post_service: ReviewPostService = Depends(get_review_post_service),
) -> FollowActionResponse:
    target = user_service.get_public_profile(username)
    result = review_post_service.follow_user(current_user=current_user, target_user=target)
    repo = review_post_service.review_post_repository
    return FollowActionResponse(
        username=target.username,
        is_following=True,
        is_self=False,
        followers_count=repo.count_followers(user_id=target.id),
        following_count=repo.count_following(user_id=target.id),
        changed=result.get("changed", False),
        message=result.get("message", "Followed."),
    )


@router.delete("/{username}/follow")
def unfollow_public_user(
    username: str,
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
    review_post_service: ReviewPostService = Depends(get_review_post_service),
) -> FollowActionResponse:
    target = user_service.get_public_profile(username)
    result = review_post_service.unfollow_user(current_user=current_user, target_user=target)
    repo = review_post_service.review_post_repository
    return FollowActionResponse(
        username=target.username,
        is_following=False,
        is_self=False,
        followers_count=repo.count_followers(user_id=target.id),
        following_count=repo.count_following(user_id=target.id),
        changed=result.get("changed", False),
        message=result.get("message", "Unfollowed."),
    )


@router.get("/{username}/follow-status", response_model=FollowStatusRead)
def get_follow_status(
    username: str,
    current_user: User | None = Depends(get_optional_current_user),
    user_service: UserService = Depends(get_user_service),
    db: Session = Depends(get_db),
) -> FollowStatusRead:
    target = user_service.get_public_profile(username)
    repo = ReviewPostRepository(db)
    return FollowStatusRead(
        username=target.username,
        is_following=bool(current_user and current_user.id != target.id and repo.get_follow(follower_id=current_user.id, following_id=target.id)),
        is_self=bool(current_user and current_user.id == target.id),
        followers_count=repo.count_followers(user_id=target.id),
        following_count=repo.count_following(user_id=target.id),
    )


@router.get("/{username}/followers", response_model=PaginatedUsersRead)
def list_followers(
    username: str,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User | None = Depends(get_optional_current_user),
    user_service: UserService = Depends(get_user_service),
    db: Session = Depends(get_db),
) -> PaginatedUsersRead:
    target = user_service.get_public_profile(username)
    repo = ReviewPostRepository(db)
    skip, total_pages = paginate(repo.count_followers(user_id=target.id), page, limit)
    total = repo.count_followers(user_id=target.id)
    return PaginatedUsersRead(
        items=[PublicUserRead.model_validate(build_user_read(user, repo, current_user)) for user in repo.list_followers(user_id=target.id, skip=skip, limit=limit)],
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )


@router.get("/{username}/following", response_model=PaginatedUsersRead)
def list_following(
    username: str,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User | None = Depends(get_optional_current_user),
    user_service: UserService = Depends(get_user_service),
    db: Session = Depends(get_db),
) -> PaginatedUsersRead:
    target = user_service.get_public_profile(username)
    repo = ReviewPostRepository(db)
    total = repo.count_following(user_id=target.id)
    skip, total_pages = paginate(total, page, limit)
    return PaginatedUsersRead(
        items=[PublicUserRead.model_validate(build_user_read(user, repo, current_user)) for user in repo.list_following(user_id=target.id, skip=skip, limit=limit)],
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )


@router.get("/{username}/posts", response_model=list[ReviewPostRead])
def list_public_user_posts(
    username: str,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=50),
    current_user: User | None = Depends(get_optional_current_user),
    user_service: UserService = Depends(get_user_service),
    review_post_service: ReviewPostService = Depends(get_review_post_service),
) -> list[ReviewPostRead]:
    user = user_service.get_public_profile(username)
    return review_post_service.get_user_posts(user_id=user.id, current_user=current_user, skip=(page - 1) * limit, limit=limit)
