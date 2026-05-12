# QuangBinhGo - Project Rules

## Project Goal
Build a tourism website for Quang Binh with mini social features and AI-powered travel discovery.

## Tech Stack
- Frontend: ReactJS + Vite + TailwindCSS + Shadcn UI
- Backend: FastAPI
- Database: PostgreSQL
- Image Upload: Cloudinary
- AI: Sentence Transformers + Pinecone

## Architecture Rules
- Backend must follow clean architecture
- Do not put business logic directly in routes
- Separate routes, schemas, services, repositories, models
- Use environment variables for secrets
- Write clear error handling
- Do not modify unrelated files

## Backend Structure
backend/
├── app/
│   ├── main.py
│   ├── core/
│   ├── models/
│   ├── schemas/
│   ├── api/
│   ├── services/
│   ├── repositories/
│   └── db/

## Frontend Structure
frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   ├── services/
│   ├── hooks/
│   └── lib/

## Features
MVP first:
1. Auth
2. Places CRUD
3. Review posts
4. Upload images
5. Like/comment/save
6. Community feed
7. Admin dashboard
8. Semantic search
9. AI itinerary generator

## Commands
- Backend run: uvicorn app.main:app --reload
- Frontend run: npm run dev
- Backend test: pytest

## Codex Rules
Before coding:
- Analyze current structure
- Create a short implementation plan
- Ask before changing architecture

After coding:
- Explain changed files
- Explain how to run/test
