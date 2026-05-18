from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.dependencies import require_moderator_or_admin
from app.db.session import get_db
from app.models.moderation import ModerationAction, UserWarning
from app.models.review_post import CommentReport, PlaceReview, PlaceReviewReport, PostComment, PostReport, ReviewPost
from app.models.user import User
from app.repositories.review_post_repository import ReviewPostRepository
from app.schemas.moderation import (
    ModerationActionRead,
    ModerationDashboardRead,
    ModerationReasonPayload,
    ModerationReportListRead,
    ModerationReportRead,
    ModerationReportResolvePayload,
    UserWarningCreate,
    UserWarningRead,
)
from app.schemas.review_post import AdminCommentRead, AdminPlaceReviewRead, AdminPostReportRead, CommentReportRead, CommentStatusUpdate, PlaceReviewReportRead, PlaceReviewStatusUpdate, ReviewPostRead
from app.schemas.user import MessageResponse
from app.services.notification_service import NotificationService
from app.services.place_service import PlaceService
from app.services.review_post_service import ReviewPostService

router = APIRouter()


def post_service(db: Session) -> ReviewPostService:
    from app.repositories.place_repository import PlaceRepository

    return ReviewPostService(ReviewPostRepository(db), PlaceRepository(db))


def create_action(
    db: Session,
    *,
    moderator: User,
    target_type: str,
    target_id: int,
    action_type: str,
    reason: str,
    note: str | None = None,
) -> ModerationAction:
    action = ModerationAction(
        moderator_id=moderator.id,
        target_type=target_type,
        target_id=target_id,
        action_type=action_type,
        reason=reason,
        note=note,
    )
    db.add(action)
    db.commit()
    db.refresh(action)
    return action


def report_status_filter(status_value: str | None):
    return status_value if status_value else None


def user_can_be_warned(actor: User, target: User) -> bool:
    if actor.id == target.id:
        return False
    if actor.role == "admin":
        return True
    return target.role == "user"


def report_to_read(report, type_value: str) -> ModerationReportRead:
    if type_value == "post":
        target = report.post
        author = target.author if target else None
        label = target.title if target and target.title else f"Post #{report.post_id}"
        return ModerationReportRead(
            id=report.id,
            type="post",
            reporter=report.reporter,
            target_id=report.post_id,
            target_label=label,
            target_author=author,
            reason=report.reason,
            detail=report.description,
            status=report.status,
            created_at=report.created_at,
        )
    if type_value == "comment":
        target = report.comment
        author = target.author if target else None
        return ModerationReportRead(
            id=report.id,
            type="comment",
            reporter=report.reporter,
            target_id=report.comment_id,
            target_label=target.content[:120] if target else f"Comment #{report.comment_id}",
            target_author=author,
            reason=report.reason,
            detail=report.detail,
            status=report.status,
            created_at=report.created_at,
        )
    target = report.review
    author = target.author if target else None
    return ModerationReportRead(
        id=report.id,
        type="review",
        reporter=report.reporter,
        target_id=report.review_id,
        target_label=target.content[:120] if target else f"Review #{report.review_id}",
        target_author=author,
        reason=report.reason,
        detail=report.detail,
        status=report.status,
        created_at=report.created_at,
    )


def collect_reports(db: Session, *, type_value: str | None, status_value: str | None) -> list[ModerationReportRead]:
    items: list[ModerationReportRead] = []
    if type_value in {None, "post"}:
        stmt = select(PostReport).options(selectinload(PostReport.reporter), selectinload(PostReport.post).selectinload(ReviewPost.author)).order_by(PostReport.created_at.desc())
        if status_value:
            stmt = stmt.where(PostReport.status == status_value)
        items.extend(report_to_read(report, "post") for report in db.scalars(stmt).all())
    if type_value in {None, "comment"}:
        stmt = select(CommentReport).options(selectinload(CommentReport.reporter), selectinload(CommentReport.comment).selectinload(PostComment.author)).order_by(CommentReport.created_at.desc())
        if status_value:
            stmt = stmt.where(CommentReport.status == status_value)
        items.extend(report_to_read(report, "comment") for report in db.scalars(stmt).all())
    if type_value in {None, "review"}:
        stmt = select(PlaceReviewReport).options(selectinload(PlaceReviewReport.reporter), selectinload(PlaceReviewReport.review).selectinload(PlaceReview.author)).order_by(PlaceReviewReport.created_at.desc())
        if status_value:
            stmt = stmt.where(PlaceReviewReport.status == status_value)
        items.extend(report_to_read(report, "review") for report in db.scalars(stmt).all())
    items.sort(key=lambda item: item.created_at, reverse=True)
    return items


