# Admin Testing

## Create an admin account

Set `ADMIN_PASSWORD` in `.env`, then run:

```powershell
cd backend
python scripts/seed_admin.py
```

Default admin email from the script:

```text
admin@gmail.com
```

The password comes from `ADMIN_PASSWORD`; do not commit real secrets.

## Run backend

```powershell
cd backend
uvicorn app.main:app --reload
```

## Run frontend

```powershell
cd frontend
npm.cmd run dev
```

## OpenStreetMap for Admin Places

Admin Places create/edit uses React Leaflet, OpenStreetMap tiles, and Nominatim search/reverse geocoding.

No Google Maps API key or Google Cloud billing setup is required for Places. Nominatim is rate-limited, so the frontend debounces search requests and only reverse geocodes after selecting/clicking a location.

## Manual test checklist

1. Login as admin at `/login`.
2. Open `/admin`.
3. Check dashboard statistics.
4. Open `/admin/users`.
5. Search users, change role, lock/unlock a non-admin test user.
6. Try locking/deleting your own admin account and confirm the API blocks it.
7. Open `/admin/places`.
8. Create a place: search with OpenStreetMap/Nominatim, pick a result, click the map to adjust the marker, upload multiple images, then save.
9. Edit the place: confirm old images render, remove one old image, add a new upload, adjust the map marker, then save.
10. Delete a test place.
11. Open `/admin/posts`.
12. View a post, toggle hidden/visible, and delete a test post.
13. Open `/admin/comments` and delete a test comment.
14. Open `/admin/reviews` and delete a test review.
15. Open `/admin/categories`, create/edit/delete a test category.
16. Logout, then try `/admin` and confirm redirect to login.
17. Login as a normal user, then try `/admin` and confirm redirect to `/`.
