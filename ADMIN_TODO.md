# Admin Backend TODO

The admin frontend uses real APIs where they exist today:

- `GET /api/v1/admin/users`
- `PATCH /api/v1/admin/users/{user_id}/status`
- `PATCH /api/v1/admin/users/{user_id}/role`
- `DELETE /api/v1/admin/users/{user_id}`
- `GET /api/v1/places`
- `POST /api/v1/places`
- `PATCH /api/v1/places/{place_id}`
- `DELETE /api/v1/places/{place_id}`
- `GET /api/v1/review-posts/feed`

Missing backend endpoints needed to fully activate all admin screens:

## Dashboard
- `GET /api/v1/admin/stats`
  - users_count
  - places_count
  - posts_count
  - reviews_count
  - comments_count
  - recent_activity

## Posts Moderation
- `GET /api/v1/admin/posts`
- `GET /api/v1/admin/posts/{post_id}`
- `PATCH /api/v1/admin/posts/{post_id}/visibility`
- `DELETE /api/v1/admin/posts/{post_id}`

## Comments Moderation
- `GET /api/v1/admin/comments`
- `DELETE /api/v1/admin/comments/{comment_id}`
- Optional filters: `post_id`, `user_id`, `search`

## Reviews/Ratings
- `GET /api/v1/admin/reviews`
- `DELETE /api/v1/admin/reviews/{review_id}`
- Optional filters: `place_id`, `rating`, `user_id`

## Categories
- `GET /api/v1/admin/categories`
- `POST /api/v1/admin/categories`
- `PATCH /api/v1/admin/categories/{category_id}`
- `DELETE /api/v1/admin/categories/{category_id}`

## Settings
- `GET /api/v1/admin/settings`
- `PATCH /api/v1/admin/settings`
