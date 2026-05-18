import re

from fastapi import HTTPException, status

SCRIPT_RE = re.compile(r"<\s*/?\s*script[^>]*>", re.IGNORECASE)
HTML_EVENT_RE = re.compile(r"\son\w+\s*=", re.IGNORECASE)
LINK_RE = re.compile(r"https?://|www\.", re.IGNORECASE)
REPEATED_RE = re.compile(r"(.)\1{12,}")


def sanitize_user_text(value: str) -> str:
    cleaned = SCRIPT_RE.sub("", value)
    cleaned = HTML_EVENT_RE.sub(" ", cleaned)
    return cleaned.strip()


def validate_not_spam(value: str) -> str:
    text = sanitize_user_text(value)
    if not text:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Content is required.")
    if len(LINK_RE.findall(text)) > 3:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Too many links in content.")
    if REPEATED_RE.search(text):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Content looks like spam.")
    return text
