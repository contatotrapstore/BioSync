@echo off
echo ========================================
echo NeuroGame Launcher - Installation
echo ========================================
echo.

echo [1/3] Installing dependencies...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to install dependencies
    echo Please check your Node.js installation
    pause
    exit /b 1
)

echo.
echo [2/3] Checking Jogos folder...
if not exist "..\Jogos" (
    echo WARNING: ../Jogos folder not found
    echo Creating folder...
    mkdir "..\Jogos"
    echo Folder created. Please add your games here.
) else (
    echo Jogos folder found!
)

echo.
echo [3/3] Setup complete!
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. Make sure your backend API is running
echo 2. Add games to the ../Jogos folder
echo 3. Run: npm run dev
echo.
echo For production build:
echo   - Windows: npm run build:win
echo   - macOS:   npm run build:mac
echo   - Linux:   npm run build:linux
echo.
echo Read SETUP.md for detailed instructions
echo ========================================
echo.
pause
