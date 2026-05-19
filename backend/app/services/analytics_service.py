from datetime import datetime, timedelta, timezone
from hashlib import sha256
from typing import Any

from fastapi import Request
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.models.analytics import ContentView, SearchLog
from app.models.place import Place
from app.models.review_post import PostComment, PostLike, PostSave, ReviewPost
from app.models.user import User


class AnalyticsService:
    VIEW_DEDUP_MINUTES = 30

    def __init__(self, db: Session) -> None:
        self.db = db

    def track_view(self, *, content_type: str, content_id: int, user: User | None, request: Request) -> bool:
        if content_type not in {"place", "post"}:
            return False
        session_id = self._session_id(request)
        ip_hash = self._ip_hash(request)
        since = datetime.now(timezone.utc) - timedelta(minutes=self.VIEW_DEDUP_MINUTES)
        statement = select(ContentView.id).where(
            ContentView.content_type == content_type,
            ContentView.content_id == content_id,
            ContentView.created_at >= since,
        )
        if user:
            statement = statement.where(ContentView.user_id == user.id)
        elif session_id:
            statement = statement.where(ContentView.session_id == session_id)
        else:
            statement = statement.where(ContentView.ip_hash == ip_hash, ContentView.user_agent == self._user_agent(request))
        if self.db.scalar(statement):
            return False

        view = ContentView(
            user_id=user.id if user else None,
            session_id=session_id,
            content_type=content_type,
            content_id=content_id,
            ip_hash=ip_hash,
            user_agent=self._user_agent(request),
            referrer=request.headers.get("referer") or request.headers.get("referrer"),
        )
        self.db.add(view)
        target = self.db.get(Place if content_type == "place" else ReviewPost, content_id)
        if target is not None:
            target.view_count = (target.view_count or 0) + 1
            self.db.add(target)
        self.db.commit()
        return True

    def track_search(
        self,
        *,
        query: str | None,
        search_type: str,
        filters: dict[str, Any] | None,
        result_count: int,
        user: User | None,
        request: Request,
    ) -> None:
        normalized_query = self._normalize_query(query)
        cleaned_filters = {key: value for key, value in (filters or {}).items() if value not in (None, "", [], {})}
        if not normalized_query and not cleaned_filters:
            return
        log = SearchLog(
            user_id=user.id if user else None,
            session_id=self._session_id(request),
            query=normalized_query or "[filters]",
            search_type=search_type[:30],
            filters_json=cleaned_filters or None,
            result_count=max(0, int(result_count)),
        )
        self.db.add(log)
        self.db.commit()

    def get_trending_posts(self, *, limit: int = 10) -> list[ReviewPost]:
        since = datetime.now(timezone.utc) - timedelta(days=7)
        views_7d = func.count(func.distinct(ContentView.id)).label("views_7d")
        likes = func.count(func.distinct(PostLike.id)).label("likes")
        comments = func.count(func.distinct(PostComment.id)).filter(PostComment.status == "visible").label("comments")
        saves = func.count(func.distinct(PostSave.id)).label("saves")
        score = (views_7d + likes * 3 + comments * 4 + saves * 5 + ReviewPost.share_count * 5).label("score")
        statement = (
            select(ReviewPost, score)
            .outerjoin(ContentView, (ContentView.content_type == "post") & (ContentView.content_id == ReviewPost.id) & (ContentView.created_at >= since))
            .outerjoin(PostLike, PostLike.post_id == ReviewPost.id)
            .outerjoin(PostComment, PostComment.post_id == ReviewPost.id)
            .outerjoin(PostSave, PostSave.post_id == ReviewPost.id)
            .where(ReviewPost.status == "visible", ReviewPost.visibility == "public", ReviewPost.is_draft.is_(False))
            .group_by(ReviewPost.id)
            .options(selectinload(ReviewPost.author), selectinload(ReviewPost.place))
            .order_by(score.desc(), ReviewPost.created_at.desc())
            .limit(limit)
        )
        return [post for post, _ in self.db.execute(statement).all()]

    def get_trending_places(self, *, limit: int = 10) -> list[Place]:
        since = datetime.now(timezone.utc) - timedelta(days=7)
        views_7d = func.count(ContentView.id).label("views_7d")
        score = (views_7d + Place.review_count * 3 + Place.rating_avg * 5).label("score")
        statement = (
            select(Place, score)
            .outerjoin(ContentView, (ContentView.content_type == "place") & (ContentView.content_id == Place.id) & (ContentView.created_at >= since))
            .where(Place.status.in_(["active", "published"]))
            .group_by(Place.id)
            .order_by(score.desc(), Place.created_at.desc())
            .limit(limit)
        )
        return [place for place, _ in self.db.execute(statement).all()]

    def get_popular_keywords(self, *, limit: int = 10) -> list[dict[str, Any]]:
        query_expr = func.lower(func.trim(SearchLog.query)).label("keyword")
        rows = self.db.execute(
            select(query_expr, func.count(SearchLog.id).label("count"))
            .where(SearchLog.query != "[filters]")
            .group_by(query_expr)
            .order_by(func.count(SearchLog.id).desc())
            .limit(limit)
        ).all()
        return [{"keyword": keyword, "count": count} for keyword, count in rows if keyword]

    def get_admin_analytics_summary(self) -> dict[str, Any]:
        today = datetime.now(timezone.utc).date()
        total_place_views = self.db.scalar(select(func.count(ContentView.id)).where(ContentView.content_type == "place")) or 0
        total_post_views = self.db.scalar(select(func.count(ContentView.id)).where(ContentView.content_type == "post")) or 0
        views_today = self.db.scalar(select(func.count(ContentView.id)).where(func.date(ContentView.created_at) == today)) or 0
        searches_today = self.db.scalar(select(func.count(SearchLog.id)).where(func.date(SearchLog.created_at) == today)) or 0
        return {
            "total_place_views": total_place_views,
            "total_post_views": total_post_views,
            "views_today": views_today,
            "searches_today": searches_today,
            "top_places": self.get_trending_places(limit=5),
            "top_posts": self.get_trending_posts(limit=5),
            "popular_keywords": self.get_popular_keywords(limit=10),
            "views_by_day": self._daily_counts(ContentView),
            "searches_by_day": self._daily_counts(SearchLog),
        }

    def _daily_counts(self, model) -> list[dict[str, Any]]:
        since = datetime.now(timezone.utc).date() - timedelta(days=13)
        rows = self.db.execute(
            select(func.date(model.created_at).label("date"), func.count(model.id))
            .where(func.date(model.created_at) >= since)
            .group_by(func.date(model.created_at))
            .order_by(func.date(model.created_at).asc())
        ).all()
        return [{"date": str(day), "count": count} for day, count in rows]

    def _session_id(self, request: Request) -> str | None:
        value = request.headers.get("x-session-id")
        return value[:120] if value else None

    def _user_agent(self, request: Request) -> str | None:
        value = request.headers.get("user-agent")
        return value[:500] if value else None

    def _ip_hash(self, request: Request) -> str | None:
        raw_ip = request.client.host if request.client else None
        if not raw_ip:
            return None
        return sha256(f"{settings.secret_key}:{raw_ip}".encode("utf-8")).hexdigest()

    def _normalize_query(self, query: str | None) -> str:
        cleaned = " ".join((query or "").split()).lower()
        if "@" in cleaned or any(ch.isdigit() for ch in cleaned if len(cleaned) > 30):
            cleaned = cleaned.replace("@", "[at]")
        return cleaned[:500]
