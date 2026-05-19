from datetime import datetime, timezone
from math import ceil

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.moderation import UserWarning
from app.models.place import Place
from app.models.report import Report
from app.models.review_post import PlaceReview, PostComment, ReviewPost
from app.models.user import User
from app.schemas.report import ReportCreate, ReportListRead, ReportRead, ReportReject, ReportResolve
from app.services.notification_service import NotificationService


ALLOWED_REASONS = {"spam", "offensive", "harassment", "false_info", "scam", "inappropriate", "other"}


class ReportService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_report(self, *, reporter: User, payload: ReportCreate) -> ReportRead:
        if payload.reason not in ALLOWED_REASONS:
            raise HTTPException(status_code=422, detail="Invalid report reason.")
        target, owner = self._target_and_owner(payload.target_type, payload.target_id)
        if owner and owner.id == reporter.id:
            raise HTTPException(status_code=400, detail="You cannot report your own content or profile.")
        existing = self.db.scalar(
            select(Report).where(
                Report.reporter_id == reporter.id,
                Report.target_type == payload.target_type,
                Report.target_id == payload.target_id,
                Report.status == "pending",
            )
        )
        if existing:
            raise HTTPException(status_code=409, detail="Bạn đã báo cáo nội dung này rồi.")
        report = Report(
            reporter_id=reporter.id,
            target_type=payload.target_type,
            target_id=payload.target_id,
            reason=payload.reason,
            detail=payload.detail,
            status="pending",
        )
        self.db.add(report)
        self._increase_report_count(target)
        self.db.commit()
        self.db.refresh(report)
        return self._read(report)

    def list_reports(
        self,
        *,
        target_type: str | None = None,
        status_value: str | None = None,
        reason: str | None = None,
        page: int = 1,
        limit: int = 50,
    ) -> ReportListRead:
        statement = select(Report).options(selectinload(Report.reporter), selectinload(Report.resolver)).order_by(Report.created_at.desc())
        count_statement = select(func.count(Report.id))
        if target_type:
            statement = statement.where(Report.target_type == target_type)
            count_statement = count_statement.where(Report.target_type == target_type)
        if status_value:
            statement = statement.where(Report.status == status_value)
            count_statement = count_statement.where(Report.status == status_value)
        if reason:
            statement = statement.where(Report.reason == reason)
            count_statement = count_statement.where(Report.reason == reason)
        total = self.db.scalar(count_statement) or 0
        rows = self.db.scalars(statement.offset((page - 1) * limit).limit(limit)).all()
        return ReportListRead(items=[self._read(report) for report in rows], total=total, page=page, limit=limit, total_pages=ceil(total / limit) if total else 0)

    def get_report(self, report_id: int) -> ReportRead:
        return self._read(self._get_report(report_id))

    def resolve_report(self, *, report_id: int, actor: User, payload: ReportResolve) -> ReportRead:
        report = self._get_report(report_id)
        target, owner = self._target_and_owner(report.target_type, report.target_id)
        if actor.role == "moderator" and (report.target_type == "user" or payload.action in {"block_user", "delete_content"}):
            raise HTTPException(status_code=403, detail="Moderator cannot perform this report action.")
        if payload.action == "hide_content":
            self._set_target_status(target, "hidden")
        elif payload.action == "delete_content":
            self._set_target_status(target, "deleted")
        elif payload.action == "warn_user" and owner:
            self.db.add(UserWarning(user_id=owner.id, moderator_id=actor.id, reason=report.reason, message=payload.resolution_note or "Nội dung của bạn đã bị cảnh báo.", related_target_type=report.target_type, related_target_id=report.target_id))
        elif payload.action == "block_user":
            target_user = target if report.target_type == "user" else owner
            if not target_user or target_user.id == actor.id:
                raise HTTPException(status_code=400, detail="Cannot block this user.")
            target_user.is_active = False
            self.db.add(target_user)
        report.status = "resolved"
        report.resolved_by = actor.id
        report.resolved_at = datetime.now(timezone.utc)
        report.resolution_note = payload.resolution_note
        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)
        if owner and payload.action in {"hide_content", "delete_content"}:
            self._notify_owner(report, owner, actor, payload.action)
        return self._read(report)

    def reject_report(self, *, report_id: int, actor: User, payload: ReportReject) -> ReportRead:
        report = self._get_report(report_id)
        report.status = "rejected"
        report.resolved_by = actor.id
        report.resolved_at = datetime.now(timezone.utc)
        report.resolution_note = payload.resolution_note
        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)
        return self._read(report)

    def _get_report(self, report_id: int) -> Report:
        report = self.db.get(Report, report_id)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found.")
        return report

    def _target_and_owner(self, target_type: str, target_id: int):
        if target_type == "post":
            target = self.db.get(ReviewPost, target_id)
            if not target:
                raise HTTPException(status_code=404, detail="Post not found.")
            return target, self.db.get(User, target.user_id)
        if target_type == "comment":
            target = self.db.get(PostComment, target_id)
            if not target:
                raise HTTPException(status_code=404, detail="Comment not found.")
            return target, self.db.get(User, target.user_id)
        if target_type == "review":
            target = self.db.get(PlaceReview, target_id)
            if not target:
                raise HTTPException(status_code=404, detail="Review not found.")
            return target, self.db.get(User, target.user_id)
        if target_type == "user":
            target = self.db.get(User, target_id)
            if not target:
                raise HTTPException(status_code=404, detail="User not found.")
            return target, target
        raise HTTPException(status_code=422, detail="Invalid report target type.")

    def _increase_report_count(self, target) -> None:
        if hasattr(target, "report_count"):
            target.report_count = (target.report_count or 0) + 1
            self.db.add(target)

    def _set_target_status(self, target, status_value: str) -> None:
        if isinstance(target, User):
            if status_value in {"hidden", "deleted"}:
                target.is_active = False
        elif hasattr(target, "status"):
            target.status = status_value
        self.db.add(target)
        if isinstance(target, PlaceReview):
            place = self.db.get(Place, target.place_id)
            if place:
                average_rating, review_count = self.db.execute(select(func.avg(PlaceReview.rating), func.count(PlaceReview.id)).where(PlaceReview.place_id == place.id, PlaceReview.status == "visible")).one()
                place.rating_avg = average_rating or 0
                place.review_count = int(review_count or 0)
                self.db.add(place)

    def _read(self, report: Report) -> ReportRead:
        target, owner = self._target_and_owner(report.target_type, report.target_id)
        return ReportRead(
            id=report.id,
            type=report.target_type,
            target_type=report.target_type,
            target_id=report.target_id,
            target_label=self._target_label(target, report.target_type),
            target_author=owner,
            reporter=report.reporter,
            reason=report.reason,
            detail=report.detail,
            status=report.status,
            resolved_by=report.resolved_by,
            resolved_at=report.resolved_at,
            resolution_note=report.resolution_note,
            created_at=report.created_at,
            updated_at=report.updated_at,
        )

    def _target_label(self, target, target_type: str) -> str:
        if target_type == "post":
            return target.title or target.content[:80]
        if target_type == "comment":
            return target.content[:80]
        if target_type == "review":
            return target.content[:80]
        if target_type == "user":
            return f"{target.full_name} (@{target.username})"
        return f"{target_type} #{getattr(target, 'id', '')}"

    def _notify_owner(self, report: Report, owner: User, actor: User, action: str) -> None:
        try:
            if report.target_type == "post":
                post = self.db.get(ReviewPost, report.target_id)
                if post:
                    NotificationService(self.db).create_post_moderation_notification(post=post, actor=actor, hidden=action == "hide_content")
        except Exception:
            return
