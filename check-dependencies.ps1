# Quick dependency checker
Write-Host "`n=== Checking Dependencies ===" -ForegroundColor Cyan

$packages = @{
    "yfinance" = "Stock data"
    "pandas" = "Data analysis"
    "numpy" = "Numerical computing"
    "anthropic" = "Claude API"
    "openai" = "DeepSeek/Kimi API"
    "chromadb" = "Vector database (optional)"
    "google.generativeai" = "Gemini API"
}

$allGood = $true

foreach ($pkg in $packages.Keys) {
    $result = python -c "import $pkg; print('OK')" 2>&1
    if ($result -match "OK") {
        Write-Host "✅ $pkg - $($packages[$pkg])" -ForegroundColor Green
    } else {
        Write-Host "❌ $pkg - $($packages[$pkg])" -ForegroundColor Red
        $allGood = $false
    }
}

Write-Host ""

if ($allGood) {
    Write-Host "✅ All dependencies ready!" -ForegroundColor Green
    Write-Host "`nYou can now run:" -ForegroundColor Cyan
    Write-Host "  python deepseek_python_20260119_ac400a.py --days 1" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  Some dependencies missing. Install with:" -ForegroundColor Yellow
    Write-Host "  python -m pip install -r requirements-tournament.txt" -ForegroundColor Yellow
}

Write-Host ""
