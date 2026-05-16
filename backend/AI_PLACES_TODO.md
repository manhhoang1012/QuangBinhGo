# AI Places Semantic Search TODO

The public endpoint `GET /api/v1/places/semantic-search?q=...` currently uses a safe keyword fallback so the frontend can integrate without breaking.

To make it true semantic search:

1. Build a place document from `name + description + category + tags + address`.
2. Generate embeddings with the configured sentence-transformer model.
3. Store vectors in Pinecone, pgvector, or FAISS.
4. Re-index places whenever admin creates or updates a place.
5. Replace the keyword fallback in `app/api/v1/routes/places.py` with vector similarity lookup.
6. Return the same `PlaceRead` response shape so the frontend does not need another rewrite.
