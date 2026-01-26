@echo off
echo Opening browser to http://localhost:3002
timeout /t 2 /nobreak >nul
start http://localhost:3002
echo.
echo Browser should open automatically.
echo If not, manually navigate to: http://localhost:3002
pause
