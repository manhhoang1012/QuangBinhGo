from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories.place_repository import PlaceRepository
from app.repositories.review_post_repository import ReviewPostRepository
from app.schemas.ai_search import SemanticSearchRequest, SemanticSearchResponse
from app.schemas.itinerary import ItineraryRequest, ItineraryResponse
from app.services.ai_search_service import AiSearchService
from app.services.embedding_service import EmbeddingService
from app.services.itinerary_service import ItineraryService
from app.services.review_post_service import ReviewPostService
from app.services.vector_search_service import VectorSearchService

router = APIRouter()


def get_ai_search_service(db: Session = Depends(get_db)) -> AiSearchService:
    review_post_repository = ReviewPostRepository(db)
    review_post_service = ReviewPostService(
        review_post_repository=review_post_repository,
        place_repository=PlaceRepository(db),
    )
    return AiSearchService(
        embedding_service=EmbeddingService(),
        vector_search_service=VectorSearchService(),
        review_post_repository=review_post_repository,
        review_post_service=review_post_service,
    )


def get_itinerary_service(db: Session = Depends(get_db)) -> ItineraryService:
    return ItineraryService(db)


@router.post("/search", response_model=SemanticSearchResponse)
def semantic_search_review_posts(
    search_request: SemanticSearchRequest,
    ai_search_service: AiSearchService = Depends(get_ai_search_service),
) -> SemanticSearchResponse:
    return ai_search_service.search_review_posts(
        query=search_request.query,
        top_k=search_request.top_k,
    )


@router.post("/itinerary", response_model=ItineraryResponse)
def generate_itinerary(
    itinerary_request: ItineraryRequest,
    itinerary_service: ItineraryService = Depends(get_itinerary_service),
) -> ItineraryResponse:
    return itinerary_service.generate_ai(itinerary_request)
