@echo off
echo ========================================
echo   AI Trading Tournament - Startup
echo ========================================
echo.

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.10-3.13 from https://www.python.org/
    pause
    exit /b 1
)

REM Check Python version
python --version
echo.

REM Check if dependencies are installed
echo [1/3] Checking dependencies...
python -c "import yfinance, pandas, numpy, anthropic, openai, chromadb" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing dependencies...
    pip install -r requirements-tournament.txt
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo Dependencies OK
)

echo.
echo [2/3] Checking API keys...
if "%ANTHROPIC_API_KEY%"=="" (
    echo [WARNING] ANTHROPIC_API_KEY not set
)
if "%OPENAI_API_KEY%"=="" (
    echo [WARNING] OPENAI_API_KEY not set
)
if "%DEEPSEEK_API_KEY%"=="" (
    echo [WARNING] DEEPSEEK_API_KEY not set
)
if "%GOOGLE_API_KEY%"=="" (
    echo [WARNING] GOOGLE_API_KEY not set
)

echo.
echo [3/3] Starting tournament...
echo.
echo ========================================
echo   Tournament Starting...
echo ========================================
echo.
echo Press Ctrl+C to stop
echo.

python deepseek_python_20260119_ac400a.py

pause
