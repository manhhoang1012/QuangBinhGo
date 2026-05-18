import logging
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile

from app.core.config import settings
from app.schemas.upload import UploadedMediaRead, UploadResponse

logger = logging.getLogger(__name__)

IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
VIDEO_TYPES = {"video/mp4": ".mp4", "video/webm": ".webm", "video/quicktime": ".mov", "video/quicktime; codecs=qt": ".mov"}
UPLOAD_LIMITS = {
    "avatar": {"resource_type": "image", "max_files": 1, "max_size": 2 * 1024 * 1024, "folder": "avatars"},
    "cover": {"resource_type": "image", "max_files": 1, "max_size": 5 * 1024 * 1024, "folder": "covers"},
    "post_image": {"resource_type": "image", "max_files": 10, "max_size": 5 * 1024 * 1024, "folder": "posts/images"},
    "post_video": {"resource_type": "video", "max_files": 3, "max_size": 50 * 1024 * 1024, "folder": "posts/videos"},
    "place_image": {"resource_type": "image", "max_files": 20, "max_size": 5 * 1024 * 1024, "folder": "places"},
    "review_image": {"resource_type": "image", "max_files": 10, "max_size": 5 * 1024 * 1024, "folder": "reviews"},
    "settings_image": {"resource_type": "image", "max_files": 1, "max_size": 5 * 1024 * 1024, "folder": "settings"},
}


class UploadService:
    def __init__(self) -> None:
        self.cloudinary_configured = bool(settings.cloudinary_cloud_name and settings.cloudinary_api_key and settings.cloudinary_api_secret)
        if self.cloudinary_configured:
            import cloudinary

            cloudinary.config(
                cloud_name=settings.cloudinary_cloud_name,
                api_key=settings.cloudinary_api_key,
                api_secret=settings.cloudinary_api_secret,
                secure=True,
            )
        else:
            logger.warning("Cloudinary not configured, using local upload fallback.")

    async def upload_files(self, files: list[UploadFile], upload_type: str, folder: str | None = None, public_id_prefix: str | None = None) -> UploadResponse:
        config = UPLOAD_LIMITS.get(upload_type)
        if not config:
            raise HTTPException(status_code=400, detail="Unsupported upload type.")
        if len(files) > int(config["max_files"]):
            raise HTTPException(status_code=400, detail=f"You can upload up to {config['max_files']} files.")

        items: list[UploadedMediaRead] = []
        for file in files:
            content = await file.read()
            resource_type = str(config["resource_type"])
            if resource_type == "image":
                self.validate_image(file, content, int(config["max_size"]))
            else:
                self.validate_video(file, content, int(config["max_size"]))
            target_folder = self._folder(folder or str(config["folder"]))
            if self.cloudinary_configured:
                items.append(self._upload_cloudinary(content, file, upload_type, target_folder, public_id_prefix, resource_type))
            else:
                items.append(self._upload_local(content, file, target_folder, resource_type))
        return UploadResponse(items=items, urls=[item.secure_url for item in items])

    def validate_image(self, file: UploadFile, content: bytes, max_size: int = 5 * 1024 * 1024) -> None:
        suffix = IMAGE_TYPES.get(file.content_type or "")
        if not suffix or not self._filename_allowed(file.filename, suffix):
            raise HTTPException(status_code=400, detail="Only JPG, PNG, WEBP images are allowed.")
        if len(content) > max_size:
            raise HTTPException(status_code=400, detail=f"Image must be {max_size // 1024 // 1024}MB or smaller.")

    def validate_video(self, file: UploadFile, content: bytes, max_size: int = 50 * 1024 * 1024) -> None:
        suffix = VIDEO_TYPES.get(file.content_type or "")
        if not suffix or not self._filename_allowed(file.filename, suffix):
            raise HTTPException(status_code=400, detail="Only MP4, WEBM, MOV videos are allowed.")
        if len(content) > max_size:
            raise HTTPException(status_code=400, detail="Video must be 50MB or smaller.")

    def delete_asset(self, public_id: str, resource_type: str = "image") -> dict[str, str]:
        if not self.cloudinary_configured:
            return {"result": "skipped-local-fallback"}
        try:
            import cloudinary.uploader

            result = cloudinary.uploader.destroy(public_id, resource_type=resource_type)
            return {"result": str(result.get("result", "ok"))}
        except Exception as exc:
            logger.warning("Cloudinary delete failed: %s", exc)
            raise HTTPException(status_code=400, detail="Could not delete uploaded asset.") from exc

    def _upload_cloudinary(self, content: bytes, file: UploadFile, upload_type: str, folder: str, public_id_prefix: str | None, resource_type: str) -> UploadedMediaRead:
        try:
            import cloudinary.uploader

            options = {
                "folder": folder,
                "resource_type": resource_type,
                "public_id": f"{public_id_prefix}-{uuid4().hex}" if public_id_prefix else None,
                "overwrite": False,
                "quality": "auto",
                "fetch_format": "auto",
            }
            if upload_type == "avatar":
                options["transformation"] = [{"width": 400, "height": 400, "crop": "fill", "gravity": "face", "quality": "auto", "fetch_format": "auto"}]
            elif upload_type == "cover":
                options["transformation"] = [{"width": 1200, "height": 400, "crop": "fill", "quality": "auto", "fetch_format": "auto"}]
            result = cloudinary.uploader.upload(content, **{key: value for key, value in options.items() if value is not None})
            return self.build_upload_response(result)
        except Exception as exc:
            logger.warning("Cloudinary upload failed, using local fallback: %s", exc)
            return self._upload_local(content, file, folder, resource_type)

    def _upload_local(self, content: bytes, file: UploadFile, folder: str, resource_type: str) -> UploadedMediaRead:
        suffix = (IMAGE_TYPES if resource_type == "image" else VIDEO_TYPES).get(file.content_type or "") or Path(file.filename or "").suffix or ".bin"
        upload_dir = Path(__file__).resolve().parents[2] / "static" / "uploads" / folder
        upload_dir.mkdir(parents=True, exist_ok=True)
        filename = f"{uuid4().hex}{suffix}"
        (upload_dir / filename).write_bytes(content)
        url = f"{settings.backend_url.rstrip('/')}/static/uploads/{folder}/{filename}".replace("\\", "/")
        return UploadedMediaRead(url=url, secure_url=url, public_id=f"local/{folder}/{filename}", resource_type=resource_type, format=suffix.lstrip("."), bytes=len(content))

    def build_upload_response(self, result: dict) -> UploadedMediaRead:
        return UploadedMediaRead(
            url=result.get("url") or result.get("secure_url"),
            secure_url=result.get("secure_url") or result.get("url"),
            public_id=result.get("public_id", ""),
            resource_type=result.get("resource_type", "image"),
            format=result.get("format"),
            bytes=int(result.get("bytes") or 0),
            width=result.get("width"),
            height=result.get("height"),
            duration=result.get("duration"),
        )

    def _folder(self, folder: str) -> str:
        root = settings.cloudinary_upload_folder.strip("/") or "quangbinhgo"
        return f"{root}/{folder.strip('/')}"

    def _filename_allowed(self, filename: str | None, expected_suffix: str) -> bool:
        if not filename:
            return True
        suffix = Path(filename).suffix.lower()
        if expected_suffix == ".jpg":
            return suffix in {".jpg", ".jpeg"}
        if expected_suffix == ".mov":
            return suffix in {".mov", ".qt"}
        return suffix == expected_suffix
