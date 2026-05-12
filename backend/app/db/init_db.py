from app.db.base import Base
from app.db.session import engine
from app.models import Place, PostComment, PostLike, PostSave, ReviewPost, User

__all__ = ["Place", "PostComment", "PostLike", "PostSave", "ReviewPost", "User"]


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
