# GitHub Setup Script for RetailEdge Pro
# Run this script after installing Git

Write-Host "🚀 RetailEdge Pro - GitHub Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if Git is installed
try {
    $gitVersion = git --version 2>$null
    Write-Host "✅ Git is installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git is not installed or not in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Git first:" -ForegroundColor Yellow
    Write-Host "  1. Download from: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "  2. Run the installer" -ForegroundColor Yellow
    Write-Host "  3. Restart PowerShell" -ForegroundColor Yellow
    Write-Host "  4. Run this script again" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Check if already initialized
if (Test-Path ".git") {
    Write-Host "✅ Git repository already exists" -ForegroundColor Green
} else {
    Write-Host "📦 Initializing Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Git initialized" -ForegroundColor Green
}

Write-Host ""

# Configure Git (if not configured)
$userName = git config user.name 2>$null
$userEmail = git config user.email 2>$null

if (-not $userName) {
    Write-Host "📝 Git user.name not set" -ForegroundColor Yellow
    $name = Read-Host "Enter your name (for commits)"
    git config --global user.name "$name"
    Write-Host "✅ Name set to: $name" -ForegroundColor Green
}

if (-not $userEmail) {
    Write-Host "📝 Git user.email not set" -ForegroundColor Yellow
    $email = Read-Host "Enter your email"
    git config --global user.email "$email"
    Write-Host "✅ Email set to: $email" -ForegroundColor Green
}

Write-Host ""

# Check for changes
$status = git status --porcelain
if ($status) {
    Write-Host "📋 Files to commit: $($status.Count) changes" -ForegroundColor Cyan
    
    # Add all files
    Write-Host "📦 Adding files..." -ForegroundColor Yellow
    git add .
    
    # Commit
    Write-Host "💾 Committing changes..." -ForegroundColor Yellow
    git commit -m "feat: AI Tournament with all stocks, SSE support, and background execution"
    
    Write-Host "✅ Changes committed" -ForegroundColor Green
} else {
    Write-Host "✅ No changes to commit" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Create a repository on GitHub:" -ForegroundColor White
Write-Host "   https://github.com/new" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Copy the repository URL (e.g., https://github.com/username/repo.git)" -ForegroundColor White
Write-Host ""
Write-Host "3. Run these commands:" -ForegroundColor White
Write-Host "   git remote add origin YOUR_REPO_URL" -ForegroundColor Gray
Write-Host "   git branch -M main" -ForegroundColor Gray
Write-Host "   git push -u origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "Or use GitHub Desktop for easier management!" -ForegroundColor Yellow
Write-Host ""
