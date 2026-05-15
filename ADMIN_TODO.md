# Admin Backend TODO

The admin frontend uses real APIs available today:

- `GET /api/v1/admin/dashboard/stats`
- `GET /api/v1/admin/users`
- `GET /api/v1/admin/users/{user_id}`
- `PATCH /api/v1/admin/users/{user_id}/status`
- `PATCH /api/v1/admin/users/{user_id}/role`
- `DELETE /api/v1/admin/users/{user_id}`
- `GET /api/v1/admin/places`
- `GET /api/v1/admin/places/{place_id}`
- `POST /api/v1/admin/places`
- `PATCH /api/v1/admin/places/{place_id}`
- `DELETE /api/v1/admin/places/{place_id}`
- `GET /api/v1/admin/posts`
- `GET /api/v1/admin/posts/{post_id}`
- `PATCH /api/v1/admin/posts/{post_id}/status`
- `DELETE /api/v1/admin/posts/{post_id}`
- `GET /api/v1/admin/comments`
- `DELETE /api/v1/admin/comments/{comment_id}`
- `GET /api/v1/admin/reviews`
- `DELETE /api/v1/admin/reviews/{review_id}`
- `GET /api/v1/admin/categories`
- `POST /api/v1/admin/categories`
- `PATCH /api/v1/admin/categories/{category_id}`
- `DELETE /api/v1/admin/categories/{category_id}`

Remaining optional backend endpoints:
- `GET /api/v1/admin/settings`
- `PATCH /api/v1/admin/settings`
- More advanced filters/pagination metadata for posts, comments, and reviews.
