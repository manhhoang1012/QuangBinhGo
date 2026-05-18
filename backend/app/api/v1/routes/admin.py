from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.api.dependencies import require_admin, require_moderator_or_admin
from app.db.session import get_db
from app.models.place import Category, Place
from app.models.review_post import CommentReport, PlaceReview, PlaceReviewReport, PostComment, PostReport, ReviewPost
from app.models.user import User
from app.repositories.place_repository import PlaceRepository
from app.repositories.review_post_repository import ReviewPostRepository
from app.repositories.user_repository import UserRepository
from app.schemas.place import CategoryCreate, CategoryRead, CategoryUpdate, PlaceCreate, PlaceRead, PlaceUpdate
from app.schemas.review_post import AdminCommentRead, AdminPlaceReviewRead, AdminPostReportRead, CommentReportRead, CommentStatusUpdate, PlaceReviewReportRead, PlaceReviewStatusUpdate, PostReportRead, PostStatusUpdate, ReviewPostRead
from app.schemas.site_settings import SettingsUploadResponse, SiteSettingsPayload
from app.schemas.user import AdminUserRead, MessageResponse, UserRoleUpdate, UserStatusUpdate
from app.services.place_service import PlaceService
from app.services.notification_service import NotificationService
from app.services.review_post_service import ReviewPostService
from app.services.settings_service import SettingsService
from app.services.upload_service import UploadService
from app.services.user_service import UserService

router = APIRouter()

ALLOWED_PLACE_IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
MAX_PLACE_IMAGE_BYTES = 5 * 1024 * 1024
MAX_PLACE_IMAGE_UPLOADS = 10


def user_service(db: Session) -> UserService:
    return UserService(UserRepository(db))


def post_service(db: Session) -> ReviewPostService:
    return ReviewPostService(ReviewPostRepository(db), PlaceRepository(db))