@router.get("", response_model=ModerationDashboardRead)
def moderation_dashboard(_: User = Depends(require_moderator_or_admin), db: Session = Depends(get_db)) -> ModerationDashboardRead:
    pending_posts = db.scalar(select(func.count(PostReport.id)).where(PostReport.status.in_(["open", "pending"]))) or 0
    pending_comments = db.scalar(select(func.count(CommentReport.id)).where(CommentReport.status.in_(["open", "pending"]))) or 0
    pending_reviews = db.scalar(select(func.count(PlaceReviewReport.id)).where(PlaceReviewReport.status.in_(["open", "pending"]))) or 0
    actions = list(db.scalars(select(ModerationAction).options(selectinload(ModerationAction.moderator)).order_by(ModerationAction.created_at.desc()).limit(8)).all())
    warnings = list(db.scalars(select(UserWarning).options(selectinload(UserWarning.user), selectinload(UserWarning.moderator)).order_by(UserWarning.created_at.desc()).limit(8)).all())
    return ModerationDashboardRead(
        pending_reports=pending_posts + pending_comments + pending_reviews,
        reported_posts=pending_posts,
        reported_comments=pending_comments,
        reported_reviews=pending_reviews,
        recent_actions=[ModerationActionRead.model_validate(action) for action in actions],
        recent_warnings=[UserWarningRead.model_validate(warning) for warning in warnings],
    )


@router.get("/reports", response_model=ModerationReportListRead)
def list_reports(
    type: str | None = Query(default=None, pattern="^(post|comment|review)$"),
    status_value: str | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    _: User = Depends(require_moderator_or_admin),
    db: Session = Depends(get_db),
) -> ModerationReportListRead:
    all_items = collect_reports(db, type_value=type, status_value=report_status_filter(status_value))
    start = (page - 1) * limit
    return ModerationReportListRead(items=all_items[start:start + limit], total=len(all_items), page=page, limit=limit, total_pages=ceil(len(all_items) / limit) if all_items else 0)


@router.get("/reports/{report_id}", response_model=ModerationReportRead)
def get_report(
    report_id: int,
    type: str = Query(pattern="^(post|comment|review)$"),
    _: User = Depends(require_moderator_or_admin),
    db: Session = Depends(get_db),
) -> ModerationReportRead:
    for report in collect_reports(db, type_value=type, status_value=None):
        if report.id == report_id:
            return report
    raise HTTPException(status_code=404, detail="Report not found.")


