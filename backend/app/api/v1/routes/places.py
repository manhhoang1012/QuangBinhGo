from math import asin, cos, radians, sin, sqrt

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_admin
from app.db.session import get_db
from app.models.place import Place
from app.models.review_post import PlaceReview
from app.models.user import User
from app.repositories.place_repository import PlaceRepository
from app.schemas.place import PlaceCreate, PlaceDetailRead, PlaceRead, PlaceUpdate
from app.schemas.review_post import PlaceReviewCreate, PlaceReviewRead, PlaceReviewUpdate
from app.services.place_service import PlaceService

router = APIRouter()


def get_place_service(db: Session = Depends(get_db)) -> PlaceService:
    return PlaceService(PlaceRepository(db))


PUBLIC_STATUSES = {"active", "published"}


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    radius = 6371.0
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    return 2 * radius * asin(sqrt(a))


def get_review_stats(db: Session, place_ids: list[int]) -> dict[int, tuple[float, int]]:
    if not place_ids:
        return {}
    rows = db.execute(
        select(PlaceReview.place_id, func.avg(PlaceReview.rating), func.count(PlaceReview.id))
        .where(PlaceReview.place_id.in_(place_ids))
        .group_by(PlaceReview.place_id)
    ).all()
    return {place_id: (float(avg_rating or 0), int(review_count or 0)) for place_id, avg_rating, review_count in rows}


def build_place_read(
    place: Place,
    distance_km: float | None = None,
    review_stats: dict[int, tuple[float, int]] | None = None,
) -> PlaceRead:
    data = PlaceRead.model_validate(place)
    if review_stats and place.id in review_stats:
        average_rating, review_count = review_stats[place.id]
        data.rating_avg = average_rating
        data.review_count = review_count
    data.cover_image = place.cover_image
    data.distance_km = round(distance_km, 2) if distance_km is not None else None
    return data


def get_public_place_or_404(db: Session, place_id: int) -> Place:
    place = db.get(Place, place_id)
    if not place or place.status not in PUBLIC_STATUSES:
        raise HTTPException(status_code=404, detail="Place not found.")
    return place


def recalculate_place_rating(db: Session, place: Place) -> None:
    average_rating, review_count = db.execute(
        select(func.avg(PlaceReview.rating), func.count(PlaceReview.id)).where(PlaceReview.place_id == place.id)
    ).one()
    place.rating_avg = average_rating or 0
    place.review_count = int(review_count or 0)
    db.add(place)
    db.commit()
    db.refresh(place)


