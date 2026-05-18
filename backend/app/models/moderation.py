from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin


class ModerationAction(TimestampMixin, Base):
    __tablename__ = "moderation_actions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    moderator_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    target_type: Mapped[str] = mapped_column(String(30), index=True, nullable=False)
    target_id: Mapped[int] = mapped_column(index=True, nullable=False)
    action_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    reason: Mapped[str] = mapped_column(String(120), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    moderator = relationship("User")


class UserWarning(TimestampMixin, Base):
    __tablename__ = "user_warnings"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    moderator_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    reason: Mapped[str] = mapped_column(String(50), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    related_target_type: Mapped[str | None] = mapped_column(String(30), nullable=True)
    related_target_id: Mapped[int | None] = mapped_column(nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user = relationship("User", foreign_keys=[user_id])
    moderator = relationship("User", foreign_keys=[moderator_id])
