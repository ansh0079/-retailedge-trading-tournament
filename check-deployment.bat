@echo off
echo ========================================
echo  Checking Render Deployment Status
echo ========================================
echo.

set URL=https://retailedge-trading-tournament-1.onrender.com

echo [1/4] Testing main app...
curl -s -o nul -w "Status: %%{http_code}\n" %URL%
echo.

echo [2/4] Testing health endpoint...
curl -s -o nul -w "Status: %%{http_code}\n" %URL%/api/health
echo.

echo [3/4] Testing market status...
curl -s -o nul -w "Status: %%{http_code}\n" %URL%/api/market/status
echo.

echo [4/4] Fetching health details (if available)...
curl -s %URL%/api/health 2>nul
echo.
echo.

echo ========================================
echo  Status Codes:
echo  - 200 = OK (endpoint working)
echo  - 404 = Not Found (endpoint missing)
echo  - 503 = Service sleeping (wait 30s)
echo ========================================
echo.

echo Your Render Dashboard:
echo https://dashboard.render.com/web/retailedge-trading-tournament-1
echo.
echo Your Live App:
echo %URL%
echo.

pause
