from collections.abc import Sequence

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.db.session import get_db
from app.models.user import User
from app.repositories.place_repository import PlaceRepository
from app.schemas.place import PlaceCreate, PlaceRead, PlaceUpdate
from app.services.place_service import PlaceService

router = APIRouter()


def get_place_service(db: Session = Depends(get_db)) -> PlaceService:
    return PlaceService(PlaceRepository(db))


@router.get("", response_model=list[PlaceRead])
def list_places(
    category: str | None = Query(default=None, min_length=1),
    search: str | None = Query(default=None, min_length=1),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    place_service: PlaceService = Depends(get_place_service),
) -> Sequence[PlaceRead]:
    return place_service.list_places(
        category=category,
        search=search,
        skip=skip,
        limit=limit,
    )


@router.get("/{place_id}", response_model=PlaceRead)
def get_place(
    place_id: int,
    place_service: PlaceService = Depends(get_place_service),
) -> PlaceRead:
    return place_service.get_place(place_id)


@router.post("", response_model=PlaceRead, status_code=status.HTTP_201_CREATED)
def create_place(
    place_create: PlaceCreate,
    _: User = Depends(require_admin),
    place_service: PlaceService = Depends(get_place_service),
) -> PlaceRead:
    return place_service.create_place(place_create)


@router.patch("/{place_id}", response_model=PlaceRead)
def update_place(
    place_id: int,
    place_update: PlaceUpdate,
    _: User = Depends(require_admin),
    place_service: PlaceService = Depends(get_place_service),
) -> PlaceRead:
    return place_service.update_place(place_id, place_update)


@router.delete("/{place_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_place(
    place_id: int,
    _: User = Depends(require_admin),
    place_service: PlaceService = Depends(get_place_service),
) -> Response:
    place_service.delete_place(place_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
