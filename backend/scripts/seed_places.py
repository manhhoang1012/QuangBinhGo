from __future__ import annotations

from decimal import Decimal
from pathlib import Path
import re
import sys
import unicodedata

from sqlalchemy import select

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from app.db.init_db import init_db
from app.db.session import SessionLocal
from app.models.place import Place
from app.schemas.place import PlaceCreate


PLACEHOLDER = "https://placehold.co/1200x800/png?text=QuangBinhGo"


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_value).strip("-").lower()
    return slug or "quang-binh-place"


PLACES: list[PlaceCreate] = [
    PlaceCreate(
        name="Vườn quốc gia Phong Nha - Kẻ Bàng",
        slug="vuon-quoc-gia-phong-nha-ke-bang",
        description=(
            "Vườn quốc gia Phong Nha - Kẻ Bàng là di sản thiên nhiên thế giới nổi bật với hệ thống núi đá vôi, rừng nguyên sinh và hàng trăm hang động. "
            "Đây là trung tâm của du lịch Quảng Bình, phù hợp cho khám phá thiên nhiên, trekking và nghỉ dưỡng sinh thái. "
            "Du khách nên dành ít nhất một ngày để cảm nhận trọn vẹn cảnh quan sông, núi và hang động nơi đây."
        ),
        category="nature",
        tags=["Thiên nhiên", "Gia đình", "Phượt"],
        address="Sơn Trạch, Bố Trạch, Quảng Bình",
        latitude=Decimal("17.537500"),
        longitude=Decimal("106.151200"),
        images=[PLACEHOLDER],
        videos=[],
        opening_hours="07:00 - 17:00",
        ticket_price="Tùy tuyến tham quan",
        price_min=Decimal("0"),
        price_max=Decimal("250000"),
        contact_phone="Đang cập nhật",
        website_url="https://phongnhakebang.vn",
        rating_avg=Decimal("4.9"),
        review_count=0,
        status="published",
    ),
    PlaceCreate(
        name="Động Thiên Đường",
        slug="dong-thien-duong",
        description=(
            "Động Thiên Đường được mệnh danh là hoàng cung trong lòng đất với hệ thống thạch nhũ tráng lệ và lối đi gỗ thuận tiện. "
            "Không gian bên trong rộng lớn, mát mẻ và tạo cảm giác choáng ngợp ngay từ những bước đầu tiên. "
            "Đây là lựa chọn dễ tiếp cận cho du khách muốn chiêm ngưỡng vẻ đẹp hang động mà không cần tour mạo hiểm."
        ),
        category="cave",
        tags=["Hang động", "Gia đình", "Check-in"],
        address="Sơn Trạch, Bố Trạch, Quảng Bình",
        latitude=Decimal("17.518700"),
        longitude=Decimal("106.225900"),
        images=[PLACEHOLDER],
        videos=[],
        opening_hours="07:00 - 16:30",
        ticket_price="Khoảng 250.000đ/người lớn",
        price_min=Decimal("250000"),
        price_max=Decimal("250000"),
        contact_phone="Đang cập nhật",
        rating_avg=Decimal("4.9"),
        review_count=0,
        status="published",
    ),
    PlaceCreate(
        name="Hang Sơn Đoòng",
        slug="hang-son-doong",
        description=(
            "Hang Sơn Đoòng là hang động tự nhiên lớn hàng đầu thế giới, nằm sâu trong vùng lõi Phong Nha - Kẻ Bàng. "
            "Bên trong hang có sông ngầm, hố sụt, rừng nguyên sinh và những khối thạch nhũ khổng lồ. "
            "Việc tham quan cần đăng ký tour thám hiểm chuyên nghiệp, phù hợp với người có thể lực tốt và yêu thiên nhiên hoang sơ."
        ),
        category="cave",
        tags=["Hang động", "Phượt", "Thiên nhiên"],
        address="Tân Trạch, Bố Trạch, Quảng Bình",
        latitude=Decimal("17.456900"),
        longitude=Decimal("106.287100"),
        images=[PLACEHOLDER],
        videos=[],
        opening_hours="Theo lịch tour khai thác",
        ticket_price="Theo tour chuyên biệt",
        price_min=Decimal("0"),
        price_max=None,
        contact_phone="Đang cập nhật",
        website_url="https://oxalisadventure.com",
        rating_avg=Decimal("5.0"),
        review_count=0,
        status="published",
    ),
    PlaceCreate(
        name="Biển Nhật Lệ",
        slug="bien-nhat-le",
        description=(
            "Biển Nhật Lệ nằm ngay trung tâm thành phố Đồng Hới, nổi tiếng với bãi cát dài, nước biển trong và không gian thoáng đãng. "
            "Du khách thường đến đây để tắm biển, ngắm bình minh và thưởng thức hải sản ven biển. "
            "Vị trí thuận tiện giúp Nhật Lệ trở thành điểm dừng gần như không thể bỏ qua khi đến Quảng Bình."
        ),
        category="beach",
        tags=["Biển", "Gần trung tâm", "Gia đình"],
        address="Đường Trương Pháp, Đồng Hới, Quảng Bình",
        latitude=Decimal("17.486700"),
        longitude=Decimal("106.624800"),
        images=[PLACEHOLDER],
        videos=[],
        opening_hours="Mở cửa cả ngày",
        ticket_price="Miễn phí",
        price_min=Decimal("0"),
        price_max=Decimal("0"),
        contact_phone="Đang cập nhật",
        rating_avg=Decimal("4.6"),
        review_count=0,
        status="published",
    ),
    PlaceCreate(
        name="Suối Nước Moọc",
        slug="suoi-nuoc-mooc",
        description=(
            "Suối Nước Moọc là điểm du lịch sinh thái có làn nước xanh trong, rừng cây rợp bóng và các cây cầu tre mộc mạc. "
            "Du khách có thể tắm suối, chèo kayak, nghỉ ngơi hoặc kết hợp tham quan các điểm gần Sông Chày - Hang Tối. "
            "Không khí ở đây trong lành, rất hợp cho một buổi thư giãn giữa thiên nhiên."
        ),
        category="nature",
        tags=["Thiên nhiên", "Gia đình", "Check-in"],
        address="Phúc Trạch, Bố Trạch, Quảng Bình",
        latitude=Decimal("17.587000"),
        longitude=Decimal("106.280500"),
        images=[PLACEHOLDER],
        videos=[],
        opening_hours="08:00 - 17:00",
        ticket_price="Có phí dịch vụ theo gói",
        price_min=Decimal("80000"),
        price_max=Decimal("180000"),
        contact_phone="Đang cập nhật",
        rating_avg=Decimal("4.6"),
        review_count=0,
        status="published",
    ),
    PlaceCreate(
        name="Đồi cát Quang Phú",
        slug="doi-cat-quang-phu",
        description=(
            "Đồi cát Quang Phú nằm gần thành phố Đồng Hới, nổi bật với những triền cát trắng uốn lượn theo gió. "
            "Đây là địa điểm lý tưởng để chụp ảnh, trượt cát và ngắm cảnh vào lúc bình minh hoặc hoàng hôn. "
            "Không gian rộng mở tạo cảm giác rất khác biệt so với các điểm hang động và biển."
        ),
        category="nature",
        tags=["Check-in", "Gần trung tâm", "Phượt"],
        address="Quang Phú, Đồng Hới, Quảng Bình",
        latitude=Decimal("17.535900"),
        longitude=Decimal("106.604100"),
        images=[PLACEHOLDER],
        videos=[],
        opening_hours="Mở cửa cả ngày",
        ticket_price="Miễn phí",
        price_min=Decimal("0"),
        price_max=Decimal("0"),
        contact_phone="Đang cập nhật",
        rating_avg=Decimal("4.4"),
        review_count=0,
        status="published",
    ),
    PlaceCreate(
        name="Vũng Chùa - Đảo Yến",
        slug="vung-chua-dao-yen",
        description=(
            "Vũng Chùa - Đảo Yến là điểm đến ven biển gắn với khu mộ Đại tướng Võ Nguyên Giáp và cảnh quan biển đảo thanh bình. "
            "Từ khu vực này, du khách có thể nhìn ra Đảo Yến và cảm nhận không khí trang nghiêm, tĩnh lặng. "
            "Đây là nơi phù hợp cho hành trình tìm hiểu lịch sử, văn hóa và tri ân."
        ),
        category="historical",
        tags=["Lịch sử", "Biển", "Gia đình"],
        address="Quảng Đông, Quảng Trạch, Quảng Bình",
        latitude=Decimal("17.953400"),
        longitude=Decimal("106.513700"),
        images=[PLACEHOLDER],
        videos=[],
        opening_hours="07:00 - 17:00",
        ticket_price="Miễn phí",
        price_min=Decimal("0"),
        price_max=Decimal("0"),
        contact_phone="Đang cập nhật",
        rating_avg=Decimal("4.8"),
        review_count=0,
        status="published",
    ),
    PlaceCreate(
        name="Làng bích họa Cảnh Dương",
        slug="lang-bich-hoa-canh-duong",
        description=(
            "Làng bích họa Cảnh Dương là làng biển lâu đời được làm mới bằng những bức tranh tường kể chuyện đời sống ngư dân. "
            "Các con ngõ nhỏ, nhà cổ và không khí làng chài tạo nên trải nghiệm văn hóa gần gũi. "
            "Đây là điểm đến phù hợp cho du khách thích đi bộ, chụp ảnh và tìm hiểu nhịp sống địa phương."
        ),
        category="cultural",
        tags=["Check-in", "Biển", "Gia đình"],
        address="Cảnh Dương, Quảng Trạch, Quảng Bình",
        latitude=Decimal("17.871300"),
        longitude=Decimal("106.452900"),
        images=[PLACEHOLDER],
        videos=[],
        opening_hours="Mở cửa cả ngày",
        ticket_price="Miễn phí",
        price_min=Decimal("0"),
        price_max=Decimal("0"),
        contact_phone="Đang cập nhật",
        rating_avg=Decimal("4.5"),
        review_count=0,
        status="published",
    ),
]


def seed_places() -> None:
    init_db()

    with SessionLocal() as db:
        created = 0
        updated = 0

        for place_create in PLACES:
            place_data = place_create.model_dump()
            place_data["slug"] = place_data.get("slug") or slugify(place_create.name)
            existing_place = db.scalar(select(Place).where(Place.name == place_create.name))

            if existing_place:
                for field, value in place_data.items():
                    setattr(existing_place, field, value)
                updated += 1
            else:
                db.add(Place(**place_data))
                created += 1

        db.commit()

    total = len(PLACES)
    print("QuangBinhGo public place seed completed.")
    print(f"{created} places created, {updated} places updated, {total} places processed.")
    print("Open the public Places page to test search, filters, nearby sorting, gallery, map, and related places.")


if __name__ == "__main__":
    seed_places()
