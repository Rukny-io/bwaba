# Run forms API e2e against local Docker Postgres/Redis.
# Usage: powershell -File test/run-forms-e2e.ps1

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
$envFile = Join-Path $repoRoot '.env.dev'

if (-not (Test-Path $envFile)) {
  Write-Error ".env.dev not found at $envFile"
}

Get-Content $envFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -eq '' -or $line.StartsWith('#')) { return }
  $idx = $line.IndexOf('=')
  if ($idx -lt 1) { return }
  $key = $line.Substring(0, $idx).Trim()
  $val = $line.Substring($idx + 1).Trim().Trim('"')
  [Environment]::SetEnvironmentVariable($key, $val, 'Process')
}

if (-not $env:DB_PASSWORD) {
  Write-Error 'DB_PASSWORD missing in .env.dev'
}

$env:DATABASE_URL = "postgresql://$($env:DB_USER):$($env:DB_PASSWORD)@127.0.0.1:5433/$($env:DB_NAME)"
$env:REDIS_URL = "redis://:$([uri]::EscapeDataString($env:REDIS_PASSWORD))@127.0.0.1:6380"
$env:NODE_ENV = 'test'

Set-Location (Join-Path $PSScriptRoot '..')
npm run test:e2e -- --testPathPatterns=forms.e2e --forceExit
exit $LASTEXITCODE
