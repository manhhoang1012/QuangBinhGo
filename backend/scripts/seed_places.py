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
from app.schemas.place import PlaceCreate


IMAGE_PLACEHOLDER = "https://placehold.co/1200x800/png?text=QuangBinhGo"

PLACES: list[PlaceCreate] = [
    PlaceCreate(
        name="Vườn quốc gia Phong Nha - Kẻ Bàng",
        description=(
            "Vườn quốc gia Phong Nha - Kẻ Bàng là di sản thiên nhiên thế giới nổi tiếng với hệ thống núi đá vôi, rừng nguyên sinh và hàng trăm hang động kỳ vĩ. "
            "Đây là điểm đến trung tâm của du lịch Quảng Bình, phù hợp cho cả khám phá thiên nhiên, trekking và nghỉ dưỡng sinh thái. "
            "Du khách nên dành ít nhất một ngày để cảm nhận trọn vẹn cảnh quan sông, núi và hang động nơi đây."
        ),
        category="nature",
        address="Sơn Trạch, Bố Trạch, Quảng Bình",
        latitude=Decimal("17.537500"),
        longitude=Decimal("106.151200"),
        images=[IMAGE_PLACEHOLDER],
        rating_avg=Decimal("4.9"),
    ),
    PlaceCreate(
        name="Động Phong Nha",
        description=(
            "Động Phong Nha là một trong những hang động tiêu biểu nhất của Quảng Bình, nổi bật với dòng sông ngầm và các khối thạch nhũ nhiều hình dáng. "
            "Hành trình tham quan bằng thuyền đưa du khách đi sâu vào không gian mát lạnh, yên tĩnh và huyền ảo. "
            "Đây là lựa chọn dễ tiếp cận cho gia đình và du khách lần đầu đến Phong Nha."
        ),
        category="cave",
        address="Sơn Trạch, Bố Trạch, Quảng Bình",
        latitude=Decimal("17.610000"),
        longitude=Decimal("106.310000"),
        images=[IMAGE_PLACEHOLDER],
        rating_avg=Decimal("4.8"),
    ),
    PlaceCreate(
        name="Động Thiên Đường",
        description=(
            "Động Thiên Đường được mệnh danh là hoàng cung trong lòng đất với hệ thống thạch nhũ tráng lệ và lối đi gỗ thuận tiện. "
            "Không gian bên trong rộng lớn, mát mẻ, tạo cảm giác choáng ngợp ngay từ những bước đầu tiên. "
            "Điểm đến này rất phù hợp với du khách muốn chiêm ngưỡng vẻ đẹp hang động mà không cần tour mạo hiểm."
        ),
        category="cave",
        address="Sơn Trạch, Bố Trạch, Quảng Bình",
        latitude=Decimal("17.518700"),
        longitude=Decimal("106.225900"),
        images=[IMAGE_PLACEHOLDER],
        rating_avg=Decimal("4.9"),
    ),
    PlaceCreate(
        name="Hang Sơn Đoòng",
        description=(
            "Hang Sơn Đoòng là hang động tự nhiên lớn hàng đầu thế giới, nằm sâu trong vùng lõi Phong Nha - Kẻ Bàng. "
            "Bên trong hang có sông ngầm, hố sụt, rừng nguyên sinh và những khối thạch nhũ khổng lồ. "
            "Việc tham quan cần đăng ký tour thám hiểm chuyên nghiệp, phù hợp với người có thể lực tốt và yêu thiên nhiên hoang sơ."
        ),
        category="cave",
        address="Tân Trạch, Bố Trạch, Quảng Bình",
        latitude=Decimal("17.456900"),
        longitude=Decimal("106.287100"),
        images=[IMAGE_PLACEHOLDER],
        rating_avg=Decimal("5.0"),
    ),
    PlaceCreate(
        name="Hang Én",
        description=(
            "Hang Én là một trong những hang động lớn và đẹp của Quảng Bình, thường được biết đến như điểm dừng trên cung đường thám hiểm Sơn Đoòng. "
            "Cửa hang rộng, bãi cát trong hang và dòng nước xanh tạo nên khung cảnh rất ấn tượng. "
            "Đây là lựa chọn đáng cân nhắc cho du khách yêu trekking và cắm trại."
        ),
        category="cave",
        address="Tân Trạch, Bố Trạch, Quảng Bình",
        latitude=Decimal("17.466700"),
        longitude=Decimal("106.315000"),
        images=[IMAGE_PLACEHOLDER],
        rating_avg=Decimal("4.9"),
    ),
    PlaceCreate(
        name="Hang Tú Làn",
        description=(
            "Hang Tú Làn thuộc hệ thống hang động ở khu vực Minh Hóa, nổi tiếng với các cung trekking, bơi trong hang và cắm trại giữa thiên nhiên. "
            "Cảnh quan nơi đây kết hợp giữa thung lũng, suối, núi đá vôi và những hang động còn nguyên nét hoang sơ. "
            "Đây là điểm đến phù hợp với nhóm bạn trẻ và du khách thích hoạt động ngoài trời."
        ),
        category="cave",
        address="Tân Hóa, Minh Hóa, Quảng Bình",
        latitude=Decimal("17.758000"),
        longitude=Decimal("105.934000"),
        images=[IMAGE_PLACEHOLDER],
        rating_avg=Decimal("4.8"),
    ),
    PlaceCreate(
        name="Suối Nước Moọc",
        description=(
            "Suối Nước Moọc là điểm du lịch sinh thái có làn nước xanh trong, rừng cây rợp bóng và các cây cầu tre mộc mạc. "
            "Du khách có thể tắm suối, chèo kayak, nghỉ ngơi hoặc kết hợp tham quan các điểm gần Sông Chày - Hang Tối. "
            "Không khí ở đây trong lành, rất hợp cho một buổi thư giãn giữa thiên nhiên."
        ),
        category="nature",
        address="Phúc Trạch, Bố Trạch, Quảng Bình",
        latitude=Decimal("17.587000"),
        longitude=Decimal("106.280500"),
        images=[IMAGE_PLACEHOLDER],
        rating_avg=Decimal("4.6"),
    ),
    PlaceCreate(
        name="Sông Chày - Hang Tối",
        description=(
            "Sông Chày - Hang Tối là khu du lịch mạo hiểm nổi bật với zipline, chèo kayak, tắm sông và trải nghiệm bùn khoáng trong hang. "
            "Màu nước xanh ngọc cùng khung cảnh núi rừng tạo nên một ngày vui chơi nhiều năng lượng. "
            "Điểm này đặc biệt phù hợp với nhóm bạn và du khách thích vận động."
        ),
        category="nature",
        address="Sơn Trạch, Bố Trạch, Quảng Bình",
        latitude=Decimal("17.582800"),
        longitude=Decimal("106.267700"),
        images=[IMAGE_PLACEHOLDER],
        rating_avg=Decimal("4.7"),
    ),
    PlaceCreate(
        name="Biển Nhật Lệ",
        description=(
            "Biển Nhật Lệ nằm ngay trung tâm thành phố Đồng Hới, nổi tiếng với bãi cát dài, nước biển trong và không gian thoáng đãng. "
            "Du khách thường đến đây để tắm biển, ngắm bình minh và thưởng thức hải sản ven biển. "
            "Vị trí thuận tiện giúp Nhật Lệ trở thành điểm dừng gần như không thể bỏ qua khi đến Quảng Bình."
        ),
        category="beach",
        address="Đường Trương Pháp, Đồng Hới, Quảng Bình",
        latitude=Decimal("17.486700"),
        longitude=Decimal("106.624800"),
        images=[IMAGE_PLACEHOLDER],
        rating_avg=Decimal("4.6"),
    ),
    PlaceCreate(
        name="Biển Bảo Ninh",
        description=(
            "Biển Bảo Ninh nằm trên bán đảo Bảo Ninh, đối diện trung tâm Đồng Hới qua sông Nhật Lệ. "
            "Bãi biển rộng, yên tĩnh hơn khu Nhật Lệ và phù hợp cho nghỉ dưỡng, dạo biển hoặc ngắm hoàng hôn. "
            "Khu vực này cũng có nhiều resort và quán hải sản phục vụ du khách."
        ),
        category="beach",
        address="Bảo Ninh, Đồng Hới, Quảng Bình",
        latitude=Decimal("17.463800"),
        longitude=Decimal("106.634500"),
        images=[IMAGE_PLACEHOLDER],
        rating_avg=Decimal("4.5"),
    ),
    PlaceCreate(
        name="Biển Đá Nhảy",
        description=(
            "Biển Đá Nhảy gây ấn tượng với những khối đá tự nhiên nhiều hình thù nằm sát mép sóng. "
            "Nơi đây vừa có vẻ đẹp hoang sơ của biển, vừa có những góc chụp ảnh độc đáo khác với các bãi tắm thông thường. "
            "Du khách nên ghé vào sáng sớm hoặc chiều muộn để có ánh sáng đẹp và thời tiết dễ chịu."
        ),
        category="beach",
        address="Thanh Trạch, Bố Trạch, Quảng Bình",
        latitude=Decimal("17.690400"),
        longitude=Decimal("106.505700"),
        images=[IMAGE_PLACEHOLDER],
        rating_avg=Decimal("4.5"),
    ),
    PlaceCreate(
        name="Vũng Chùa - Đảo Yến",
        description=(
            "Vũng Chùa - Đảo Yến là điểm đến ven biển gắn với khu mộ Đại tướng Võ Nguyên Giáp và cảnh quan biển đảo thanh bình. "
            "Từ khu vực này, du khách có thể nhìn ra Đảo Yến và cảm nhận không khí trang nghiêm, tĩnh lặng. "
            "Đây là nơi phù hợp cho hành trình tìm hiểu lịch sử, văn hóa và tri ân."
        ),
        category="historical",
        address="Quảng Đông, Quảng Trạch, Quảng Bình",
        latitude=Decimal("17.953400"),
        longitude=Decimal("106.513700"),
        images=[IMAGE_PLACEHOLDER],
        rating_avg=Decimal("4.8"),
    ),
    PlaceCreate(
        name="Đồi cát Quang Phú",
        description=(
            "Đồi cát Quang Phú nằm gần thành phố Đồng Hới, nổi bật với những triền cát trắng uốn lượn theo gió. "
            "Đây là địa điểm lý tưởng để chụp ảnh, trượt cát và ngắm cảnh vào lúc bình minh hoặc hoàng hôn. "
            "Không gian rộng mở tạo cảm giác rất khác biệt so với các điểm hang động và biển."
        ),
        category="nature",
        address="Quang Phú, Đồng Hới, Quảng Bình",
        latitude=Decimal("17.535900"),
        longitude=Decimal("106.604100"),
        images=[IMAGE_PLACEHOLDER],
        rating_avg=Decimal("4.4"),
    ),
    PlaceCreate(
        name="Bàu Tró",
        description=(
            "Bàu Tró là hồ nước ngọt tự nhiên nằm gần biển Nhật Lệ, gắn với nhiều giá trị khảo cổ và đời sống của người dân Đồng Hới. "
            "Không gian quanh hồ yên bình, thích hợp để đi dạo, ngắm cảnh và tìm hiểu thêm về lịch sử địa phương. "
            "Đây là một điểm dừng nhẹ nhàng khi khám phá trung tâm thành phố."
        ),
        category="historical",
        address="Hải Thành, Đồng Hới, Quảng Bình",
        latitude=Decimal("17.489700"),
        longitude=Decimal("106.618900"),
        images=[IMAGE_PLACEHOLDER],
        rating_avg=Decimal("4.2"),
    ),
    PlaceCreate(
        name="Quảng Bình Quan",
        description=(
            "Quảng Bình Quan là công trình thành lũy cổ nằm ở trung tâm Đồng Hới, gắn với hệ thống phòng thủ thời chúa Nguyễn. "
            "Di tích này mang dấu ấn lịch sử rõ nét và là biểu tượng quen thuộc của thành phố. "
            "Du khách có thể ghé nhanh để chụp ảnh và kết hợp tham quan các điểm lân cận."
        ),
        category="historical",
        address="Phường Đồng Hải, Đồng Hới, Quảng Bình",
        latitude=Decimal("17.467600"),
        longitude=Decimal("106.622300"),
        images=[IMAGE_PLACEHOLDER],
        rating_avg=Decimal("4.3"),
    ),
    PlaceCreate(
        name="Làng bích họa Cảnh Dương",
        description=(
            "Làng bích họa Cảnh Dương là làng biển lâu đời được làm mới bằng những bức tranh tường kể chuyện đời sống ngư dân. "
            "Các con ngõ nhỏ, nhà cổ và không khí làng chài tạo nên trải nghiệm văn hóa gần gũi. "
            "Đây là điểm đến phù hợp cho du khách thích đi bộ, chụp ảnh và tìm hiểu nhịp sống địa phương."
        ),
        category="cultural",
        address="Cảnh Dương, Quảng Trạch, Quảng Bình",
        latitude=Decimal("17.871300"),
        longitude=Decimal("106.452900"),
        images=[IMAGE_PLACEHOLDER],
        rating_avg=Decimal("4.5"),
    ),
    PlaceCreate(
        name="Suối nước nóng Bang",
        description=(
            "Suối nước nóng Bang là nguồn khoáng nóng tự nhiên nổi tiếng ở huyện Lệ Thủy, có nhiệt độ cao và cảnh quan núi rừng bao quanh. "
            "Khu vực này phù hợp cho nghỉ dưỡng, chăm sóc sức khỏe và kết hợp khám phá phía nam Quảng Bình. "
            "Sau khi được đầu tư dịch vụ, nơi đây trở thành điểm thư giãn đáng chú ý cho du khách."
        ),
        category="resort",
        address="Kim Thủy, Lệ Thủy, Quảng Bình",
        latitude=Decimal("17.084300"),
        longitude=Decimal("106.725300"),
        images=[IMAGE_PLACEHOLDER],
        rating_avg=Decimal("4.6"),
    ),
    PlaceCreate(
        name="Chợ Đồng Hới",
        description=(
            "Chợ Đồng Hới là khu chợ trung tâm của thành phố, nơi du khách có thể cảm nhận nhịp sống địa phương và tìm nhiều món đặc sản Quảng Bình. "
            "Các món như bánh lọc, cháo canh, hải sản khô và quà mang về được bày bán khá phong phú. "
            "Đây là điểm dừng hợp lý cho hành trình khám phá ẩm thực và mua quà."
        ),
        category="food",
        address="Mẹ Suốt, Đồng Hới, Quảng Bình",
        latitude=Decimal("17.468900"),
        longitude=Decimal("106.625900"),
        images=[IMAGE_PLACEHOLDER],
        rating_avg=Decimal("4.4"),
    ),
]


def seed_places() -> None:
    init_db()

    with SessionLocal() as db:
        created = 0
        updated = 0

        for place_create in PLACES:
            place_data = place_create.model_dump()
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
    print("QuangBinhGo place seed completed.")
    print(f"{created} places created, {updated} places updated, {total} places processed.")
    print("You can now open the Places page and filter/search these Quang Binh destinations.")


if __name__ == "__main__":
    seed_places()
