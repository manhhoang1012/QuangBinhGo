import time
from collections import defaultdict, deque
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.db.session import get_db
from app.models.place import Place
from app.models.review_post import ReviewPost
from app.schemas.ai_features import (
    AiChatRequest,
    AiChatResponse,
    AiRecommendPlacesRequest,
    AiRecommendPlacesResponse,
    AiRecommendedPlace,
    AiSearchRequest,
    AiSearchResponse,
    CaptionResponse,
    ContentTextRequest,
    HashtagResponse,
    ModerationResponse,
    SummaryResponse,
)
from app.schemas.itinerary import ItineraryRequest, ItineraryResponse
from app.schemas.place import PlaceRead
from app.schemas.review_post import ReviewPostRead
from app.services.gemini_service import gemini_service
from app.services.itinerary_service import ItineraryService

router = APIRouter()

PUBLIC_STATUSES = {"active", "published"}
RATE_BUCKET: dict[str, deque[float]] = defaultdict(deque)


def rate_limit(request: Request) -> None:
    key = request.client.host if request.client else "anonymous"
    now = time.time()
    bucket = RATE_BUCKET[key]
    while bucket and now - bucket[0] > 60:
        bucket.popleft()
    if len(bucket) >= 30:
        raise HTTPException(status_code=429, detail="AI rate limit exceeded. Please try again shortly.")
    bucket.append(now)


def get_itinerary_service(db: Session = Depends(get_db)) -> ItineraryService:
    return ItineraryService(db)


def normalize(value: object) -> str:
    return str(value or "").strip().lower()


def keywords_from_text(text: str) -> list[str]:
    stopwords = {"toi", "tôi", "muon", "muốn", "di", "đi", "va", "và", "co", "có", "cho", "phu", "phù", "hop", "hợp"}
    return [word for word in normalize(text).replace(",", " ").split() if len(word) > 2 and word not in stopwords]


def place_text(place: Place) -> str:
    return normalize(f"{place.name} {place.description} {place.category} {place.region or ''} {' '.join(place.tags or [])} {place.address} {place.opening_hours or ''}")


def post_text(post: ReviewPost) -> str:
    return normalize(f"{post.title} {post.content} {' '.join(post.hashtags or [])} {post.place.name if post.place else ''}")


def build_place_read(place: Place, score: float | None = None) -> PlaceRead:
    data = PlaceRead.model_validate(place)
    data.cover_image = place.cover_image
    if score is not None:
        data.distance_km = None
    return data


def query_places(db: Session, keywords: list[str], limit: int = 8) -> list[Place]:
    places = list(db.scalars(select(Place).where(Place.status.in_(PUBLIC_STATUSES))).all())
    if not keywords:
        places.sort(key=lambda place: (float(place.rating_avg or 0), place.review_count or 0), reverse=True)
        return places[:limit]
    scored = []
    for place in places:
        text = place_text(place)
        score = sum(2 if keyword in normalize(place.name) else 1 for keyword in keywords if keyword in text)
        if score:
            scored.append((score, place))
    scored.sort(key=lambda item: (item[0], float(item[1].rating_avg or 0)), reverse=True)
    return [place for _, place in scored[:limit]]


def query_posts(db: Session, keywords: list[str], limit: int = 8) -> list[ReviewPost]:
    posts = list(db.scalars(
        select(ReviewPost)
        .where(ReviewPost.status == "visible", ReviewPost.visibility == "public", ReviewPost.is_draft.is_(False))
        .options(selectinload(ReviewPost.author), selectinload(ReviewPost.place))
    ).all())
    scored = []
    for post in posts:
        text = post_text(post)
        score = sum(2 if keyword in normalize(post.title) else 1 for keyword in keywords if keyword in text)
        if score or not keywords:
            scored.append((score, post))
    scored.sort(key=lambda item: (item[0], item[1].created_at), reverse=True)
    return [post for _, post in scored[:limit]]


def extract_intent(query: str) -> tuple[dict[str, Any], str]:
    fallback = {
        "categories": [],
        "tags": keywords_from_text(query),
        "travel_style": None,
        "budget_level": None,
        "suitable_audience": [],
        "keywords": keywords_from_text(query),
    }
    prompt = f"""
You extract travel search intent for Quang Binh tourism.
Query: {query}
Return JSON with: categories, tags, travel_style, budget_level, suitable_audience, keywords.
Use Vietnamese lowercase keywords where possible.
"""
    intent = gemini_service.generate_json(prompt, fallback=fallback)
    if not isinstance(intent, dict):
        return fallback, "fallback"
    intent.setdefault("keywords", fallback["keywords"])
    return intent, "gemini" if gemini_service.available else "fallback"


