from functools import lru_cache

from app.core.config import settings


@lru_cache
def get_embedding_model():
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(settings.sentence_transformer_model)


class EmbeddingService:
    def embed_text(self, text: str) -> list[float]:
        embedding = get_embedding_model().encode(text, normalize_embeddings=True)
        return embedding.tolist()
