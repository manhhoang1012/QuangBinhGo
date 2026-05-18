from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.user import UserRead


class ModerationActionCreate(BaseModel):
    target_type: str = Field(pattern="^(post|comment|review|user)$")
    target_id: int = Field(gt=0)
    action_type: str = Field(min_length=1, max_length=50)
    reason: str = Field(min_length=1, max_length=120)
    note: str | None = Field(default=None, max_length=1000)


class ModerationActionRead(BaseModel):
    id: int
    moderator: UserRead | None = None
    moderator_id: int
    target_type: str
    target_id: int
    action_type: str
    reason: str
    note: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserWarningCreate(BaseModel):
    reason: str = Field(pattern="^(spam|offensive|harassment|false_info|other)$")
    message: str = Field(min_length=1, max_length=2000)
    related_target_type: str | None = Field(default=None, pattern="^(post|comment|review|user)$")
    related_target_id: int | None = Field(default=None, gt=0)


class UserWarningRead(BaseModel):
    id: int
    user: UserRead | None = None
    user_id: int
    moderator: UserRead | None = None
    moderator_id: int
    reason: str
    message: str
    related_target_type: str | None = None
    related_target_id: int | None = None
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ModerationReasonPayload(BaseModel):
    reason: str = Field(default="violation", min_length=1, max_length=120)
    note: str | None = Field(default=None, max_length=1000)


class ModerationReportResolvePayload(ModerationReasonPayload):
    type: str = Field(pattern="^(post|comment|review)$")
    hide_target: bool = False
    warn_user: bool = False
    warning_message: str | None = Field(default=None, max_length=2000)


class ModerationReportRead(BaseModel):
    id: int
    type: str
    reporter: UserRead | None = None
    target_id: int
    target_label: str
    target_author: UserRead | None = None
    reason: str
    detail: str | None = None
    status: str
    created_at: datetime


class ModerationReportListRead(BaseModel):
    items: list[ModerationReportRead]
    total: int
    page: int
    limit: int
    total_pages: int


class ModerationDashboardRead(BaseModel):
    pending_reports: int
    reported_posts: int
    reported_comments: int
    reported_reviews: int
    recent_actions: list[ModerationActionRead]
    recent_warnings: list[UserWarningRead]
