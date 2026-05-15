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

## Manual test checklist

1. Login as admin at `/login`.
2. Open `/admin`.
3. Check dashboard statistics.
4. Open `/admin/users`.
5. Search users, change role, lock/unlock a non-admin test user.
6. Try locking/deleting your own admin account and confirm the API blocks it.
7. Open `/admin/places`.
8. Create, edit, and delete a test place.
9. Open `/admin/posts`.
10. View a post, toggle hidden/visible, and delete a test post.
11. Open `/admin/comments` and delete a test comment.
12. Open `/admin/reviews` and delete a test review.
13. Open `/admin/categories`, create/edit/delete a test category.
14. Logout, then try `/admin` and confirm redirect to login.
15. Login as a normal user, then try `/admin` and confirm redirect to `/`.
