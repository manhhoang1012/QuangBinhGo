from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.notification import Notification
from app.models.review_post import PostComment, ReviewPost
from app.models.user import User
from app.schemas.notification import NotificationRead
from app.services.websocket_manager import notification_ws_manager


class NotificationService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_notification(
        self,
        *,
        recipient_id: int,
        actor_id: int | None,
        type: str,
        title: str,
        message: str,
        target_type: str,
        target_id: int | None = None,
        target_url: str | None = None,
        metadata: dict | None = None,
    ) -> Notification | None:
        if actor_id is not None and actor_id == recipient_id:
            return None
        notification = Notification(
            recipient_id=recipient_id,
            actor_id=actor_id,
            type=type,
            title=title,
            message=message,
            target_type=target_type,
            target_id=target_id,
            target_url=target_url,
            metadata_json=metadata,
        )
        self.db.add(notification)
        self.db.commit()
        notification = self._get(notification.id) or notification
        self._send_realtime(recipient_id, notification)
        return notification

    def create_post_like_notification(self, *, post: ReviewPost, actor: User) -> Notification | None:
        return self.create_notification(
            recipient_id=post.user_id,
            actor_id=actor.id,
            type="post_like",
            title="Bài viết có lượt thích mới",
            message=f"{actor.full_name} đã thích bài viết của bạn",
            target_type="post",
            target_id=post.id,
            target_url=f"/community/{post.id}",
        )

    def create_post_comment_notification(self, *, post: ReviewPost, comment: PostComment, actor: User) -> Notification | None:
        return self.create_notification(
            recipient_id=post.user_id,
            actor_id=actor.id,
            type="post_comment",
            title="Bình luận mới",
            message=f"{actor.full_name} đã bình luận về bài viết của bạn",
            target_type="post",
            target_id=post.id,
            target_url=f"/community/{post.id}",
            metadata={"comment_id": comment.id},
        )

    def create_comment_reply_notification(self, *, post: ReviewPost, parent_comment: PostComment, reply: PostComment, actor: User) -> Notification | None:
        return self.create_notification(
            recipient_id=parent_comment.user_id,
            actor_id=actor.id,
            type="comment_reply",
            title="Có phản hồi bình luận",
            message=f"{actor.full_name} đã trả lời bình luận của bạn",
            target_type="post",
            target_id=post.id,
            target_url=f"/community/{post.id}",
            metadata={"comment_id": parent_comment.id, "reply_id": reply.id},
        )

    def create_comment_like_notification(self, *, post: ReviewPost | None, comment: PostComment, actor: User) -> Notification | None:
        return self.create_notification(
            recipient_id=comment.user_id,
            actor_id=actor.id,
            type="comment_like",
            title="Bình luận có lượt thích mới",
            message=f"{actor.full_name} đã thích bình luận của bạn",
            target_type="post" if post else "comment",
            target_id=post.id if post else comment.id,
            target_url=f"/community/{post.id}" if post else None,
            metadata={"comment_id": comment.id},
        )

    def create_user_follow_notification(self, *, target_user: User, actor: User) -> Notification | None:
        username = actor.username or str(actor.id)
        return self.create_notification(
            recipient_id=target_user.id,
            actor_id=actor.id,
            type="user_follow",
            title="Người theo dõi mới",
            message=f"{actor.full_name} đã theo dõi bạn",
            target_type="user",
            target_id=actor.id,
            target_url=f"/users/{username}",
        )

    def create_post_moderation_notification(self, *, post: ReviewPost, actor: User | None, hidden: bool) -> Notification | None:
        return self.create_notification(
            recipient_id=post.user_id,
            actor_id=actor.id if actor else None,
            type="post_hidden" if hidden else "post_deleted",
            title="Bài viết đã bị ẩn" if hidden else "Bài viết đã bị xóa",
            message="Bài viết của bạn đã bị ẩn do vi phạm quy định." if hidden else "Bài viết của bạn đã bị xóa bởi quản trị viên.",
            target_type="post",
            target_id=post.id,
            target_url=f"/community/{post.id}" if hidden else None,
        )

    def list_notifications(self, *, user_id: int, page: int = 1, limit: int = 20, unread_only: bool = False, type: str | None = None) -> tuple[list[Notification], int]:
        statement = select(Notification).where(Notification.recipient_id == user_id, Notification.deleted_at.is_(None))
        count_statement = select(func.count(Notification.id)).where(Notification.recipient_id == user_id, Notification.deleted_at.is_(None))
        if unread_only:
            statement = statement.where(Notification.is_read.is_(False))
            count_statement = count_statement.where(Notification.is_read.is_(False))
        if type:
            statement = statement.where(Notification.type == type)
            count_statement = count_statement.where(Notification.type == type)
        statement = statement.options(selectinload(Notification.actor)).order_by(Notification.created_at.desc()).offset((page - 1) * limit).limit(limit)
        return list(self.db.scalars(statement).all()), int(self.db.scalar(count_statement) or 0)

    def get_unread_count(self, user_id: int) -> int:
        return int(self.db.scalar(select(func.count(Notification.id)).where(Notification.recipient_id == user_id, Notification.deleted_at.is_(None), Notification.is_read.is_(False))) or 0)

    def mark_as_read(self, notification_id: int, user_id: int) -> Notification:
        notification = self._get_owned(notification_id, user_id)
        notification.is_read = True
        notification.read_at = datetime.now(timezone.utc)
        self.db.add(notification)
        self.db.commit()
        notification = self._get(notification.id) or notification
        self._send_read_event(user_id, notification.id)
        return notification

    def mark_all_as_read(self, user_id: int) -> int:
        notifications, _ = self.list_notifications(user_id=user_id, page=1, limit=1000, unread_only=True)
        now = datetime.now(timezone.utc)
        for notification in notifications:
            notification.is_read = True
            notification.read_at = now
            self.db.add(notification)
        self.db.commit()
        self._send_read_event(user_id, None)
        return len(notifications)

    def delete_notification(self, notification_id: int, user_id: int) -> None:
        notification = self._get_owned(notification_id, user_id)
        notification.deleted_at = datetime.now(timezone.utc)
        self.db.add(notification)
        self.db.commit()

    def _get(self, notification_id: int) -> Notification | None:
        return self.db.scalar(select(Notification).where(Notification.id == notification_id).options(selectinload(Notification.actor)))

    def _get_owned(self, notification_id: int, user_id: int) -> Notification:
        notification = self._get(notification_id)
        if not notification or notification.recipient_id != user_id or notification.deleted_at is not None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")
        return notification

    def _send_realtime(self, user_id: int, notification: Notification) -> None:
        try:
            import anyio

            anyio.from_thread.run(notification_ws_manager.send_to_user, user_id, {
                "event": "notification:new",
                "notification": NotificationRead.model_validate(notification).model_dump(mode="json"),
                "unread_count": self.get_unread_count(user_id),
            })
        except Exception:
            return

    def _send_read_event(self, user_id: int, notification_id: int | None) -> None:
        try:
            import anyio

            anyio.from_thread.run(notification_ws_manager.send_to_user, user_id, {
                "event": "notification:read",
                "notification_id": notification_id,
                "unread_count": self.get_unread_count(user_id),
            })
        except Exception:
            return
