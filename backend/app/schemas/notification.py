from datetime import datetime
from typing import Any

from pydantic import AliasChoices, BaseModel, Field

from app.schemas.user import UserRead


class NotificationRead(BaseModel):
    id: int
    type: str
    title: str
    message: str
    actor: UserRead | None = None
    target_type: str
    target_id: int | None = None
    target_url: str | None = None
    metadata: dict[str, Any] | None = Field(default=None, validation_alias=AliasChoices("metadata", "metadata_json"))
    is_read: bool
    read_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationListRead(BaseModel):
    items: list[NotificationRead]
    total: int
    page: int
    limit: int
    total_pages: int


class UnreadCountRead(BaseModel):
    unread_count: int = Field(ge=0)
