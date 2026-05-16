from collections.abc import Sequence
from pathlib import Path
from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.repositories.place_repository import PlaceRepository
from app.repositories.review_post_repository import ReviewPostRepository
from app.schemas.review_post import (
    CommentCreate,
    CommentRead,
    CommentUpdate,
    PostInteractionResponse,
    PostReportCreate,
    PostReportRead,
    ReviewPostCreate,
    ReviewPostRead,
    ReviewPostUpdate,
)
from app.services.embedding_service import EmbeddingService
from app.services.review_post_service import ReviewPostService
from app.services.vector_search_service import VectorSearchService

router = APIRouter()

ALLOWED_POST_IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
MAX_POST_IMAGE_BYTES = 5 * 1024 * 1024
MAX_POST_IMAGE_UPLOADS = 10


def get_review_post_service(db: Session = Depends(get_db)) -> ReviewPostService:
    return ReviewPostService(
        review_post_repository=ReviewPostRepository(db),
        place_repository=PlaceRepository(db),
        embedding_service=EmbeddingService(),
        vector_search_service=VectorSearchService(),
    )


@router.get("/feed", response_model=list[ReviewPostRead])
def get_community_feed(
    sort: Literal["latest", "popular"] = Query(default="latest"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    review_post_service: ReviewPostService = Depends(get_review_post_service),
) -> list[ReviewPostRead]:
    return review_post_service.get_feed(sort=sort, skip=skip, limit=limit)


@router.post("/uploads")
async def upload_post_images(
    files: list[UploadFile] = File(...),
    _: User = Depends(get_current_user),
) -> dict[str, list[str]]:
    if len(files) > MAX_POST_IMAGE_UPLOADS:
        raise HTTPException(status_code=400, detail="You can upload up to 10 images.")

    upload_dir = Path(__file__).resolve().parents[4] / "static" / "uploads" / "posts"
    upload_dir.mkdir(parents=True, exist_ok=True)
    urls: list[str] = []

    for file in files:
        suffix = ALLOWED_POST_IMAGE_TYPES.get(file.content_type or "")
        if not suffix:
            raise HTTPException(status_code=400, detail="Only jpg, png, and webp images are allowed.")
        content = await file.read()
        if len(content) > MAX_POST_IMAGE_BYTES:
            raise HTTPException(status_code=400, detail="Each image must be 5MB or smaller.")
        filename = f"{uuid4().hex}{suffix}"
        (upload_dir / filename).write_bytes(content)
        urls.append(f"{settings.backend_url.rstrip('/')}/static/uploads/posts/{filename}")

    return {"urls": urls}


@router.post("", response_model=ReviewPostRead, status_code=status.HTTP_201_CREATED)
def create_review_post(
    post_create: ReviewPostCreate,
    current_user: User = Depends(get_current_user),
    review_post_service: ReviewPostService = Depends(get_review_post_service),
) -> ReviewPostRead:
    return review_post_service.create_post(current_user=current_user, post_create=post_create)


@router.get("/{post_id}", response_model=ReviewPostRead)
def get_review_post(
    post_id: int,
    review_post_service: ReviewPostService = Depends(get_review_post_service),
) -> ReviewPostRead:
    return review_post_service.get_post(post_id=post_id)


@router.patch("/{post_id}", response_model=ReviewPostRead)
def update_review_post(
    post_id: int,
    post_update: ReviewPostUpdate,
    current_user: User = Depends(get_current_user),
    review_post_service: ReviewPostService = Depends(get_review_post_service),
) -> ReviewPostRead:
    return review_post_service.update_post(post_id=post_id, current_user=current_user, post_update=post_update)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    review_post_service: ReviewPostService = Depends(get_review_post_service),
) -> Response:
    review_post_service.delete_post(post_id=post_id, current_user=current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{post_id}/likes", response_model=PostInteractionResponse)
def like_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    review_post_service: ReviewPostService = Depends(get_review_post_service),
) -> PostInteractionResponse:
    return review_post_service.like_post(post_id=post_id, current_user=current_user)


@router.delete("/{post_id}/likes", response_model=PostInteractionResponse)
def unlike_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    review_post_service: ReviewPostService = Depends(get_review_post_service),
) -> PostInteractionResponse:
    return review_post_service.unlike_post(post_id=post_id, current_user=current_user)


@router.post("/{post_id}/saves", response_model=PostInteractionResponse)
def save_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    review_post_service: ReviewPostService = Depends(get_review_post_service),
) -> PostInteractionResponse:
    return review_post_service.save_post(post_id=post_id, current_user=current_user)


@router.delete("/{post_id}/saves", response_model=PostInteractionResponse)
def unsave_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    review_post_service: ReviewPostService = Depends(get_review_post_service),
) -> PostInteractionResponse:
    return review_post_service.unsave_post(post_id=post_id, current_user=current_user)


@router.post("/{post_id}/comments", response_model=CommentRead, status_code=status.HTTP_201_CREATED)
def comment_post(
    post_id: int,
    comment_create: CommentCreate,
    current_user: User = Depends(get_current_user),
    review_post_service: ReviewPostService = Depends(get_review_post_service),
) -> CommentRead:
    return review_post_service.comment_post(post_id=post_id, current_user=current_user, comment_create=comment_create)


@router.get("/{post_id}/comments", response_model=list[CommentRead])
def list_comments(
    post_id: int,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    review_post_service: ReviewPostService = Depends(get_review_post_service),
) -> Sequence[CommentRead]:
    return review_post_service.list_comments(post_id=post_id, skip=skip, limit=limit)


@router.patch("/{post_id}/comments/{comment_id}", response_model=CommentRead)
def update_comment(
    post_id: int,
    comment_id: int,
    comment_update: CommentUpdate,
    current_user: User = Depends(get_current_user),
    review_post_service: ReviewPostService = Depends(get_review_post_service),
) -> CommentRead:
    return review_post_service.update_comment(post_id=post_id, comment_id=comment_id, current_user=current_user, comment_update=comment_update)


@router.delete("/{post_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    post_id: int,
    comment_id: int,
    current_user: User = Depends(get_current_user),
    review_post_service: ReviewPostService = Depends(get_review_post_service),
) -> Response:
    review_post_service.delete_comment(post_id=post_id, comment_id=comment_id, current_user=current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{post_id}/reports", response_model=PostReportRead, status_code=status.HTTP_201_CREATED)
def report_post(
    post_id: int,
    report_create: PostReportCreate,
    current_user: User = Depends(get_current_user),
    review_post_service: ReviewPostService = Depends(get_review_post_service),
) -> PostReportRead:
    return review_post_service.report_post(post_id=post_id, current_user=current_user, report_create=report_create)