def update_report(db: Session, *, report_id: int, type_value: str, status_value: str):
    model = {"post": PostReport, "comment": CommentReport, "review": PlaceReviewReport}[type_value]
    report = db.get(model, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    report.status = status_value
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.patch("/reports/{report_id}/resolve")
def resolve_report(report_id: int, payload: ModerationReportResolvePayload, current_user: User = Depends(require_moderator_or_admin), db: Session = Depends(get_db)) -> dict:
    report = update_report(db, report_id=report_id, type_value=payload.type, status_value="resolved")
    create_action(db, moderator=current_user, target_type=payload.type, target_id=getattr(report, f"{payload.type}_id", getattr(report, "review_id", report_id)), action_type="resolve_report", reason=payload.reason, note=payload.note)
    if payload.hide_target:
        if payload.type == "post":
            hide_post(getattr(report, "post_id"), ModerationReasonPayload(reason=payload.reason, note=payload.note), current_user, db)
        elif payload.type == "comment":
            hide_comment(getattr(report, "comment_id"), ModerationReasonPayload(reason=payload.reason, note=payload.note), current_user, db)
    if payload.warn_user and payload.warning_message:
        target = getattr(report, payload.type, None)
        target_user_id = getattr(target, "user_id", None)
        if target_user_id:
            warn_user(target_user_id, UserWarningCreate(reason="other", message=payload.warning_message, related_target_type=payload.type, related_target_id=getattr(report, f"{payload.type}_id", getattr(report, "review_id", None))), current_user, db)
    return {"id": report_id, "type": payload.type, "status": "resolved"}


@router.patch("/reports/{report_id}/reject")
def reject_report(report_id: int, payload: ModerationReportResolvePayload, current_user: User = Depends(require_moderator_or_admin), db: Session = Depends(get_db)) -> dict:
    update_report(db, report_id=report_id, type_value=payload.type, status_value="rejected")
    create_action(db, moderator=current_user, target_type=payload.type, target_id=report_id, action_type="reject_report", reason=payload.reason, note=payload.note)
    return {"id": report_id, "type": payload.type, "status": "rejected"}


@router.get("/posts/reported", response_model=list[AdminPostReportRead])
def reported_posts(status_value: str | None = Query(default=None, alias="status"), _: User = Depends(require_moderator_or_admin), db: Session = Depends(get_db)):
    return post_service(db).list_reports(status_value=status_value, skip=0, limit=100)


@router.patch("/posts/{post_id}/hide", response_model=ReviewPostRead)
def hide_post(post_id: int, payload: ModerationReasonPayload, current_user: User = Depends(require_moderator_or_admin), db: Session = Depends(get_db)):
    post = ReviewPostRepository(db).get(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")
    post.status = "hidden"
    db.add(post)
    db.commit()
    create_action(db, moderator=current_user, target_type="post", target_id=post_id, action_type="hide_post", reason=payload.reason, note=payload.note)
    try:
        NotificationService(db).create_post_moderation_notification(post=post, actor=current_user, hidden=True)
    except Exception:
        pass
    return post_service(db).build_post_read(ReviewPostRepository(db).get_many_with_counts([post_id])[post_id][0], likes_count=ReviewPostRepository(db).count_likes(post_id), comments_count=ReviewPostRepository(db).count_comments(post_id), saves_count=ReviewPostRepository(db).count_saves(post_id))


@router.patch("/posts/{post_id}/unhide", response_model=ReviewPostRead)
def unhide_post(post_id: int, payload: ModerationReasonPayload | None = None, current_user: User = Depends(require_moderator_or_admin), db: Session = Depends(get_db)):
    post = ReviewPostRepository(db).get(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")
    post.status = "visible"
    db.add(post)
    db.commit()
    create_action(db, moderator=current_user, target_type="post", target_id=post_id, action_type="unhide_post", reason=payload.reason if payload else "unhide", note=payload.note if payload else None)
    counts = ReviewPostRepository(db).get_many_with_counts([post_id])[post_id]
    return post_service(db).build_post_read(counts[0], likes_count=counts[1], comments_count=counts[2], saves_count=counts[3])


@router.get("/comments/reported", response_model=list[CommentReportRead])
def reported_comments(status_value: str | None = Query(default=None, alias="status"), _: User = Depends(require_moderator_or_admin), db: Session = Depends(get_db)):
    return post_service(db).list_comment_reports(status_value=status_value, skip=0, limit=100)


@router.patch("/comments/{comment_id}/hide", response_model=AdminCommentRead)
def hide_comment(comment_id: int, payload: ModerationReasonPayload, current_user: User = Depends(require_moderator_or_admin), db: Session = Depends(get_db)):
    comment = post_service(db).update_comment_status(comment_id=comment_id, status_update=CommentStatusUpdate(status="hidden"))
    create_action(db, moderator=current_user, target_type="comment", target_id=comment_id, action_type="hide_comment", reason=payload.reason, note=payload.note)
    try:
        NotificationService(db).create_notification(recipient_id=comment.user_id, actor_id=current_user.id, type="comment_hidden", title="Bình luận đã bị ẩn", message="Bình luận của bạn đã bị ẩn do vi phạm quy định.", target_type="comment", target_id=comment.id, target_url=f"/community/{comment.post_id}")
    except Exception:
        pass
    from app.api.v1.routes.admin import admin_list_comments

    return admin_list_comments(post_id=comment.post_id, user_id=None, status_value=None, skip=0, limit=100, _=current_user, db=db)[0]


@router.patch("/comments/{comment_id}/unhide", response_model=AdminCommentRead)
def unhide_comment(comment_id: int, payload: ModerationReasonPayload | None = None, current_user: User = Depends(require_moderator_or_admin), db: Session = Depends(get_db)):
    comment = post_service(db).update_comment_status(comment_id=comment_id, status_update=CommentStatusUpdate(status="visible"))
    create_action(db, moderator=current_user, target_type="comment", target_id=comment_id, action_type="unhide_comment", reason=payload.reason if payload else "unhide", note=payload.note if payload else None)
    from app.api.v1.routes.admin import admin_list_comments

    return admin_list_comments(post_id=comment.post_id, user_id=None, status_value=None, skip=0, limit=100, _=current_user, db=db)[0]


@router.post("/users/{user_id}/warnings", response_model=UserWarningRead, status_code=status.HTTP_201_CREATED)
def warn_user(user_id: int, payload: UserWarningCreate, current_user: User = Depends(require_moderator_or_admin), db: Session = Depends(get_db)) -> UserWarningRead:
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")
    if not user_can_be_warned(current_user, target):
        raise HTTPException(status_code=403, detail="You cannot warn this user.")
    warning = UserWarning(user_id=user_id, moderator_id=current_user.id, reason=payload.reason, message=payload.message, related_target_type=payload.related_target_type, related_target_id=payload.related_target_id)
    db.add(warning)
    db.commit()
    db.refresh(warning)
    create_action(db, moderator=current_user, target_type="user", target_id=user_id, action_type="warn_user", reason=payload.reason, note=payload.message)
    try:
        NotificationService(db).create_notification(recipient_id=user_id, actor_id=current_user.id, type="user_warning", title="Cảnh báo từ kiểm duyệt", message=payload.message, target_type=payload.related_target_type or "user", target_id=payload.related_target_id or user_id, target_url="/notifications")
    except Exception:
        pass
    warning = db.scalar(select(UserWarning).where(UserWarning.id == warning.id).options(selectinload(UserWarning.user), selectinload(UserWarning.moderator))) or warning
    return UserWarningRead.model_validate(warning)


@router.get("/users/{user_id}/warnings", response_model=list[UserWarningRead])
def list_user_warnings(user_id: int, _: User = Depends(require_moderator_or_admin), db: Session = Depends(get_db)) -> list[UserWarningRead]:
    warnings = db.scalars(select(UserWarning).where(UserWarning.user_id == user_id).options(selectinload(UserWarning.user), selectinload(UserWarning.moderator)).order_by(UserWarning.created_at.desc())).all()
    return [UserWarningRead.model_validate(warning) for warning in warnings]


@router.get("/actions", response_model=list[ModerationActionRead])
def list_actions(
    target_type: str | None = Query(default=None, pattern="^(post|comment|review|user)$"),
    action_type: str | None = None,
    moderator_id: int | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=100),
    _: User = Depends(require_moderator_or_admin),
    db: Session = Depends(get_db),
) -> list[ModerationActionRead]:
    stmt = select(ModerationAction).options(selectinload(ModerationAction.moderator)).order_by(ModerationAction.created_at.desc())
    if target_type:
        stmt = stmt.where(ModerationAction.target_type == target_type)
    if action_type:
        stmt = stmt.where(ModerationAction.action_type == action_type)
    if moderator_id:
        stmt = stmt.where(ModerationAction.moderator_id == moderator_id)
    stmt = stmt.offset((page - 1) * limit).limit(limit)
    return [ModerationActionRead.model_validate(action) for action in db.scalars(stmt).all()]
