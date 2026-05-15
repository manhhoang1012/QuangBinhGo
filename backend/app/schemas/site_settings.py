import re
from typing import Literal

from pydantic import BaseModel, Field, field_validator


URL_RE = re.compile(r"^https?://.+", re.IGNORECASE)
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class SiteSettingsPayload(BaseModel):
    site_name: str = Field(default="QuangBinhGo", min_length=1, max_length=120)
    site_description: str = Field(default="Website giới thiệu du lịch Quảng Bình", min_length=1, max_length=500)
    logo_url: str | None = None
    favicon_url: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    address: str | None = None
    facebook_url: str | None = None
    zalo_url: str | None = None
    youtube_url: str | None = None
    hero_title: str = Field(default="Caves, coastlines, and local stories in one trip.", min_length=1, max_length=180)
    hero_subtitle: str = Field(
        default="Plan meaningful days around Phong Nha, Dong Hoi, Nhat Le, and hidden local favorites with real traveler reviews.",
        min_length=1,
        max_length=500,
    )
    hero_background_image: str | None = None
    featured_place_limit: int = Field(default=3, ge=1, le=20)
    show_featured_places: bool = True
    show_latest_posts: bool = True
    show_reviews_section: bool = True
    allow_user_posts: bool = True
    allow_comments: bool = True
    allow_reviews: bool = True
    auto_approve_posts: bool = True
    auto_approve_comments: bool = True
    max_images_per_post: int = Field(default=10, ge=1, le=20)
    max_images_per_place: int = Field(default=10, ge=1, le=20)
    default_place_status: Literal["active", "hidden", "published", "draft"] = "published"
    enable_place_reviews: bool = True
    enable_place_map: bool = True
    allow_register: bool = True
    require_email_verification: bool = False
    default_user_role: Literal["user"] = "user"

    @field_validator("logo_url", "favicon_url", "facebook_url", "zalo_url", "youtube_url", "hero_background_image")
    @classmethod
    def validate_url(cls, value: str | None) -> str | None:
        if value in (None, ""):
            return None
        if not URL_RE.match(value):
            raise ValueError("URL must start with http:// or https://")
        return value

    @field_validator("contact_email")
    @classmethod
    def validate_email(cls, value: str | None) -> str | None:
        if value in (None, ""):
            return None
        if not EMAIL_RE.match(value):
            raise ValueError("Invalid email address")
        return value


class SettingsUploadResponse(BaseModel):
    url: str
