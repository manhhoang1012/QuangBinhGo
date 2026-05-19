from math import asin, cos, radians, sin, sqrt
from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, Response, UploadFile, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_optional_current_user, require_admin
from app.core.content_safety import validate_not_spam
from app.db.session import get_db
from app.models.place import Place
from app.models.review_post import PlaceReview, PlaceReviewHelpful, PlaceReviewReport
from app.models.user import User
from app.repositories.place_repository import PlaceRepository
from app.schemas.place import PlaceCreate, PlaceDetailRead, PlaceMapRead, PlaceRead, PlaceUpdate, RouteSuggestionRead, RouteSuggestionRequest
from app.schemas.review_post import PlaceReviewCreate, PlaceReviewListRead, PlaceReviewRead, PlaceReviewReportCreate, PlaceReviewReportRead, PlaceReviewUpdate, RatingSummary
from app.services.place_service import PlaceService
from app.services.analytics_service import AnalyticsService
from app.services.upload_service import UploadService

router = APIRouter()


def get_place_service(db: Session = Depends(get_db)) -> PlaceService:
    return PlaceService(PlaceRepository(db))


PUBLIC_STATUSES = {"active", "published"}
ALLOWED_REVIEW_IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
MAX_REVIEW_IMAGE_BYTES = 5 * 1024 * 1024
MAX_REVIEW_IMAGE_UPLOADS = 10


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    radius = 6371.0
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    return 2 * radius * asin(sqrt(a))


def safe_float(value: object) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if number == number else None


def get_review_stats(db: Session, place_ids: list[int]) -> dict[int, tuple[float, int]]:
    if not place_ids:
        return {}
    rows = db.execute(
        select(PlaceReview.place_id, func.avg(PlaceReview.rating), func.count(PlaceReview.id))
        .where(PlaceReview.place_id.in_(place_ids), PlaceReview.status == "visible")
        .group_by(PlaceReview.place_id)
    ).all()
    return {place_id: (float(avg_rating or 0), int(review_count or 0)) for place_id, avg_rating, review_count in rows}


def normalize_tag(value: object) -> str:
    return str(value).strip().lower()


def parse_requested_tags(tags: str | None) -> set[str]:
    if not tags:
        return set()
    return {normalize_tag(tag) for tag in tags.split(",") if normalize_tag(tag)}


def normalize_place_tags(tags: object) -> set[str]:
    if tags is None:
        return set()
    if isinstance(tags, str):
        values = tags.split(",")
    elif isinstance(tags, list):
        values = tags
    else:
        return set()
    return {normalize_tag(tag) for tag in values if normalize_tag(tag)}


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


def build_place_map_read(place: Place, distance_km: float | None = None) -> PlaceMapRead:
    return PlaceMapRead(
        id=place.id,
        name=place.name,
        slug=place.slug,
        latitude=place.latitude,
        longitude=place.longitude,
        address=place.address,
        cover_image=place.cover_image,
        category=place.category,
        region=place.region,
        rating_avg=place.rating_avg,
        distance_km=round(distance_km, 2) if distance_km is not None else None,
    )


def build_google_maps_url(origin: tuple[float, float], places: list[Place]) -> str:
    destination = places[-1]
    params = [
        "api=1",
        f"origin={origin[0]},{origin[1]}",
        f"destination={safe_float(destination.latitude)},{safe_float(destination.longitude)}",
    ]
    waypoints = [f"{safe_float(place.latitude)},{safe_float(place.longitude)}" for place in places[:-1]]
    if waypoints:
        params.append(f"waypoints={'|'.join(waypoints)}")
    return "https://www.google.com/maps/dir/?" + "&".join(params)


def get_public_place_or_404(db: Session, place_id: int) -> Place:
    place = db.get(Place, place_id)
    if not place or place.status not in PUBLIC_STATUSES:
        raise HTTPException(status_code=404, detail="Place not found.")
    return place


def recalculate_place_rating(db: Session, place: Place) -> None:
    average_rating, review_count = db.execute(
        select(func.avg(PlaceReview.rating), func.count(PlaceReview.id)).where(PlaceReview.place_id == place.id, PlaceReview.status == "visible")
    ).one()
    place.rating_avg = average_rating or 0
    place.review_count = int(review_count or 0)
    db.add(place)
    db.commit()
    db.refresh(place)


