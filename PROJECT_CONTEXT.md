# QuangBinhGo Project Context

## Project Goal
QuangBinhGo is a tourism discovery website for Quang Binh with mini social community features and AI-powered travel planning.

## Stack
- Frontend: React + Vite + TypeScript
- UI: TailwindCSS + Shadcn-style components
- Backend: FastAPI
- Database: PostgreSQL
- Image Upload: Cloudinary
- AI: Sentence Transformers + Pinecone

## Current Completed Features
- Project structure
- FastAPI backend base
- React frontend base
- PostgreSQL docker setup
- Authentication
- Login/Register
- JWT token handling
- Admin seed script
- Protected admin route
- Places page
- Community feed
- Saved posts
- Profile page
- Edit profile mode
- Change password
- Avatar upload with Cloudinary

## Current UX Decisions
- Admin is not shown in the main navbar
- Admin is accessed only by direct URL: /admin
- Profile is not shown in the main navbar
- Profile is accessed from avatar dropdown after login
- If not logged in and accessing protected pages, redirect to /login
- Profile page should show read-only mode first
- Clicking Edit profile opens edit mode
- Avatar can be uploaded from local computer via Cloudinary

## Environment Variables

### Frontend
- VITE_API_BASE_URL=http://localhost:8000/api/v1
- VITE_CLOUDINARY_CLOUD_NAME=
- VITE_CLOUDINARY_UPLOAD_PRESET=

### Backend
- DATABASE_URL=
- JWT_SECRET_KEY=
- ADMIN_PASSWORD=

## Important Local Setup Notes
- frontend/.env is required for Vite variables
- .env.example is only a sample file
- After editing frontend/.env, restart npm run dev
- Cloudinary upload preset must be Unsigned
- Do not commit real .env files

## Current Known Issues
- Need to continue testing UX feature by feature
- Some frontend pages may still use mock data
- Some backend APIs may not be connected to frontend yet
- Need better mobile navbar
- Need better comments UX
- Need better admin dashboard UX
- Need AI search and itinerary refinement

## Important Rules for Codex
- Read AGENTS.md and PROJECT_CONTEXT.md before editing
- Do not rewrite the whole project
- Do not modify unrelated files
- Keep current UI style
- Explain changed files after editing
- Add loading, error, and empty states for API features
- Keep clean architecture in backend