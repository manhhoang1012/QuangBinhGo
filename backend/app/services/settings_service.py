from pathlib import Path
from uuid import uuid4
import logging

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.site_settings import SiteSettings
from app.schemas.site_settings import SiteSettingsPayload

SETTINGS_ID = 1
MAX_IMAGE_SIZE = 5 * 1024 * 1024
MAX_SETTINGS_IMAGE_BYTES = MAX_IMAGE_SIZE
ALLOWED_SETTINGS_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/x-icon": ".ico",
    "image/vnd.microsoft.icon": ".ico",
}

logger = logging.getLogger(__name__)


def default_settings() -> dict:
    return SiteSettingsPayload().model_dump()


class SettingsService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_payload(self) -> SiteSettingsPayload:
        row = self._get_or_create()
        return SiteSettingsPayload(**{**default_settings(), **(row.data or {})})

    def update(self, payload: SiteSettingsPayload) -> SiteSettingsPayload:
        row = self._get_or_create()
        row.data = payload.model_dump()
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return SiteSettingsPayload(**row.data)

    async def upload_image(self, file: UploadFile, upload_type: str) -> str:
        suffix = ALLOWED_SETTINGS_IMAGE_TYPES.get(file.content_type or "")
        if not suffix:
            raise HTTPException(status_code=400, detail="Only jpg, png, webp, and ico images are allowed.")
        if upload_type == "favicon" and suffix not in {".ico", ".png", ".webp"}:
            raise HTTPException(status_code=400, detail="Favicon must be ico, png, or webp.")

        content = await file.read()
        if len(content) > MAX_SETTINGS_IMAGE_BYTES:
            raise HTTPException(status_code=400, detail="Image must be 5MB or smaller.")

        safe_type = upload_type if upload_type in {"logo", "favicon", "hero"} else "settings"
        upload_dir = Path(__file__).resolve().parents[2] / "static" / "uploads" / "settings"
        filename = f"{safe_type}-{uuid4().hex}{suffix}"
        try:
            upload_dir.mkdir(parents=True, exist_ok=True)
            (upload_dir / filename).write_bytes(content)
        except OSError:
            logger.exception("Failed to write settings image upload.")
            raise HTTPException(status_code=500, detail="Could not save uploaded image.") from None
        return f"{settings.backend_url.rstrip('/')}/static/uploads/settings/{filename}"

    def _get_or_create(self) -> SiteSettings:
        row = self.db.get(SiteSettings, SETTINGS_ID)
        if row:
            return row
        row = SiteSettings(id=SETTINGS_ID, data=default_settings())
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return row
