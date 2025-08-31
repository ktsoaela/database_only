# DATABASE ONLY - PowerShell Startup Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    DATABASE ONLY - Starting Up" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Python installation
Write-Host "Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.8+ and try again" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check Node.js installation
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js 16+ and try again" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Install Python dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

Write-Host ""
Write-Host "Starting DATABASE ONLY..." -ForegroundColor Green
Write-Host ""

# Start Python backend
Write-Host "Starting Python backend..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd backend && python app.py" -WindowStyle Normal

# Wait for backend to start
Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start Electron frontend
Write-Host "Starting Electron frontend..." -ForegroundColor Yellow
npm start

Write-Host ""
Write-Host "✅ DATABASE ONLY has been started!" -ForegroundColor Green
Write-Host "🌐 Backend: http://localhost:5001" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"
