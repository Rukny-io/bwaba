# رفع apps/app فقط (rukny.work)
param(
    [switch]$Tunnel,
    [switch]$BuildOnly
)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$composeFile = 'docker-compose.app.yml'

if (-not (Test-Path '.env')) {
    if (Test-Path '.env.app.example') {
        Copy-Item .env.app.example .env
        Write-Host 'Created .env from .env.app.example — set CLOUDFLARE_TUNNEL_TOKEN if using -Tunnel' -ForegroundColor Yellow
    } else {
        Write-Host 'Missing docker-test/.env' -ForegroundColor Red
        exit 1
    }
}

$profileArg = @()
if ($Tunnel) {
    $tokenLine = Get-Content .env -ErrorAction SilentlyContinue | Where-Object { $_ -match '^CLOUDFLARE_TUNNEL_TOKEN=' }
    $token = if ($tokenLine) { ($tokenLine -replace '^CLOUDFLARE_TUNNEL_TOKEN=', '').Trim() } else { '' }
    if (-not $token) {
        Write-Host 'CLOUDFLARE_TUNNEL_TOKEN is empty in .env — cloudflared will fail and rukny.work will show 502.' -ForegroundColor Red
        Write-Host 'Cloudflare Zero Trust -> Networks -> Tunnels -> copy token into .env' -ForegroundColor Yellow
        exit 1
    }
    $profileArg = '--profile', 'tunnel'
}

Write-Host ''
Write-Host 'Rukny apps/app only (rukny.work)' -ForegroundColor Cyan
Write-Host "  Tunnel: $(if ($Tunnel) { 'yes' } else { 'no' })" -ForegroundColor DarkGray
Write-Host ''

docker compose -f $composeFile --env-file .env @profileArg build app
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if ($BuildOnly) {
    Write-Host 'Build done.' -ForegroundColor Green
    exit 0
}

docker compose -f $composeFile --env-file .env @profileArg up -d
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Start-Sleep -Seconds 5
docker compose -f $composeFile --env-file .env ps

Write-Host ''
Write-Host 'Local:  http://127.0.0.1:3000' -ForegroundColor Yellow
if ($Tunnel) {
    $appUrl = (Get-Content .env | Where-Object { $_ -match '^NEXT_PUBLIC_APP_URL=' }) -replace '^NEXT_PUBLIC_APP_URL=', ''
    if ($appUrl) { Write-Host "Public: $appUrl" -ForegroundColor Green }
}
Write-Host ''
Write-Host 'Cloudflare: rukny.work -> http://app:3000' -ForegroundColor DarkGray
Write-Host ''
