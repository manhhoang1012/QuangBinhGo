from datetime import date, datetime, time

from pydantic import BaseModel, Field

from app.schemas.place import PlaceRead


class ItineraryItemBase(BaseModel):
    place_id: int | None = None
    day_number: int = Field(ge=1)
    start_time: time | None = None
    end_time: time | None = None
    title: str = Field(min_length=1, max_length=255)
    note: str | None = None
    estimated_cost: float | None = Field(default=None, ge=0)
    transport_note: str | None = None
    order_index: int = Field(default=0, ge=0)


class ItineraryItemCreate(ItineraryItemBase):
    pass


class ItineraryItemUpdate(BaseModel):
    place_id: int | None = None
    day_number: int | None = Field(default=None, ge=1)
    start_time: time | None = None
    end_time: time | None = None
    title: str | None = Field(default=None, min_length=1, max_length=255)
    note: str | None = None
    estimated_cost: float | None = Field(default=None, ge=0)
    transport_note: str | None = None
    order_index: int | None = Field(default=None, ge=0)


class ItineraryItemRead(ItineraryItemBase):
    id: int
    place: PlaceRead | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ItineraryBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    total_days: int = Field(default=1, ge=1, le=30)
    budget: float | None = Field(default=None, ge=0)
    travel_style: str | None = Field(default=None, max_length=100)
    interests: list[str] = Field(default_factory=list, max_length=20)
    visibility: str = Field(default="private", pattern="^(private|public|shared)$")
    created_by_ai: bool = False


class ItineraryCreate(ItineraryBase):
    items: list[ItineraryItemCreate] = Field(default_factory=list)


class ItineraryUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    total_days: int | None = Field(default=None, ge=1, le=30)
    budget: float | None = Field(default=None, ge=0)
    travel_style: str | None = Field(default=None, max_length=100)
    interests: list[str] | None = Field(default=None, max_length=20)
    visibility: str | None = Field(default=None, pattern="^(private|public|shared)$")


class ItineraryRead(ItineraryBase):
    id: int
    user_id: int
    share_slug: str | None = None
    items: list[ItineraryItemRead] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ItineraryReorderItem(BaseModel):
    item_id: int
    day_number: int = Field(ge=1)
    order_index: int = Field(ge=0)
    start_time: time | None = None


class AiItineraryGenerateRequest(BaseModel):
    days: int = Field(ge=1, le=14)
    budget: float | None = Field(default=None, ge=0)
    interests: list[str] = Field(default_factory=list, max_length=20)
    travel_style: str = Field(default="khám phá", max_length=100)
    start_location: str = "Đồng Hới"
    start_date: date | None = None
    people_count: int = Field(default=2, ge=1, le=30)


class AiItineraryItem(BaseModel):
    time: str
    title: str
    place_id: int | None = None
    place_name: str | None = None
    note: str
    estimated_cost: float | None = None
    transport_note: str | None = None
    duration_minutes: int = 90


class AiItineraryDay(BaseModel):
    day_number: int
    summary: str
    items: list[AiItineraryItem]


class AiItineraryResponse(BaseModel):
    title: str
    description: str
    total_days: int
    estimated_budget: float | None = None
    travel_style: str
    interests: list[str]
    days: list[AiItineraryDay]
    todo: str | None = "TODO: Connect a production LLM provider; current generator uses rule-based fallback."


# Backward-compatible aliases for /ai/itinerary.
ItineraryRequest = AiItineraryGenerateRequest
ItineraryResponse = AiItineraryResponse
ItineraryDay = AiItineraryDay
ItineraryScheduleItem = AiItineraryItem
