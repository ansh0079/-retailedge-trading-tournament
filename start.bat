@echo off
echo ========================================
echo  Starting Retail Edge Pro
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo [1/3] Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo [2/3] Starting proxy server...
start "Retail Edge Pro Server" cmd /k "node proxy-server.js"

REM Wait a bit for server to start
timeout /t 3 /nobreak >nul

echo [3/3] Opening application in browser...
start http://localhost:3002

echo.
echo ========================================
echo  Retail Edge Pro is now running!
echo ========================================
echo.
echo - Application: http://localhost:3002
echo - Server window is running in background
echo.
echo To stop the server:
echo   1. Go to the "Retail Edge Pro Server" window
echo   2. Press Ctrl+C twice
echo.
echo This window can be closed safely.
echo ========================================
pause
