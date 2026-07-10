@echo off
echo Starting AI Service...
start "AI Service" cmd /k "cd python-ai-service && pip install -r requirements.txt && python -m uvicorn app.main:app --reload --port 8000"

echo Starting .NET Backend...
start cmd /k "cd backend\src\FoodAdsAI.Api && dotnet run --urls http://localhost:8080"

echo Starting Vite Frontend...
start cmd /k "cd frontend && npm install && npm run dev -- --port 5173"

echo All services are starting up in separate windows!
echo You can view the frontend at: http://localhost:5173
