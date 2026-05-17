from fastapi import APIRouter

from app.api.v1.routes import admin, ai, auth, health, itineraries, places, review_posts, settings, users

api_router = APIRouter()
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(itineraries.router, prefix="/itineraries", tags=["itineraries"])
api_router.include_router(places.router, prefix="/places", tags=["places"])
api_router.include_router(review_posts.router, prefix="/review-posts", tags=["review-posts"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
