from typing import Literal

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, Response, UploadFile, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.security import get_token_subject
from app.db.session import get_db
from app.models.user import User
from app.repositories.place_repository import PlaceRepository
from app.repositories.review_post_repository import ReviewPostRepository
from app.repositories.user_repository import UserRepository
from app.schemas.review_post import (
    CommentCreate,
    CommentInteractionResponse,
    CommentReportCreate,
    CommentReportRead,
    CommentRead,
    CommentUpdate,
    PostInteractionResponse,
    PostReportCreate,
    PostReportRead,
    PostShareResponse,
    ReviewPostCreate,
    ReviewPostRead,
    ReviewPostUpdate,
)
from app.services.embedding_service import EmbeddingService
from app.services.analytics_service import AnalyticsService
from app.services.review_post_service import ReviewPostService
from app.services.upload_service import UploadService
from app.services.vector_search_service import VectorSearchService

router = APIRouter()
optional_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

ALLOWED_POST_IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
ALLOWED_POST_VIDEO_TYPES = {"video/mp4": ".mp4", "video/webm": ".webm", "video/quicktime": ".mov"}
MAX_POST_IMAGE_BYTES = 5 * 1024 * 1024
MAX_POST_VIDEO_BYTES = 50 * 1024 * 1024
MAX_POST_IMAGE_UPLOADS = 10
MAX_POST_VIDEO_UPLOADS = 3


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


def get_review_post_service(db: Session = Depends(get_db)) -> ReviewPostService:
    return ReviewPostService(
        review_post_repository=ReviewPostRepository(db),
        place_repository=PlaceRepository(db),
        embedding_service=EmbeddingService(),
        vector_search_service=VectorSearchService(),
    )


