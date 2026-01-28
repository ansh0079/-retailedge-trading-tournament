@echo off
echo ========================================
echo  Deploying Stock Data Fix to Render
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Checking Git status...
git status
if errorlevel 1 (
    echo ERROR: Git not found. Please:
    echo   1. Open a NEW PowerShell window
    echo   2. Run: cd "c:\Users\ansh0\Downloads\working version"
    echo   3. Run: git add .
    echo   4. Run: git commit -m "Fix: Enable real FMP stock data"
    echo   5. Run: git push origin main
    echo.
    echo OR use GitHub Desktop to commit and push.
    pause
    exit /b 1
)

echo.
echo [2/4] Adding all changes...
git add .

echo.
echo [3/4] Committing changes...
git commit -m "Fix: Enable real FMP stock data loading (disable demo mode)"

echo.
echo [4/4] Pushing to GitHub (triggers Render auto-deploy)...
git push origin main

echo.
echo ========================================
echo  SUCCESS! Changes pushed to GitHub
echo ========================================
echo.
echo Render will auto-deploy in 5-10 minutes.
echo.
echo Monitor deployment at:
echo https://dashboard.render.com
echo.
echo Your live app:
echo https://retailedge-trading-tournament-1.onrender.com
echo.
pause
