from pydantic import BaseModel, EmailStr, Field

from app.schemas.user import UserRead


class UserBase(BaseModel):
    email: EmailStr
    username: str | None = Field(default=None, min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_][a-zA-Z0-9_-]*$")
    full_name: str = Field(min_length=1, max_length=255)


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AuthResponse(Token):
    user: UserRead


class LogoutResponse(BaseModel):
    message: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=16)
    new_password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)


class VerifyEmailRequest(BaseModel):
    token: str = Field(min_length=16)


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class DevTokenResponse(BaseModel):
    message: str
    dev_token: str | None = None
    dev_url: str | None = None
