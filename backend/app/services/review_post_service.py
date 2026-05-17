import re

from fastapi import HTTPException, status

from app.models.review_post import PostComment
from app.models.user import User
from app.repositories.place_repository import PlaceRepository
from app.repositories.review_post_repository import ReviewPostRepository
from app.schemas.review_post import (
    AdminPostReportRead,
    CommentCreate,
    CommentInteractionResponse,
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
        if post_create.place_id is not None and not self.place_repository.get(post_create.place_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found.")
        post_create.hashtags = self._normalize_hashtags(content=post_create.content, hashtags=post_create.hashtags)
        post = self.review_post_repository.create(user_id=current_user.id, post_create=post_create)
        self._index_post(post)
        return self.build_post_read(post, likes_count=0, comments_count=0, saves_count=0)

    def get_post(self, *, post_id: int, current_user: User | None = None) -> ReviewPostRead:
        post = self._get_existing_post(post_id)
        self._ensure_can_view(post, current_user=current_user)
        return self.build_post_read(
            post,
            likes_count=self.review_post_repository.count_likes(post_id),
            comments_count=self.review_post_repository.count_comments(post_id),
            saves_count=self.review_post_repository.count_saves(post_id),
        )

    def update_post(self, *, post_id: int, current_user: User, post_update: ReviewPostUpdate) -> ReviewPostRead:
        post = self._get_existing_post(post_id)
        if post.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only update your own post.")
        if post_update.place_id is not None and not self.place_repository.get(post_update.place_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found.")
        if post_update.content is not None or post_update.hashtags is not None:
            post_update.hashtags = self._normalize_hashtags(
                content=post_update.content if post_update.content is not None else post.content,
                hashtags=post_update.hashtags if post_update.hashtags is not None else post.hashtags,
            )
        post = self.review_post_repository.update(post, post_update)
        self._index_post(post)
        return self.get_post(post_id=post.id, current_user=current_user)

    def delete_post(self, *, post_id: int, current_user: User) -> None:
        post = self._get_existing_post(post_id)
        if post.user_id != current_user.id and current_user.role not in {"moderator", "admin"}:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own post.")
        self.review_post_repository.delete_post(post)

    def get_feed(
        self,
        *,
        sort: str = "latest",
        current_user: User | None = None,
        place_id: int | None = None,
        hashtag: str | None = None,
        following_only: bool = False,
        skip: int = 0,
        limit: int = 20,
    ) -> list[ReviewPostRead]:
        if following_only and not current_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
        following_ids = self.review_post_repository.list_following_ids(follower_id=current_user.id) if current_user else []
        rows = self.review_post_repository.feed(
            sort=sort,
            current_user_id=current_user.id if current_user else None,
            following_user_ids=following_ids if following_only else None,
            viewer_following_ids=following_ids if current_user else None,
            place_id=place_id,
            hashtag=self._normalize_tag(hashtag) if hashtag else None,
            skip=skip,
            limit=limit,
        )
        return self._rows_to_reads(rows)

    def get_user_posts(self, *, user_id: int, current_user: User | None = None, skip: int = 0, limit: int = 20) -> list[ReviewPostRead]:
        following_ids = self.review_post_repository.list_following_ids(follower_id=current_user.id) if current_user else []
        rows = self.review_post_repository.list_with_counts(
            user_id=user_id,
            current_user_id=current_user.id if current_user else None,
            viewer_following_ids=following_ids if current_user else None,
            skip=skip,
            limit=limit,
        )
        return self._rows_to_reads(rows)

    def get_saved_posts(self, *, user_id: int, skip: int = 0, limit: int = 20) -> list[ReviewPostRead]:
        following_ids = self.review_post_repository.list_following_ids(follower_id=user_id)
        rows = self.review_post_repository.list_with_counts(saved_by_user_id=user_id, current_user_id=user_id, viewer_following_ids=following_ids, skip=skip, limit=limit)
        return self._rows_to_reads(rows)

    def get_drafts(self, *, current_user: User, skip: int = 0, limit: int = 20) -> list[ReviewPostRead]:
        rows = self.review_post_repository.list_with_counts(user_id=current_user.id, current_user_id=current_user.id, drafts_only=True, include_hidden=True, skip=skip, limit=limit)
        return self._rows_to_reads(rows)

    def like_post(self, *, post_id: int, current_user: User) -> PostInteractionResponse:
        self._get_existing_post(post_id)
        if not self.review_post_repository.get_like(post_id=post_id, user_id=current_user.id):
            self.review_post_repository.add_like(post_id=post_id, user_id=current_user.id)
        return PostInteractionResponse(post_id=post_id, liked=True, likes_count=self.review_post_repository.count_likes(post_id))

    def unlike_post(self, *, post_id: int, current_user: User) -> PostInteractionResponse:
        self._get_existing_post(post_id)
        self.review_post_repository.remove_like(post_id=post_id, user_id=current_user.id)
        return PostInteractionResponse(post_id=post_id, liked=False, likes_count=self.review_post_repository.count_likes(post_id))

    def save_post(self, *, post_id: int, current_user: User) -> PostInteractionResponse:
        self._get_existing_post(post_id)
        if not self.review_post_repository.get_save(post_id=post_id, user_id=current_user.id):
            self.review_post_repository.add_save(post_id=post_id, user_id=current_user.id)
        return PostInteractionResponse(post_id=post_id, saved=True, saves_count=self.review_post_repository.count_saves(post_id))

    def unsave_post(self, *, post_id: int, current_user: User) -> PostInteractionResponse:
        self._get_existing_post(post_id)
        self.review_post_repository.remove_save(post_id=post_id, user_id=current_user.id)
        return PostInteractionResponse(post_id=post_id, saved=False, saves_count=self.review_post_repository.count_saves(post_id))

    def share_post(self, *, post_id: int) -> PostShareResponse:
        post = self.review_post_repository.increment_share_count(self._get_existing_post(post_id))
        return PostShareResponse(post_id=post_id, share_count=post.share_count)

    def hide_post(self, *, post_id: int, current_user: User) -> PostInteractionResponse:
        self._get_existing_post(post_id)
        if not self.review_post_repository.get_hidden(post_id=post_id, user_id=current_user.id):
            self.review_post_repository.add_hide(post_id=post_id, user_id=current_user.id)
        return PostInteractionResponse(post_id=post_id, hidden=True)

    def comment_post(self, *, post_id: int, current_user: User, comment_create: CommentCreate) -> PostComment:
        self._get_existing_post(post_id)
        return self.review_post_repository.create_comment(post_id=post_id, user_id=current_user.id, comment_create=comment_create)

    def reply_comment(self, *, post_id: int, comment_id: int, current_user: User, comment_create: CommentCreate) -> PostComment:
        parent = self.review_post_repository.get_comment(comment_id)
        if not parent or parent.post_id != post_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found.")
        return self.review_post_repository.create_comment(post_id=post_id, user_id=current_user.id, comment_create=comment_create, parent_comment_id=comment_id)

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

    def list_comments(self, *, post_id: int, skip: int = 0, limit: int = 50) -> list[dict]:
        self._get_existing_post(post_id)
        comments = self.review_post_repository.list_comments(post_id=post_id, skip=skip, limit=limit)
        by_parent: dict[int | None, list[dict]] = {}
        for comment in comments:
            item = {
                "id": comment.id,
                "content": comment.content,
                "author": comment.author,
                "parent_comment_id": comment.parent_comment_id,
                "likes_count": self.review_post_repository.count_comment_likes(comment.id),
                "replies": [],
                "created_at": comment.created_at,
            }
            by_parent.setdefault(comment.parent_comment_id, []).append(item)
        for item in by_parent.get(None, []):
            item["replies"] = by_parent.get(item["id"], [])
        return by_parent.get(None, [])

    def like_comment(self, *, comment_id: int, current_user: User) -> CommentInteractionResponse:
        if not self.review_post_repository.get_comment(comment_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found.")
        if not self.review_post_repository.get_comment_like(comment_id=comment_id, user_id=current_user.id):
            self.review_post_repository.add_comment_like(comment_id=comment_id, user_id=current_user.id)
        return CommentInteractionResponse(comment_id=comment_id, liked=True, likes_count=self.review_post_repository.count_comment_likes(comment_id))

    def unlike_comment(self, *, comment_id: int, current_user: User) -> CommentInteractionResponse:
        if not self.review_post_repository.get_comment(comment_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found.")
        self.review_post_repository.remove_comment_like(comment_id=comment_id, user_id=current_user.id)
        return CommentInteractionResponse(comment_id=comment_id, liked=False, likes_count=self.review_post_repository.count_comment_likes(comment_id))

    def follow_user(self, *, current_user: User, target_user: User) -> dict[str, bool]:
        if current_user.id == target_user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot follow yourself.")
        if not self.review_post_repository.get_follow(follower_id=current_user.id, following_id=target_user.id):
            self.review_post_repository.add_follow(follower_id=current_user.id, following_id=target_user.id)
        return {"following": True}

    def unfollow_user(self, *, current_user: User, target_user: User) -> dict[str, bool]:
        if current_user.id == target_user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot unfollow yourself.")
        self.review_post_repository.remove_follow(follower_id=current_user.id, following_id=target_user.id)
        return {"following": False}

    def report_post(self, *, post_id: int, current_user: User, report_create: PostReportCreate) -> PostReportRead:
        self._get_existing_post(post_id)
        reason = report_create.reason or report_create.report_reason
        if not reason:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Report reason is required.")
        report = self.review_post_repository.create_report(
            post_id=post_id,
            user_id=current_user.id,
            reason=reason,
            description=report_create.description or report_create.report_detail,
        )
        return PostReportRead.model_validate(report)

    def list_reports(self, *, status_value: str | None = None, skip: int = 0, limit: int = 50) -> list[AdminPostReportRead]:
        reports = self.review_post_repository.list_reports(status=status_value, skip=skip, limit=limit)
        return [
            AdminPostReportRead.model_validate(
                {**report.__dict__, "reporter": report.reporter, "post": self.get_post(post_id=report.post_id, current_user=report.reporter)}
            )
            for report in reports
        ]

    def resolve_report(self, *, report_id: int, status_value: str = "resolved") -> PostReportRead:
        report = self.review_post_repository.resolve_report(report_id=report_id, status_value=status_value)
        if not report:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")
        return PostReportRead.model_validate(report)

    def _rows_to_reads(self, rows) -> list[ReviewPostRead]:
        return [
            self.build_post_read(post, likes_count=likes_count, comments_count=comments_count, saves_count=saves_count)
            for post, likes_count, comments_count, saves_count in rows
        ]

    def _get_existing_post(self, post_id: int):
        post = self.review_post_repository.get(post_id)
        if not post:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review post not found.")
        return post

    def _ensure_can_view(self, post, *, current_user: User | None) -> None:
        if current_user and current_user.role in {"moderator", "admin"}:
            return
        if post.status != "visible":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review post not found.")
        if post.is_draft and (not current_user or post.user_id != current_user.id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review post not found.")
        if post.visibility == "private" and (not current_user or post.user_id != current_user.id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This post is private.")
        if post.visibility == "followers" and (not current_user or (post.user_id != current_user.id and post.user_id not in self.review_post_repository.list_following_ids(follower_id=current_user.id))):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only followers can view this post.")

    def build_post_read(self, post, *, likes_count: int, comments_count: int, saves_count: int) -> ReviewPostRead:
        return ReviewPostRead.model_validate(
            {
                **post.__dict__,
                "author": post.author,
                "place": post.place,
                "likes_count": likes_count,
                "comments_count": comments_count,
                "saves_count": saves_count,
                "share_count": post.share_count,
            }
        )

    def _normalize_tag(self, tag: str) -> str:
        return tag.strip().lower().lstrip("#")

    def _normalize_hashtags(self, *, content: str, hashtags: list[str]) -> list[str]:
        parsed = re.findall(r"#([\w-]+)", content.lower())
        explicit = [self._normalize_tag(tag) for tag in hashtags]
        return list(dict.fromkeys(tag for tag in [*parsed, *explicit] if tag))

    def _index_post(self, post) -> None:
        if not self.embedding_service or not self.vector_search_service or post.is_draft:
            return
        try:
            text = f"{post.title}\n\n{post.content}"
            embedding = self.embedding_service.embed_text(text)
            self.vector_search_service.upsert_review_post(post=post, embedding=embedding)
        except Exception:
            return
