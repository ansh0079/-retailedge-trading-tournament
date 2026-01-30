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
git add index.html
git add app.js
git add tournament.js
git add tournament-server.js
git add api-service.js
git add config.js
git add package.json
git add package-lock.json
git add fix-stock-columns.js
git add technical-analysis-engine.js
git add technical-analysis-ui.js
git add technical-analysis-integration.js
git add sw.js
git add .gitignore
git add README.md
git add OPTIMIZATION_SUMMARY.md
git add DEPLOYMENT_CHECKLIST.md
git add FINAL_FIXES.md
git add vendor/

REM Commit with message
echo Committing changes...
git commit -m "Deploy optimized app with working API endpoints" -m "- Fixed Babel 500KB error (moved to external app.js)" -m "- Fixed duplicate FMP_API_KEY declaration" -m "- Added tournament.js for AI tournament" -m "- Optimized HTML: 1235KB → 25KB (98% reduction)" -m "- Fixed API endpoints for stock data" -m "- Safari/iOS compatibility" -m "- Ready for 24/7 tournament on Render"

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
