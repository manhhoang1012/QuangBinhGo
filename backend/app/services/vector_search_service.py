from functools import lru_cache
from typing import Any

from fastapi import HTTPException, status
from pinecone import Pinecone

from app.core.config import settings
from app.models.review_post import ReviewPost


@lru_cache
def get_pinecone_index():
    if not settings.pinecone_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Pinecone API key is not configured.",
        )

    pinecone = Pinecone(api_key=settings.pinecone_api_key)
    return pinecone.Index(settings.pinecone_index_name)


class VectorSearchService:
    namespace = "review-posts"

    def upsert_review_post(self, *, post: ReviewPost, embedding: list[float]) -> None:
        index = get_pinecone_index()
        index.upsert(
            vectors=[
                {
                    "id": self._vector_id(post.id),
                    "values": embedding,
                    "metadata": {
                        "post_id": post.id,
                        "place_id": post.place_id,
                        "user_id": post.user_id,
                        "title": post.title,
                    },
                }
            ],
            namespace=self.namespace,
        )

    def search(self, *, embedding: list[float], top_k: int) -> list[tuple[int, float]]:
        index = get_pinecone_index()
        response = index.query(
            vector=embedding,
            top_k=top_k,
            namespace=self.namespace,
            include_metadata=True,
        )
        matches = self._matches_from_response(response)

        results: list[tuple[int, float]] = []
        for match in matches:
            metadata = self._metadata_from_match(match)
            post_id = metadata.get("post_id")
            score = self._score_from_match(match)
            if isinstance(post_id, int):
                results.append((post_id, score))
            elif isinstance(post_id, str) and post_id.isdigit():
                results.append((int(post_id), score))

        return results

    def _vector_id(self, post_id: int) -> str:
        return f"review-post:{post_id}"

    def _matches_from_response(self, response: Any) -> list[Any]:
        if isinstance(response, dict):
            return response.get("matches", [])
        return list(getattr(response, "matches", []))

    def _metadata_from_match(self, match: Any) -> dict[str, Any]:
        if isinstance(match, dict):
            return match.get("metadata") or {}
        return getattr(match, "metadata", {}) or {}

    def _score_from_match(self, match: Any) -> float:
        if isinstance(match, dict):
            return float(match.get("score", 0))
        return float(getattr(match, "score", 0))
