from math import ceil
from typing import Any

from fastapi import Request
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.audit_log import AdminAuditLog
from app.models.user import User


class AuditService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def log(
        self,
        *,
        actor: User | None,
        action: str,
        target_type: str,
        target_id: int | None = None,
        metadata: dict[str, Any] | None = None,
        request: Request | None = None,
    ) -> AdminAuditLog:
        log = AdminAuditLog(
            actor_id=actor.id if actor else None,
            action=action,
            target_type=target_type,
            target_id=target_id,
            metadata_json=metadata,
            ip_address=request.client.host if request and request.client else None,
            user_agent=request.headers.get("user-agent")[:500] if request else None,
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    def list_logs(
        self,
        *,
        action: str | None = None,
        actor_id: int | None = None,
        target_type: str | None = None,
        page: int = 1,
        limit: int = 50,
    ) -> tuple[list[AdminAuditLog], int, int]:
        statement = select(AdminAuditLog).options(selectinload(AdminAuditLog.actor)).order_by(AdminAuditLog.created_at.desc())
        count_statement = select(func.count(AdminAuditLog.id))
        if action:
            statement = statement.where(AdminAuditLog.action == action)
            count_statement = count_statement.where(AdminAuditLog.action == action)
        if actor_id:
            statement = statement.where(AdminAuditLog.actor_id == actor_id)
            count_statement = count_statement.where(AdminAuditLog.actor_id == actor_id)
        if target_type:
            statement = statement.where(AdminAuditLog.target_type == target_type)
            count_statement = count_statement.where(AdminAuditLog.target_type == target_type)
        total = int(self.db.scalar(count_statement) or 0)
        logs = list(self.db.scalars(statement.offset((page - 1) * limit).limit(limit)).all())
        return logs, total, ceil(total / limit) if total else 0
