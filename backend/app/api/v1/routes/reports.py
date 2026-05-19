from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_moderator_or_admin
from app.db.session import get_db
from app.models.user import User
from app.schemas.report import ReportCreate, ReportListRead, ReportRead, ReportReject, ReportResolve
from app.services.audit_service import AuditService
from app.services.report_service import ReportService

router = APIRouter()


@router.post("/reports", response_model=ReportRead)
def create_report(payload: ReportCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> ReportRead:
    return ReportService(db).create_report(reporter=current_user, payload=payload)


@router.get("/admin/reports", response_model=ReportListRead)
def admin_list_reports(
    target_type: str | None = Query(default=None),
    type: str | None = Query(default=None),
    status: str | None = Query(default=None),
    reason: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=100),
    _: User = Depends(require_moderator_or_admin),
    db: Session = Depends(get_db),
) -> ReportListRead:
    return ReportService(db).list_reports(target_type=target_type or type, status_value=status, reason=reason, page=page, limit=limit)


@router.get("/admin/reports/{report_id}", response_model=ReportRead)
def admin_get_report(report_id: int, _: User = Depends(require_moderator_or_admin), db: Session = Depends(get_db)) -> ReportRead:
    return ReportService(db).get_report(report_id)


@router.patch("/admin/reports/{report_id}/resolve", response_model=ReportRead)
def admin_resolve_report(report_id: int, payload: ReportResolve, request: Request, current_user: User = Depends(require_moderator_or_admin), db: Session = Depends(get_db)) -> ReportRead:
    report = ReportService(db).resolve_report(report_id=report_id, actor=current_user, payload=payload)
    AuditService(db).log(actor=current_user, action="report_resolved", target_type=report.target_type, target_id=report.target_id, metadata={"report_id": report_id, "action": payload.action}, request=request)
    return report


@router.patch("/admin/reports/{report_id}/reject", response_model=ReportRead)
def admin_reject_report(report_id: int, payload: ReportReject, request: Request, current_user: User = Depends(require_moderator_or_admin), db: Session = Depends(get_db)) -> ReportRead:
    report = ReportService(db).reject_report(report_id=report_id, actor=current_user, payload=payload)
    AuditService(db).log(actor=current_user, action="report_rejected", target_type=report.target_type, target_id=report.target_id, metadata={"report_id": report_id}, request=request)
    return report
