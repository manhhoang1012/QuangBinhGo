from math import ceil

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.notification import NotificationListRead, NotificationRead, UnreadCountRead
from app.services.notification_service import NotificationService

router = APIRouter()


def notification_service(db: Session = Depends(get_db)) -> NotificationService:
    return NotificationService(db)


@router.get("", response_model=NotificationListRead)
def list_notifications(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    unread_only: bool = Query(default=False),
    type: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    service: NotificationService = Depends(notification_service),
) -> NotificationListRead:
    items, total = service.list_notifications(
        user_id=current_user.id,
        page=page,
        limit=limit,
        unread_only=unread_only,
        type=type,
    )
    return NotificationListRead(
        items=[NotificationRead.model_validate(item) for item in items],
        total=total,
        page=page,
        limit=limit,
        total_pages=ceil(total / limit) if total else 0,
    )


@router.get("/unread-count", response_model=UnreadCountRead)
def get_unread_count(
    current_user: User = Depends(get_current_user),
    service: NotificationService = Depends(notification_service),
) -> UnreadCountRead:
    return UnreadCountRead(unread_count=service.get_unread_count(current_user.id))


@router.patch("/{notification_id}/read", response_model=NotificationRead)
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    service: NotificationService = Depends(notification_service),
) -> NotificationRead:
    return NotificationRead.model_validate(service.mark_as_read(notification_id, current_user.id))


@router.patch("/read-all", response_model=UnreadCountRead)
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    service: NotificationService = Depends(notification_service),
) -> UnreadCountRead:
    service.mark_all_as_read(current_user.id)
    return UnreadCountRead(unread_count=service.get_unread_count(current_user.id))


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    service: NotificationService = Depends(notification_service),
) -> Response:
    service.delete_notification(notification_id, current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
