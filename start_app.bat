@echo off
echo ===================================================
echo     Launching AI Study Assistant Web App
echo ===================================================
echo.

set APP_DIR=%~dp0

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "AI Study Assistant - Backend" cmd /k "cd /d %APP_DIR%backend && python run.py"

echo [2/2] Starting Vite Frontend on http://localhost:5173 ...
start "AI Study Assistant - Frontend" cmd /k "cd /d %APP_DIR%frontend && npm run dev"

timeout /t 3 >nul

echo.
echo ===================================================
echo   Application is now running!
echo   Frontend: http://localhost:5173
echo   Backend:  http://127.0.0.1:8000
echo   Docs:     http://127.0.0.1:8000/docs
echo.
echo   Default Login:
echo     Username: admin
echo     Password: admin123
echo ===================================================
echo.

start http://localhost:5173
