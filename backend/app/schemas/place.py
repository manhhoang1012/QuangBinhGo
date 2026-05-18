from decimal import Decimal
from datetime import datetime

from pydantic import BaseModel, Field


class PlaceBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    slug: str | None = Field(default=None, max_length=255)
    description: str = Field(min_length=1)
    category: str = Field(min_length=1, max_length=100)
    region: str | None = Field(default=None, max_length=100)
    tags: list[str] = Field(default_factory=list, max_length=20)
    status: str = Field(default="active", min_length=1, max_length=30)
    address: str = Field(min_length=1, max_length=500)
    latitude: Decimal = Field(ge=-90, le=90)
    longitude: Decimal = Field(ge=-180, le=180)
    images: list[str] = Field(default_factory=list, max_length=10)
    videos: list[str] = Field(default_factory=list, max_length=10)
    opening_hours: str | None = Field(default=None, max_length=255)
    ticket_price: str | None = Field(default=None, max_length=255)
    price_min: Decimal | None = Field(default=None, ge=0)
    price_max: Decimal | None = Field(default=None, ge=0)
    contact_phone: str | None = Field(default=None, max_length=50)
    contact_email: str | None = Field(default=None, max_length=255)
    website_url: str | None = Field(default=None, max_length=500)
    facebook_url: str | None = Field(default=None, max_length=500)
    rating_avg: Decimal = Field(default=0, ge=0, le=5)
    review_count: int = Field(default=0, ge=0)


class PlaceCreate(PlaceBase):
    pass


class PlaceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    slug: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, min_length=1)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    region: str | None = Field(default=None, max_length=100)
    tags: list[str] | None = Field(default=None, max_length=20)
    address: str | None = Field(default=None, min_length=1, max_length=500)
    latitude: Decimal | None = Field(default=None, ge=-90, le=90)
    longitude: Decimal | None = Field(default=None, ge=-180, le=180)
    images: list[str] | None = Field(default=None, max_length=10)
    videos: list[str] | None = Field(default=None, max_length=10)
    opening_hours: str | None = Field(default=None, max_length=255)
    ticket_price: str | None = Field(default=None, max_length=255)
    price_min: Decimal | None = Field(default=None, ge=0)
    price_max: Decimal | None = Field(default=None, ge=0)
    contact_phone: str | None = Field(default=None, max_length=50)
    contact_email: str | None = Field(default=None, max_length=255)
    website_url: str | None = Field(default=None, max_length=500)
    facebook_url: str | None = Field(default=None, max_length=500)
    rating_avg: Decimal | None = Field(default=None, ge=0, le=5)
    review_count: int | None = Field(default=None, ge=0)
    status: str | None = Field(default=None, min_length=1, max_length=30)


class PlaceRead(PlaceBase):
    id: int
    cover_image: str | None = None
    distance_km: float | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PlaceDetailRead(PlaceRead):
    related_places: list[PlaceRead] = Field(default_factory=list)


class PlaceMapRead(BaseModel):
    id: int
    name: str
    slug: str | None = None
    latitude: Decimal
    longitude: Decimal
    address: str
    cover_image: str | None = None
    category: str
    region: str | None = None
    rating_avg: Decimal
    distance_km: float | None = None

    model_config = {"from_attributes": True}


class RouteSuggestionRequest(BaseModel):
    start_lat: float = Field(ge=-90, le=90)
    start_lng: float = Field(ge=-180, le=180)
    place_ids: list[int] = Field(min_length=1, max_length=25)
    travel_mode: str = Field(default="driving", pattern="^(driving|motorbike|walking)$")


class RouteSuggestionRead(BaseModel):
    ordered_places: list[PlaceMapRead]
    total_distance_km: float
    estimated_duration_text: str
    google_maps_url: str


class CategoryBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    slug: str = Field(min_length=1, max_length=120, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str | None = None
    icon: str | None = Field(default=None, max_length=100)
    status: str = Field(default="active", min_length=1, max_length=30)


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    slug: str | None = Field(default=None, min_length=1, max_length=120, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str | None = None
    icon: str | None = Field(default=None, max_length=100)
    status: str | None = Field(default=None, min_length=1, max_length=30)


class CategoryRead(CategoryBase):
    id: int

    model_config = {"from_attributes": True}