def get_target_user(user_id: int, db: Session = Depends(get_db)) -> User:
    user = UserRepository(db).get(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return user


@router.get("/settings", response_model=SiteSettingsPayload)
def get_settings(_: User = Depends(require_admin), db: Session = Depends(get_db)) -> SiteSettingsPayload:
    return SettingsService(db).get_payload()


@router.put("/settings", response_model=SiteSettingsPayload)
def update_settings(payload: SiteSettingsPayload, _: User = Depends(require_admin), db: Session = Depends(get_db)) -> SiteSettingsPayload:
    return SettingsService(db).update(payload)


@router.post("/settings/upload", response_model=SettingsUploadResponse)
async def upload_setting_image(
    upload_type: str = Query(...),
    file: UploadFile = File(...),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> SettingsUploadResponse:
    allowed_types = {"logo", "favicon", "hero", "hero_image", "hero_background"}
    if upload_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Invalid upload_type: {upload_type}")
    if not file:
        raise HTTPException(status_code=400, detail="Missing file field.")

    normalized_type = "hero" if upload_type in {"hero_image", "hero_background"} else upload_type
    response = await UploadService().upload_files([file], "settings_image", folder=f"settings/{normalized_type}")
    url = response.urls[0]
    return SettingsUploadResponse(url=url, image_url=url)


@router.post("/uploads/places")
async def upload_place_images(
    files: list[UploadFile] = File(...),
    _: User = Depends(require_admin),
) -> dict[str, list[str]]:
    response = await UploadService().upload_files(files, "place_image")
    return {"urls": response.urls}


@router.get("/dashboard/stats")
def dashboard_stats(_: User = Depends(require_admin), db: Session = Depends(get_db)) -> dict:
    total_users = db.scalar(select(func.count(User.id)).where(User.deleted_at.is_(None))) or 0
    total_places = db.scalar(select(func.count(Place.id))) or 0
    total_posts = db.scalar(select(func.count(ReviewPost.id))) or 0
    total_comments = db.scalar(select(func.count(PostComment.id))) or 0
    total_reviews = db.scalar(select(func.count(PlaceReview.id))) or 0
    recent_posts = db.scalars(
        select(ReviewPost).options(selectinload(ReviewPost.author), selectinload(ReviewPost.place)).order_by(ReviewPost.created_at.desc()).limit(5)
    ).all()
    return {
        "total_users": total_users,
        "total_places": total_places,
        "total_posts": total_posts,
        "total_comments": total_comments,
        "total_reviews": total_reviews,
        "recent_activities": [
            {
                "type": "post",
                "title": post.title,
                "actor": post.author.full_name if post.author else "Unknown",
                "target": post.place.name if post.place else "",
                "created_at": post.created_at,
            }
            for post in recent_posts
        ],
    }


@router.get("/users", response_model=list[AdminUserRead])
def list_users(
    search: str | None = Query(default=None),
    role: str | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[User]:
    return user_service(db).list_users(search=search, role=role, is_active=is_active, skip=skip, limit=limit)


@router.get("/users/{user_id}", response_model=AdminUserRead)
def get_user(_: User = Depends(require_admin), target: User = Depends(get_target_user)) -> User:
    return target


@router.patch("/users/{user_id}/status", response_model=AdminUserRead)
def update_user_status(
    status_update: UserStatusUpdate,
    actor: User = Depends(require_admin),
    target: User = Depends(get_target_user),
    db: Session = Depends(get_db),
) -> User:
    return user_service(db).update_user_status(actor=actor, target=target, is_active=status_update.is_active)


@router.patch("/users/{user_id}/role", response_model=AdminUserRead)
def update_user_role(
    role_update: UserRoleUpdate,
    actor: User = Depends(require_admin),
    target: User = Depends(get_target_user),
    db: Session = Depends(get_db),
) -> User:
    return user_service(db).update_user_role(actor=actor, target=target, role=role_update.role)


@router.delete("/users/{user_id}", response_model=MessageResponse)
def delete_user(
    actor: User = Depends(require_admin),
    target: User = Depends(get_target_user),
    db: Session = Depends(get_db),
) -> MessageResponse:
    return user_service(db).admin_delete_user(actor=actor, target=target)


@router.get("/places", response_model=list[PlaceRead])
def admin_list_places(
    search: str | None = None,
    category: str | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return PlaceService(PlaceRepository(db)).list_places(search=search, category=category, skip=skip, limit=limit)


@router.get("/places/{place_id}", response_model=PlaceRead)
def admin_get_place(place_id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    return PlaceService(PlaceRepository(db)).get_place(place_id)


@router.post("/places", response_model=PlaceRead, status_code=status.HTTP_201_CREATED)
def admin_create_place(payload: PlaceCreate, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    return PlaceService(PlaceRepository(db)).create_place(payload)


@router.patch("/places/{place_id}", response_model=PlaceRead)
def admin_update_place(place_id: int, payload: PlaceUpdate, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    return PlaceService(PlaceRepository(db)).update_place(place_id, payload)


@router.delete("/places/{place_id}", response_model=MessageResponse)
def admin_delete_place(place_id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    PlaceService(PlaceRepository(db)).delete_place(place_id)
    return MessageResponse(message="Place deleted successfully.")


@router.get("/posts", response_model=list[ReviewPostRead])
def admin_list_posts(
    search: str | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    _: User = Depends(require_moderator_or_admin),
    db: Session = Depends(get_db),
):
    rows = ReviewPostRepository(db).list_with_counts(skip=skip, limit=limit, include_hidden=True)
    posts = post_service(db)._rows_to_reads(rows)
    if search:
        q = search.lower()
        posts = [post for post in posts if q in f"{post.title} {post.content} {post.author.full_name}".lower()]
    return posts


@router.get("/posts/{post_id}", response_model=ReviewPostRead)
def admin_get_post(post_id: int, _: User = Depends(require_moderator_or_admin), db: Session = Depends(get_db)):
    post = ReviewPostRepository(db).get(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")
    counts = ReviewPostRepository(db).get_many_with_counts([post_id])[post_id]
    return post_service(db).build_post_read(counts[0], likes_count=counts[1], comments_count=counts[2], saves_count=counts[3])


@router.patch("/posts/{post_id}/status", response_model=ReviewPostRead)
def admin_update_post_status(post_id: int, payload: PostStatusUpdate, _: User = Depends(require_moderator_or_admin), db: Session = Depends(get_db)):
    post = ReviewPostRepository(db).get(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")
    post.status = payload.status
    db.add(post)
    db.commit()
    if payload.status != "visible" and post.user_id != _.id:
        try:
            NotificationService(db).create_post_moderation_notification(post=post, actor=_, hidden=True)
        except Exception:
            pass
    return admin_get_post(post_id, _, db)


@router.delete("/posts/{post_id}", response_model=MessageResponse)
def admin_delete_post(post_id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    post = ReviewPostRepository(db).get(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")
    if post.user_id != _.id:
        try:
            NotificationService(db).create_post_moderation_notification(post=post, actor=_, hidden=False)
        except Exception:
            pass
    db.delete(post)
    db.commit()
    return MessageResponse(message="Post deleted successfully.")


@router.get("/reports/posts", response_model=list[AdminPostReportRead])
def admin_list_post_reports(
    status_value: str | None = Query(default=None, alias="status"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    _: User = Depends(require_moderator_or_admin),
    db: Session = Depends(get_db),
):
    return post_service(db).list_reports(status_value=status_value, skip=skip, limit=limit)


@router.patch("/reports/{report_id}/resolve", response_model=PostReportRead)
def admin_resolve_report(report_id: int, _: User = Depends(require_moderator_or_admin), db: Session = Depends(get_db)):
    return post_service(db).resolve_report(report_id=report_id, status_value="resolved")


@router.get("/comments", response_model=list[AdminCommentRead])
def admin_list_comments(
    post_id: int | None = None,
    user_id: int | None = None,
    status_value: str | None = Query(default=None, alias="status"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    _: User = Depends(require_moderator_or_admin),
    db: Session = Depends(get_db),
):
    stmt = select(PostComment).options(selectinload(PostComment.author)).order_by(PostComment.created_at.desc()).offset(skip).limit(limit)
    if post_id:
        stmt = stmt.where(PostComment.post_id == post_id)
    if user_id:
        stmt = stmt.where(PostComment.user_id == user_id)
    if status_value:
        stmt = stmt.where(PostComment.status == status_value)
    comments = db.scalars(stmt).all()
    result = []
    repo = ReviewPostRepository(db)
    svc = post_service(db)
    for comment in comments:
        counts = repo.get_many_with_counts([comment.post_id]).get(comment.post_id)
        if counts:
            reports = list(db.scalars(select(CommentReport).options(selectinload(CommentReport.reporter)).where(CommentReport.comment_id == comment.id)).all())
            result.append({
                "id": comment.id,
                "content": comment.content,
                "status": comment.status,
                "report_count": comment.report_count,
                "like_count": repo.count_comment_likes(comment.id),
                "author": comment.author,
                "post": svc.build_post_read(counts[0], likes_count=counts[1], comments_count=counts[2], saves_count=counts[3]),
                "reports": [CommentReportRead.model_validate({**report.__dict__, "reporter": report.reporter}) for report in reports],
                "created_at": comment.created_at,
            })
    return result


@router.get("/comments/reports", response_model=list[CommentReportRead])
def admin_list_comment_reports(
    status_value: str | None = Query(default=None, alias="status"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    _: User = Depends(require_moderator_or_admin),
    db: Session = Depends(get_db),
):
    return post_service(db).list_comment_reports(status_value=status_value, skip=skip, limit=limit)


@router.patch("/comments/{comment_id}/status", response_model=AdminCommentRead)
def admin_update_comment_status(comment_id: int, payload: CommentStatusUpdate, _: User = Depends(require_moderator_or_admin), db: Session = Depends(get_db)):
    comment = post_service(db).update_comment_status(comment_id=comment_id, status_update=payload)
    return admin_list_comments(post_id=comment.post_id, user_id=None, status_value=None, skip=0, limit=100, _=_, db=db)[0]


@router.delete("/comments/{comment_id}", response_model=MessageResponse)
def admin_delete_comment(comment_id: int, _: User = Depends(require_moderator_or_admin), db: Session = Depends(get_db)):
    comment = db.get(PostComment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found.")
    post_service(db).update_comment_status(comment_id=comment_id, status_update=CommentStatusUpdate(status="deleted"))
    return MessageResponse(message="Comment deleted successfully.")


@router.get("/place-reviews", response_model=list[AdminPlaceReviewRead])
@router.get("/reviews", response_model=list[AdminPlaceReviewRead])
def admin_list_reviews(
    status_value: str | None = Query(default=None, alias="status"),
    rating: int | None = Query(default=None, ge=1, le=5),
    _: User = Depends(require_moderator_or_admin),
    db: Session = Depends(get_db),
):
    stmt = select(PlaceReview).options(selectinload(PlaceReview.author), selectinload(PlaceReview.place)).order_by(PlaceReview.created_at.desc())
    if status_value:
        stmt = stmt.where(PlaceReview.status == status_value)
    if rating:
        stmt = stmt.where(PlaceReview.rating == rating)
    reviews = list(db.scalars(stmt).all())
    result = []
    for review in reviews:
        reports = list(db.scalars(select(PlaceReviewReport).options(selectinload(PlaceReviewReport.reporter)).where(PlaceReviewReport.review_id == review.id)).all())
        result.append({**review.__dict__, "author": review.author, "place": review.place, "reports": [PlaceReviewReportRead.model_validate({**report.__dict__, "reporter": report.reporter}) for report in reports]})
    return result


@router.get("/place-reviews/reports", response_model=list[PlaceReviewReportRead])
def admin_list_place_review_reports(_: User = Depends(require_moderator_or_admin), db: Session = Depends(get_db)):
    reports = list(db.scalars(select(PlaceReviewReport).options(selectinload(PlaceReviewReport.reporter)).order_by(PlaceReviewReport.created_at.desc())).all())
    return [PlaceReviewReportRead.model_validate({**report.__dict__, "reporter": report.reporter}) for report in reports]


@router.patch("/place-reviews/{review_id}/status", response_model=AdminPlaceReviewRead)
def admin_update_place_review_status(review_id: int, payload: PlaceReviewStatusUpdate, _: User = Depends(require_moderator_or_admin), db: Session = Depends(get_db)):
    review = db.get(PlaceReview, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found.")
    review.status = payload.status
    db.add(review)
    db.commit()
    place = db.get(Place, review.place_id)
    if place:
        average_rating, review_count = db.execute(select(func.avg(PlaceReview.rating), func.count(PlaceReview.id)).where(PlaceReview.place_id == place.id, PlaceReview.status == "visible")).one()
        place.rating_avg = average_rating or 0
        place.review_count = int(review_count or 0)
        db.add(place)
        db.commit()
    return admin_list_reviews(status_value=None, rating=None, _=_, db=db)[0]


@router.delete("/reviews/{review_id}", response_model=MessageResponse)
@router.delete("/place-reviews/{review_id}", response_model=MessageResponse)
def admin_delete_review(review_id: int, _: User = Depends(require_moderator_or_admin), db: Session = Depends(get_db)):
    review = db.get(PlaceReview, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found.")
    place = db.get(Place, review.place_id)
    review.status = "deleted"
    db.add(review)
    db.commit()
    if place:
        average_rating, review_count = db.execute(
            select(func.avg(PlaceReview.rating), func.count(PlaceReview.id)).where(PlaceReview.place_id == place.id)
        ).one()
        place.rating_avg = average_rating or 0
        place.review_count = int(review_count or 0)
        db.add(place)
        db.commit()
    return MessageResponse(message="Review deleted successfully.")


@router.get("/categories", response_model=list[CategoryRead])
def admin_list_categories(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    return list(db.scalars(select(Category).order_by(Category.name.asc())).all())


@router.post("/categories", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
def admin_create_category(payload: CategoryCreate, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    category = Category(**payload.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.patch("/categories/{category_id}", response_model=CategoryRead)
def admin_update_category(category_id: int, payload: CategoryUpdate, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found.")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(category, key, value)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/categories/{category_id}", response_model=MessageResponse)
def admin_delete_category(category_id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found.")
    db.delete(category)
    db.commit()
    return MessageResponse(message="Category deleted successfully.")
