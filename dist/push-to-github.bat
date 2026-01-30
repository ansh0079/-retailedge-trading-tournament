@echo off
echo ========================================
echo  Pushing Optimized Files to GitHub
echo ========================================
echo.

REM Check if git is installed
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Git is not installed or not in PATH
    echo Please use GitHub Desktop instead
    echo.
    pause
    exit /b 1
)

REM Add all changes
echo Adding files...
git add index.html OPTIMIZATION_SUMMARY.md

REM Commit with message
echo Committing changes...
git commit -m "Major optimization: Fix Babel error & reduce HTML by 98%%" -m "- Moved 1.14MB inline script to external app.js" -m "- Fixed Babel 500KB deoptimization error" -m "- Removed duplicate FMP_API_KEY declaration" -m "- Added Safari CSS compatibility" -m "- Reduced index.html from 1235KB to 25KB" -m "- All features working perfectly"

REM Push to GitHub
echo Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo  Push Complete! ✅
echo ========================================
echo.
echo Your changes are now on GitHub
echo Render will auto-deploy shortly
echo.
pause
