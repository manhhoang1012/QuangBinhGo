from collections.abc import Sequence

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session, selectinload

from app.models.review_post import PostComment, PostLike, PostSave, ReviewPost
from app.schemas.review_post import CommentCreate, ReviewPostCreate


class ReviewPostRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, *, user_id: int, post_create: ReviewPostCreate) -> ReviewPost:
        post = ReviewPost(user_id=user_id, **post_create.model_dump())
        self.db.add(post)
        self.db.commit()
        self.db.refresh(post)
        return self.get(post.id) or post

    def get(self, post_id: int) -> ReviewPost | None:
        statement = (
            select(ReviewPost)
            .where(ReviewPost.id == post_id)
            .options(
                selectinload(ReviewPost.author),
                selectinload(ReviewPost.place),
            )
        )
        return self.db.scalar(statement)

    def feed(self, *, sort: str = "latest", skip: int = 0, limit: int = 20) -> Sequence[tuple[ReviewPost, int, int, int]]:
        likes_count = func.count(func.distinct(PostLike.id)).label("likes_count")
        comments_count = func.count(func.distinct(PostComment.id)).label("comments_count")
        saves_count = func.count(func.distinct(PostSave.id)).label("saves_count")

        statement = (
            select(ReviewPost, likes_count, comments_count, saves_count)
            .outerjoin(PostLike, PostLike.post_id == ReviewPost.id)
            .outerjoin(PostComment, PostComment.post_id == ReviewPost.id)
            .outerjoin(PostSave, PostSave.post_id == ReviewPost.id)
            .group_by(ReviewPost.id)
            .options(
                selectinload(ReviewPost.author),
                selectinload(ReviewPost.place),
            )
            .offset(skip)
            .limit(limit)
        )

        if sort == "popular":
            statement = statement.order_by(likes_count.desc(), comments_count.desc(), ReviewPost.created_at.desc())
        else:
            statement = statement.order_by(ReviewPost.created_at.desc())

        return self.db.execute(statement).all()

    def get_many_with_counts(self, post_ids: list[int]) -> dict[int, tuple[ReviewPost, int, int, int]]:
        if not post_ids:
            return {}

        likes_count = func.count(func.distinct(PostLike.id)).label("likes_count")
        comments_count = func.count(func.distinct(PostComment.id)).label("comments_count")
        saves_count = func.count(func.distinct(PostSave.id)).label("saves_count")

        statement = (
            select(ReviewPost, likes_count, comments_count, saves_count)
            .outerjoin(PostLike, PostLike.post_id == ReviewPost.id)
            .outerjoin(PostComment, PostComment.post_id == ReviewPost.id)
            .outerjoin(PostSave, PostSave.post_id == ReviewPost.id)
            .where(ReviewPost.id.in_(post_ids))
            .group_by(ReviewPost.id)
            .options(
                selectinload(ReviewPost.author),
                selectinload(ReviewPost.place),
            )
        )

        return {
            post.id: (post, likes_count_value, comments_count_value, saves_count_value)
            for post, likes_count_value, comments_count_value, saves_count_value in self.db.execute(statement).all()
        }

    def get_like(self, *, post_id: int, user_id: int) -> PostLike | None:
        statement = select(PostLike).where(PostLike.post_id == post_id, PostLike.user_id == user_id)
        return self.db.scalar(statement)

    def add_like(self, *, post_id: int, user_id: int) -> PostLike:
        like = PostLike(post_id=post_id, user_id=user_id)
        self.db.add(like)
        self.db.commit()
        self.db.refresh(like)
        return like

    def remove_like(self, *, post_id: int, user_id: int) -> None:
        statement = delete(PostLike).where(PostLike.post_id == post_id, PostLike.user_id == user_id)
        self.db.execute(statement)
        self.db.commit()

    def get_save(self, *, post_id: int, user_id: int) -> PostSave | None:
        statement = select(PostSave).where(PostSave.post_id == post_id, PostSave.user_id == user_id)
        return self.db.scalar(statement)

    def add_save(self, *, post_id: int, user_id: int) -> PostSave:
        save = PostSave(post_id=post_id, user_id=user_id)
        self.db.add(save)
        self.db.commit()
        self.db.refresh(save)
        return save

    def remove_save(self, *, post_id: int, user_id: int) -> None:
        statement = delete(PostSave).where(PostSave.post_id == post_id, PostSave.user_id == user_id)
        self.db.execute(statement)
        self.db.commit()

    def create_comment(
        self,
        *,
        post_id: int,
        user_id: int,
        comment_create: CommentCreate,
    ) -> PostComment:
        comment = PostComment(post_id=post_id, user_id=user_id, content=comment_create.content)
        self.db.add(comment)
        self.db.commit()
        self.db.refresh(comment)
        return self.get_comment(comment.id) or comment

    def get_comment(self, comment_id: int) -> PostComment | None:
        statement = (
            select(PostComment)
            .where(PostComment.id == comment_id)
            .options(selectinload(PostComment.author))
        )
        return self.db.scalar(statement)

    def list_comments(self, *, post_id: int, skip: int = 0, limit: int = 50) -> Sequence[PostComment]:
        statement = (
            select(PostComment)
            .where(PostComment.post_id == post_id)
            .options(selectinload(PostComment.author))
            .order_by(PostComment.created_at.asc())
            .offset(skip)
            .limit(limit)
        )
        return self.db.scalars(statement).all()

    def count_likes(self, post_id: int) -> int:
        return self.db.scalar(select(func.count(PostLike.id)).where(PostLike.post_id == post_id)) or 0

    def count_saves(self, post_id: int) -> int:
        return self.db.scalar(select(func.count(PostSave.id)).where(PostSave.post_id == post_id)) or 0
