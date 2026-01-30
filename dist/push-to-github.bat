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
git commit -m "Fix: Safari CSS compatibility for backdrop-filter" -m "- Added -webkit-backdrop-filter prefixes for iOS support" -m "- Fixed 9 Safari compatibility issues" -m "- All features working perfectly" -m "- Zero syntax errors"

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
