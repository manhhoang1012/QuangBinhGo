from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.dependencies import require_admin
from app.db.session import get_db
from app.models.analytics import ContentView, SearchLog
from app.models.user import User
from app.repositories.review_post_repository import ReviewPostRepository
from app.schemas.place import PlaceRead
from app.schemas.review_post import ReviewPostRead
from app.services.analytics_service import AnalyticsService
from app.services.review_post_service import ReviewPostService
from app.repositories.place_repository import PlaceRepository

router = APIRouter()


def build_place(place) -> PlaceRead:
    data = PlaceRead.model_validate(place)
    data.cover_image = place.cover_image
    return data


@router.get("/analytics/trending/posts", response_model=list[ReviewPostRead])
def trending_posts(limit: int = Query(default=10, ge=1, le=50), db: Session = Depends(get_db)):
    service = AnalyticsService(db)
    post_service = ReviewPostService(ReviewPostRepository(db), PlaceRepository(db))
    posts = service.get_trending_posts(limit=limit)
    counts = ReviewPostRepository(db).get_many_with_counts([post.id for post in posts])
    return [
        post_service.build_post_read(post, likes_count=counts.get(post.id, (post, 0, 0, 0))[1], comments_count=counts.get(post.id, (post, 0, 0, 0))[2], saves_count=counts.get(post.id, (post, 0, 0, 0))[3])
        for post in posts
    ]


@router.get("/analytics/trending/places", response_model=list[PlaceRead])
def trending_places(limit: int = Query(default=10, ge=1, le=50), db: Session = Depends(get_db)):
    return [build_place(place) for place in AnalyticsService(db).get_trending_places(limit=limit)]


@router.get("/admin/analytics/summary")
def admin_analytics_summary(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    summary = AnalyticsService(db).get_admin_analytics_summary()
    post_service = ReviewPostService(ReviewPostRepository(db), PlaceRepository(db))
    post_counts = ReviewPostRepository(db).get_many_with_counts([post.id for post in summary["top_posts"]])
    return {
        **summary,
        "top_places": [build_place(place) for place in summary["top_places"]],
        "top_posts": [
            post_service.build_post_read(post, likes_count=post_counts.get(post.id, (post, 0, 0, 0))[1], comments_count=post_counts.get(post.id, (post, 0, 0, 0))[2], saves_count=post_counts.get(post.id, (post, 0, 0, 0))[3])
            for post in summary["top_posts"]
        ],
    }


@router.get("/admin/analytics/searches")
def admin_search_logs(
    q: str | None = None,
    search_type: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    statement = select(SearchLog).options(selectinload(SearchLog.user)).order_by(SearchLog.created_at.desc())
    if q:
        statement = statement.where(SearchLog.query.ilike(f"%{q}%"))
    if search_type:
        statement = statement.where(SearchLog.search_type == search_type)
    if date_from:
        statement = statement.where(SearchLog.created_at >= date_from)
    if date_to:
        statement = statement.where(SearchLog.created_at <= date_to)
    rows = db.scalars(statement.offset((page - 1) * limit).limit(limit)).all()
    return [
        {
            "id": row.id,
            "query": row.query,
            "search_type": row.search_type,
            "filters": row.filters_json,
            "result_count": row.result_count,
            "user": {"id": row.user.id, "username": row.user.username, "full_name": row.user.full_name} if row.user else None,
            "created_at": row.created_at,
        }
        for row in rows
    ]


@router.get("/admin/analytics/content-views")
def admin_content_views(
    content_type: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    statement = select(ContentView).options(selectinload(ContentView.user)).order_by(ContentView.created_at.desc())
    if content_type:
        statement = statement.where(ContentView.content_type == content_type)
    if date_from:
        statement = statement.where(ContentView.created_at >= date_from)
    if date_to:
        statement = statement.where(ContentView.created_at <= date_to)
    rows = db.scalars(statement.offset((page - 1) * limit).limit(limit)).all()
    return [
        {
            "id": row.id,
            "content_type": row.content_type,
            "content_id": row.content_id,
            "session_id": row.session_id,
            "user_agent": row.user_agent,
            "referrer": row.referrer,
            "user": {"id": row.user.id, "username": row.user.username, "full_name": row.user.full_name} if row.user else None,
            "created_at": row.created_at,
        }
        for row in rows
    ]
