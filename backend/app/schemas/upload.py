from pydantic import BaseModel, Field


class UploadedMediaRead(BaseModel):
    url: str
    secure_url: str
    public_id: str
    resource_type: str
    format: str | None = None
    bytes: int
    width: int | None = None
    height: int | None = None
    duration: float | None = None


class UploadResponse(BaseModel):
    items: list[UploadedMediaRead]
    urls: list[str] = Field(default_factory=list)


class DeleteAssetRequest(BaseModel):
    public_id: str = Field(min_length=1)
    resource_type: str = Field(default="image", pattern="^(image|video|raw)$")
