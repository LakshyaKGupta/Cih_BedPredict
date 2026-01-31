# Quick Deployment Script for Hospital Bed Occupancy Predictor

Write-Host "🚀 Hospital Bed Occupancy Predictor - Quick Deploy" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "✓ Docker found" -ForegroundColor Green
    
    $deployDocker = Read-Host "Deploy with Docker? (Y/N)"
    
    if ($deployDocker -eq 'Y' -or $deployDocker -eq 'y') {
        Write-Host ""
        Write-Host "Starting Docker deployment..." -ForegroundColor Yellow
        Write-Host ""
        
        # Build and start containers
        docker-compose up --build -d
        
        Write-Host ""
        Write-Host "✓ Containers started!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Services:"
        Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "  Backend:  http://localhost:8000" -ForegroundColor Cyan
        Write-Host "  API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "To stop: docker-compose down" -ForegroundColor Yellow
        Write-Host "To view logs: docker-compose logs -f" -ForegroundColor Yellow
        
        exit
    }
}

Write-Host ""
Write-Host "Choose deployment platform:" -ForegroundColor Yellow
Write-Host "1. Railway.app (Recommended - Fast & Easy)"
Write-Host "2. Render.com (Free tier available)"
Write-Host "3. Vercel (Frontend) + Render (Backend)"
Write-Host "4. Local Docker setup"
Write-Host "5. Manual deployment info"
Write-Host ""

$choice = Read-Host "Enter choice (1-5)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "📱 Railway.app Deployment" -ForegroundColor Cyan
        Write-Host "========================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Steps:"
        Write-Host "1. Visit https://railway.app"
        Write-Host "2. Sign up with GitHub"
        Write-Host "3. Create new project → Deploy from GitHub"
        Write-Host "4. Select this repository"
        Write-Host "5. Add PostgreSQL database"
        Write-Host "6. Set environment variables:"
        Write-Host "   - DATABASE_URL (auto from Postgres)"
        Write-Host "   - SECRET_KEY (random 32+ chars)"
        Write-Host ""
        Write-Host "Estimated time: 10 minutes" -ForegroundColor Green
    }
    
    "2" {
        Write-Host ""
        Write-Host "🎨 Render.com Deployment" -ForegroundColor Cyan
        Write-Host "========================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Steps:"
        Write-Host "1. Visit https://render.com"
        Write-Host "2. Create PostgreSQL database"
        Write-Host "3. Create Web Service for backend"
        Write-Host "   Build: pip install -r requirements.txt"
        Write-Host "   Start: uvicorn app.main:app --host 0.0.0.0 --port `$PORT"
        Write-Host "4. Create Static Site for frontend"
        Write-Host "   Build: npm install && npm run build"
        Write-Host "   Publish: dist"
        Write-Host ""
        Write-Host "Estimated time: 15 minutes" -ForegroundColor Green
    }
    
    "3" {
        Write-Host ""
        Write-Host "⚡ Vercel + Render Deployment" -ForegroundColor Cyan
        Write-Host "=============================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Backend (Render):"
        Write-Host "  1. Visit https://render.com"
        Write-Host "  2. Create PostgreSQL + Web Service"
        Write-Host ""
        Write-Host "Frontend (Vercel):"
        Write-Host "  1. Visit https://vercel.com"
        Write-Host "  2. Import GitHub repo"
        Write-Host "  3. Set Root Directory: frontend"
        Write-Host "  4. Add env: VITE_API_URL=<backend-url>"
        Write-Host ""
        Write-Host "Estimated time: 12 minutes" -ForegroundColor Green
    }
    
    "4" {
        Write-Host ""
        Write-Host "🐳 Local Docker Setup" -ForegroundColor Cyan
        Write-Host "=====================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Running: docker-compose up --build"
        Write-Host ""
        
        docker-compose up --build
    }
    
    "5" {
        Write-Host ""
        Write-Host "📖 Manual Deployment Information" -ForegroundColor Cyan
        Write-Host "================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "See DEPLOYMENT.md for detailed instructions"
        Write-Host ""
        Write-Host "Quick links:"
        Write-Host "  - Railway: https://railway.app"
        Write-Host "  - Render: https://render.com"
        Write-Host "  - Vercel: https://vercel.com"
        Write-Host "  - AWS: https://aws.amazon.com"
        Write-Host "  - Azure: https://azure.microsoft.com"
        Write-Host ""
        
        # Open DEPLOYMENT.md
        if (Test-Path "DEPLOYMENT.md") {
            $open = Read-Host "Open DEPLOYMENT.md? (Y/N)"
            if ($open -eq 'Y' -or $open -eq 'y') {
                Start-Process "DEPLOYMENT.md"
            }
        }
    }
    
    default {
        Write-Host "Invalid choice" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Need help? Check DEPLOYMENT.md for detailed guides" -ForegroundColor Yellow
Write-Host ""
