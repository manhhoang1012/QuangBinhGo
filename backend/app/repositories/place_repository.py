from collections.abc import Sequence

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.place import Place
from app.schemas.place import PlaceCreate, PlaceUpdate


class PlaceRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(
        self,
        *,
        category: str | None = None,
        search: str | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Sequence[Place]:
        statement = select(Place).order_by(Place.id.desc()).offset(skip).limit(limit)

        if category:
            statement = statement.where(Place.category == category)

        if search:
            statement = statement.where(Place.name.ilike(f"%{search}%"))

        return self.db.scalars(statement).all()

    def get(self, place_id: int) -> Place | None:
        return self.db.get(Place, place_id)

    def get_by_slug(self, slug: str) -> Place | None:
        return self.db.scalar(select(Place).where(Place.slug == slug))

    def slug_exists(self, slug: str, *, exclude_id: int | None = None) -> bool:
        statement = select(func.count(Place.id)).where(Place.slug == slug)
        if exclude_id is not None:
            statement = statement.where(Place.id != exclude_id)
        return bool(self.db.scalar(statement))

    def create(self, place_create: PlaceCreate) -> Place:
        place = Place(**place_create.model_dump())
        self.db.add(place)
        self.db.commit()
        self.db.refresh(place)
        return place

    def update(self, place: Place, place_update: PlaceUpdate) -> Place:
        update_data = place_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(place, field, value)

        self.db.add(place)
        self.db.commit()
        self.db.refresh(place)
        return place

    def delete(self, place: Place) -> None:
        self.db.delete(place)
        self.db.commit()
