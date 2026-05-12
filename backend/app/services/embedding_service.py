from functools import lru_cache

from sentence_transformers import SentenceTransformer

from app.core.config import settings


@lru_cache
def get_embedding_model() -> SentenceTransformer:
    return SentenceTransformer(settings.sentence_transformer_model)


class EmbeddingService:
    def embed_text(self, text: str) -> list[float]:
        embedding = get_embedding_model().encode(text, normalize_embeddings=True)
        return embedding.tolist()
