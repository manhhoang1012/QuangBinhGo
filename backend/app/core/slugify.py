import re
import unicodedata


def slugify(value: str, *, fallback: str = "item") -> str:
    normalized = unicodedata.normalize("NFKD", (value or "").replace("đ", "d").replace("Đ", "D"))
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_value).strip("-").lower()
    return slug or fallback