@router.post("/search", response_model=AiSearchResponse)
def ai_search(payload: AiSearchRequest, request: Request, db: Session = Depends(get_db)) -> AiSearchResponse:
    rate_limit(request)
    intent, source = extract_intent(payload.query)
    raw_keywords = [*intent.get("keywords", []), *intent.get("tags", []), *intent.get("categories", []), payload.query]
    keywords = keywords_from_text(" ".join(str(item) for item in raw_keywords))
    places = [] if payload.type == "posts" else query_places(db, keywords, payload.top_k)
    posts = [] if payload.type == "places" else query_posts(db, keywords, payload.top_k)
    return AiSearchResponse(
        query=payload.query,
        intent=intent,
        places=[build_place_read(place) for place in places],
        posts=[ReviewPostRead.model_validate(post) for post in posts],
        results=[{"score": 1.0, "post": ReviewPostRead.model_validate(post)} for post in posts],
        source=source,
    )


@router.post("/recommend/places", response_model=AiRecommendPlacesResponse)
def recommend_places(payload: AiRecommendPlacesRequest, request: Request, db: Session = Depends(get_db)) -> AiRecommendPlacesResponse:
    rate_limit(request)
    keywords = keywords_from_text(" ".join([*payload.interests, payload.travel_style or ""]))
    candidates = query_places(db, keywords, 12)
    context = [
        {"id": place.id, "name": place.name, "category": place.category, "region": place.region, "tags": place.tags, "rating": float(place.rating_avg or 0)}
        for place in candidates
    ]
    fallback = {
        "recommended_places": [{"place_id": place.id, "reason": f"Phù hợp với {', '.join(payload.interests) or 'nhu cầu du lịch'}."} for place in candidates[:5]],
        "estimated_budget": payload.budget,
        "suggested_region": candidates[0].region if candidates else None,
    }
    prompt = f"""
You are a Quang Binh travel recommender. Use only these database places:
{context}
User interests={payload.interests}, budget={payload.budget}, style={payload.travel_style}, days={payload.days}.
Return JSON: recommended_places array with place_id and reason, estimated_budget, suggested_region.
"""
    data = gemini_service.generate_json(prompt, fallback=fallback)
    by_id = {place.id: place for place in candidates}
    recommended = []
    for item in data.get("recommended_places", []) if isinstance(data, dict) else []:
        place = by_id.get(item.get("place_id"))
        if place:
            recommended.append(AiRecommendedPlace(place=build_place_read(place), reason=item.get("reason") or "Phù hợp với nhu cầu của bạn."))
    if not recommended:
        recommended = [AiRecommendedPlace(place=build_place_read(place), reason="Phù hợp với sở thích và độ phổ biến.") for place in candidates[:5]]
    return AiRecommendPlacesResponse(
        recommended_places=recommended,
        estimated_budget=data.get("estimated_budget", payload.budget) if isinstance(data, dict) else payload.budget,
        suggested_region=data.get("suggested_region") if isinstance(data, dict) else (candidates[0].region if candidates else None),
        source="gemini" if gemini_service.available and data != fallback else "fallback",
    )


@router.post("/chat", response_model=AiChatResponse)
def ai_chat(payload: AiChatRequest, request: Request, db: Session = Depends(get_db)) -> AiChatResponse:
    rate_limit(request)
    keywords = keywords_from_text(payload.message)
    places = query_places(db, keywords, 5)
    posts = query_posts(db, keywords, 3)
    context = [{"name": place.name, "category": place.category, "region": place.region, "address": place.address, "tags": place.tags} for place in places]
    fallback_answer = "Mình có thể gợi ý địa điểm, lịch trình, chi phí và thời điểm đi Quảng Bình. Bạn có thể nói rõ số ngày, ngân sách và kiểu du lịch mong muốn nhé."
    if places:
        fallback_answer = "Một vài gợi ý phù hợp: " + ", ".join(place.name for place in places[:3]) + "."
    prompt = f"""
You are QuangBinhGo, a concise helpful chatbot specialized in Quang Binh travel.
Never invent places. Prefer this database context:
{context}
User: {payload.message}
Answer in Vietnamese, short and practical.
"""
    answer = gemini_service.generate_text(prompt, max_output_tokens=700) or fallback_answer
    return AiChatResponse(
        answer=answer,
        related_places=[build_place_read(place) for place in places],
        related_posts=[ReviewPostRead.model_validate(post) for post in posts],
        source="gemini" if gemini_service.available and answer != fallback_answer else "fallback",
    )


