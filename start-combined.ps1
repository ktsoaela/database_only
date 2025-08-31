Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   DATABASE ONLY - Combined Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Starting Python backend..." -ForegroundColor Yellow
Start-Process -WindowStyle Normal -FilePath "python" -ArgumentList "backend/app.py" -PassThru
Write-Host ""

Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Write-Host ""

Write-Host "Starting Electron frontend..." -ForegroundColor Yellow
Start-Process -WindowStyle Normal -FilePath "npm" -ArgumentList "start" -PassThru
Write-Host ""

Write-Host "DATABASE ONLY has been started!" -ForegroundColor Green
Write-Host "Backend: http://localhost:5001" -ForegroundColor Green
Write-Host "Frontend: Electron app" -ForegroundColor Green
Write-Host ""

Write-Host "Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
