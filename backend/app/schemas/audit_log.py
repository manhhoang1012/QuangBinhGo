from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.schemas.user import PublicUserRead


class AdminAuditLogRead(BaseModel):
    id: int
    actor: PublicUserRead | None = None
    actor_id: int | None = None
    action: str
    target_type: str
    target_id: int | None = None
    metadata: dict[str, Any] | None = Field(default=None, validation_alias="metadata_json")
    ip_address: str | None = None
    user_agent: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminAuditLogListRead(BaseModel):
    items: list[AdminAuditLogRead]
    total: int
    page: int
    limit: int
    total_pages: int
