from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session

from app.core.security import get_token_subject
from app.db.session import SessionLocal
from app.repositories.user_repository import UserRepository
from app.services.websocket_manager import notification_ws_manager

router = APIRouter()


def _get_ws_user_id(token: str, db: Session) -> int | None:
    subject = get_token_subject(token)
    if subject is None:
        return None
    try:
        user_id = int(subject)
    except ValueError:
        return None
    user = UserRepository(db).get(user_id)
    if not user or not user.is_active:
        return None
    return user.id


@router.websocket("/notifications")
async def notifications_websocket(websocket: WebSocket, token: str = Query(...)) -> None:
    db = SessionLocal()
    try:
        user_id = _get_ws_user_id(token, db)
    finally:
        db.close()

    if user_id is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await notification_ws_manager.connect(user_id, websocket)
    try:
        while True:
            message = await websocket.receive_text()
            if message == "ping":
                await websocket.send_json({"event": "pong"})
    except WebSocketDisconnect:
        notification_ws_manager.disconnect(user_id, websocket)
    except Exception:
        notification_ws_manager.disconnect(user_id, websocket)
