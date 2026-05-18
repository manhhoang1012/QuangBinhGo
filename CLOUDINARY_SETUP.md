# Cloudinary setup for QuangBinhGo

QuangBinhGo uploads media through the FastAPI backend, then the backend uploads to Cloudinary with server-side credentials. The frontend must not contain Cloudinary API keys or unsigned presets.

## 1. Create Cloudinary credentials

1. Create or open a Cloudinary account.
2. Copy:
   - Cloud name
   - API key
   - API secret

## 2. Configure backend env

Add these values to `backend/.env`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_FOLDER=quangbinhgo
```

Restart FastAPI after changing `.env`.

## 3. Test upload

Use any logged-in account and upload:

- Avatar or cover image from Profile.
- Post images/videos from Create Post.
- Place images from Admin Places.
- Review images from Place Detail review form.
- Logo/hero images from Admin Settings.

## 4. Local fallback

If Cloudinary env values are missing, the backend logs:

```text
Cloudinary not configured, using local upload fallback.
```

Uploads then save to `backend/static/uploads/...` so local development does not crash. Production should use Cloudinary.

## 5. Limits

- Avatar: JPG/PNG/WEBP, max 2MB.
- Cover: JPG/PNG/WEBP, max 5MB.
- Post images: max 10 files, 5MB each.
- Post videos: MP4/WEBM/MOV, max 3 files, 50MB each.
- Place images: max 20 files, 5MB each.
- Review images: max 10 files, 5MB each.
