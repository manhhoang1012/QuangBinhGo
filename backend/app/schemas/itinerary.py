from pydantic import BaseModel, Field


class ItineraryRequest(BaseModel):
    days: int = Field(ge=1, le=14)
    interests: list[str] = Field(default_factory=list, max_length=10)
    travel_style: str = Field(min_length=1, max_length=100)
    budget: str = Field(min_length=1, max_length=100)


class ItineraryScheduleItem(BaseModel):
    time: str
    title: str
    description: str
    place: str | None = None
    food: str | None = None


class ItineraryDay(BaseModel):
    day: int
    theme: str
    places: list[str]
    food: list[str]
    schedule: list[ItineraryScheduleItem]


class ItineraryResponse(BaseModel):
    destination: str = "Quang Binh"
    days: int
    travel_style: str
    budget: str
    interests: list[str]
    overview: str
    itinerary: list[ItineraryDay]
    tips: list[str]
