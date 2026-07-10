param(
    [switch]$Help
)

if ($Help) {
    Write-Host "FoodAds AI - Local Runner (No Docker)"
    Write-Host "====================================="
    Write-Host "This script runs the AI service, Backend, and Frontend locally."
    Write-Host "Please ensure you have:"
    Write-Host "  1. Python 3.11 installed (for python-ai-service)"
    Write-Host "  2. .NET 8 SDK installed (for backend)"
    Write-Host "  3. Node.js installed (for frontend)"
    Write-Host "  4. PostgreSQL running locally on port 5432 with user/pass foodadsai/foodadsai"
    Write-Host ""
    Write-Host "Usage: .\run-local.ps1"
    exit
}

$Root = $PSScriptRoot

Write-Host "Starting AI Service..." -ForegroundColor Cyan
Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd python-ai-service && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000" -WindowStyle Normal

Write-Host "Starting .NET Backend..." -ForegroundColor Cyan
Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd backend\src\FoodAdsAI.Api && dotnet run --urls http://localhost:8080" -WindowStyle Normal

Write-Host "Starting Vite Frontend..." -ForegroundColor Cyan
Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd frontend && npm install && npm run dev -- --port 5173" -WindowStyle Normal

Write-Host "All services are starting up in separate windows!" -ForegroundColor Green
Write-Host "You can view the frontend at: http://localhost:5173" -ForegroundColor Green
