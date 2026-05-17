from datetime import date, time

from sqlalchemy import Boolean, Date, ForeignKey, JSON, Numeric, String, Text, Time, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin


class Itinerary(TimestampMixin, Base):
    __tablename__ = "itineraries"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    total_days: Mapped[int] = mapped_column(default=1, nullable=False)
    budget: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    travel_style: Mapped[str | None] = mapped_column(String(100), nullable=True)
    interests: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    visibility: Mapped[str] = mapped_column(String(30), default="private", nullable=False)
    share_slug: Mapped[str | None] = mapped_column(String(120), unique=True, index=True, nullable=True)
    created_by_ai: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    author = relationship("User")
    items = relationship("ItineraryItem", cascade="all, delete-orphan", order_by="ItineraryItem.day_number, ItineraryItem.order_index")


class ItineraryItem(TimestampMixin, Base):
    __tablename__ = "itinerary_items"
    __table_args__ = (UniqueConstraint("itinerary_id", "day_number", "order_index", name="uq_itinerary_item_order"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    itinerary_id: Mapped[int] = mapped_column(ForeignKey("itineraries.id", ondelete="CASCADE"), index=True, nullable=False)
    place_id: Mapped[int | None] = mapped_column(ForeignKey("places.id", ondelete="SET NULL"), index=True, nullable=True)
    day_number: Mapped[int] = mapped_column(default=1, nullable=False)
    start_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    end_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    estimated_cost: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    transport_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    order_index: Mapped[int] = mapped_column(default=0, nullable=False)

    place = relationship("Place")
