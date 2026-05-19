# QuangBinhGo Performance Deploy Notes

## Frontend build

- Run `cd frontend && npm run build`.
- Vite hashed assets under `dist/assets` should be cached aggressively.
- Keep route-level code splitting for heavy areas: Admin, Moderation, AI, Leaflet map, Itinerary, Community detail.
- Do not import map/admin/AI pages eagerly from `App.tsx`.

## Image delivery

- Cloudinary URLs should use automatic format and quality:
  - Avatar: `f_auto,q_auto,w_200,h_200,c_thumb`
  - Place card: `f_auto,q_auto,w_600,h_400,c_fill`
  - Gallery detail: `f_auto,q_auto,w_1200,c_limit`
  - Hero/banner: `f_auto,q_auto,w_1600,c_limit`
- Local uploaded files are served from `/static/uploads`; prefer WebP/JPEG under 5 MB and avoid original camera-size files in cards.
- Use `loading="lazy"` for images below the first viewport and keep explicit width/height where practical.

## FastAPI

- GZip is enabled in the app for responses above 1 KB.
- Static uploads are served with `Cache-Control: public, max-age=2592000`.
- For Cloudinary media, rely on Cloudinary CDN caching.

## Nginx example

```nginx
gzip on;
gzip_min_length 1024;
gzip_comp_level 5;
gzip_types
  text/plain
  text/css
  application/json
  application/javascript
  text/xml
  application/xml
  image/svg+xml;

location /assets/ {
  add_header Cache-Control "public, max-age=31536000, immutable";
  try_files $uri =404;
}

location / {
  add_header Cache-Control "no-cache";
  try_files $uri /index.html;
}

location /static/ {
  add_header Cache-Control "public, max-age=2592000";
  proxy_pass http://backend;
}

location /api/ {
  proxy_pass http://backend;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

If your Nginx build supports Brotli, enable it for text assets:

```nginx
brotli on;
brotli_comp_level 5;
brotli_types text/plain text/css application/json application/javascript image/svg+xml;
```

## Cache-Control policy

- Vite hashed `js/css/fonts/images`: `public, max-age=31536000, immutable`.
- `index.html`: `no-cache`.
- Backend uploads: `public, max-age=2592000`.
- API JSON: no long-term cache unless an endpoint is explicitly safe to cache.

## Database

Indexes are created during `init_db()` for frequent filters/sorts:

- `users`: role, active status.
- `places`: status, category, region, rating, view count, created date, latitude/longitude.
- `review_posts`: status, visibility, created date, view/engagement counts.
- `comments/reviews/reports/notifications`: ownership, status, target, and created date fields.
- `analytics`: content target/date and search type/query.

For larger production data, consider PostgreSQL-specific indexes:

- GIN index on `places.tags`.
- PostGIS geography index for nearby search.
- Full-text indexes on place/post search content.
