from collections.abc import Sequence

from fastapi import HTTPException, status

from app.models.review_post import PostComment
from app.models.user import User
from app.repositories.place_repository import PlaceRepository
from app.repositories.review_post_repository import ReviewPostRepository
from app.schemas.review_post import (
    CommentCreate,
    CommentUpdate,
    PostInteractionResponse,
    PostReportCreate,
    PostReportRead,
    ReviewPostCreate,
    ReviewPostRead,
    ReviewPostUpdate,
)
from app.services.embedding_service import EmbeddingService
from app.services.vector_search_service import VectorSearchService


class ReviewPostService:
    def __init__(
        self,
        review_post_repository: ReviewPostRepository,
        place_repository: PlaceRepository,
        embedding_service: EmbeddingService | None = None,
        vector_search_service: VectorSearchService | None = None,
    ) -> None:
        self.review_post_repository = review_post_repository
        self.place_repository = place_repository
        self.embedding_service = embedding_service
        self.vector_search_service = vector_search_service

    def create_post(self, *, current_user: User, post_create: ReviewPostCreate) -> ReviewPostRead:
        if not self.place_repository.get(post_create.place_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Place not found.",
            )

        post = self.review_post_repository.create(user_id=current_user.id, post_create=post_create)
        self._index_post(post)
        return self.build_post_read(post, likes_count=0, comments_count=0, saves_count=0)

    def get_post(self, *, post_id: int) -> ReviewPostRead:
        post = self._get_existing_post(post_id)
        likes_count = self.review_post_repository.count_likes(post_id)
        saves_count = self.review_post_repository.count_saves(post_id)
        comments_count = self.review_post_repository.count_comments(post_id)
        return self.build_post_read(post, likes_count=likes_count, comments_count=comments_count, saves_count=saves_count)

    def update_post(self, *, post_id: int, current_user: User, post_update: ReviewPostUpdate) -> ReviewPostRead:
        post = self._get_existing_post(post_id)
        if post.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only update your own post.")
        if post_update.place_id is not None and not self.place_repository.get(post_update.place_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found.")
        post = self.review_post_repository.update(post, post_update)
        self._index_post(post)
        return self.get_post(post_id=post.id)

    def delete_post(self, *, post_id: int, current_user: User) -> None:
        post = self._get_existing_post(post_id)
        if post.user_id != current_user.id and current_user.role not in {"moderator", "admin"}:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own post.")
        self.review_post_repository.delete_post(post)

    def get_feed(self, *, sort: str = "latest", skip: int = 0, limit: int = 20) -> list[ReviewPostRead]:
        rows = self.review_post_repository.feed(sort=sort, skip=skip, limit=limit)
        return self._rows_to_reads(rows)

    def get_user_posts(self, *, user_id: int, skip: int = 0, limit: int = 20) -> list[ReviewPostRead]:
        rows = self.review_post_repository.list_with_counts(user_id=user_id, skip=skip, limit=limit)
        return self._rows_to_reads(rows)

    def get_saved_posts(self, *, user_id: int, skip: int = 0, limit: int = 20) -> list[ReviewPostRead]:
        rows = self.review_post_repository.list_with_counts(saved_by_user_id=user_id, skip=skip, limit=limit)
        return self._rows_to_reads(rows)

    def _rows_to_reads(self, rows) -> list[ReviewPostRead]:
        return [
            self.build_post_read(
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

    def update_comment(self, *, post_id: int, comment_id: int, current_user: User, comment_update: CommentUpdate) -> PostComment:
        self._get_existing_post(post_id)
        comment = self.review_post_repository.get_comment(comment_id)
        if not comment or comment.post_id != post_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found.")
        if comment.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only update your own comment.")
        return self.review_post_repository.update_comment(comment, comment_update.content)

    def delete_comment(self, *, post_id: int, comment_id: int, current_user: User) -> None:
        self._get_existing_post(post_id)
        comment = self.review_post_repository.get_comment(comment_id)
        if not comment or comment.post_id != post_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found.")
        if comment.user_id != current_user.id and current_user.role not in {"moderator", "admin"}:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own comment.")
        self.review_post_repository.delete_comment(comment)

    def list_comments(self, *, post_id: int, skip: int = 0, limit: int = 50) -> Sequence[PostComment]:
        self._get_existing_post(post_id)
        return self.review_post_repository.list_comments(post_id=post_id, skip=skip, limit=limit)

    def follow_user(self, *, current_user: User, target_user: User) -> dict[str, bool]:
        if current_user.id == target_user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot follow yourself.")
        existing = self.review_post_repository.get_follow(follower_id=current_user.id, following_id=target_user.id)
        if not existing:
            self.review_post_repository.add_follow(follower_id=current_user.id, following_id=target_user.id)
        return {"following": True}

    def unfollow_user(self, *, current_user: User, target_user: User) -> dict[str, bool]:
        if current_user.id == target_user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot unfollow yourself.")
        self.review_post_repository.remove_follow(follower_id=current_user.id, following_id=target_user.id)
        return {"following": False}

    def report_post(self, *, post_id: int, current_user: User, report_create: PostReportCreate) -> PostReportRead:
        self._get_existing_post(post_id)
        report = self.review_post_repository.create_report(
            post_id=post_id,
            user_id=current_user.id,
            reason=report_create.reason,
            description=report_create.description,
        )
        return PostReportRead.model_validate(report)

    def _get_existing_post(self, post_id: int):
        post = self.review_post_repository.get(post_id)
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review post not found.",
            )
        return post

    def build_post_read(
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

    def _index_post(self, post) -> None:
        if not self.embedding_service or not self.vector_search_service:
            return

        try:
            text = f"{post.title}\n\n{post.content}"
            embedding = self.embedding_service.embed_text(text)
            self.vector_search_service.upsert_review_post(post=post, embedding=embedding)
        except Exception:
            return
