from app.db.base import Base
from app.db.session import engine
from app.models import AuthToken, Place, PlaceReview, PostComment, PostLike, PostSave, ReviewPost, User
from sqlalchemy import inspect, text

__all__ = ["AuthToken", "Place", "PlaceReview", "PostComment", "PostLike", "PostSave", "ReviewPost", "User"]


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_user_profile_columns()


def ensure_user_profile_columns() -> None:
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("users")}
    columns = {
        "username": "VARCHAR(50)",
        "avatar_url": "VARCHAR(500)",
        "cover_image_url": "VARCHAR(500)",
        "bio": "TEXT",
        "date_of_birth": "DATE",
        "gender": "VARCHAR(30)",
        "location": "VARCHAR(255)",
        "phone": "VARCHAR(50)",
        "phone_number": "VARCHAR(50)",
        "social_links": "JSON",
        "oauth_provider": "VARCHAR(50)",
        "oauth_provider_id": "VARCHAR(255)",
        "role": "VARCHAR(20) DEFAULT 'user' NOT NULL",
        "email_verified": "BOOLEAN DEFAULT FALSE NOT NULL",
        "deleted_at": "TIMESTAMP WITH TIME ZONE",
    }

    with engine.begin() as connection:
        for column_name, column_type in columns.items():
            if column_name not in existing_columns:
                connection.execute(text(f"ALTER TABLE users ADD COLUMN {column_name} {column_type}"))
        connection.execute(text("UPDATE users SET role = 'admin' WHERE is_admin = TRUE"))
        connection.execute(text("UPDATE users SET role = 'user' WHERE role IS NULL"))
        connection.execute(text("UPDATE users SET phone_number = phone WHERE phone_number IS NULL AND phone IS NOT NULL"))
