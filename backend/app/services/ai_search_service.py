from app.repositories.review_post_repository import ReviewPostRepository
from app.schemas.ai_search import SemanticSearchResponse, SemanticSearchResult
from app.services.embedding_service import EmbeddingService
from app.services.review_post_service import ReviewPostService
from app.services.vector_search_service import VectorSearchService


class AiSearchService:
    def __init__(
        self,
        *,
        embedding_service: EmbeddingService,
        vector_search_service: VectorSearchService,
        review_post_repository: ReviewPostRepository,
        review_post_service: ReviewPostService,
    ) -> None:
        self.embedding_service = embedding_service
        self.vector_search_service = vector_search_service
        self.review_post_repository = review_post_repository
        self.review_post_service = review_post_service

    def search_review_posts(self, *, query: str, top_k: int) -> SemanticSearchResponse:
        embedding = self.embedding_service.embed_text(query)
        matches = self.vector_search_service.search(embedding=embedding, top_k=top_k)
        posts_by_id = self.review_post_repository.get_many_with_counts(
            post_ids=[post_id for post_id, _ in matches]
        )

        results = [
            SemanticSearchResult(
                score=score,
                post=self.review_post_service.build_post_read(
                    post,
                    likes_count=likes_count,
                    comments_count=comments_count,
                    saves_count=saves_count,
                ),
            )
            for post_id, score in matches
            if post_id in posts_by_id
            for post, likes_count, comments_count, saves_count in [posts_by_id[post_id]]
        ]

        return SemanticSearchResponse(query=query, results=results)
