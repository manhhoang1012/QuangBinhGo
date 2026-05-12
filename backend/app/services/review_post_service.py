from collections.abc import Sequence

from fastapi import HTTPException, status

from app.models.review_post import PostComment
from app.models.user import User
from app.repositories.place_repository import PlaceRepository
from app.repositories.review_post_repository import ReviewPostRepository
from app.schemas.review_post import (
    CommentCreate,
    PostInteractionResponse,
    ReviewPostCreate,
    ReviewPostRead,
)


class ReviewPostService:
    def __init__(
        self,
        review_post_repository: ReviewPostRepository,
        place_repository: PlaceRepository,
    ) -> None:
        self.review_post_repository = review_post_repository
        self.place_repository = place_repository

    def create_post(self, *, current_user: User, post_create: ReviewPostCreate) -> ReviewPostRead:
        if not self.place_repository.get(post_create.place_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Place not found.",
            )

        post = self.review_post_repository.create(user_id=current_user.id, post_create=post_create)
        return self._build_post_read(post, likes_count=0, comments_count=0, saves_count=0)

    def get_feed(self, *, sort: str = "latest", skip: int = 0, limit: int = 20) -> list[ReviewPostRead]:
        rows = self.review_post_repository.feed(sort=sort, skip=skip, limit=limit)
        return [
            self._build_post_read(
                post,
                likes_count=likes_count,
                comments_count=comments_count,
                saves_count=saves_count,
            )
            for post, likes_count, comments_count, saves_count in rows
        ]

    def like_post(self, *, post_id: int, current_user: User) -> PostInteractionResponse:
        self._get_existing_post(post_id)
        existing_like = self.review_post_repository.get_like(post_id=post_id, user_id=current_user.id)
        if existing_like:
            likes_count = self.review_post_repository.count_likes(post_id)
            return PostInteractionResponse(post_id=post_id, liked=True, likes_count=likes_count)

        self.review_post_repository.add_like(post_id=post_id, user_id=current_user.id)
        likes_count = self.review_post_repository.count_likes(post_id)
        return PostInteractionResponse(post_id=post_id, liked=True, likes_count=likes_count)

    def unlike_post(self, *, post_id: int, current_user: User) -> PostInteractionResponse:
        self._get_existing_post(post_id)
        self.review_post_repository.remove_like(post_id=post_id, user_id=current_user.id)
        likes_count = self.review_post_repository.count_likes(post_id)
        return PostInteractionResponse(post_id=post_id, liked=False, likes_count=likes_count)

    def save_post(self, *, post_id: int, current_user: User) -> PostInteractionResponse:
        self._get_existing_post(post_id)
        existing_save = self.review_post_repository.get_save(post_id=post_id, user_id=current_user.id)
        if existing_save:
            saves_count = self.review_post_repository.count_saves(post_id)
            return PostInteractionResponse(post_id=post_id, saved=True, saves_count=saves_count)

        self.review_post_repository.add_save(post_id=post_id, user_id=current_user.id)
        saves_count = self.review_post_repository.count_saves(post_id)
        return PostInteractionResponse(post_id=post_id, saved=True, saves_count=saves_count)

    def unsave_post(self, *, post_id: int, current_user: User) -> PostInteractionResponse:
        self._get_existing_post(post_id)
        self.review_post_repository.remove_save(post_id=post_id, user_id=current_user.id)
        saves_count = self.review_post_repository.count_saves(post_id)
        return PostInteractionResponse(post_id=post_id, saved=False, saves_count=saves_count)

    def comment_post(
        self,
        *,
        post_id: int,
        current_user: User,
        comment_create: CommentCreate,
    ) -> PostComment:
        self._get_existing_post(post_id)
        return self.review_post_repository.create_comment(
            post_id=post_id,
            user_id=current_user.id,
            comment_create=comment_create,
        )

    def list_comments(self, *, post_id: int, skip: int = 0, limit: int = 50) -> Sequence[PostComment]:
        self._get_existing_post(post_id)
        return self.review_post_repository.list_comments(post_id=post_id, skip=skip, limit=limit)

    def _get_existing_post(self, post_id: int):
        post = self.review_post_repository.get(post_id)
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review post not found.",
            )
        return post

    def _build_post_read(
        self,
        post,
        *,
        likes_count: int,
        comments_count: int,
        saves_count: int,
    ) -> ReviewPostRead:
        return ReviewPostRead.model_validate(
            {
                **post.__dict__,
                "author": post.author,
                "place": post.place,
                "likes_count": likes_count,
                "comments_count": comments_count,
                "saves_count": saves_count,
            }
        )
