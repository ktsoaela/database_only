@echo off
echo ========================================
echo    DATABASE ONLY - Starting Up
echo ========================================
echo.

echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 16+ and try again
    pause
    exit /b 1
)

echo Installing Python dependencies...
pip install -r requirements.txt

echo.
echo Starting DATABASE ONLY...
echo.

echo Starting Python backend...
start "DATABASE ONLY Backend" cmd /k "cd backend && python app.py"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo Starting Electron frontend...
npm start

echo.
echo DATABASE ONLY has been started!
echo Backend: http://localhost:5001
echo.
pause
