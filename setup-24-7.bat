@echo off
echo ========================================
echo   Tournament 24/7 Setup
echo ========================================
echo.

echo [1/4] Installing PM2 globally...
call npm install -g pm2
if %errorlevel% neq 0 (
    echo ERROR: Failed to install PM2
    pause
    exit /b 1
)

echo.
echo [2/4] Creating logs directory...
if not exist "logs" mkdir logs

echo.
echo [3/4] Starting services with PM2...
call pm2 start ecosystem.config.js
if %errorlevel% neq 0 (
    echo ERROR: Failed to start services
    pause
    exit /b 1
)

echo.
echo [4/4] Saving PM2 configuration...
call pm2 save

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Services started:
call pm2 list
echo.
echo Next steps:
echo 1. Configure Windows power settings (see TOURNAMENT_24_7_GUIDE.md)
echo 2. Run: pm2 startup (to enable auto-start on boot)
echo 3. Monitor: pm2 logs
echo.
pause
