from decimal import Decimal

from pydantic import BaseModel, Field


class PlaceBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    category: str = Field(min_length=1, max_length=100)
    status: str = Field(default="active", min_length=1, max_length=30)
    address: str = Field(min_length=1, max_length=500)
    latitude: Decimal = Field(ge=-90, le=90)
    longitude: Decimal = Field(ge=-180, le=180)
    images: list[str] = Field(default_factory=list, max_length=10)
    rating_avg: Decimal = Field(default=0, ge=0, le=5)


class PlaceCreate(PlaceBase):
    pass


class PlaceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, min_length=1)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    address: str | None = Field(default=None, min_length=1, max_length=500)
    latitude: Decimal | None = Field(default=None, ge=-90, le=90)
    longitude: Decimal | None = Field(default=None, ge=-180, le=180)
    images: list[str] | None = Field(default=None, max_length=10)
    rating_avg: Decimal | None = Field(default=None, ge=0, le=5)
    status: str | None = Field(default=None, min_length=1, max_length=30)


class PlaceRead(PlaceBase):
    id: int

    model_config = {"from_attributes": True}


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
