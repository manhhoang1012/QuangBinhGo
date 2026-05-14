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

ADMIN_EMAIL = "admin@gmail.com"
ADMIN_FULL_NAME = "Admin"


def seed_admin() -> None:
    admin_password = os.getenv("ADMIN_PASSWORD")
    if not admin_password:
        raise RuntimeError("ADMIN_PASSWORD environment variable is required.")

    init_db()

    with SessionLocal() as db:
        admin = db.scalar(select(User).where(User.email == ADMIN_EMAIL))

        if admin:
            admin.full_name = ADMIN_FULL_NAME
            admin.hashed_password = get_password_hash(admin_password)
            admin.is_active = True
            admin.is_admin = True
            admin.role = "admin"
            admin.email_verified = True
            action = "updated"
        else:
            admin = User(
                email=ADMIN_EMAIL,
                full_name=ADMIN_FULL_NAME,
                hashed_password=get_password_hash(admin_password),
                is_active=True,
                is_admin=True,
                role="admin",
                email_verified=True,
            )
            db.add(admin)
            action = "created"

        db.commit()

    print(f"Admin user {action}: {ADMIN_EMAIL}")


if __name__ == "__main__":
    seed_admin()
