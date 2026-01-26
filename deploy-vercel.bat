@echo off
echo ========================================
echo   Deploying to Vercel
echo ========================================
echo.

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Vercel CLI not found. Installing...
    call npm install -g vercel
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install Vercel CLI
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
echo [2/3] Deploying to Vercel...
echo.
vercel --prod

echo.
echo [3/3] Deployment complete!
echo.
echo Don't forget to set environment variables in Vercel Dashboard:
echo - ANTHROPIC_API_KEY
echo - FINNHUB_KEY (if used)
echo - SERPER_API_KEY (if used)
echo.
pause
