from collections.abc import Sequence
from typing import Literal

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.repositories.place_repository import PlaceRepository
from app.repositories.review_post_repository import ReviewPostRepository
from app.schemas.review_post import (
    CommentCreate,
    CommentRead,
    PostInteractionResponse,
    ReviewPostCreate,
    ReviewPostRead,
)
from app.services.review_post_service import ReviewPostService
from app.services.embedding_service import EmbeddingService
from app.services.vector_search_service import VectorSearchService

router = APIRouter()


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


@router.post("", response_model=ReviewPostRead, status_code=status.HTTP_201_CREATED)
def create_review_post(
    post_create: ReviewPostCreate,
    current_user: User = Depends(get_current_user),
    review_post_service: ReviewPostService = Depends(get_review_post_service),
) -> ReviewPostRead:
    return review_post_service.create_post(
        current_user=current_user,
        post_create=post_create,
    )


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
    return review_post_service.comment_post(
        post_id=post_id,
        current_user=current_user,
        comment_create=comment_create,
    )


@router.get("/{post_id}/comments", response_model=list[CommentRead])
def list_comments(
    post_id: int,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    review_post_service: ReviewPostService = Depends(get_review_post_service),
) -> Sequence[CommentRead]:
    return review_post_service.list_comments(post_id=post_id, skip=skip, limit=limit)
