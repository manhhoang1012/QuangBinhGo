from fastapi import APIRouter

from app.api.v1.routes import admin, ai, auth, health, itineraries, moderation, notification_ws, notifications, places, review_posts, settings, uploads, users

api_router = APIRouter()
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(itineraries.router, prefix="/itineraries", tags=["itineraries"])
api_router.include_router(moderation.router, prefix="/moderation", tags=["moderation"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(notification_ws.router, prefix="/ws", tags=["websocket"])
api_router.include_router(places.router, prefix="/places", tags=["places"])
api_router.include_router(review_posts.router, prefix="/review-posts", tags=["review-posts"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
