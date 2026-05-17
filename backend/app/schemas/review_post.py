from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.place import PlaceRead
from app.schemas.user import UserRead

VISIBILITIES = {"public", "followers", "private"}


class ReviewPostCreate(BaseModel):
    title: str = Field(default="", max_length=255)
    content: str = Field(min_length=1)
    place_id: int | None = Field(default=None, gt=0)
    images: list[str] = Field(default_factory=list)
    videos: list[str] = Field(default_factory=list, max_length=5)
    hashtags: list[str] = Field(default_factory=list, max_length=30)
    tagged_users: list[str] = Field(default_factory=list, max_length=30)
    visibility: str = Field(default="public", pattern="^(public|followers|private)$")
    is_draft: bool = False


class ReviewPostUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    content: str | None = Field(default=None, min_length=1)
    place_id: int | None = Field(default=None, gt=0)
    images: list[str] | None = Field(default=None, max_length=10)
    videos: list[str] | None = Field(default=None, max_length=5)
    hashtags: list[str] | None = Field(default=None, max_length=30)
    tagged_users: list[str] | None = Field(default=None, max_length=30)
    visibility: str | None = Field(default=None, pattern="^(public|followers|private)$")
    is_draft: bool | None = None


class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


class CommentUpdate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


class CommentStatusUpdate(BaseModel):
    status: str = Field(pattern="^(visible|hidden|deleted|spam)$")


class CommentReportCreate(BaseModel):
    reason: str = Field(pattern="^(spam|offensive|harassment|other)$")
    detail: str | None = Field(default=None, max_length=1000)


class CommentReportRead(BaseModel):
    id: int
    reason: str
    detail: str | None = None
    status: str
    reporter: UserRead | None = None
    comment_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class PostReportCreate(BaseModel):
    reason: str | None = Field(default=None, min_length=1, max_length=120)
    report_reason: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=1000)
    report_detail: str | None = Field(default=None, max_length=1000)


class PostReportRead(BaseModel):
    id: int
    reason: str
    description: str | None = None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class CommentRead(BaseModel):
    id: int
    content: str
    author: UserRead
    parent_comment_id: int | None = None
    status: str = "visible"
    like_count: int = 0
    likes_count: int = 0
    report_count: int = 0
    liked_by_me: bool = False
    replies: list["CommentRead"] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ReviewPostRead(BaseModel):
    id: int
    title: str
    content: str
    place_id: int | None = None
    images: list[str]
    videos: list[str] = Field(default_factory=list)
    hashtags: list[str] = Field(default_factory=list)
    tagged_users: list[str] = Field(default_factory=list)
    visibility: str = "public"
    is_draft: bool = False
    status: str = "visible"
    author: UserRead
    place: PlaceRead | None = None
    likes_count: int = 0
    comments_count: int = 0
    saves_count: int = 0
    share_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PostInteractionResponse(BaseModel):
    post_id: int
    liked: bool | None = None
    saved: bool | None = None
    hidden: bool | None = None
    likes_count: int | None = None
    saves_count: int | None = None
    share_count: int | None = None


class CommentInteractionResponse(BaseModel):
    comment_id: int
    liked: bool
    liked_by_me: bool
    like_count: int
    likes_count: int


class PostShareResponse(BaseModel):
    post_id: int
    share_count: int


class AdminPostReportRead(PostReportRead):
    reporter: UserRead
    post: ReviewPostRead

    model_config = {"from_attributes": True}


class PlaceReviewRead(BaseModel):
    id: int
    place: PlaceRead
    author: UserRead
    rating: int
    content: str
    images: list[str] = Field(default_factory=list)
    status: str = "visible"
    helpful_count: int = 0
    report_count: int = 0
    helpful_by_me: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PlaceReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    content: str = Field(min_length=5, max_length=2000)
    images: list[str] = Field(default_factory=list, max_length=10)


class PlaceReviewUpdate(BaseModel):
    rating: int | None = Field(default=None, ge=1, le=5)
    content: str | None = Field(default=None, min_length=5, max_length=2000)
    images: list[str] | None = Field(default=None, max_length=10)


class RatingSummary(BaseModel):
    average_rating: float = 0
    review_count: int = 0
    star_counts: dict[int, int] = Field(default_factory=dict)


class PlaceReviewListRead(BaseModel):
    items: list[PlaceReviewRead]
    total: int
    page: int
    limit: int
    total_pages: int
    rating_summary: RatingSummary


class PlaceReviewReportCreate(BaseModel):
    reason: str = Field(pattern="^(false_info|spam|offensive|other)$")
    detail: str | None = Field(default=None, max_length=1000)


class PlaceReviewStatusUpdate(BaseModel):
    status: str = Field(pattern="^(visible|hidden|deleted|reported)$")


class PlaceReviewReportRead(BaseModel):
    id: int
    reason: str
    detail: str | None = None
    status: str
    reporter: UserRead | None = None
    review_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class PostStatusUpdate(BaseModel):
    status: str = Field(min_length=1, max_length=30)


class AdminCommentRead(BaseModel):
    id: int
    content: str
    status: str = "visible"
    report_count: int = 0
    like_count: int = 0
    author: UserRead
    post: ReviewPostRead
    reports: list[CommentReportRead] = Field(default_factory=list)
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminPlaceReviewRead(PlaceReviewRead):
    reports: list[PlaceReviewReportRead] = Field(default_factory=list)
