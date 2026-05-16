from collections.abc import Sequence

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session, selectinload

from app.models.review_post import PlaceReview, PostComment, PostLike, PostReport, PostSave, ReviewPost, UserFollow
from app.schemas.review_post import CommentCreate, ReviewPostCreate, ReviewPostUpdate


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
        return self.list_with_counts(sort=sort, skip=skip, limit=limit)

    def list_with_counts(
        self,
        *,
        user_id: int | None = None,
        saved_by_user_id: int | None = None,
        include_hidden: bool = False,
        sort: str = "latest",
        skip: int = 0,
        limit: int = 20,
    ) -> Sequence[tuple[ReviewPost, int, int, int]]:
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

        if not include_hidden:
            statement = statement.where(ReviewPost.status == "visible")

        if user_id is not None:
            statement = statement.where(ReviewPost.user_id == user_id)

        if saved_by_user_id is not None:
            statement = statement.where(PostSave.user_id == saved_by_user_id)

        if sort == "popular":
            statement = statement.order_by(likes_count.desc(), comments_count.desc(), ReviewPost.created_at.desc())
        else:
            statement = statement.order_by(ReviewPost.created_at.desc())

        return self.db.execute(statement).all()

    def update(self, post: ReviewPost, post_update: ReviewPostUpdate) -> ReviewPost:
        for field, value in post_update.model_dump(exclude_unset=True).items():
            setattr(post, field, value)
        self.db.add(post)
        self.db.commit()
        self.db.refresh(post)
        return self.get(post.id) or post

    def delete_post(self, post: ReviewPost) -> None:
        self.db.delete(post)
        self.db.commit()

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

    def update_comment(self, comment: PostComment, content: str) -> PostComment:
        comment.content = content
        self.db.add(comment)
        self.db.commit()
        self.db.refresh(comment)
        return self.get_comment(comment.id) or comment

    def delete_comment(self, comment: PostComment) -> None:
        self.db.delete(comment)
        self.db.commit()

    def count_likes(self, post_id: int) -> int:
        return self.db.scalar(select(func.count(PostLike.id)).where(PostLike.post_id == post_id)) or 0

    def count_saves(self, post_id: int) -> int:
        return self.db.scalar(select(func.count(PostSave.id)).where(PostSave.post_id == post_id)) or 0

    def count_comments(self, post_id: int) -> int:
        return self.db.scalar(select(func.count(PostComment.id)).where(PostComment.post_id == post_id)) or 0

    def get_follow(self, *, follower_id: int, following_id: int) -> UserFollow | None:
        return self.db.scalar(select(UserFollow).where(UserFollow.follower_id == follower_id, UserFollow.following_id == following_id))

    def add_follow(self, *, follower_id: int, following_id: int) -> UserFollow:
        follow = UserFollow(follower_id=follower_id, following_id=following_id)
        self.db.add(follow)
        self.db.commit()
        self.db.refresh(follow)
        return follow

    def remove_follow(self, *, follower_id: int, following_id: int) -> None:
        self.db.execute(delete(UserFollow).where(UserFollow.follower_id == follower_id, UserFollow.following_id == following_id))
        self.db.commit()

    def create_report(self, *, post_id: int, user_id: int, reason: str, description: str | None) -> PostReport:
        existing = self.db.scalar(select(PostReport).where(PostReport.post_id == post_id, PostReport.user_id == user_id))
        if existing:
            return existing
        report = PostReport(post_id=post_id, user_id=user_id, reason=reason, description=description)
        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)
        return report

    def list_place_reviews_by_user(self, *, user_id: int, skip: int = 0, limit: int = 20) -> Sequence[PlaceReview]:
        statement = (
            select(PlaceReview)
            .where(PlaceReview.user_id == user_id)
            .options(selectinload(PlaceReview.place))
            .order_by(PlaceReview.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return self.db.scalars(statement).all()
