import logging
from collections import defaultdict

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class NotificationWebSocketManager:
    def __init__(self) -> None:
        self.active_connections: dict[int, set[WebSocket]] = defaultdict(set)

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections[user_id].add(websocket)
        logger.info("Notification websocket connected for user_id=%s", user_id)

    def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        self.active_connections[user_id].discard(websocket)
        if not self.active_connections[user_id]:
            self.active_connections.pop(user_id, None)
        logger.info("Notification websocket disconnected for user_id=%s", user_id)

    async def send_to_user(self, user_id: int, payload: dict) -> None:
        connections = list(self.active_connections.get(user_id, set()))
        for websocket in connections:
            try:
                await websocket.send_json(payload)
            except Exception:
                self.disconnect(user_id, websocket)


notification_ws_manager = NotificationWebSocketManager()
