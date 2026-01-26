@echo off
echo ========================================
echo   Deploying to Netlify
echo ========================================
echo.

REM Check if Netlify CLI is installed
where netlify >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Netlify CLI not found. Installing...
    call npm install -g netlify-cli
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install Netlify CLI
        pause
        exit /b 1
    )
)

echo [1/3] Building application...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)

echo.
echo [2/3] Deploying to Netlify...
echo.
netlify deploy --prod

echo.
echo [3/3] Deployment complete!
echo.
echo Don't forget to set environment variables in Netlify Dashboard:
echo - ANTHROPIC_API_KEY
echo - FINNHUB_KEY (if used)
echo - SERPER_API_KEY (if used)
echo.
pause
