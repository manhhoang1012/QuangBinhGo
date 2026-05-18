from uuid import uuid4

from fastapi.testclient import TestClient

from app.core.security import create_access_token, get_password_hash
from app.db.init_db import init_db
from app.db.session import SessionLocal
from app.main import app
from app.models.notification import Notification
from app.models.user import User


client = TestClient(app)


def create_test_user(prefix: str) -> User:
    init_db()
    unique = uuid4().hex[:12]
    with SessionLocal() as db:
        user = User(
            email=f"{prefix}-{unique}@example.com",
            username=f"{prefix}-{unique}",
            full_name=f"{prefix.title()} User",
            hashed_password=get_password_hash("password123"),
            is_active=True,
            is_admin=False,
            role="user",
            email_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        db.expunge(user)
        return user


def auth_headers(user: User) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(str(user.id))}"}


def test_list_notifications_empty_returns_200() -> None:
    user = create_test_user("notif-empty")

    response = client.get("/api/v1/notifications?page=1&limit=8", headers=auth_headers(user))

    assert response.status_code == 200
    assert response.json() == {"items": [], "total": 0, "page": 1, "limit": 8, "total_pages": 0}


def test_list_notifications_actor_null_returns_200() -> None:
    user = create_test_user("notif-null-actor")
    with SessionLocal() as db:
        notification = Notification(
            recipient_id=user.id,
            actor_id=None,
            type="post_deleted",
            title="Bài viết đã bị xóa",
            message="Bài viết của bạn đã bị xóa bởi quản trị viên.",
            target_type="post",
            target_id=None,
            target_url=None,
            metadata_json={"source": "test"},
        )
        db.add(notification)
        db.commit()

    response = client.get("/api/v1/notifications?page=1&limit=8", headers=auth_headers(user))

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["actor"] is None
    assert body["items"][0]["metadata"] == {"source": "test"}


def test_user_cannot_see_other_users_notifications() -> None:
    owner = create_test_user("notif-owner")
    other = create_test_user("notif-other")
    with SessionLocal() as db:
        db.add(
            Notification(
                recipient_id=owner.id,
                actor_id=None,
                type="post_hidden",
                title="Hidden",
                message="Hidden message",
                target_type="post",
            )
        )
        db.commit()

    response = client.get("/api/v1/notifications?page=1&limit=8", headers=auth_headers(other))

    assert response.status_code == 200
    assert response.json()["items"] == []
