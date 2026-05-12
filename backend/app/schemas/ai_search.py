from pydantic import BaseModel, Field

from app.schemas.review_post import ReviewPostRead


class SemanticSearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)
    top_k: int = Field(default=5, ge=1, le=20)


class SemanticSearchResult(BaseModel):
    score: float
    post: ReviewPostRead


class SemanticSearchResponse(BaseModel):
    query: str
    results: list[SemanticSearchResult]
