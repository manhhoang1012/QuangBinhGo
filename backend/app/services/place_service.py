from collections.abc import Sequence

from fastapi import HTTPException, status

from app.core.slugify import slugify
from app.models.place import Place
from app.repositories.place_repository import PlaceRepository
from app.schemas.place import PlaceCreate, PlaceUpdate


class PlaceService:
    def __init__(self, place_repository: PlaceRepository) -> None:
        self.place_repository = place_repository

    def list_places(
        self,
        *,
        category: str | None = None,
        search: str | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Sequence[Place]:
        return self.place_repository.list(
            category=category,
            search=search,
            skip=skip,
            limit=limit,
        )

    def get_place(self, place_id: int) -> Place:
        place = self.place_repository.get(place_id)
        if not place:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Place not found.",
            )
        return place

    def create_place(self, place_create: PlaceCreate) -> Place:
        place_create.slug = self._make_unique_slug(place_create.slug or place_create.name)
        return self.place_repository.create(place_create)

    def update_place(self, place_id: int, place_update: PlaceUpdate) -> Place:
        place = self.get_place(place_id)
        if place_update.slug is not None:
            place_update.slug = self._make_unique_slug(place_update.slug or place.name, exclude_id=place.id)
        elif place_update.name and not place.slug:
            place_update.slug = self._make_unique_slug(place_update.name, exclude_id=place.id)
        return self.place_repository.update(place, place_update)

    def delete_place(self, place_id: int) -> None:
        place = self.get_place(place_id)
        self.place_repository.delete(place)

    def _make_unique_slug(self, value: str, *, exclude_id: int | None = None) -> str:
        base = slugify(value, fallback="dia-diem")
        candidate = base
        suffix = 2
        while self.place_repository.slug_exists(candidate, exclude_id=exclude_id):
            candidate = f"{base}-{suffix}"
            suffix += 1
        return candidate
