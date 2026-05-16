from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.place import PlaceRead
from app.schemas.user import UserRead


class ReviewPostCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    content: str = Field(min_length=1)
    place_id: int = Field(gt=0)
    images: list[str] = Field(default_factory=list)


class ReviewPostUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    content: str | None = Field(default=None, min_length=1)
    place_id: int | None = Field(default=None, gt=0)
    images: list[str] | None = Field(default=None, max_length=10)


class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


class CommentUpdate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


class PostReportCreate(BaseModel):
    reason: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=1000)


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
    created_at: datetime

    model_config = {"from_attributes": True}


class ReviewPostRead(BaseModel):
    id: int
    title: str
    content: str
    place_id: int
    images: list[str]
    status: str = "visible"
    author: UserRead
    place: PlaceRead
    likes_count: int = 0
    comments_count: int = 0
    saves_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PostInteractionResponse(BaseModel):
    post_id: int
    liked: bool | None = None
    saved: bool | None = None
    likes_count: int | None = None
    saves_count: int | None = None


class PlaceReviewRead(BaseModel):
    id: int
    place: PlaceRead
    author: UserRead
    rating: int
    content: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PlaceReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    content: str = Field(min_length=1, max_length=2000)


class PlaceReviewUpdate(BaseModel):
    rating: int | None = Field(default=None, ge=1, le=5)
    content: str | None = Field(default=None, min_length=1, max_length=2000)


class PostStatusUpdate(BaseModel):
    status: str = Field(min_length=1, max_length=30)


class AdminCommentRead(BaseModel):
    id: int
    content: str
    author: UserRead
    post: ReviewPostRead
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminPlaceReviewRead(PlaceReviewRead):
    pass
