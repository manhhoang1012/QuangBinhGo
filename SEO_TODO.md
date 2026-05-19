# SEO TODO

QuangBinhGo currently runs as a React/Vite SPA with dynamic meta tags via `react-helmet-async`.

This improves browser titles, canonical tags, and runtime Open Graph/Twitter tags, but Facebook/Zalo crawlers may not execute the SPA reliably. For production-perfect share previews, add one of these later:

- SSR/prerender for public routes: `/places/:slug`, `/community/:slug`, `/u/:username`, shared itineraries.
- Backend-rendered OG preview endpoints that return static HTML meta tags and redirect users to the SPA.
- A prerender service in the deploy pipeline for public sitemap URLs.

Current sitemap and robots endpoints are served by FastAPI:

- `/sitemap.xml`
- `/robots.txt`
