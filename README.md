# QuangBinhGo

QuangBinhGo is a Quang Binh tourism discovery website with mini social features, place reviews/ratings, admin moderation, settings management, and early AI search/planning hooks.

## Stack

- Frontend: React, Vite, TailwindCSS, Shadcn-style local UI components
- Backend: FastAPI, SQLAlchemy
- Database: PostgreSQL
- Maps: React Leaflet + OpenStreetMap
- Uploads: local static uploads for places/posts/settings, optional Cloudinary for profile images
- AI hooks: Sentence Transformers + Pinecone interfaces

## Main Features

- Auth: register, login, logout, forgot/reset password, email verification, Google/Facebook OAuth hooks
- Roles: `user`, `moderator`, `admin`
- Public Places: list/detail, search, filters, near me, gallery, videos, map, directions, reviews/ratings
- Mini Social: feed, create post, multi-image upload, detail, like, comment, save, share, follow, report
- Admin: dashboard, users, places, posts, comments, reviews, categories, settings, image uploads

## Prerequisites

- Python 3.11+
- Node.js 20+
- Docker Desktop, for local PostgreSQL

## Environment

Copy the example files and fill local values:

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

Important backend values:

- `DATABASE_URL=postgresql+psycopg://quangbinhgo:quangbinhgo@localhost:5432/quangbinhgo`
- `SECRET_KEY=...`
- `BACKEND_URL=http://localhost:8000`
- `FRONTEND_URL=http://localhost:5173`
- SMTP values if testing real email
- OAuth client values if testing Google/Facebook login

Important frontend values:

- `VITE_API_BASE_URL=http://localhost:8000/api/v1`
- Cloudinary values only if using direct profile image upload

## Run Locally

Start PostgreSQL:

```powershell
docker compose up -d postgres
```

Backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open:

- Frontend: `http://localhost:5173`
- Backend docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`

## Seed Demo Data

Seed places:

```powershell
cd backend
python scripts/seed_places.py
```

Seed admin/moderator helpers, if needed:

```powershell
cd backend
python scripts/seed_admin.py
python scripts/seed_moderator.py
```

Use environment variables for seed passwords where scripts support them. Do not commit real passwords.

## Test And Build

Backend tests:

```powershell
cd backend
python -m pytest
```

Frontend build:

```powershell
cd frontend
npm run build
```

Frontend lint:

```powershell
cd frontend
npm run lint
```

## Uploads And Static Files

The backend mounts `/static` and stores local uploads under:

- `backend/static/uploads/settings`
- `backend/static/uploads/places`
- `backend/static/uploads/posts`

Uploaded URLs use `BACKEND_URL`, so keep it correct for local or deployed environments.

## Demo Checklist

See [DEMO_CHECKLIST.md](DEMO_CHECKLIST.md) for a full user/admin/moderator demo script.

## Notes

- Keep secrets in `.env` only.
- Production must set a non-default `SECRET_KEY`.
- `AUTO_CREATE_TABLES=true` is convenient locally; use proper migrations for production deployments.
- AI semantic search currently has interfaces/fallback behavior; full vector indexing is tracked in `backend/AI_PLACES_TODO.md`.
