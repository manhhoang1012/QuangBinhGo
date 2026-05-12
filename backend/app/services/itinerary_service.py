from collections.abc import Sequence

from app.models.place import Place
from app.repositories.place_repository import PlaceRepository
from app.schemas.itinerary import (
    ItineraryDay,
    ItineraryRequest,
    ItineraryResponse,
    ItineraryScheduleItem,
)


DEFAULT_PLACES = [
    {"name": "Phong Nha Cave", "category": "cave"},
    {"name": "Paradise Cave", "category": "cave"},
    {"name": "Dark Cave", "category": "adventure"},
    {"name": "Mooc Spring", "category": "nature"},
    {"name": "Nhat Le Beach", "category": "beach"},
    {"name": "Quang Phu Sand Dunes", "category": "landscape"},
    {"name": "Dong Hoi Citadel", "category": "culture"},
    {"name": "Vung Chua - Yen Island", "category": "culture"},
]

FOOD_BY_BUDGET = {
    "budget": ["banh loc", "chao canh", "banh xeo Quang Hoa", "local seafood rice"],
    "mid-range": ["river fish hotpot", "grilled squid", "seafood noodles", "Phong Nha farm lunch"],
    "luxury": ["premium seafood dinner", "resort breakfast", "private cave picnic", "chef-led local tasting"],
}

STYLE_NOTES = {
    "relaxed": "keeps mornings gentle and leaves room for cafes, swimming, and slow transfers",
    "adventure": "prioritizes caves, forest trails, kayaking, and higher-energy stops",
    "family": "balances short travel times, easy meals, and flexible rest windows",
    "culture": "adds historical stops, markets, and local food experiences",
}


class ItineraryService:
    def __init__(self, place_repository: PlaceRepository) -> None:
        self.place_repository = place_repository

    def generate(self, request: ItineraryRequest) -> ItineraryResponse:
        places = self._load_places()
        selected_places = self._rank_places(
            places=places,
            interests=request.interests,
            travel_style=request.travel_style,
        )
        food_pool = self._food_for_budget(request.budget)

        days = [
            self._build_day(
                day_number=day_number,
                request=request,
                places=selected_places,
                food_pool=food_pool,
            )
            for day_number in range(1, request.days + 1)
        ]

        style_note = self._style_note(request.travel_style)
        overview = (
            f"A {request.days}-day Quang Binh itinerary that {style_note}, "
            f"with food and pacing tuned for a {request.budget} budget."
        )

        return ItineraryResponse(
            days=request.days,
            travel_style=request.travel_style,
            budget=request.budget,
            interests=request.interests,
            overview=overview,
            itinerary=days,
            tips=[
                "Book cave tours early during weekends and Vietnamese holidays.",
                "Use Dong Hoi as the easiest base for beach, food, and airport access.",
                "Start cave and spring days early to avoid midday heat.",
                "Carry cash for small restaurants, boat rides, and rural stops.",
            ],
        )

    def _load_places(self) -> list[dict[str, str]]:
        db_places = self.place_repository.list(limit=100)
        if not db_places:
            return DEFAULT_PLACES

        return [
            {"name": place.name, "category": place.category}
            for place in db_places
        ]

    def _rank_places(
        self,
        *,
        places: Sequence[dict[str, str]],
        interests: list[str],
        travel_style: str,
    ) -> list[dict[str, str]]:
        keywords = {item.lower() for item in interests}
        keywords.add(travel_style.lower())

        def score(place: dict[str, str]) -> int:
            text = f"{place['name']} {place['category']}".lower()
            return sum(1 for keyword in keywords if keyword and keyword in text)

        ranked = sorted(places, key=score, reverse=True)
        return ranked or DEFAULT_PLACES

    def _build_day(
        self,
        *,
        day_number: int,
        request: ItineraryRequest,
        places: list[dict[str, str]],
        food_pool: list[str],
    ) -> ItineraryDay:
        primary = places[(day_number - 1) % len(places)]
        secondary = places[day_number % len(places)]
        dinner_place = "Dong Hoi riverside" if day_number == request.days else "Phong Nha town"
        breakfast = food_pool[(day_number - 1) % len(food_pool)]
        lunch = food_pool[day_number % len(food_pool)]
        dinner = food_pool[(day_number + 1) % len(food_pool)]

        return ItineraryDay(
            day=day_number,
            theme=self._theme_for_day(day_number, primary, request.travel_style),
            places=[primary["name"], secondary["name"], dinner_place],
            food=[breakfast, lunch, dinner],
            schedule=[
                ItineraryScheduleItem(
                    time="07:30",
                    title="Breakfast and route check",
                    description="Start with a local meal and confirm transport timing before the main activity.",
                    food=breakfast,
                ),
                ItineraryScheduleItem(
                    time="09:00",
                    title=f"Explore {primary['name']}",
                    description=self._activity_description(primary, request.travel_style),
                    place=primary["name"],
                ),
                ItineraryScheduleItem(
                    time="12:30",
                    title="Lunch near the route",
                    description="Keep lunch close to the next stop to reduce backtracking.",
                    food=lunch,
                ),
                ItineraryScheduleItem(
                    time="14:30",
                    title=f"Visit {secondary['name']}",
                    description="Use the afternoon for a second highlight or a slower scenic stop.",
                    place=secondary["name"],
                ),
                ItineraryScheduleItem(
                    time="18:30",
                    title=f"Dinner around {dinner_place}",
                    description="End the day with regional dishes and an easy walk nearby.",
                    place=dinner_place,
                    food=dinner,
                ),
            ],
        )

    def _food_for_budget(self, budget: str) -> list[str]:
        normalized = budget.lower()
        if "lux" in normalized or "high" in normalized:
            return FOOD_BY_BUDGET["luxury"]
        if "mid" in normalized or "medium" in normalized:
            return FOOD_BY_BUDGET["mid-range"]
        return FOOD_BY_BUDGET["budget"]

    def _style_note(self, travel_style: str) -> str:
        normalized = travel_style.lower()
        for key, note in STYLE_NOTES.items():
            if key in normalized:
                return note
        return "balances signature landscapes, local food, and practical travel time"

    def _theme_for_day(self, day_number: int, place: dict[str, str], travel_style: str) -> str:
        return f"Day {day_number}: {place['category'].title()} discovery for {travel_style} travelers"

    def _activity_description(self, place: dict[str, str], travel_style: str) -> str:
        if "adventure" in travel_style.lower():
            return f"Plan an active visit at {place['name']} with time for guided activities and photo stops."
        if "relaxed" in travel_style.lower():
            return f"Take {place['name']} slowly, leaving extra time for coffee, shade, and unplanned views."
        return f"Make {place['name']} the main stop of the day with enough time for context and photos."
