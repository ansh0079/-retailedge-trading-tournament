@echo off
echo ========================================
echo   Testing Server Connection
echo ========================================
echo.

echo [1/4] Checking if server is running...
netstat -ano | findstr ":3002" | findstr "LISTENING"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Server is NOT running on port 3002
    echo Please start the server first: node proxy-server.js
    pause
    exit /b 1
)
echo [OK] Server is running on port 3002
echo.

echo [2/4] Testing HTTP connection...
curl http://localhost:3002 -UseBasicParsing -TimeoutSec 3 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Cannot connect to http://localhost:3002
    pause
    exit /b 1
)
echo [OK] Server is responding
echo.

echo [3/4] Checking required files...
if not exist "dist\index.html" (
    echo [ERROR] dist\index.html not found
    echo Please run: npm run build
    pause
    exit /b 1
)
if not exist "dist\app.js" (
    echo [ERROR] dist\app.js not found
    echo Please run: npm run build
    pause
    exit /b 1
)
if not exist "dist\tailwind.css" (
    echo [ERROR] dist\tailwind.css not found
    echo Please run: npm run build
    pause
    exit /b 1
)
echo [OK] All required files exist
echo.

echo [4/4] Opening browser...
start http://localhost:3002
echo.
echo ========================================
echo   Server Status: READY
echo ========================================
echo.
echo Application URL: http://localhost:3002
echo.
echo If the page doesn't load:
echo 1. Check browser console (F12) for errors
echo 2. Verify firewall isn't blocking port 3002
echo 3. Try a different browser
echo.
pause
