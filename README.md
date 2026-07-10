# FoodAds AI

FoodAds AI is a restaurant marketing studio that turns one prompt into:

- generated food imagery
- campaign headlines and captions
- Google Ads, Instagram, TikTok, email, SMS, and push content
- downloadable campaign reports
- saved history with image previews and favorites

## Project Structure

- `frontend/` - React 19 + Vite UI
- `backend/` - ASP.NET Core API and persistence
- `python-ai-service/` - FastAPI AI orchestration layer
- `database/` - schema and migration notes

## Key Features

- Prompt enhancement before image generation
- Image generation with Base or LoRA workflows
- Campaign copy generation in one pass
- History page with selectable saved campaigns
- Favorites for saved campaigns
- Campaign reports with embedded image previews
- Downloadable generated images and HTML reports

## Local Setup

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
dotnet build
dotnet run --project src/FoodAdsAI.Api
```

### Python AI Service

```bash
cd python-ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Environment Variables

Set the API URLs so the frontend and backend can reach each other:

- `VITE_API_URL`
- backend AI service base URL
- database connection string
- JWT/auth settings

## Current Notes

- The Generate page now shows the image, campaign text, and a compact completion summary when all outputs are ready.
- History reports include the saved campaign image instead of raw JSON.
- Saved campaigns keep their image data so reports and previews stay useful later.

## Build Verification

- Frontend: `npm run build`
- Backend: `dotnet build`

## Deployment

This project is deployable once the backend, frontend, Python service, and database are configured for production.

