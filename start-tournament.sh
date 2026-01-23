#!/bin/bash

echo "========================================"
echo "  AI Trading Tournament - Startup"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed"
    echo "Please install Python 3.10-3.13 from https://www.python.org/"
    exit 1
fi

# Check Python version
python3 --version
echo ""

# Check if dependencies are installed
echo "[1/3] Checking dependencies..."
python3 -c "import yfinance, pandas, numpy, anthropic, openai, chromadb" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Installing dependencies..."
    pip3 install -r requirements-tournament.txt
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to install dependencies"
        exit 1
    fi
else
    echo "Dependencies OK"
fi

echo ""
echo "[2/3] Checking API keys..."
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "[WARNING] ANTHROPIC_API_KEY not set"
fi
if [ -z "$OPENAI_API_KEY" ]; then
    echo "[WARNING] OPENAI_API_KEY not set"
fi
if [ -z "$DEEPSEEK_API_KEY" ]; then
    echo "[WARNING] DEEPSEEK_API_KEY not set"
fi
if [ -z "$GOOGLE_API_KEY" ]; then
    echo "[WARNING] GOOGLE_API_KEY not set"
fi

echo ""
echo "[3/3] Starting tournament..."
echo ""
echo "========================================"
echo "  Tournament Starting..."
echo "========================================"
echo ""
echo "Press Ctrl+C to stop"
echo ""

python3 deepseek_python_20260119_ac400a.py
