from app.db.base import Base
from app.db.session import engine
from app.models import Place, PostComment, PostLike, PostSave, ReviewPost, User
from sqlalchemy import inspect, text

__all__ = ["Place", "PostComment", "PostLike", "PostSave", "ReviewPost", "User"]


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_user_profile_columns()


def ensure_user_profile_columns() -> None:
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("users")}
    columns = {
        "avatar_url": "VARCHAR(500)",
        "bio": "TEXT",
        "date_of_birth": "DATE",
        "gender": "VARCHAR(30)",
        "location": "VARCHAR(255)",
        "phone": "VARCHAR(50)",
    }

    with engine.begin() as connection:
        for column_name, column_type in columns.items():
            if column_name not in existing_columns:
                connection.execute(text(f"ALTER TABLE users ADD COLUMN {column_name} {column_type}"))
