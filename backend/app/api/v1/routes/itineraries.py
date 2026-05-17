from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.itinerary import (
    AiItineraryGenerateRequest,
    AiItineraryResponse,
    ItineraryCreate,
    ItineraryItemCreate,
    ItineraryItemRead,
    ItineraryItemUpdate,
    ItineraryRead,
    ItineraryReorderItem,
    ItineraryUpdate,
)
from app.services.itinerary_service import ItineraryService

router = APIRouter()


def service(db: Session = Depends(get_db)) -> ItineraryService:
    return ItineraryService(db)


@router.get("", response_model=list[ItineraryRead])
def list_itineraries(current_user: User = Depends(get_current_user), svc: ItineraryService = Depends(service)):
    return svc.list_user_itineraries(current_user)


@router.post("", response_model=ItineraryRead, status_code=status.HTTP_201_CREATED)
def create_itinerary(payload: ItineraryCreate, current_user: User = Depends(get_current_user), svc: ItineraryService = Depends(service)):
    return svc.create(current_user, payload)


@router.post("/ai/generate", response_model=AiItineraryResponse)
def generate_ai_itinerary(payload: AiItineraryGenerateRequest, svc: ItineraryService = Depends(service)):
    return svc.generate_ai(payload)


@router.get("/shared/{share_slug}", response_model=ItineraryRead)
def get_shared_itinerary(share_slug: str, svc: ItineraryService = Depends(service)):
    return svc.get_shared(share_slug)


@router.get("/{itinerary_id}", response_model=ItineraryRead)
def get_itinerary(itinerary_id: int, current_user: User = Depends(get_current_user), svc: ItineraryService = Depends(service)):
    return svc.get_for_user_or_public(itinerary_id, current_user)


@router.patch("/{itinerary_id}", response_model=ItineraryRead)
def update_itinerary(itinerary_id: int, payload: ItineraryUpdate, current_user: User = Depends(get_current_user), svc: ItineraryService = Depends(service)):
    return svc.update(current_user, itinerary_id, payload)


@router.delete("/{itinerary_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_itinerary(itinerary_id: int, current_user: User = Depends(get_current_user), svc: ItineraryService = Depends(service)):
    svc.delete(current_user, itinerary_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{itinerary_id}/items", response_model=ItineraryItemRead, status_code=status.HTTP_201_CREATED)
def add_item(itinerary_id: int, payload: ItineraryItemCreate, current_user: User = Depends(get_current_user), svc: ItineraryService = Depends(service)):
    return svc.add_item(current_user, itinerary_id, payload)


@router.patch("/{itinerary_id}/items/reorder", response_model=ItineraryRead)
def reorder_items(itinerary_id: int, payload: list[ItineraryReorderItem], current_user: User = Depends(get_current_user), svc: ItineraryService = Depends(service)):
    return svc.reorder_items(current_user, itinerary_id, payload)


@router.patch("/{itinerary_id}/items/{item_id}", response_model=ItineraryItemRead)
def update_item(itinerary_id: int, item_id: int, payload: ItineraryItemUpdate, current_user: User = Depends(get_current_user), svc: ItineraryService = Depends(service)):
    return svc.update_item(current_user, itinerary_id, item_id, payload)


@router.delete("/{itinerary_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(itinerary_id: int, item_id: int, current_user: User = Depends(get_current_user), svc: ItineraryService = Depends(service)):
    svc.delete_item(current_user, itinerary_id, item_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{itinerary_id}/share", response_model=ItineraryRead)
def share_itinerary(itinerary_id: int, current_user: User = Depends(get_current_user), svc: ItineraryService = Depends(service)):
    return svc.share(current_user, itinerary_id)
