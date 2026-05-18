from __future__ import annotations

from collections import defaultdict, deque
from time import monotonic

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse, Response


class InMemoryRateLimiter:
    def __init__(self) -> None:
        self.requests: dict[str, deque[float]] = defaultdict(deque)

    def allow(self, key: str, *, limit: int, window_seconds: int) -> bool:
        now = monotonic()
        bucket = self.requests[key]
        while bucket and bucket[0] <= now - window_seconds:
            bucket.popleft()
        if len(bucket) >= limit:
            return False
        bucket.append(now)
        return True


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app) -> None:
        super().__init__(app)
        self.limiter = InMemoryRateLimiter()

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.url.path.startswith("/api/v1/"):
            client_ip = request.client.host if request.client else "unknown"
            path = request.url.path
            limit, window = self._limits_for(path, request.method)
            if limit and not self.limiter.allow(f"{client_ip}:{request.method}:{path}", limit=limit, window_seconds=window):
                return JSONResponse(status_code=429, content={"detail": "Too many requests. Please try again later."})
        return await call_next(request)

    def _limits_for(self, path: str, method: str) -> tuple[int, int]:
        if method == "POST" and path.endswith("/auth/login"):
            return 5, 60
        if method == "POST" and path.endswith("/auth/register"):
            return 5, 300
        if method == "POST" and path.endswith("/auth/forgot-password"):
            return 5, 300
        if method == "POST" and "/uploads" in path:
            return 20, 60
        if path.startswith("/api/v1/ai"):
            return 30, 60
        if method in {"POST", "PATCH"} and ("/comments" in path or "/reports" in path or "/reviews" in path or "/follow" in path):
            return 30, 60
        return 300, 60
