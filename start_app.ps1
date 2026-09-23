Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "    Launching AI Study Assistant Web App" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

$appDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "[1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$appDir\backend`"; python run.py"

Write-Host "[2/2] Starting Vite Frontend on http://localhost:5173 ..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k", "cd /d `"$appDir\frontend`" && npm run dev"

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "===================================================" -ForegroundColor Green
Write-Host "  Application is now running!" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "  Backend:  http://127.0.0.1:8000" -ForegroundColor White
Write-Host "  Docs:     http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "  Default Login:" -ForegroundColor White
Write-Host "    Username: admin" -ForegroundColor White
Write-Host "    Password: admin123" -ForegroundColor White
Write-Host "===================================================" -ForegroundColor Green
Write-Host ""

Start-Process "http://localhost:5173"
