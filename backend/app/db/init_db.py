from app.db.base import Base
from app.db.session import engine
from app.models import AuthToken, Category, CommentLike, CommentReport, Place, PlaceReview, PostComment, PostHide, PostLike, PostReport, PostSave, ReviewPost, SiteSettings, User, UserFollow
from sqlalchemy import inspect, text

__all__ = ["AuthToken", "Category", "CommentLike", "CommentReport", "Place", "PlaceReview", "PostComment", "PostHide", "PostLike", "PostReport", "PostSave", "ReviewPost", "SiteSettings", "User", "UserFollow"]


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_user_profile_columns()
    ensure_admin_content_columns()


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


def ensure_admin_content_columns() -> None:
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    table_columns = {
        "places": {
            "status": "VARCHAR(30) DEFAULT 'active' NOT NULL",
            "slug": "VARCHAR(255)",
            "tags": "JSON",
            "videos": "JSON",
            "opening_hours": "VARCHAR(255)",
            "ticket_price": "VARCHAR(255)",
            "price_min": "NUMERIC(12, 2)",
            "price_max": "NUMERIC(12, 2)",
            "contact_phone": "VARCHAR(50)",
            "contact_email": "VARCHAR(255)",
            "website_url": "VARCHAR(500)",
            "facebook_url": "VARCHAR(500)",
            "review_count": "INTEGER DEFAULT 0 NOT NULL",
        },
        "review_posts": {
            "status": "VARCHAR(30) DEFAULT 'visible' NOT NULL",
            "videos": "JSON DEFAULT '[]' NOT NULL",
            "hashtags": "JSON DEFAULT '[]' NOT NULL",
            "tagged_users": "JSON DEFAULT '[]' NOT NULL",
            "visibility": "VARCHAR(30) DEFAULT 'public' NOT NULL",
            "is_draft": "BOOLEAN DEFAULT FALSE NOT NULL",
            "share_count": "INTEGER DEFAULT 0 NOT NULL",
        },
        "post_comments": {
            "parent_comment_id": "INTEGER",
            "status": "VARCHAR(30) DEFAULT 'visible' NOT NULL",
            "report_count": "INTEGER DEFAULT 0 NOT NULL",
        },
    }

    with engine.begin() as connection:
        for table_name, columns in table_columns.items():
            if table_name not in tables:
                continue
            existing_columns = {column["name"] for column in inspector.get_columns(table_name)}
            for column_name, column_type in columns.items():
                if column_name not in existing_columns:
                    connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"))
        if "places" in tables:
            connection.execute(text("UPDATE places SET tags = '[]' WHERE tags IS NULL"))
            connection.execute(text("UPDATE places SET videos = '[]' WHERE videos IS NULL"))
            connection.execute(text("UPDATE places SET review_count = 0 WHERE review_count IS NULL"))
        if "review_posts" in tables:
            connection.execute(text("UPDATE review_posts SET videos = '[]' WHERE videos IS NULL"))
            connection.execute(text("UPDATE review_posts SET hashtags = '[]' WHERE hashtags IS NULL"))
            connection.execute(text("UPDATE review_posts SET tagged_users = '[]' WHERE tagged_users IS NULL"))
            connection.execute(text("UPDATE review_posts SET visibility = 'public' WHERE visibility IS NULL"))
            connection.execute(text("UPDATE review_posts SET is_draft = FALSE WHERE is_draft IS NULL"))
            connection.execute(text("UPDATE review_posts SET share_count = 0 WHERE share_count IS NULL"))
        if "post_comments" in tables:
            connection.execute(text("UPDATE post_comments SET status = 'visible' WHERE status IS NULL"))
            connection.execute(text("UPDATE post_comments SET report_count = 0 WHERE report_count IS NULL"))
