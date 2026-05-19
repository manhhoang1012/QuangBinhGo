from datetime import datetime, timezone
from html import escape

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from sqlalchemy import select
from starlette.responses import PlainTextResponse, Response
from starlette.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from app.api.v1.routes import ai
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.rate_limit import RateLimitMiddleware
from app.core.security_headers import SecurityHeadersMiddleware
from app.db.init_db import init_db
from app.db.session import SessionLocal
from app.models.place import Place
from app.models.review_post import ReviewPost
from pathlib import Path


class CachedStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope) -> Response:
        response = await super().get_response(path, scope)
        response.headers.setdefault("Cache-Control", "public, max-age=2592000")
        return response


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        debug=settings.debug,
        version="0.1.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    app.add_middleware(
        SessionMiddleware,
        secret_key=settings.secret_key,
        same_site="lax",
        https_only=settings.app_env.lower() in {"production", "prod"},
    )
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)

    app.include_router(api_router, prefix=settings.api_v1_prefix)
    app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
    static_dir = Path(__file__).resolve().parents[1] / "static"
    static_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/static", CachedStaticFiles(directory=static_dir), name="static")

    @app.on_event("startup")
    def on_startup() -> None:
        if settings.auto_create_tables:
            init_db()

    @app.get("/health", tags=["health"])
    def health_check() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/robots.txt", include_in_schema=False)
    def robots_txt() -> PlainTextResponse:
        sitemap_url = f"{settings.backend_url.rstrip('/')}/sitemap.xml"
        body = "\n".join(
            [
                "User-agent: *",
                "Allow: /",
                "Disallow: /admin",
                "Disallow: /moderation",
                "Disallow: /login",
                "Disallow: /register",
                "Disallow: /settings",
                f"Sitemap: {sitemap_url}",
                "",
            ]
        )
        return PlainTextResponse(body)

    @app.get("/sitemap.xml", include_in_schema=False)
    def sitemap_xml() -> Response:
        frontend_base_url = (settings.frontend_base_url or settings.frontend_url).rstrip("/")
        urls: list[tuple[str, datetime | None, str, str]] = [
            ("/", None, "daily", "1.0"),
            ("/places", None, "daily", "0.9"),
            ("/community", None, "daily", "0.8"),
            ("/map", None, "weekly", "0.7"),
            ("/ai", None, "weekly", "0.7"),
        ]
        with SessionLocal() as db:
            places = db.scalars(
                select(Place).where(Place.status.in_(["active", "published"])).order_by(Place.updated_at.desc())
            ).all()
            for place in places:
                urls.append((f"/places/{place.slug or place.id}", place.updated_at, "weekly", "0.8"))

            posts = db.scalars(
                select(ReviewPost)
                .where(
                    ReviewPost.status == "visible",
                    ReviewPost.visibility == "public",
                    ReviewPost.is_draft.is_(False),
                )
                .order_by(ReviewPost.updated_at.desc())
            ).all()
            for post in posts:
                urls.append((f"/community/{post.slug or post.id}", post.updated_at, "weekly", "0.7"))

        now = datetime.now(timezone.utc)
        items = []
        for path, lastmod, changefreq, priority in urls:
            updated = (lastmod or now).date().isoformat()
            loc = escape(f"{frontend_base_url}{path}")
            items.append(
                f"<url><loc>{loc}</loc><lastmod>{updated}</lastmod><changefreq>{changefreq}</changefreq><priority>{priority}</priority></url>"
            )
        xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
        xml += "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">"
        xml += "".join(items)
        xml += "</urlset>"
        return Response(content=xml, media_type="application/xml")

    return app


app = create_app()