def build_review_read(review: PlaceReview, db: Session, current_user: User | None = None) -> PlaceReviewRead:
    return PlaceReviewRead.model_validate({
        **review.__dict__,
        "place": review.place,
        "author": review.author,
        "helpful_by_me": bool(current_user and db.scalar(select(PlaceReviewHelpful).where(PlaceReviewHelpful.review_id == review.id, PlaceReviewHelpful.user_id == current_user.id))),
    })


def rating_summary(db: Session, place_id: int) -> RatingSummary:
    rows = db.execute(select(PlaceReview.rating, func.count(PlaceReview.id)).where(PlaceReview.place_id == place_id, PlaceReview.status == "visible").group_by(PlaceReview.rating)).all()
    star_counts = {star: 0 for star in range(1, 6)}
    total = 0
    weighted = 0
    for rating, count in rows:
        star_counts[int(rating)] = int(count)
        total += int(count)
        weighted += int(rating) * int(count)
    return RatingSummary(average_rating=round(weighted / total, 2) if total else 0, review_count=total, star_counts=star_counts)


def get_place_review_or_404(db: Session, place_id: int, review_id: int) -> PlaceReview:
    review = db.get(PlaceReview, review_id)
    if not review or review.place_id != place_id:
        raise HTTPException(status_code=404, detail="Review not found.")
    return review


@router.get("", response_model=list[PlaceRead])
def list_places(
    request: Request,
    q: str | None = Query(default=None, min_length=1),
    category: str | None = Query(default=None, min_length=1),
    tags: str | None = Query(default=None),
    region: str | None = Query(default=None, min_length=1),
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
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
) -> list[PlaceRead]:
    keyword = q or search
    statement = select(Place).where(Place.status.in_(PUBLIC_STATUSES))
    if category:
        statement = statement.where(Place.category == category)
    if region:
        statement = statement.where(func.lower(Place.region) == region.strip().lower())
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
    wanted_tags = parse_requested_tags(tags)
    if wanted_tags:
        places = [place for place in places if normalize_place_tags(place.tags).intersection(wanted_tags)]

    distances: dict[int, float] = {}
    if near_lat is not None and near_lng is not None:
        for place in places:
            place_lat = safe_float(place.latitude)
            place_lng = safe_float(place.longitude)
            if place_lat is None or place_lng is None:
                continue
            distance = haversine_km(near_lat, near_lng, place_lat, place_lng)
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
        places.sort(key=lambda place: place.created_at or place.updated_at, reverse=True)

    start = (page - 1) * limit
    result = [build_place_read(place, distances.get(place.id), review_stats) for place in places[start : start + limit]]
    AnalyticsService(db).track_search(
        query=keyword,
        search_type="places",
        filters={"category": category, "tags": tags, "region": region, "min_rating": min_rating, "max_price": max_price, "price_type": price_type, "near": bool(near_lat is not None and near_lng is not None), "sort": sort},
        result_count=len(result),
        user=current_user,
        request=request,
    )
    return result


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


