from sqlalchemy import Boolean, ForeignKey, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin


class ReviewPost(TimestampMixin, Base):
    __tablename__ = "review_posts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    place_id: Mapped[int | None] = mapped_column(ForeignKey("places.id", ondelete="SET NULL"), index=True, nullable=True)
    title: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    images: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    videos: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    hashtags: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    tagged_users: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    visibility: Mapped[str] = mapped_column(String(30), default="public", nullable=False)
    is_draft: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    share_count: Mapped[int] = mapped_column(default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="visible", nullable=False)

    author = relationship("User")
    place = relationship("Place")


class PostLike(TimestampMixin, Base):
    __tablename__ = "post_likes"
    __table_args__ = (UniqueConstraint("post_id", "user_id", name="uq_post_likes_post_user"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("review_posts.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)


class PostSave(TimestampMixin, Base):
    __tablename__ = "post_saves"
    __table_args__ = (UniqueConstraint("post_id", "user_id", name="uq_post_saves_post_user"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("review_posts.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)


class PostHide(TimestampMixin, Base):
    __tablename__ = "post_hides"
    __table_args__ = (UniqueConstraint("post_id", "user_id", name="uq_post_hides_post_user"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("review_posts.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)


class UserFollow(TimestampMixin, Base):
    __tablename__ = "user_follows"
    __table_args__ = (UniqueConstraint("follower_id", "following_id", name="uq_user_follows_follower_following"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    follower_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    following_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)


class PostReport(TimestampMixin, Base):
    __tablename__ = "post_reports"
    __table_args__ = (UniqueConstraint("post_id", "user_id", name="uq_post_reports_post_user"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("review_posts.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    reason: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="open", nullable=False)

    reporter = relationship("User")
    post = relationship("ReviewPost")


class PostComment(TimestampMixin, Base):
    __tablename__ = "post_comments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("review_posts.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    parent_comment_id: Mapped[int | None] = mapped_column(ForeignKey("post_comments.id", ondelete="CASCADE"), index=True, nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="visible", nullable=False)
    report_count: Mapped[int] = mapped_column(default=0, nullable=False)

    author = relationship("User")
    replies = relationship("PostComment")


class CommentLike(TimestampMixin, Base):
    __tablename__ = "comment_likes"
    __table_args__ = (UniqueConstraint("comment_id", "user_id", name="uq_comment_likes_comment_user"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    comment_id: Mapped[int] = mapped_column(ForeignKey("post_comments.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)


class CommentReport(TimestampMixin, Base):
    __tablename__ = "comment_reports"
    __table_args__ = (UniqueConstraint("comment_id", "user_id", name="uq_comment_reports_comment_user"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    comment_id: Mapped[int] = mapped_column(ForeignKey("post_comments.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    reason: Mapped[str] = mapped_column(String(50), nullable=False)
    detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="open", nullable=False)

    reporter = relationship("User")
    comment = relationship("PostComment")


class PlaceReview(TimestampMixin, Base):
    __tablename__ = "place_reviews"
    __table_args__ = (UniqueConstraint("place_id", "user_id", name="uq_place_reviews_place_user"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    place_id: Mapped[int] = mapped_column(ForeignKey("places.id", ondelete="CASCADE"), index=True, nullable=False)
    rating: Mapped[int] = mapped_column(nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    images: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="visible", nullable=False)
    helpful_count: Mapped[int] = mapped_column(default=0, nullable=False)
    report_count: Mapped[int] = mapped_column(default=0, nullable=False)

    author = relationship("User")
    place = relationship("Place")


class PlaceReviewHelpful(TimestampMixin, Base):
    __tablename__ = "place_review_helpful"
    __table_args__ = (UniqueConstraint("review_id", "user_id", name="uq_place_review_helpful_review_user"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    review_id: Mapped[int] = mapped_column(ForeignKey("place_reviews.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)


class PlaceReviewReport(TimestampMixin, Base):
    __tablename__ = "place_review_reports"
    __table_args__ = (UniqueConstraint("review_id", "user_id", name="uq_place_review_reports_review_user"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    review_id: Mapped[int] = mapped_column(ForeignKey("place_reviews.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    reason: Mapped[str] = mapped_column(String(50), nullable=False)
    detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="open", nullable=False)

    reporter = relationship("User")
    review = relationship("PlaceReview")
