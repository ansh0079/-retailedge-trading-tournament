@echo off
echo ========================================
echo   GitHub API Key Security Fix
echo ========================================
echo.

echo This script will help you secure your API keys.
echo.

echo Step 1: Checking what files are tracked by git...
echo.

REM Try to find git
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Git is not installed or not in PATH
    echo.
    echo You'll need to:
    echo 1. Install Git from: https://git-scm.com/download/win
    echo 2. Or use GitHub Desktop
    echo 3. Or manually check your GitHub repository
    echo.
    goto :manual_fix
)

echo Git found! Checking repository status...
echo.

REM Check if sensitive files are tracked
git ls-files | findstr /i "API.*keys" > temp_tracked.txt
git ls-files | findstr /i "\.env$" >> temp_tracked.txt

if exist temp_tracked.txt (
    for /f %%i in ("temp_tracked.txt") do set size=%%~zi
    if !size! gtr 0 (
        echo.
        echo ⚠️  WARNING: The following sensitive files are tracked by git:
        echo.
        type temp_tracked.txt
        echo.
        echo These files need to be removed from git tracking!
        echo.
        goto :remove_files
    ) else (
        echo ✅ Good! No sensitive files are currently tracked.
        echo.
        goto :check_history
    )
)

:remove_files
echo.
echo Do you want to remove these files from git tracking? (Y/N)
set /p remove_choice=
if /i "%remove_choice%"=="Y" (
    echo.
    echo Removing files from git tracking...
    for /f "delims=" %%f in (temp_tracked.txt) do (
        echo Removing: %%f
        git rm --cached "%%f"
    )
    echo.
    echo Files removed from tracking. Creating commit...
    git commit -m "Remove sensitive API key files from tracking"
    echo.
    echo ✅ Done! Now push to GitHub:
    echo    git push origin main
    echo.
) else (
    echo.
    echo Skipped removal. Please remove manually.
    echo.
)

:check_history
echo.
echo Step 2: Checking if files were in previous commits...
echo.
git log --all --full-history --pretty=format:"" --name-only | findstr /i "API.*keys" > temp_history.txt
git log --all --full-history --pretty=format:"" --name-only | findstr /i "\.env$" >> temp_history.txt

if exist temp_history.txt (
    for /f %%i in ("temp_history.txt") do set size=%%~zi
    if !size! gtr 0 (
        echo.
        echo ⚠️  WARNING: Sensitive files found in git history!
        echo.
        type temp_history.txt | sort | uniq
        echo.
        echo These files were committed in the past.
        echo The API keys in these files are EXPOSED and must be revoked!
        echo.
    )
)

goto :cleanup

:manual_fix
echo.
echo ========================================
echo   Manual Fix Instructions
echo ========================================
echo.
echo 1. Go to your GitHub repository in a web browser
echo 2. Check if these files exist:
echo    - AI API keys.txt
echo    - .env
echo    - FMP API keys.txt
echo.
echo 3. If you see any of these files:
echo    - The API keys in them are EXPOSED
echo    - You MUST revoke those keys immediately
echo.
echo 4. To remove from GitHub:
echo    - Delete the files locally
echo    - Commit: git commit -m "Remove sensitive files"
echo    - Push: git push
echo.
echo 5. Revoke exposed keys:
echo    - Gemini: https://makersuite.google.com/app/apikey
echo    - Claude: https://console.anthropic.com/settings/keys
echo    - DeepSeek: https://platform.deepseek.com/
echo    - Kimi: https://platform.moonshot.cn/
echo.

:cleanup
if exist temp_tracked.txt del temp_tracked.txt
if exist temp_history.txt del temp_history.txt

echo.
echo ========================================
echo   Next Steps
echo ========================================
echo.
echo 1. ⚠️  REVOKE exposed API keys immediately!
echo 2. Generate NEW API keys
echo 3. Update .env file with new keys
echo 4. Restart your server
echo 5. Verify .gitignore includes:
echo    - .env
echo    - *API keys*.txt
echo.
echo See SECURITY_FIX_API_KEY.md for detailed instructions.
echo.
pause
