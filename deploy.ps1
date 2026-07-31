# ============================================
# Rukny.io - Production Deployment Script (Windows)
# Run from project root directory
# ============================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🚀 Rukny.io Production Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ─── Check Docker ───
Write-Host "🔍 Checking Docker..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running! Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# ─── Check .env.production ───
if (-not (Test-Path ".env.production")) {
    Write-Host "❌ .env.production file not found!" -ForegroundColor Red
    Write-Host "   Copy .env.production.example and fill in your values." -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ .env.production found" -ForegroundColor Green

# ─── Check docker-compose.yml ───
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "❌ docker-compose.yml not found!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ docker-compose.yml found" -ForegroundColor Green

# ─── Load .env for display ───
Write-Host ""
Write-Host "📋 Configuration:" -ForegroundColor Yellow
$envContent = Get-Content ".env.production" | Where-Object { $_ -match "^[A-Z]" -and $_ -match "DOMAIN" }
foreach ($line in $envContent) {
    Write-Host "   $line" -ForegroundColor DarkGray
}

# ─── Build Docker images ───
Write-Host ""
Write-Host "📦 Building Docker images (this may take a while)..." -ForegroundColor Yellow
Write-Host ""

docker compose --env-file .env.production build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build completed" -ForegroundColor Green

# ─── Start services ───
Write-Host ""
Write-Host "🔄 Starting services..." -ForegroundColor Yellow

docker compose --env-file .env.production up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start services!" -ForegroundColor Red
    exit 1
}

# ─── Wait for services ───
Write-Host ""
Write-Host "⏳ Waiting for services to be ready (15 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# ─── Show status ───
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  📊 Service Status" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

docker compose --env-file .env.production ps

# ─── Health check ───
Write-Host ""
Write-Host "🏥 Running health checks..." -ForegroundColor Yellow

$services = @(
    @{Name="PostgreSQL"; Url=$null; Container="rukny-postgres"},
    @{Name="Redis"; Url=$null; Container="rukny-redis"},
    @{Name="API"; Url="http://localhost:3001"; Container="rukny-api"},
    @{Name="App"; Url="http://localhost:3000"; Container="rukny-app"},
    @{Name="Accounts"; Url="http://localhost:3005"; Container="rukny-accounts"},
    @{Name="Admin"; Url="http://localhost:3002"; Container="rukny-admin"},
    @{Name="Business"; Url="http://localhost:3003"; Container="rukny-business"},
    @{Name="Developers"; Url="http://localhost:3004"; Container="rukny-developers"}
)

foreach ($svc in $services) {
    $status = docker inspect --format='{{.State.Status}}' $svc.Container 2>$null
    if ($status -eq "running") {
        Write-Host "   ✅ $($svc.Name) - running" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $($svc.Name) - $status" -ForegroundColor Red
    }
}

# ─── Final output ───
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Public URLs (via Cloudflare Tunnel):" -ForegroundColor Cyan
Write-Host "   🌐 Web:        https://rukny.io" -ForegroundColor White
Write-Host "   📱 App:        https://app.rukny.io" -ForegroundColor White
Write-Host "   🔐 Auth:       https://accounts.rukny.io" -ForegroundColor White
Write-Host "   ⚡ API:        https://api.rukny.io" -ForegroundColor White
Write-Host "   🛠️  Admin:      https://admin.rukny.io" -ForegroundColor White
Write-Host "   💼 Business:   https://business.rukny.io" -ForegroundColor White
Write-Host "   👨‍💻 Developers: https://developers.rukny.io" -ForegroundColor White
Write-Host "   📊 DB Admin:   https://db.rukny.io" -ForegroundColor White
Write-Host ""
Write-Host "🖥️  Local URLs:" -ForegroundColor Cyan
Write-Host "   http://localhost:3000  (App)" -ForegroundColor DarkGray
Write-Host "   http://localhost:3001  (API)" -ForegroundColor DarkGray
Write-Host "   http://localhost:3005  (Accounts)" -ForegroundColor DarkGray
Write-Host "   http://localhost:5050  (pgAdmin)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "📝 Useful commands:" -ForegroundColor Yellow
Write-Host "   docker compose --env-file .env.production logs -f      # View logs" -ForegroundColor DarkGray
Write-Host "   docker compose --env-file .env.production ps           # Service status" -ForegroundColor DarkGray
Write-Host "   docker compose --env-file .env.production down         # Stop all" -ForegroundColor DarkGray
Write-Host "   docker compose --env-file .env.production restart api  # Restart API" -ForegroundColor DarkGray
Write-Host ""
