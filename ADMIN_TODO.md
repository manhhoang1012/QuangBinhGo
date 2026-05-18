# Admin TODO

The current admin dashboard uses real APIs for users, posts, comments, places, categories, reviews, settings, and content reports.

Pending backend models/endpoints for later completion:

- User reports: add a `user_reports` table before enabling `type=user` handling in `/api/v1/admin/reports`.
- Place suggestions: add a `place_suggestions` table and endpoints for approving/rejecting user-submitted places.
- Report moderation actions: add one-click target actions from `/admin/reports`, such as hide/delete target content and block reported users, if the product wants reports to drive enforcement directly from the reports table.
