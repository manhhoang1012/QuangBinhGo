from datetime import date
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, HttpUrl

Gender = Literal["male", "female", "other", "prefer_not_to_say"]
UserRole = Literal["user", "moderator", "admin"]


class SocialLinks(BaseModel):
    facebook: HttpUrl | None = None
    instagram: HttpUrl | None = None
    tiktok: HttpUrl | None = None
    website: HttpUrl | None = None


class UserRead(BaseModel):
    id: int
    email: EmailStr
    username: str | None = None
    full_name: str
    is_active: bool
    is_admin: bool
    role: UserRole = "user"
    email_verified: bool = False
    avatar_url: str | None = None
    cover_image_url: str | None = None
    bio: str | None = None
    date_of_birth: date | None = None
    gender: Gender | None = None
    location: str | None = None
    phone: str | None = None
    phone_number: str | None = None
    social_links: SocialLinks | None = None
    oauth_provider: str | None = None

    model_config = {"from_attributes": True}


class PublicUserRead(BaseModel):
    id: int
    username: str | None = None
    full_name: str
    role: UserRole = "user"
    avatar_url: str | None = None
    cover_image_url: str | None = None
    bio: str | None = None
    gender: Gender | None = None
    location: str | None = None
    social_links: SocialLinks | None = None

    model_config = {"from_attributes": True}


class UserProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    email: EmailStr | None = None
    username: str | None = Field(default=None, min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_][a-zA-Z0-9_-]*$")
    avatar_url: HttpUrl | None = None
    cover_image_url: HttpUrl | None = None
    bio: str | None = Field(default=None, max_length=2000)
    date_of_birth: date | None = None
    gender: Gender | None = None
    location: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=50)
    phone_number: str | None = Field(default=None, max_length=50)
    social_links: SocialLinks | None = None


class ImageUrlUpdate(BaseModel):
    url: HttpUrl


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)


class MessageResponse(BaseModel):
    message: str


class AdminUserRead(UserRead):
    created_at: object | None = None
    updated_at: object | None = None
    deleted_at: object | None = None


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserRoleUpdate(BaseModel):
    role: UserRole
