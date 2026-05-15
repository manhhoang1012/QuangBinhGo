from __future__ import annotations

import os
from pathlib import Path
import sys

from sqlalchemy import select

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from app.core.security import get_password_hash
from app.db.init_db import init_db
from app.db.session import SessionLocal
from app.models.user import User

MODERATOR_EMAIL = "moderator@gmail.com"
MODERATOR_FULL_NAME = "Moderator"


def seed_moderator() -> None:
    moderator_password = os.getenv("MODERATOR_PASSWORD")
    if not moderator_password:
        raise RuntimeError("MODERATOR_PASSWORD environment variable is required.")

    init_db()

    with SessionLocal() as db:
        moderator = db.scalar(select(User).where(User.email == MODERATOR_EMAIL))

        if moderator:
            moderator.full_name = MODERATOR_FULL_NAME
            moderator.hashed_password = get_password_hash(moderator_password)
            moderator.is_active = True
            moderator.is_admin = False
            moderator.role = "moderator"
            moderator.email_verified = True
            action = "updated"
        else:
            moderator = User(
                email=MODERATOR_EMAIL,
                full_name=MODERATOR_FULL_NAME,
                hashed_password=get_password_hash(moderator_password),
                is_active=True,
                is_admin=False,
                role="moderator",
                email_verified=True,
            )
            db.add(moderator)
            action = "created"

        db.commit()

    print(f"Moderator user {action}: {MODERATOR_EMAIL}")


if __name__ == "__main__":
    seed_moderator()
