from typing import Any, Literal

from pydantic import BaseModel, Field

from app.schemas.place import PlaceRead
from app.schemas.review_post import ReviewPostRead


class AiSearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=800)
    type: Literal["all", "places", "posts"] = "all"
    top_k: int = Field(default=8, ge=1, le=20)


class AiSearchResponse(BaseModel):
    query: str
    intent: dict[str, Any]
    places: list[PlaceRead] = Field(default_factory=list)
    posts: list[ReviewPostRead] = Field(default_factory=list)
    results: list[dict[str, Any]] = Field(default_factory=list)
    source: str = "fallback"


class AiRecommendPlacesRequest(BaseModel):
    interests: list[str] = Field(default_factory=list, max_length=20)
    budget: float | None = Field(default=None, ge=0)
    travel_style: str | None = Field(default=None, max_length=100)
    days: int | None = Field(default=None, ge=1, le=30)


class AiRecommendedPlace(BaseModel):
    place: PlaceRead
    reason: str


class AiRecommendPlacesResponse(BaseModel):
    recommended_places: list[AiRecommendedPlace]
    estimated_budget: float | None = None
    suggested_region: str | None = None
    source: str = "fallback"


class AiChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1500)


class AiChatResponse(BaseModel):
    answer: str
    related_places: list[PlaceRead] = Field(default_factory=list)
    related_posts: list[ReviewPostRead] = Field(default_factory=list)
    source: str = "fallback"


class ContentTextRequest(BaseModel):
    content: str = Field(min_length=1, max_length=5000)


class CaptionResponse(BaseModel):
    captions: dict[str, str]
    source: str = "fallback"


class SummaryResponse(BaseModel):
    summary: str
    source: str = "fallback"


class HashtagResponse(BaseModel):
    hashtags: list[str]
    source: str = "fallback"


class ModerationResponse(BaseModel):
    safe: bool
    labels: list[str] = Field(default_factory=list)
    warning: str | None = None
    source: str = "fallback"
