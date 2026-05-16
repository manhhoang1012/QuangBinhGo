# QuangBinhGo Demo Checklist

Use this checklist before demos or deploy handoff.

## 1. Local Setup

- [ ] Start PostgreSQL: `docker compose up -d postgres`
- [ ] Backend `.env` exists and uses the local PostgreSQL URL.
- [ ] Frontend `.env` has `VITE_API_BASE_URL=http://localhost:8000/api/v1`
- [ ] Backend runs: `cd backend && uvicorn app.main:app --reload`
- [ ] Frontend runs: `cd frontend && npm run dev`
- [ ] Open `http://localhost:8000/health` and verify `{"status":"ok"}`

## 2. Seed And Accounts

- [ ] Seed tourism places: `cd backend && python scripts/seed_places.py`
- [ ] Create or seed an admin account.
- [ ] Create or seed a moderator account.
- [ ] Create at least two normal user accounts.

## 3. Auth And Account Flow

- [ ] Register a new user.
- [ ] Login with email/password.
- [ ] Logout and verify protected pages redirect or show login.
- [ ] Forgot password sends/logs reset link in configured environment.
- [ ] Reset password works with a valid token.
- [ ] Email verification flow works or logs dev link.
- [ ] Google/Facebook OAuth buttons redirect only when provider env values are configured.

## 4. Role Access

- [ ] User cannot open `/admin`.
- [ ] Moderator cannot open `/admin`, `/admin/users`, `/admin/places`, `/admin/categories`, or `/admin/settings`.
- [ ] Moderator can open `/admin/posts`, `/admin/comments`, and `/admin/reviews`.
- [ ] Admin can open all admin pages.
- [ ] Direct API calls return `401` when not logged in and `403` for insufficient role.

## 5. Public Places

- [ ] `/places` loads published places.
- [ ] Search by name/keyword works.
- [ ] Category filter works.
- [ ] Tag/experience filter works.
- [ ] Rating filter works.
- [ ] Free/paid price filter works.
- [ ] Sort by newest, rating, review count, price works.
- [ ] "Gần tôi" asks browser location permission and shows distance.
- [ ] Empty/error/loading states render cleanly.

## 6. Place Detail

- [ ] Gallery shows a main image and thumbnails.
- [ ] Video section renders when videos exist.
- [ ] Raw latitude/longitude is not shown to users.
- [ ] Leaflet map shows the place marker.
- [ ] "Định vị của tôi" shows user marker or a friendly permission error.
- [ ] "Chỉ đường" opens maps in a new tab.
- [ ] Opening hours, ticket price, contact, website/Facebook render.
- [ ] Related places render.

## 7. Place Reviews/Ratings

- [ ] Logged-out user sees login CTA to review.
- [ ] Logged-in user can create a 1-5 star review.
- [ ] Same user cannot create a duplicate review for the same place.
- [ ] User can edit their review.
- [ ] User can delete their review.
- [ ] `rating_avg` and `review_count` update after create/edit/delete.
- [ ] User cannot delete another user's review.
- [ ] Moderator/admin can delete violating reviews from `/admin/reviews`.

## 8. Mini Social

- [ ] `/community` feed loads visible posts only.
- [ ] User can create a travel review post.
- [ ] Multi-image upload validates jpg/png/webp, max 5MB each, max 10 images.
- [ ] Post detail opens at `/community/:postId`.
- [ ] User can like/unlike a post.
- [ ] User can comment on a post.
- [ ] User can save/unsave a post.
- [ ] Saved posts appear in saved posts page.
- [ ] Share button copies or opens native share.
- [ ] Follow user works from feed.
- [ ] Report post creates a report without crashing UI.
- [ ] Post owner can delete their post.

## 9. Admin And Moderator

- [ ] Admin dashboard stats load.
- [ ] Admin users page lists, searches, locks/unlocks, changes role, and blocks self-lock/self-delete.
- [ ] Admin places page can create/edit/delete places.
- [ ] Admin places upload multiple images and displays previews.
- [ ] Admin places Leaflet picker searches/clicks/reverse-geocodes location.
- [ ] Admin posts page can hide/show/delete posts.
- [ ] Admin comments page can delete comments.
- [ ] Admin reviews page can delete reviews and rating counts update.
- [ ] Admin categories CRUD works.
- [ ] Admin settings loads and saves settings.
- [ ] Admin settings logo/favicon/hero upload returns a static URL and preview works.

## 10. Static Files And Images

- [ ] Uploaded settings image URL opens directly in the browser.
- [ ] Uploaded place image URL opens directly in the browser.
- [ ] Uploaded post image URL opens directly in the browser.
- [ ] Public pages display uploaded images after page refresh.

## 11. Responsive And Browser Console

- [ ] Home page works on mobile viewport.
- [ ] Places list/detail work on mobile viewport.
- [ ] Community feed/detail work on mobile viewport.
- [ ] Admin tables remain usable on mobile or narrow width.
- [ ] Browser console has no critical runtime errors.
- [ ] Network tab has no unexpected `500`; expected `401/403/404/422` responses show friendly UI messages.

## 12. Final Verification

- [ ] Backend: `cd backend && python -m pytest`
- [ ] Frontend: `cd frontend && npm run build`
- [ ] Optional lint: `cd frontend && npm run lint`
- [ ] Confirm `.env` files are not staged or committed.
