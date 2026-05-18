import json
import logging
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiService:
    def __init__(self) -> None:
        self.model_name = settings.gemini_model or "gemini-2.5-flash"
        self._model = None
        if not settings.gemini_api_key:
            logger.info("GEMINI_API_KEY is not configured. AI endpoints will use fallback logic.")
            return
        try:
            import google.generativeai as genai

            genai.configure(api_key=settings.gemini_api_key)
            self._model = genai.GenerativeModel(self.model_name)
        except Exception as exc:
            logger.exception("Could not initialize Gemini client: %s", exc)
            self._model = None

    @property
    def available(self) -> bool:
        return self._model is not None

    def generate_text(self, prompt: str, *, max_output_tokens: int = 1200) -> str | None:
        if not self._model:
            return None
        try:
            response = self._model.generate_content(
                prompt,
                generation_config={
                    "temperature": 0.4,
                    "max_output_tokens": max_output_tokens,
                },
                request_options={"timeout": 20},
            )
            return (getattr(response, "text", "") or "").strip()
        except Exception as exc:
            logger.warning("Gemini text generation failed: %s", exc)
            return None

    def generate_json(self, prompt: str, *, fallback: Any, max_output_tokens: int = 1600) -> Any:
        text = self.generate_text(
            prompt + "\n\nReturn only valid JSON. Do not wrap it in markdown.",
            max_output_tokens=max_output_tokens,
        )
        if not text:
            return fallback
        try:
            cleaned = text.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.strip("`")
                cleaned = cleaned.removeprefix("json").strip()
            return json.loads(cleaned)
        except Exception as exc:
            logger.warning("Gemini JSON parse failed: %s; raw=%s", exc, text[:500])
            return fallback


gemini_service = GeminiService()
