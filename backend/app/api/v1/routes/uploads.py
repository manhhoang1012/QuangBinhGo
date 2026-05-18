from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.api.dependencies import get_current_user
from app.models.user import User
from app.schemas.upload import DeleteAssetRequest, UploadResponse
from app.services.upload_service import UploadService

router = APIRouter()


def get_upload_service() -> UploadService:
    return UploadService()


@router.post("", response_model=UploadResponse)
async def upload_files(
    files: list[UploadFile] = File(...),
    upload_type: str = Form(...),
    entity_id: str | None = Form(default=None),
    folder: str | None = Form(default=None),
    current_user: User = Depends(get_current_user),
    service: UploadService = Depends(get_upload_service),
) -> UploadResponse:
    prefix = f"user-{current_user.id}" + (f"-entity-{entity_id}" if entity_id else "")
    return await service.upload_files(files=files, upload_type=upload_type, folder=folder, public_id_prefix=prefix)


@router.delete("")
def delete_uploaded_asset(
    payload: DeleteAssetRequest,
    _: User = Depends(get_current_user),
    service: UploadService = Depends(get_upload_service),
) -> dict[str, str]:
    return service.delete_asset(payload.public_id, payload.resource_type)
