from decimal import Decimal

from sqlalchemy import JSON, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base import TimestampMixin


class Place(TimestampMixin, Base):
    __tablename__ = "places"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    slug: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    tags: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="active", nullable=False)
    address: Mapped[str] = mapped_column(String(500), nullable=False)
    latitude: Mapped[Decimal] = mapped_column(Numeric(9, 6), nullable=False)
    longitude: Mapped[Decimal] = mapped_column(Numeric(9, 6), nullable=False)
    images: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    videos: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    opening_hours: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ticket_price: Mapped[str | None] = mapped_column(String(255), nullable=True)
    price_min: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    price_max: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    contact_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    website_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    facebook_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    rating_avg: Mapped[Decimal] = mapped_column(Numeric(3, 2), default=0, nullable=False)
    review_count: Mapped[int] = mapped_column(default=0, nullable=False)

    @property
    def cover_image(self) -> str | None:
        return self.images[0] if self.images else None


class Category(TimestampMixin, Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    icon: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="active", nullable=False)
