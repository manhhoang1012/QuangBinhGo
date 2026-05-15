from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.site_settings import SiteSettingsPayload
from app.services.settings_service import SettingsService

router = APIRouter()


@router.get("/public", response_model=SiteSettingsPayload)
def public_settings(db: Session = Depends(get_db)) -> SiteSettingsPayload:
    return SettingsService(db).get_payload()
