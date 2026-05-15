from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.api.dependencies import require_admin
from app.core.config import settings
from app.db.session import get_db
from app.models.place import Category, Place
from app.models.review_post import PlaceReview, PostComment, ReviewPost
from app.models.user import User
from app.repositories.place_repository import PlaceRepository
from app.repositories.review_post_repository import ReviewPostRepository
from app.repositories.user_repository import UserRepository
from app.schemas.place import CategoryCreate, CategoryRead, CategoryUpdate, PlaceCreate, PlaceRead, PlaceUpdate
from app.schemas.review_post import AdminCommentRead, AdminPlaceReviewRead, PostStatusUpdate, ReviewPostRead
from app.schemas.user import AdminUserRead, MessageResponse, UserRoleUpdate, UserStatusUpdate
from app.services.place_service import PlaceService
from app.services.review_post_service import ReviewPostService
from app.services.user_service import UserService

router = APIRouter()

ALLOWED_PLACE_IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
MAX_PLACE_IMAGE_BYTES = 5 * 1024 * 1024


def user_service(db: Session) -> UserService:
    return UserService(UserRepository(db))


def post_service(db: Session) -> ReviewPostService:
    return ReviewPostService(ReviewPostRepository(db), PlaceRepository(db))


def get_target_user(user_id: int, db: Session = Depends(get_db)) -> User:
    user = UserRepository(db).get(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return user


@router.post("/uploads/places")
async def upload_place_images(
    files: list[UploadFile] = File(...),
    _: User = Depends(require_admin),
) -> dict[str, list[str]]:
    upload_dir = Path(__file__).resolve().parents[4] / "static" / "uploads" / "places"
    upload_dir.mkdir(parents=True, exist_ok=True)
    urls: list[str] = []

    for file in files:
        suffix = ALLOWED_PLACE_IMAGE_TYPES.get(file.content_type or "")
        if not suffix:
            raise HTTPException(status_code=400, detail="Only jpg, png, and webp images are allowed.")

        content = await file.read()
        if len(content) > MAX_PLACE_IMAGE_BYTES:
            raise HTTPException(status_code=400, detail="Each image must be 5MB or smaller.")

        filename = f"{uuid4().hex}{suffix}"
        path = upload_dir / filename
        path.write_bytes(content)
        urls.append(f"{settings.backend_url.rstrip('/')}/static/uploads/places/{filename}")

    return {"urls": urls}


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
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    rows = ReviewPostRepository(db).list_with_counts(skip=skip, limit=limit)
    posts = post_service(db)._rows_to_reads(rows)
    if search:
        q = search.lower()
        posts = [post for post in posts if q in f"{post.title} {post.content} {post.author.full_name}".lower()]
    return posts


@router.get("/posts/{post_id}", response_model=ReviewPostRead)
def admin_get_post(post_id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    post = ReviewPostRepository(db).get(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")
    counts = ReviewPostRepository(db).get_many_with_counts([post_id])[post_id]
    return post_service(db).build_post_read(counts[0], likes_count=counts[1], comments_count=counts[2], saves_count=counts[3])


@router.patch("/posts/{post_id}/status", response_model=ReviewPostRead)
def admin_update_post_status(post_id: int, payload: PostStatusUpdate, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    post = ReviewPostRepository(db).get(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")
    post.status = payload.status
    db.add(post)
    db.commit()
    return admin_get_post(post_id, _, db)


@router.delete("/posts/{post_id}", response_model=MessageResponse)
def admin_delete_post(post_id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    post = ReviewPostRepository(db).get(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")
    db.delete(post)
    db.commit()
    return MessageResponse(message="Post deleted successfully.")


@router.get("/comments", response_model=list[AdminCommentRead])
def admin_list_comments(
    post_id: int | None = None,
    user_id: int | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    stmt = select(PostComment).options(selectinload(PostComment.author)).order_by(PostComment.created_at.desc()).offset(skip).limit(limit)
    if post_id:
        stmt = stmt.where(PostComment.post_id == post_id)
    if user_id:
        stmt = stmt.where(PostComment.user_id == user_id)
    comments = db.scalars(stmt).all()
    result = []
    repo = ReviewPostRepository(db)
    svc = post_service(db)
    for comment in comments:
        counts = repo.get_many_with_counts([comment.post_id]).get(comment.post_id)
        if counts:
            result.append({"id": comment.id, "content": comment.content, "author": comment.author, "post": svc.build_post_read(counts[0], likes_count=counts[1], comments_count=counts[2], saves_count=counts[3]), "created_at": comment.created_at})
    return result


@router.delete("/comments/{comment_id}", response_model=MessageResponse)
def admin_delete_comment(comment_id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    comment = db.get(PostComment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found.")
    db.delete(comment)
    db.commit()
    return MessageResponse(message="Comment deleted successfully.")


@router.get("/reviews", response_model=list[AdminPlaceReviewRead])
def admin_list_reviews(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    return list(db.scalars(select(PlaceReview).options(selectinload(PlaceReview.author), selectinload(PlaceReview.place)).order_by(PlaceReview.created_at.desc())).all())


@router.delete("/reviews/{review_id}", response_model=MessageResponse)
def admin_delete_review(review_id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    review = db.get(PlaceReview, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found.")
    db.delete(review)
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
