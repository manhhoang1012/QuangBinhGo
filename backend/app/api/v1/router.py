from fastapi import APIRouter

from app.api.v1.routes import auth, health, places

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(places.router, prefix="/places", tags=["places"])
