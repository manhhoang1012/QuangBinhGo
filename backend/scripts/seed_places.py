from __future__ import annotations

from decimal import Decimal
from pathlib import Path
import sys

from sqlalchemy import select

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from app.db.init_db import init_db
from app.db.session import SessionLocal
from app.models.place import Place


IMAGE_PLACEHOLDER = "https://placehold.co/1200x800?text=QuangBinhGo"

PLACES = [
    {
        "name": "Phong Nha Cave",
        "description": "A famous river cave in Phong Nha - Ke Bang National Park, known for limestone formations and boat access through underground chambers.",
        "category": "cave",
        "address": "Phong Nha, Bo Trach District, Quang Binh",
        "latitude": Decimal("17.610000"),
        "longitude": Decimal("106.310000"),
    },
    {
        "name": "Paradise Cave",
        "description": "A spectacular dry cave with long wooden walkways, dramatic stalactites, and one of the most accessible cave experiences in the national park.",
        "category": "cave",
        "address": "Son Trach, Bo Trach District, Quang Binh",
        "latitude": Decimal("17.518700"),
        "longitude": Decimal("106.225900"),
    },
    {
        "name": "Dark Cave",
        "description": "Adventure cave destination offering zipline access, kayaking, swimming, and mud bath activities near the Chay River.",
        "category": "cave",
        "address": "Son Trach, Bo Trach District, Quang Binh",
        "latitude": Decimal("17.582800"),
        "longitude": Decimal("106.267700"),
    },
    {
        "name": "Son Doong Cave",
        "description": "The world's largest known cave passage, located in Phong Nha - Ke Bang National Park and visited through limited expedition tours.",
        "category": "cave",
        "address": "Tan Trach, Bo Trach District, Quang Binh",
        "latitude": Decimal("17.456900"),
        "longitude": Decimal("106.287100"),
    },
    {
        "name": "Nhat Le Beach",
        "description": "A long sandy beach in Dong Hoi, popular for sunrise walks, swimming, seafood restaurants, and easy city access.",
        "category": "beach",
        "address": "Truong Phap Street, Dong Hoi City, Quang Binh",
        "latitude": Decimal("17.486700"),
        "longitude": Decimal("106.624800"),
    },
    {
        "name": "Bao Ninh Beach",
        "description": "A quiet coastal area across the Nhat Le River from Dong Hoi, with open sea views and resort-style stays.",
        "category": "beach",
        "address": "Bao Ninh Peninsula, Dong Hoi City, Quang Binh",
        "latitude": Decimal("17.463800"),
        "longitude": Decimal("106.634500"),
    },
    {
        "name": "Quang Phu Sand Dunes",
        "description": "Rolling white sand dunes north of Dong Hoi, best visited in early morning or late afternoon for cooler weather and softer light.",
        "category": "nature",
        "address": "Quang Phu, Dong Hoi City, Quang Binh",
        "latitude": Decimal("17.535900"),
        "longitude": Decimal("106.604100"),
    },
    {
        "name": "Mooc Spring Eco Trail",
        "description": "Forest spring destination with turquoise water, bamboo bridges, swimming areas, and relaxed nature activities.",
        "category": "nature",
        "address": "Phuc Trach, Bo Trach District, Quang Binh",
        "latitude": Decimal("17.587000"),
        "longitude": Decimal("106.280500"),
    },
    {
        "name": "Botanic Garden Phong Nha",
        "description": "Nature attraction in Phong Nha - Ke Bang with forest trails, waterfalls, wildlife rescue exhibits, and viewpoints.",
        "category": "nature",
        "address": "Son Trach, Bo Trach District, Quang Binh",
        "latitude": Decimal("17.541800"),
        "longitude": Decimal("106.306800"),
    },
    {
        "name": "Vung Chua - Yen Island",
        "description": "Coastal historical and spiritual site near the grave of General Vo Nguyen Giap, with views toward Yen Island.",
        "category": "historical",
        "address": "Quang Dong, Quang Trach District, Quang Binh",
        "latitude": Decimal("17.953400"),
        "longitude": Decimal("106.513700"),
    },
    {
        "name": "Dong Hoi Citadel",
        "description": "Historical remains of the old Dong Hoi defensive citadel, located near the city center and Nhat Le River.",
        "category": "historical",
        "address": "Hai Dinh Ward, Dong Hoi City, Quang Binh",
        "latitude": Decimal("17.467600"),
        "longitude": Decimal("106.622300"),
    },
    {
        "name": "Tam Toa Church Ruins",
        "description": "War-damaged church bell tower preserved as a historical landmark beside the Nhat Le River in Dong Hoi.",
        "category": "historical",
        "address": "Dong Hai Ward, Dong Hoi City, Quang Binh",
        "latitude": Decimal("17.478300"),
        "longitude": Decimal("106.625700"),
    },
    {
        "name": "Me Suot Monument",
        "description": "Memorial honoring Mother Suot, a local wartime heroine known for ferrying soldiers and supplies across the Nhat Le River.",
        "category": "historical",
        "address": "Dong Hai Ward, Dong Hoi City, Quang Binh",
        "latitude": Decimal("17.480700"),
        "longitude": Decimal("106.627400"),
    },
    {
        "name": "Chao Canh Dong Hoi",
        "description": "A signature Quang Binh noodle soup experience, commonly served with fish, pork, herbs, and a rich local broth.",
        "category": "food",
        "address": "Dong Hoi City, Quang Binh",
        "latitude": Decimal("17.468900"),
        "longitude": Decimal("106.622200"),
    },
    {
        "name": "Banh Loc Quang Binh",
        "description": "Local tapioca dumplings filled with shrimp and pork, often served with fish sauce and herbs around Dong Hoi markets.",
        "category": "food",
        "address": "Dong Hoi City, Quang Binh",
        "latitude": Decimal("17.470200"),
        "longitude": Decimal("106.621900"),
    },
    {
        "name": "Sun Spa Resort",
        "description": "Beachfront resort on Bao Ninh Peninsula with access to Nhat Le Beach, pools, gardens, and leisure facilities.",
        "category": "resort",
        "address": "My Canh, Bao Ninh, Dong Hoi City, Quang Binh",
        "latitude": Decimal("17.473800"),
        "longitude": Decimal("106.636100"),
    },
    {
        "name": "Melia Vinpearl Quang Binh",
        "description": "City hotel and resort-style stay near the Nhat Le River, convenient for Dong Hoi dining and transport.",
        "category": "resort",
        "address": "Quach Xuan Ky Street, Dong Hoi City, Quang Binh",
        "latitude": Decimal("17.466500"),
        "longitude": Decimal("106.623600"),
    },
]


def seed_places() -> None:
    init_db()

    with SessionLocal() as db:
        created = 0
        updated = 0

        for place_data in PLACES:
            existing_place = db.scalar(select(Place).where(Place.name == place_data["name"]))
            payload = {
                **place_data,
                "images": [IMAGE_PLACEHOLDER],
                "rating_avg": Decimal("0.00"),
            }

            if existing_place:
                for field, value in payload.items():
                    setattr(existing_place, field, value)
                updated += 1
            else:
                db.add(Place(**payload))
                created += 1

        db.commit()

    print(f"Seeded Quang Binh places: {created} created, {updated} updated.")


if __name__ == "__main__":
    seed_places()
1