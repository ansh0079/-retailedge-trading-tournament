@echo off
echo ========================================
echo  Starting RetailEdge Pro Local Server
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed
    echo Please install Node.js from https://nodejs.org
    echo.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting server on http://localhost:3002
echo.
echo The app will connect to this local server for:
echo - Stock quotes and data
echo - Tournament functionality  
echo - AI analysis
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the server
node tournament-server.js

pause
