@echo off
echo ========================================
echo    DATABASE ONLY - Simple Start
echo ========================================
echo.

echo Starting Python backend...
start "DATABASE ONLY Backend" cmd /k "python backend/app.py"

echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo Starting Electron frontend...
npm start

echo.
echo DATABASE ONLY has been started!
echo.
pause
