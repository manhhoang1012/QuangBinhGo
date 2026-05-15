from sqlalchemy import JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base import TimestampMixin


class SiteSettings(TimestampMixin, Base):
    __tablename__ = "site_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    data: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
