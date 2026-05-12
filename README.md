# QuangBinhGo

Tourism discovery website for Quang Binh with mini social community features and AI-powered travel planning.

This repository is currently scaffolded as a production-ready foundation. Feature implementation is intentionally minimal.

## Stack

- Frontend: React, Vite, TailwindCSS, Shadcn UI-ready structure
- Backend: FastAPI
- Database: PostgreSQL
- Image upload: Cloudinary
- AI discovery: Sentence Transformers and Pinecone

## Project Structure

```text
backend/
  app/
    api/
    core/
    db/
    models/
    repositories/
    schemas/
    services/
    main.py
frontend/
  src/
    components/
    hooks/
    layouts/
    lib/
    pages/
    services/
docs/
scripts/
```

## Prerequisites

- Python 3.11+
- Node.js 20+
- Docker Desktop

## Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Update values in `.env` for your local machine and service credentials.

## Database

Start PostgreSQL:

```bash
docker compose up -d postgres
```

The default local database is:

- Host: `localhost`
- Port: `5432`
- Database: `quangbinhgo`
- User: `quangbinhgo`
- Password: `quangbinhgo`

## Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

On Windows PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend health check:

```bash
curl http://localhost:8000/health
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173` by default.

## Development Commands

- Backend run: `uvicorn app.main:app --reload`
- Backend test: `pytest`
- Frontend run: `npm run dev`
- Frontend build: `npm run build`
- Frontend lint: `npm run lint`

## Notes

- Keep business logic out of FastAPI routes.
- Add feature code through schemas, services, repositories, and models.
- Store secrets in environment variables only.
- Do not commit `.env`, virtual environments, build outputs, or dependency caches.
