from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.itinerary import Itinerary, ItineraryItem
from app.models.place import Place
from app.models.user import User
from app.schemas.itinerary import (
    AiItineraryDay,
    AiItineraryGenerateRequest,
    AiItineraryItem,
    AiItineraryResponse,
    ItineraryCreate,
    ItineraryItemCreate,
    ItineraryItemUpdate,
    ItineraryReorderItem,
    ItineraryUpdate,
)
from app.services.gemini_service import gemini_service


class ItineraryService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_user_itineraries(self, user: User) -> list[Itinerary]:
        return list(self.db.scalars(
            select(Itinerary)
            .where(Itinerary.user_id == user.id)
            .options(selectinload(Itinerary.items).selectinload(ItineraryItem.place))
            .order_by(Itinerary.updated_at.desc())
        ).all())

    def create(self, user: User, payload: ItineraryCreate) -> Itinerary:
        data = payload.model_dump(exclude={"items"})
        itinerary = Itinerary(user_id=user.id, **data)
        self.db.add(itinerary)
        self.db.commit()
        self.db.refresh(itinerary)
        for item in payload.items:
            self.add_item(user, itinerary.id, item)
        return self.get_for_user_or_public(itinerary.id, user)

    def get_for_user_or_public(self, itinerary_id: int, user: User | None = None) -> Itinerary:
        itinerary = self.db.scalar(
            select(Itinerary)
            .where(Itinerary.id == itinerary_id)
            .options(selectinload(Itinerary.items).selectinload(ItineraryItem.place))
        )
        if not itinerary:
            raise HTTPException(status_code=404, detail="Itinerary not found.")
        if itinerary.visibility == "private" and (not user or itinerary.user_id != user.id):
            raise HTTPException(status_code=403, detail="You do not have permission to view this itinerary.")
        return itinerary

    def get_owned(self, itinerary_id: int, user: User) -> Itinerary:
        itinerary = self.get_for_user_or_public(itinerary_id, user)
        if itinerary.user_id != user.id:
            raise HTTPException(status_code=403, detail="You can only edit your own itinerary.")
        return itinerary

    def update(self, user: User, itinerary_id: int, payload: ItineraryUpdate) -> Itinerary:
        itinerary = self.get_owned(itinerary_id, user)
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(itinerary, key, value)
        self.db.add(itinerary)
        self.db.commit()
        return self.get_owned(itinerary_id, user)

    def delete(self, user: User, itinerary_id: int) -> None:
        itinerary = self.get_owned(itinerary_id, user)
        self.db.delete(itinerary)
        self.db.commit()

    def add_item(self, user: User, itinerary_id: int, payload: ItineraryItemCreate) -> ItineraryItem:
        self.get_owned(itinerary_id, user)
        if payload.place_id and not self.db.get(Place, payload.place_id):
            raise HTTPException(status_code=404, detail="Place not found.")
        item = ItineraryItem(itinerary_id=itinerary_id, **payload.model_dump())
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def update_item(self, user: User, itinerary_id: int, item_id: int, payload: ItineraryItemUpdate) -> ItineraryItem:
        self.get_owned(itinerary_id, user)
        item = self.db.get(ItineraryItem, item_id)
        if not item or item.itinerary_id != itinerary_id:
            raise HTTPException(status_code=404, detail="Itinerary item not found.")
        if payload.place_id and not self.db.get(Place, payload.place_id):
            raise HTTPException(status_code=404, detail="Place not found.")
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(item, key, value)
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def delete_item(self, user: User, itinerary_id: int, item_id: int) -> None:
        self.get_owned(itinerary_id, user)
        item = self.db.get(ItineraryItem, item_id)
        if not item or item.itinerary_id != itinerary_id:
            raise HTTPException(status_code=404, detail="Itinerary item not found.")
        self.db.delete(item)
        self.db.commit()

    def reorder_items(self, user: User, itinerary_id: int, items: list[ItineraryReorderItem]) -> Itinerary:
        self.get_owned(itinerary_id, user)
        for payload in items:
            item = self.db.get(ItineraryItem, payload.item_id)
            if not item or item.itinerary_id != itinerary_id:
                raise HTTPException(status_code=400, detail="Invalid itinerary item.")
            item.day_number = payload.day_number
            item.order_index = payload.order_index
            item.start_time = payload.start_time
            self.db.add(item)
        self.db.commit()
        return self.get_owned(itinerary_id, user)

    def share(self, user: User, itinerary_id: int) -> Itinerary:
        itinerary = self.get_owned(itinerary_id, user)
        if not itinerary.share_slug:
            itinerary.share_slug = uuid4().hex
        itinerary.visibility = "shared"
        self.db.add(itinerary)
        self.db.commit()
        return self.get_owned(itinerary_id, user)

    def get_shared(self, share_slug: str) -> Itinerary:
        itinerary = self.db.scalar(
            select(Itinerary)
            .where(Itinerary.share_slug == share_slug)
            .options(selectinload(Itinerary.items).selectinload(ItineraryItem.place))
        )
        if not itinerary or itinerary.visibility not in {"shared", "public"}:
            raise HTTPException(status_code=404, detail="Shared itinerary not found.")
        return itinerary

    def generate_ai(self, request: AiItineraryGenerateRequest) -> AiItineraryResponse:
        places = list(self.db.scalars(
            select(Place)
            .where(Place.status.in_(["active", "published"]))
            .order_by(Place.rating_avg.desc())
            .limit(100)
        ).all())
        if request.interests:
            interests = [item.lower() for item in request.interests]
            ranked = [
                place for place in places
                if any(keyword in f"{place.name} {place.category} {' '.join(place.tags or [])}".lower() for keyword in interests)
            ]
            places = ranked or places

        gemini_response = self._generate_ai_with_gemini(request, places[:30])
        if gemini_response:
            return gemini_response

        slots = [
            ("08:00", "Ăn sáng và chuẩn bị di chuyển"),
            ("09:30", "Khám phá điểm chính"),
            ("12:00", "Ăn trưa địa phương"),
            ("14:00", "Tham quan/Check-in"),
            ("18:30", "Ăn tối và nghỉ ngơi"),
        ]
        days: list[AiItineraryDay] = []
        for day in range(1, request.days + 1):
            items: list[AiItineraryItem] = []
            for index, (time, fallback_title) in enumerate(slots):
                place = places[((day - 1) * 2 + index) % len(places)] if places and index in {1, 3} else None
                items.append(AiItineraryItem(
                    time=time,
                    title=place.name if place else fallback_title,
                    place_id=place.id if place else None,
                    place_name=place.name if place else None,
                    note=f"Gợi ý phù hợp với phong cách {request.travel_style}, xuất phát từ {request.start_location}.",
                    estimated_cost=(request.budget or 0) / max(request.days, 1) / len(slots) if request.budget else None,
                    transport_note="Ưu tiên taxi/xe máy tùy nhóm; kiểm tra thời tiết trước khi đi.",
                    duration_minutes=120 if place else 60,
                ))
            days.append(AiItineraryDay(
                day_number=day,
                summary=f"Ngày {day}: cân bằng trải nghiệm, ăn uống và nghỉ ngơi.",
                items=items,
            ))

        return AiItineraryResponse(
            title=f"Lịch trình Quảng Bình {request.days} ngày",
            description="Lịch trình AI fallback dựa trên địa điểm, tags, rating và nhu cầu đã chọn.",
            total_days=request.days,
            estimated_budget=request.budget,
            travel_style=request.travel_style,
            interests=request.interests,
            days=days,
        )

    def _generate_ai_with_gemini(self, request: AiItineraryGenerateRequest, places: list[Place]) -> AiItineraryResponse | None:
        if not gemini_service.available or not places:
            return None
        place_context = [
            {
                "id": place.id,
                "name": place.name,
                "category": place.category,
                "region": place.region,
                "tags": place.tags,
                "address": place.address,
                "rating": float(place.rating_avg or 0),
            }
            for place in places
        ]
        fallback = {}
        prompt = f"""
You are planning a Quang Binh itinerary. Use only these real database places:
{place_context}

User request:
days={request.days}
budget={request.budget}
interests={request.interests}
travel_style={request.travel_style}
start_location={request.start_location}
start_date={request.start_date}
people_count={request.people_count}

Return JSON with title, description, total_days, estimated_budget, travel_style, interests, days.
Each day has day_number, summary, items.
Each item has time (HH:MM), title, place_id nullable, place_name nullable, note, estimated_cost, transport_note, duration_minutes.
Do not invent place_id. For meals/hotel area, use place_id null.
"""
        data = gemini_service.generate_json(prompt, fallback=fallback, max_output_tokens=2600)
        if not isinstance(data, dict) or not data.get("days"):
            return None
        valid_place_ids = {place.id for place in places}
        try:
            normalized_days: list[AiItineraryDay] = []
            for day in data.get("days", [])[: request.days]:
                items: list[AiItineraryItem] = []
                for item in day.get("items", [])[:8]:
                    place_id = item.get("place_id")
                    if place_id not in valid_place_ids:
                        place_id = None
                    items.append(AiItineraryItem(
                        time=str(item.get("time") or "09:00")[:5],
                        title=str(item.get("title") or "Hoạt động"),
                        place_id=place_id,
                        place_name=item.get("place_name") if place_id else None,
                        note=str(item.get("note") or ""),
                        estimated_cost=item.get("estimated_cost"),
                        transport_note=item.get("transport_note"),
                        duration_minutes=int(item.get("duration_minutes") or 90),
                    ))
                normalized_days.append(AiItineraryDay(
                    day_number=int(day.get("day_number") or len(normalized_days) + 1),
                    summary=str(day.get("summary") or ""),
                    items=items,
                ))
            return AiItineraryResponse(
                title=str(data.get("title") or f"Lịch trình Quảng Bình {request.days} ngày"),
                description=str(data.get("description") or "Lịch trình Gemini dựa trên dữ liệu địa điểm thật."),
                total_days=request.days,
                estimated_budget=data.get("estimated_budget", request.budget),
                travel_style=str(data.get("travel_style") or request.travel_style),
                interests=list(data.get("interests") or request.interests),
                days=normalized_days,
                todo=None,
            )
        except Exception:
            return None
