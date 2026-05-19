from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.user import UserRead

ReportTargetType = Literal["post", "comment", "user", "review"]
ReportReason = Literal["spam", "offensive", "harassment", "false_info", "scam", "inappropriate", "other"]
ReportStatus = Literal["pending", "resolved", "rejected"]


class ReportCreate(BaseModel):
    target_type: ReportTargetType
    target_id: int = Field(gt=0)
    reason: ReportReason
    detail: str | None = Field(default=None, max_length=1000)


class ReportResolve(BaseModel):
    action: Literal["none", "hide_content", "delete_content", "warn_user", "block_user"] = "none"
    resolution_note: str | None = Field(default=None, max_length=1000)
    notify_user: bool = True


class ReportReject(BaseModel):
    resolution_note: str | None = Field(default=None, max_length=1000)


class ReportRead(BaseModel):
    id: int
    type: str
    target_type: str
    target_id: int
    target_label: str
    target_author: UserRead | None = None
    reporter: UserRead | None = None
    reason: str
    detail: str | None = None
    status: str
    resolved_by: int | None = None
    resolved_at: datetime | None = None
    resolution_note: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ReportListRead(BaseModel):
    items: list[ReportRead]
    total: int
    page: int
    limit: int
    total_pages: int