@router.get("/map", response_model=list[PlaceMapRead])
def map_places(
    category: str | None = Query(default=None, min_length=1),
    tags: str | None = Query(default=None),
    region: str | None = Query(default=None, min_length=1),
    near_lat: float | None = Query(default=None, ge=-90, le=90),
    near_lng: float | None = Query(default=None, ge=-180, le=180),
    radius_km: float | None = Query(default=None, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[PlaceMapRead]:
    statement = select(Place).where(Place.status.in_(PUBLIC_STATUSES), Place.latitude.is_not(None), Place.longitude.is_not(None))
    if category:
        statement = statement.where(Place.category == category)
    if region:
        statement = statement.where(func.lower(Place.region) == region.strip().lower())
    places = list(db.scalars(statement).all())
    wanted_tags = parse_requested_tags(tags)
    if wanted_tags:
        places = [place for place in places if normalize_place_tags(place.tags).intersection(wanted_tags)]

    distances: dict[int, float] = {}
    if near_lat is not None and near_lng is not None:
        filtered: list[Place] = []
        for place in places:
            place_lat = safe_float(place.latitude)
            place_lng = safe_float(place.longitude)
            if place_lat is None or place_lng is None:
                continue
            distance = haversine_km(near_lat, near_lng, place_lat, place_lng)
            if radius_km is None or distance <= radius_km:
                distances[place.id] = distance
                filtered.append(place)
        places = filtered
        places.sort(key=lambda place: distances.get(place.id, 0))
    return [build_place_map_read(place, distances.get(place.id)) for place in places[:500]]


@router.post("/route-suggestions", response_model=RouteSuggestionRead)
def route_suggestions(payload: RouteSuggestionRequest, db: Session = Depends(get_db)) -> RouteSuggestionRead:
    unique_ids = list(dict.fromkeys(payload.place_ids))
    places = list(db.scalars(select(Place).where(Place.id.in_(unique_ids), Place.status.in_(PUBLIC_STATUSES))).all())
    place_by_id = {place.id: place for place in places}
    remaining = [
        place_by_id[place_id]
        for place_id in unique_ids
        if place_id in place_by_id and safe_float(place_by_id[place_id].latitude) is not None and safe_float(place_by_id[place_id].longitude) is not None
    ]
    if not remaining:
        raise HTTPException(status_code=404, detail="No routable places found.")

    current = (payload.start_lat, payload.start_lng)
    ordered: list[Place] = []
    total_distance = 0.0
    while remaining:
        next_place = min(remaining, key=lambda place: haversine_km(current[0], current[1], safe_float(place.latitude) or 0, safe_float(place.longitude) or 0))
        distance = haversine_km(current[0], current[1], safe_float(next_place.latitude) or 0, safe_float(next_place.longitude) or 0)
        total_distance += distance
        ordered.append(next_place)
        remaining.remove(next_place)
        current = (safe_float(next_place.latitude) or current[0], safe_float(next_place.longitude) or current[1])

    speed = {"driving": 40, "motorbike": 35, "walking": 5}[payload.travel_mode]
    minutes = round((total_distance / speed) * 60) if speed else 0
    hours, remaining_minutes = divmod(minutes, 60)
    duration_text = f"{hours} giờ {remaining_minutes} phút" if hours else f"{remaining_minutes} phút"
    return RouteSuggestionRead(
        ordered_places=[build_place_map_read(place) for place in ordered],
        total_distance_km=round(total_distance, 2),
        estimated_duration_text=duration_text,
        google_maps_url=build_google_maps_url((payload.start_lat, payload.start_lng), ordered),
    )


@router.post("/{place_id}/reviews/uploads")
async def upload_place_review_images(
    place_id: int,
    files: list[UploadFile] = File(...),
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, list[str]]:
    get_public_place_or_404(db, place_id)
    response = await UploadService().upload_files(files, "review_image", folder=f"reviews/place-{place_id}")
    return {"urls": response.urls}


@router.get("/{place_id}/reviews", response_model=PlaceReviewListRead)
def list_place_reviews(
    place_id: int,
    rating: int | None = Query(default=None, ge=1, le=5),
    sort: str = Query(default="newest"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    current_user: User | None = Depends(lambda: None),
    db: Session = Depends(get_db),
) -> PlaceReviewListRead:
    get_public_place_or_404(db, place_id)
    statement = select(PlaceReview).where(PlaceReview.place_id == place_id, PlaceReview.status == "visible")
    if rating:
        statement = statement.where(PlaceReview.rating == rating)
    all_reviews = list(db.scalars(statement).all())
    if sort == "highest":
        all_reviews.sort(key=lambda review: (review.rating, review.created_at), reverse=True)
    elif sort == "lowest":
        all_reviews.sort(key=lambda review: (review.rating, review.created_at))
    elif sort == "helpful":
        all_reviews.sort(key=lambda review: (review.helpful_count, review.created_at), reverse=True)
    else:
        all_reviews.sort(key=lambda review: review.created_at, reverse=True)
    total = len(all_reviews)
    start = (page - 1) * limit
    items = all_reviews[start:start + limit]
    return PlaceReviewListRead(
        items=[build_review_read(review, db, current_user) for review in items],
        total=total,
        page=page,
        limit=limit,
        total_pages=(total + limit - 1) // limit if total else 0,
        rating_summary=rating_summary(db, place_id),
    )


@router.get("/{place_id}/reviews/featured", response_model=list[PlaceReviewRead])
def featured_place_reviews(place_id: int, limit: int = Query(default=3, ge=1, le=10), db: Session = Depends(get_db)) -> list[PlaceReviewRead]:
    get_public_place_or_404(db, place_id)
    reviews = list(db.scalars(select(PlaceReview).where(PlaceReview.place_id == place_id, PlaceReview.status == "visible")).all())
    reviews.sort(key=lambda review: (review.helpful_count, review.rating, review.created_at), reverse=True)
    return [build_review_read(review, db) for review in reviews[:limit]]


@router.post("/{place_id}/reviews", response_model=PlaceReviewRead, status_code=status.HTTP_201_CREATED)
def create_place_review(
    place_id: int,
    payload: PlaceReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PlaceReview:
    place = get_public_place_or_404(db, place_id)
    existing = db.scalar(select(PlaceReview).where(PlaceReview.place_id == place_id, PlaceReview.user_id == current_user.id, PlaceReview.status != "deleted"))
    if existing:
        raise HTTPException(status_code=409, detail="You already reviewed this place.")
    payload.content = validate_not_spam(payload.content)
    review = PlaceReview(place_id=place_id, user_id=current_user.id, rating=payload.rating, content=payload.content, images=payload.images)
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
    review = get_place_review_or_404(db, place_id, review_id)
    if review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update your own review.")
    if payload.content is not None:
        payload.content = validate_not_spam(payload.content)
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
    review = get_place_review_or_404(db, place_id, review_id)
    if review.user_id != current_user.id and current_user.role not in {"moderator", "admin"}:
        raise HTTPException(status_code=403, detail="You can only delete your own review.")
    review.status = "deleted"
    db.add(review)
    db.commit()
    recalculate_place_rating(db, place)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{place_id}/reviews/{review_id}/helpful")
def mark_review_helpful(place_id: int, review_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    review = get_place_review_or_404(db, place_id, review_id)
    if review.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot mark your own review as helpful.")
    existing = db.scalar(select(PlaceReviewHelpful).where(PlaceReviewHelpful.review_id == review_id, PlaceReviewHelpful.user_id == current_user.id))
    if not existing:
        db.add(PlaceReviewHelpful(review_id=review_id, user_id=current_user.id))
        review.helpful_count = (review.helpful_count or 0) + 1
        db.add(review)
        db.commit()
    return {"helpful_by_me": True, "helpful_count": review.helpful_count}


@router.delete("/{place_id}/reviews/{review_id}/helpful")
def unmark_review_helpful(place_id: int, review_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    review = get_place_review_or_404(db, place_id, review_id)
    existing = db.scalar(select(PlaceReviewHelpful).where(PlaceReviewHelpful.review_id == review_id, PlaceReviewHelpful.user_id == current_user.id))
    if existing:
        db.delete(existing)
        review.helpful_count = max(0, (review.helpful_count or 0) - 1)
        db.add(review)
        db.commit()
    return {"helpful_by_me": False, "helpful_count": review.helpful_count}


@router.post("/{place_id}/reviews/{review_id}/reports", response_model=PlaceReviewReportRead, status_code=status.HTTP_201_CREATED)
def report_place_review(place_id: int, review_id: int, payload: PlaceReviewReportCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> PlaceReviewReportRead:
    review = get_place_review_or_404(db, place_id, review_id)
    if review.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot report your own review.")
    existing = db.scalar(select(PlaceReviewReport).where(PlaceReviewReport.review_id == review_id, PlaceReviewReport.user_id == current_user.id))
    if existing:
        return PlaceReviewReportRead.model_validate(existing)
    report = PlaceReviewReport(review_id=review_id, user_id=current_user.id, reason=payload.reason, detail=payload.detail)
    review.report_count = (review.report_count or 0) + 1
    if review.report_count >= 3 and review.status == "visible":
        review.status = "reported"
    db.add(report)
    db.add(review)
    db.commit()
    db.refresh(report)
    recalculate_place_rating(db, db.get(Place, place_id))
    return PlaceReviewReportRead.model_validate(report)


@router.get("/{slug_or_id}", response_model=PlaceDetailRead)
def get_place(
    slug_or_id: str,
    request: Request,
    current_user: User | None = Depends(get_optional_current_user),
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
    try:
        AnalyticsService(db).track_view(content_type="place", content_id=place.id, user=current_user, request=request)
        db.refresh(place)
        detail.view_count = place.view_count
    except Exception:
        pass
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
