@echo off
echo ========================================
echo DATABASE ONLY - Simple Build Script
echo ========================================
echo.

echo [1/4] Cleaning previous builds...
if exist "dist" rmdir /s /q "dist"
if exist "build" rmdir /s /q "build"

echo [2/4] Installing dependencies...
call npm install

echo [3/4] Creating simple package...
mkdir "dist\DATABASE-ONLY"
xcopy "*.js" "dist\DATABASE-ONLY\" /Y
xcopy "*.html" "dist\DATABASE-ONLY\" /Y
xcopy "*.css" "dist\DATABASE-ONLY\" /Y
xcopy "backend" "dist\DATABASE-ONLY\backend\" /E /I /Y
xcopy "assets" "dist\DATABASE-ONLY\assets\" /E /I /Y
xcopy "requirements.txt" "dist\DATABASE-ONLY\" /Y
xcopy "package.json" "dist\DATABASE-ONLY\" /Y
xcopy "start-combined.bat" "dist\DATABASE-ONLY\" /Y
xcopy "start-combined.ps1" "dist\DATABASE-ONLY\" /Y

echo [4/4] Creating README for users...
echo # DATABASE ONLY - Installation Instructions > "dist\DATABASE-ONLY\INSTALL.txt"
echo. >> "dist\DATABASE-ONLY\INSTALL.txt"
echo ## Quick Start >> "dist\DATABASE-ONLY\INSTALL.txt"
echo 1. Install Node.js (v16 or higher) >> "dist\DATABASE-ONLY\INSTALL.txt"
echo 2. Install Python (v3.8 or higher) >> "dist\DATABASE-ONLY\INSTALL.txt"
echo 3. Open command prompt in this folder >> "dist\DATABASE-ONLY\INSTALL.txt"
echo 4. Run: npm install >> "dist\DATABASE-ONLY\INSTALL.txt"
echo 5. Run: pip install -r requirements.txt >> "dist\DATABASE-ONLY\INSTALL.txt"
echo 6. Run: start-combined.bat >> "dist\DATABASE-ONLY\INSTALL.txt"
echo. >> "dist\DATABASE-ONLY\INSTALL.txt"
echo ## Alternative Startup >> "dist\DATABASE-ONLY\INSTALL.txt"
echo - Use start-combined.ps1 for PowerShell >> "dist\DATABASE-ONLY\INSTALL.txt"
echo - Or run: npm run combined >> "dist\DATABASE-ONLY\INSTALL.txt"

echo.
echo ========================================
echo Build Complete!
echo ========================================
echo.
echo Your application is ready in: dist\DATABASE-ONLY\
echo.
echo To distribute:
echo 1. Zip the DATABASE-ONLY folder
echo 2. Share with users
echo 3. Users follow INSTALL.txt instructions
echo.
pause
