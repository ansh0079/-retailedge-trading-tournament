# RetailEdge Autonomous Agent Server Launcher
# PowerShell Script

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " RetailEdge Autonomous Agent Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js detected: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found!" -ForegroundColor Red
    Write-Host "  Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit
}

Write-Host ""
Write-Host "Starting server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "📍 Server will be available at: http://localhost:8080" -ForegroundColor Green
Write-Host "📂 Serving: RetailEdge_Autonomous_Agent_v2.html" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Remember to configure your API keys!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start the server
node serve.js