@router.get("", response_model=list[PlaceRead])
def list_places(
    q: str | None = Query(default=None, min_length=1),
    category: str | None = Query(default=None, min_length=1),
    tags: str | None = Query(default=None),
    min_rating: float | None = Query(default=None, ge=0, le=5),
    max_price: float | None = Query(default=None, ge=0),
    price_type: str | None = Query(default=None),
    near_lat: float | None = Query(default=None, ge=-90, le=90),
    near_lng: float | None = Query(default=None, ge=-180, le=180),
    radius_km: float = Query(default=50, ge=1, le=500),
    sort: str = Query(default="newest"),
    page: int = Query(default=1, ge=1),
    search: str | None = Query(default=None, min_length=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[PlaceRead]:
    keyword = q or search
    statement = select(Place).where(Place.status.in_(PUBLIC_STATUSES))
    if category:
        statement = statement.where(Place.category == category)
    if keyword:
        pattern = f"%{keyword}%"
        statement = statement.where(or_(Place.name.ilike(pattern), Place.description.ilike(pattern), Place.address.ilike(pattern)))
    if max_price is not None:
        statement = statement.where(or_(Place.price_min.is_(None), Place.price_min <= max_price))
    if price_type == "free":
        statement = statement.where(or_(Place.price_min == 0, Place.ticket_price.ilike("%miễn phí%"), Place.ticket_price.ilike("%free%")))
    elif price_type == "paid":
        statement = statement.where(or_(Place.price_min > 0, Place.ticket_price.is_not(None)))

    places = list(db.scalars(statement).all())
    wanted_tags = [tag.strip().lower() for tag in (tags or "").split(",") if tag.strip()]
    if wanted_tags:
        places = [place for place in places if wanted_tags.intersection({tag.lower() for tag in (place.tags or [])})]

    distances: dict[int, float] = {}
    if near_lat is not None and near_lng is not None:
        for place in places:
            distance = haversine_km(near_lat, near_lng, float(place.latitude), float(place.longitude))
            if distance <= radius_km:
                distances[place.id] = distance
        places = [place for place in places if place.id in distances]

    review_stats = get_review_stats(db, [place.id for place in places])

    def effective_rating(place: Place) -> float:
        return review_stats.get(place.id, (float(place.rating_avg or 0), place.review_count or 0))[0]

    def effective_review_count(place: Place) -> int:
        return review_stats.get(place.id, (float(place.rating_avg or 0), place.review_count or 0))[1]

    if min_rating is not None:
        places = [place for place in places if effective_rating(place) >= min_rating]

    if sort == "rating_desc":
        places.sort(key=effective_rating, reverse=True)
    elif sort == "review_count_desc":
        places.sort(key=effective_review_count, reverse=True)
    elif sort == "price_asc":
        places.sort(key=lambda place: float(place.price_min or 0))
    elif sort == "distance_asc" and distances:
        places.sort(key=lambda place: distances[place.id])
    else:
        places.sort(key=lambda place: place.created_at, reverse=True)

    start = (page - 1) * limit
    return [build_place_read(place, distances.get(place.id), review_stats) for place in places[start : start + limit]]


@router.get("/semantic-search", response_model=list[PlaceRead])
def semantic_search_places(q: str = Query(..., min_length=1), limit: int = Query(default=10, ge=1, le=50), db: Session = Depends(get_db)) -> list[PlaceRead]:
    pattern = f"%{q}%"
    places = db.scalars(
        select(Place).where(
            Place.status.in_(PUBLIC_STATUSES),
            or_(Place.name.ilike(pattern), Place.description.ilike(pattern), Place.category.ilike(pattern), Place.address.ilike(pattern)),
        ).limit(limit)
    ).all()
    review_stats = get_review_stats(db, [place.id for place in places])
    return [build_place_read(place, review_stats=review_stats) for place in places]


@router.get("/{place_id}/reviews", response_model=list[PlaceReviewRead])
def list_place_reviews(
    place_id: int,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[PlaceReview]:
    get_public_place_or_404(db, place_id)
    return list(
        db.scalars(
            select(PlaceReview)
            .where(PlaceReview.place_id == place_id)
            .order_by(PlaceReview.created_at.desc())
            .offset(skip)
            .limit(limit)
        ).all()
    )


@router.post("/{place_id}/reviews", response_model=PlaceReviewRead, status_code=status.HTTP_201_CREATED)
def create_place_review(
    place_id: int,
    payload: PlaceReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PlaceReview:
    place = get_public_place_or_404(db, place_id)
    existing = db.scalar(select(PlaceReview).where(PlaceReview.place_id == place_id, PlaceReview.user_id == current_user.id))
    if existing:
        raise HTTPException(status_code=409, detail="You already reviewed this place.")
    review = PlaceReview(place_id=place_id, user_id=current_user.id, rating=payload.rating, content=payload.content)
    db.add(review)
    db.commit()
    db.refresh(review)
    recalculate_place_rating(db, place)
    return review


@router.patch("/{place_id}/reviews/{review_id}", response_model=PlaceReviewRead)
def update_place_review(
    place_id: int,
    review_id: int,
    payload: PlaceReviewUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PlaceReview:
    place = get_public_place_or_404(db, place_id)
    review = db.get(PlaceReview, review_id)
    if not review or review.place_id != place_id:
        raise HTTPException(status_code=404, detail="Review not found.")
    if review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update your own review.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(review, field, value)
    db.add(review)
    db.commit()
    db.refresh(review)
    recalculate_place_rating(db, place)
    return review


@router.delete("/{place_id}/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_place_review(
    place_id: int,
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    place = get_public_place_or_404(db, place_id)
    review = db.get(PlaceReview, review_id)
    if not review or review.place_id != place_id:
        raise HTTPException(status_code=404, detail="Review not found.")
    if review.user_id != current_user.id and current_user.role not in {"moderator", "admin"}:
        raise HTTPException(status_code=403, detail="You can only delete your own review.")
    db.delete(review)
    db.commit()
    recalculate_place_rating(db, place)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{slug_or_id}", response_model=PlaceDetailRead)
def get_place(
    slug_or_id: str,
    db: Session = Depends(get_db),
) -> PlaceDetailRead:
    if slug_or_id.isdigit():
        place = db.get(Place, int(slug_or_id))
    else:
        place = db.scalar(select(Place).where(Place.slug == slug_or_id))
    if not place or place.status not in PUBLIC_STATUSES:
        raise HTTPException(status_code=404, detail="Place not found.")

    related = list(
        db.scalars(
            select(Place)
            .where(Place.id != place.id, Place.status.in_(PUBLIC_STATUSES), Place.category == place.category)
            .order_by(Place.rating_avg.desc())
            .limit(6)
        ).all()
    )
    review_stats = get_review_stats(db, [place.id, *[item.id for item in related]])
    detail = PlaceDetailRead(
        **build_place_read(place, review_stats=review_stats).model_dump(),
        related_places=[build_place_read(item, review_stats=review_stats) for item in related],
    )
    return detail


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
