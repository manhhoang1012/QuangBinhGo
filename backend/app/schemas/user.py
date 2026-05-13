from datetime import date
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

Gender = Literal["male", "female", "other", "prefer_not_to_say"]


class UserRead(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    is_active: bool
    is_admin: bool
    avatar_url: str | None = None
    bio: str | None = None
    date_of_birth: date | None = None
    gender: Gender | None = None
    location: str | None = None
    phone: str | None = None

    model_config = {"from_attributes": True}


class UserProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    email: EmailStr | None = None
    avatar_url: str | None = Field(default=None, max_length=500)
    bio: str | None = None
    date_of_birth: date | None = None
    gender: Gender | None = None
    location: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=50)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)


class MessageResponse(BaseModel):
    message: str
