from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import require_admin, require_moderator_or_admin
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import AdminUserRead, MessageResponse, UserRoleUpdate, UserStatusUpdate
from app.services.user_service import UserService

router = APIRouter()


def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(UserRepository(db))


def get_target_user(user_id: int, db: Session = Depends(get_db)) -> User:
    user = UserRepository(db).get(user_id)
    if not user:
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return user


@router.get("/users", response_model=list[AdminUserRead])
def list_users(
    search: str | None = Query(default=None),
    role: str | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    _: User = Depends(require_moderator_or_admin),
    user_service: UserService = Depends(get_user_service),
) -> list[User]:
    return user_service.list_users(search=search, role=role, is_active=is_active, skip=skip, limit=limit)


@router.patch("/users/{user_id}/status", response_model=AdminUserRead)
def update_user_status(
    status_update: UserStatusUpdate,
    actor: User = Depends(require_moderator_or_admin),
    target: User = Depends(get_target_user),
    user_service: UserService = Depends(get_user_service),
) -> User:
    return user_service.update_user_status(actor=actor, target=target, is_active=status_update.is_active)


@router.patch("/users/{user_id}/role", response_model=AdminUserRead)
def update_user_role(
    role_update: UserRoleUpdate,
    actor: User = Depends(require_admin),
    target: User = Depends(get_target_user),
    user_service: UserService = Depends(get_user_service),
) -> User:
    return user_service.update_user_role(actor=actor, target=target, role=role_update.role)


@router.delete("/users/{user_id}", response_model=MessageResponse)
def delete_user(
    actor: User = Depends(require_moderator_or_admin),
    target: User = Depends(get_target_user),
    user_service: UserService = Depends(get_user_service),
) -> MessageResponse:
    return user_service.admin_delete_user(actor=actor, target=target)