@router.post("/content/caption", response_model=CaptionResponse)
def generate_caption(payload: ContentTextRequest, request: Request) -> CaptionResponse:
    rate_limit(request)
    fallback = {
        "short": payload.content[:120],
        "chill": f"Quảng Bình hôm nay thật đáng nhớ. {payload.content[:100]}",
        "viral": f"Không ngờ Quảng Bình lại đẹp như vậy! {payload.content[:100]}",
        "travel": f"Một hành trình Quảng Bình nhiều trải nghiệm: {payload.content[:120]}",
    }
    data = gemini_service.generate_json(f"Generate Vietnamese travel captions from this content: {payload.content}. Return JSON with short, chill, viral, travel.", fallback=fallback)
    return CaptionResponse(captions=data if isinstance(data, dict) else fallback, source="gemini" if gemini_service.available and data != fallback else "fallback")


@router.post("/content/summarize", response_model=SummaryResponse)
def summarize_content(payload: ContentTextRequest, request: Request) -> SummaryResponse:
    rate_limit(request)
    fallback = payload.content[:350] + ("..." if len(payload.content) > 350 else "")
    summary = gemini_service.generate_text(f"Summarize this Vietnamese travel review in 2-4 concise sentences:\n{payload.content}", max_output_tokens=500) or fallback
    return SummaryResponse(summary=summary, source="gemini" if gemini_service.available and summary != fallback else "fallback")


@router.post("/content/hashtags", response_model=HashtagResponse)
def generate_hashtags(payload: ContentTextRequest, request: Request) -> HashtagResponse:
    rate_limit(request)
    words = keywords_from_text(payload.content)[:8]
    fallback = ["#quangbinh", *[f"#{word.replace('-', '')}" for word in words]]
    data = gemini_service.generate_json(f"Generate 5-10 Vietnamese travel hashtags for: {payload.content}. Return JSON array of hashtags.", fallback=fallback)
    hashtags = data if isinstance(data, list) else fallback
    return HashtagResponse(hashtags=[tag if str(tag).startswith("#") else f"#{tag}" for tag in hashtags][:10], source="gemini" if gemini_service.available and data != fallback else "fallback")


@router.post("/content/moderate", response_model=ModerationResponse)
def moderate_content(payload: ContentTextRequest, request: Request) -> ModerationResponse:
    rate_limit(request)
    lower = normalize(payload.content)
    fallback_labels = [label for label, terms in {
        "spam": ["http://", "https://", "kiếm tiền", "casino", "khuyến mãi"],
        "toxic": ["đồ ngu", "chửi", "fuck"],
        "scam": ["chuyển khoản", "lừa đảo"],
    }.items() if any(term in lower for term in terms)]
    fallback = {"safe": not fallback_labels, "labels": fallback_labels, "warning": "Nội dung có dấu hiệu không an toàn." if fallback_labels else None}
    data = gemini_service.generate_json(
        f"Moderate this Vietnamese user content for spam, toxic, harassment, scam, offensive. Return JSON safe boolean, labels array, warning string/null:\n{payload.content}",
        fallback=fallback,
    )
    if not isinstance(data, dict):
        data = fallback
    return ModerationResponse(
        safe=bool(data.get("safe", True)),
        labels=list(data.get("labels", [])),
        warning=data.get("warning"),
        source="gemini" if gemini_service.available and data != fallback else "fallback",
    )


@router.post("/itinerary", response_model=ItineraryResponse)
def generate_itinerary(
    itinerary_request: ItineraryRequest,
    request: Request,
    itinerary_service: ItineraryService = Depends(get_itinerary_service),
) -> ItineraryResponse:
    rate_limit(request)
    return itinerary_service.generate_ai(itinerary_request)
