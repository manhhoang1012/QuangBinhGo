from datetime import date

from sqlalchemy import Date, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin


class ContentView(TimestampMixin, Base):
    __tablename__ = "content_views"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)
    session_id: Mapped[str | None] = mapped_column(String(120), index=True, nullable=True)
    content_type: Mapped[str] = mapped_column(String(30), index=True, nullable=False)
    content_id: Mapped[int] = mapped_column(index=True, nullable=False)
    ip_hash: Mapped[str | None] = mapped_column(String(128), index=True, nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    referrer: Mapped[str | None] = mapped_column(Text, nullable=True)

    user = relationship("User")


class SearchLog(TimestampMixin, Base):
    __tablename__ = "search_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)
    session_id: Mapped[str | None] = mapped_column(String(120), index=True, nullable=True)
    query: Mapped[str] = mapped_column(String(500), index=True, nullable=False)
    search_type: Mapped[str] = mapped_column(String(30), index=True, nullable=False)
    filters_json: Mapped[dict | None] = mapped_column("filters", JSON, nullable=True)
    result_count: Mapped[int] = mapped_column(default=0, nullable=False)

    user = relationship("User")


class DailyAnalytics(TimestampMixin, Base):
    __tablename__ = "daily_analytics"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    metric_name: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    metric_value: Mapped[int] = mapped_column(default=0, nullable=False)
    metadata_json: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)
