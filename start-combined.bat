@echo off
echo ========================================
echo    DATABASE ONLY - Combined Start
echo ========================================
echo.
echo Starting Python backend...
start "DATABASE ONLY Backend" cmd /k "python backend/app.py"
echo.
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul
echo.
echo Starting Electron frontend...
start "DATABASE ONLY Frontend" cmd /k "npm start"
echo.
echo DATABASE ONLY has been started!
echo Backend: http://localhost:5001
echo Frontend: Electron app
echo.
echo Press any key to close this window...
pause >nul
