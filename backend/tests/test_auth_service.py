import pytest
from fastapi import HTTPException

from app.models.user import User
from app.schemas.auth import LoginRequest, UserCreate
from app.services.auth_service import AuthService


class FakeUserRepository:
    def __init__(self) -> None:
        self.users_by_email: dict[str, User] = {}
        self.next_id = 1

    def get_by_email(self, email: str) -> User | None:
        return self.users_by_email.get(email)

    def create(self, *, email: str, full_name: str, hashed_password: str) -> User:
        user = User(
            id=self.next_id,
            email=email,
            full_name=full_name,
            hashed_password=hashed_password,
            is_active=True,
            is_admin=False,
        )
        self.next_id += 1
        self.users_by_email[email] = user
        return user


def test_register_creates_user_and_token() -> None:
    service = AuthService(FakeUserRepository())

    response = service.register(
        UserCreate(
            email="traveler@example.com",
            full_name="Quang Binh Traveler",
            password="strong-password",
        )
    )

    assert response.access_token
    assert response.token_type == "bearer"
    assert response.user.email == "traveler@example.com"


def test_register_rejects_duplicate_email() -> None:
    service = AuthService(FakeUserRepository())
    user_create = UserCreate(
        email="traveler@example.com",
        full_name="Quang Binh Traveler",
        password="strong-password",
    )

    service.register(user_create)

    with pytest.raises(HTTPException) as exc_info:
        service.register(user_create)

    assert exc_info.value.status_code == 409


def test_login_rejects_invalid_password() -> None:
    service = AuthService(FakeUserRepository())
    service.register(
        UserCreate(
            email="traveler@example.com",
            full_name="Quang Binh Traveler",
            password="strong-password",
        )
    )

    with pytest.raises(HTTPException) as exc_info:
        service.login(
            LoginRequest(
                email="traveler@example.com",
                password="wrong-password",
            )
        )

    assert exc_info.value.status_code == 401
