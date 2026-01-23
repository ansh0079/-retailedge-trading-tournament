@echo off
echo ========================================
echo   RetailEdge Pro - Local Deployment
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/
    pause
    exit /b 1
)

echo [1/4] Checking Node.js dependencies...
if not exist "node_modules" (
    echo Installing Node.js dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install Node.js dependencies
        pause
        exit /b 1
    )
) else (
    echo Node.js dependencies already installed
)

echo.
echo [2/4] Checking Python dependencies...
python -m pip install --upgrade pip >nul 2>nul
python -m pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install Python dependencies
    pause
    exit /b 1
)

echo.
echo [3/4] Building frontend...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Frontend build failed, but continuing...
)

echo.
echo [4/4] Starting application servers...
echo.
echo ========================================
echo   Application Starting...
echo ========================================
echo.
echo Frontend will be available at: http://localhost:3002
echo.
echo Press Ctrl+C to stop all servers
echo.

REM Start the proxy server (which will auto-start Python backends)
node proxy-server.js

pause
