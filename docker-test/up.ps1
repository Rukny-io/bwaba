# Rukny docker-test launcher (Windows)
param(
    [switch]$Tunnel,
    [switch]$BuildOnly
)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

if (-not (Test-Path '.env')) {
    Write-Host 'Missing docker-test/.env — copy .env.example and fill values.' -ForegroundColor Red
    exit 1
}

$profiles = @()
if ($Tunnel) { $profiles += 'tunnel' }

$profileArg = @()
if ($profiles.Count -gt 0) {
    $profileArg = $profiles | ForEach-Object { '--profile'; $_ }
}

Write-Host ''
Write-Host 'Rukny docker-test' -ForegroundColor Cyan
Write-Host "  Tunnel: $(if ($Tunnel) { 'yes' } else { 'no (use -Tunnel for cloudflared)' })" -ForegroundColor DarkGray
Write-Host ''

docker compose --env-file .env @profileArg build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if ($BuildOnly) {
    Write-Host 'Build only — done.' -ForegroundColor Green
    exit 0
}

docker compose --env-file .env @profileArg up -d
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Start-Sleep -Seconds 12
docker compose --env-file .env ps

Write-Host ''
Write-Host 'Local:' -ForegroundColor Yellow
Write-Host '  app direct  -> http://127.0.0.1:3000'
Write-Host '  nginx proxy -> http://127.0.0.1:8080  (set Host header to APP_HOST from .env)'
if ($Tunnel) {
    $appUrl = (Get-Content .env | Where-Object { $_ -match '^NEXT_PUBLIC_APP_URL=' }) -replace '^NEXT_PUBLIC_APP_URL=', ''
    if ($appUrl) { Write-Host "  public      -> $appUrl" -ForegroundColor Green }
}
Write-Host ''