@router.get("/feed", response_model=list[ReviewPostRead])
def get_community_feed(
    sort: Literal["latest", "popular", "trending"] = Query(default="latest"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User | None = Depends(get_optional_current_user),
    review_post_service: ReviewPostService = Depends(get_review_post_service),
) -> list[ReviewPostRead]:
    return review_post_service.get_feed(sort=sort, current_user=current_user, skip=skip, limit=limit)


@router.get("/feed/latest", response_model=list[ReviewPostRead])
def get_latest_feed(skip: int = Query(default=0, ge=0), limit: int = Query(default=20, ge=1, le=100), current_user: User | None = Depends(get_optional_current_user), service: ReviewPostService = Depends(get_review_post_service)):
    return service.get_feed(sort="latest", current_user=current_user, skip=skip, limit=limit)


@router.get("/feed/trending", response_model=list[ReviewPostRead])
def get_trending_feed(skip: int = Query(default=0, ge=0), limit: int = Query(default=20, ge=1, le=100), current_user: User | None = Depends(get_optional_current_user), service: ReviewPostService = Depends(get_review_post_service)):
    return service.get_feed(sort="trending", current_user=current_user, skip=skip, limit=limit)


@router.get("/feed/following", response_model=list[ReviewPostRead])
def get_following_feed(
    page: int = Query(default=1, ge=1),
    skip: int | None = Query(default=None, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    service: ReviewPostService = Depends(get_review_post_service),
):
    offset = skip if skip is not None else (page - 1) * limit
    return service.get_feed(sort="latest", current_user=current_user, following_only=True, skip=offset, limit=limit)


@router.get("/feed/place/{place_id}", response_model=list[ReviewPostRead])
def get_place_feed(place_id: int, skip: int = Query(default=0, ge=0), limit: int = Query(default=20, ge=1, le=100), current_user: User | None = Depends(get_optional_current_user), service: ReviewPostService = Depends(get_review_post_service)):
    return service.get_feed(sort="latest", current_user=current_user, place_id=place_id, skip=skip, limit=limit)


@router.get("/feed/hashtag/{tag}", response_model=list[ReviewPostRead])
def get_hashtag_feed(tag: str, skip: int = Query(default=0, ge=0), limit: int = Query(default=20, ge=1, le=100), current_user: User | None = Depends(get_optional_current_user), service: ReviewPostService = Depends(get_review_post_service)):
    return service.get_feed(sort="latest", current_user=current_user, hashtag=tag, skip=skip, limit=limit)


@router.get("/feed/recommended", response_model=list[ReviewPostRead])
def get_recommended_feed(skip: int = Query(default=0, ge=0), limit: int = Query(default=20, ge=1, le=100), current_user: User | None = Depends(get_optional_current_user), service: ReviewPostService = Depends(get_review_post_service)):
    # TODO: Replace fallback with AI recommendations from embeddings/Pinecone.
    return service.get_feed(sort="trending", current_user=current_user, skip=skip, limit=limit)


@router.get("/drafts/me", response_model=list[ReviewPostRead])
def get_my_drafts(skip: int = Query(default=0, ge=0), limit: int = Query(default=20, ge=1, le=100), current_user: User = Depends(get_current_user), service: ReviewPostService = Depends(get_review_post_service)):
    return service.get_drafts(current_user=current_user, skip=skip, limit=limit)


@router.post("/uploads")
async def upload_post_images(files: list[UploadFile] = File(...), _: User = Depends(get_current_user)) -> dict[str, list[str]]:
    response = await UploadService().upload_files(files, "post_image")
    return {"urls": response.urls}


@router.post("/uploads/videos")
async def upload_post_videos(files: list[UploadFile] = File(...), _: User = Depends(get_current_user)) -> dict[str, list[str]]:
    response = await UploadService().upload_files(files, "post_video")
    return {"urls": response.urls}


@router.post("", response_model=ReviewPostRead, status_code=status.HTTP_201_CREATED)
def create_review_post(post_create: ReviewPostCreate, current_user: User = Depends(get_current_user), service: ReviewPostService = Depends(get_review_post_service)) -> ReviewPostRead:
    return service.create_post(current_user=current_user, post_create=post_create)


@router.get("/{slug_or_id}", response_model=ReviewPostRead)
def get_review_post(
    slug_or_id: str,
    request: Request,
    current_user: User | None = Depends(get_optional_current_user),
    service: ReviewPostService = Depends(get_review_post_service),
    db: Session = Depends(get_db),
) -> ReviewPostRead:
    post = service.get_post(post_id=slug_or_id, current_user=current_user)
    try:
        AnalyticsService(db).track_view(content_type="post", content_id=post.id, user=current_user, request=request)
        post = service.get_post(post_id=post.id, current_user=current_user)
    except Exception:
        pass
    return post


@router.patch("/{post_id}", response_model=ReviewPostRead)
def update_review_post(post_id: int, post_update: ReviewPostUpdate, current_user: User = Depends(get_current_user), service: ReviewPostService = Depends(get_review_post_service)) -> ReviewPostRead:
    return service.update_post(post_id=post_id, current_user=current_user, post_update=post_update)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review_post(post_id: int, current_user: User = Depends(get_current_user), service: ReviewPostService = Depends(get_review_post_service)) -> Response:
    service.delete_post(post_id=post_id, current_user=current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{post_id}/likes", response_model=PostInteractionResponse)
def like_post(post_id: int, current_user: User = Depends(get_current_user), service: ReviewPostService = Depends(get_review_post_service)) -> PostInteractionResponse:
    return service.like_post(post_id=post_id, current_user=current_user)


@router.delete("/{post_id}/likes", response_model=PostInteractionResponse)
def unlike_post(post_id: int, current_user: User = Depends(get_current_user), service: ReviewPostService = Depends(get_review_post_service)) -> PostInteractionResponse:
    return service.unlike_post(post_id=post_id, current_user=current_user)


@router.post("/{post_id}/saves", response_model=PostInteractionResponse)
def save_post(post_id: int, current_user: User = Depends(get_current_user), service: ReviewPostService = Depends(get_review_post_service)) -> PostInteractionResponse:
    return service.save_post(post_id=post_id, current_user=current_user)


@router.delete("/{post_id}/saves", response_model=PostInteractionResponse)
def unsave_post(post_id: int, current_user: User = Depends(get_current_user), service: ReviewPostService = Depends(get_review_post_service)) -> PostInteractionResponse:
    return service.unsave_post(post_id=post_id, current_user=current_user)


@router.post("/{post_id}/share", response_model=PostShareResponse)
def share_post(post_id: int, service: ReviewPostService = Depends(get_review_post_service)) -> PostShareResponse:
    return service.share_post(post_id=post_id)


@router.post("/{post_id}/hide", response_model=PostInteractionResponse)
def hide_post(post_id: int, current_user: User = Depends(get_current_user), service: ReviewPostService = Depends(get_review_post_service)) -> PostInteractionResponse:
    return service.hide_post(post_id=post_id, current_user=current_user)


@router.post("/{post_id}/comments", response_model=CommentRead, status_code=status.HTTP_201_CREATED)
def comment_post(post_id: int, comment_create: CommentCreate, current_user: User = Depends(get_current_user), service: ReviewPostService = Depends(get_review_post_service)) -> CommentRead:
    return service.comment_post(post_id=post_id, current_user=current_user, comment_create=comment_create)


@router.get("/{post_id}/comments", response_model=list[CommentRead])
def list_comments(post_id: int, skip: int = Query(default=0, ge=0), limit: int = Query(default=50, ge=1, le=100), current_user: User | None = Depends(get_optional_current_user), service: ReviewPostService = Depends(get_review_post_service)) -> list[dict]:
    return service.list_comments(post_id=post_id, current_user=current_user, skip=skip, limit=limit)


@router.post("/{post_id}/comments/{comment_id}/replies", response_model=CommentRead, status_code=status.HTTP_201_CREATED)
def reply_comment(post_id: int, comment_id: int, comment_create: CommentCreate, current_user: User = Depends(get_current_user), service: ReviewPostService = Depends(get_review_post_service)) -> CommentRead:
    return service.reply_comment(post_id=post_id, comment_id=comment_id, current_user=current_user, comment_create=comment_create)


@router.patch("/{post_id}/comments/{comment_id}", response_model=CommentRead)
def update_comment(post_id: int, comment_id: int, comment_update: CommentUpdate, current_user: User = Depends(get_current_user), service: ReviewPostService = Depends(get_review_post_service)) -> CommentRead:
    return service.update_comment(post_id=post_id, comment_id=comment_id, current_user=current_user, comment_update=comment_update)


@router.delete("/{post_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(post_id: int, comment_id: int, current_user: User = Depends(get_current_user), service: ReviewPostService = Depends(get_review_post_service)) -> Response:
    service.delete_comment(post_id=post_id, comment_id=comment_id, current_user=current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/comments/{comment_id}/like", response_model=CommentInteractionResponse)
def like_comment(comment_id: int, current_user: User = Depends(get_current_user), service: ReviewPostService = Depends(get_review_post_service)) -> CommentInteractionResponse:
    return service.like_comment(comment_id=comment_id, current_user=current_user)


@router.delete("/comments/{comment_id}/like", response_model=CommentInteractionResponse)
def unlike_comment(comment_id: int, current_user: User = Depends(get_current_user), service: ReviewPostService = Depends(get_review_post_service)) -> CommentInteractionResponse:
    return service.unlike_comment(comment_id=comment_id, current_user=current_user)


@router.post("/{post_id}/comments/{comment_id}/like", response_model=CommentInteractionResponse)
def like_post_comment(post_id: int, comment_id: int, current_user: User = Depends(get_current_user), service: ReviewPostService = Depends(get_review_post_service)) -> CommentInteractionResponse:
    return service.like_post_comment(post_id=post_id, comment_id=comment_id, current_user=current_user)


@router.delete("/{post_id}/comments/{comment_id}/like", response_model=CommentInteractionResponse)
def unlike_post_comment(post_id: int, comment_id: int, current_user: User = Depends(get_current_user), service: ReviewPostService = Depends(get_review_post_service)) -> CommentInteractionResponse:
    return service.unlike_post_comment(post_id=post_id, comment_id=comment_id, current_user=current_user)


@router.post("/{post_id}/comments/{comment_id}/reports", response_model=CommentReportRead, status_code=status.HTTP_201_CREATED)
def report_comment(post_id: int, comment_id: int, report_create: CommentReportCreate, current_user: User = Depends(get_current_user), service: ReviewPostService = Depends(get_review_post_service)) -> CommentReportRead:
    return service.report_comment(post_id=post_id, comment_id=comment_id, current_user=current_user, report_create=report_create)


@router.post("/{post_id}/reports", response_model=PostReportRead, status_code=status.HTTP_201_CREATED)
def report_post(post_id: int, report_create: PostReportCreate, current_user: User = Depends(get_current_user), service: ReviewPostService = Depends(get_review_post_service)) -> PostReportRead:
    return service.report_post(post_id=post_id, current_user=current_user, report_create=report_create)
