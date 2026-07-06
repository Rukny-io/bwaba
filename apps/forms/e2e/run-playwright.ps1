# Run Playwright E2E (requires API :3001 + public :3000 + forms :3007 + DATABASE_URL).
# Usage: powershell -File e2e/run-playwright.ps1
# Tests: e2e/golden-path.spec.ts (dashboard + roundtrip), e2e/public-form.spec.ts

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
$envFile = Join-Path $repoRoot '.env.dev'

if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -eq '' -or $line.StartsWith('#')) { return }
    $idx = $line.IndexOf('=')
    if ($idx -lt 1) { return }
    $key = $line.Substring(0, $idx).Trim()
    $val = $line.Substring($idx + 1).Trim().Trim('"')
    [Environment]::SetEnvironmentVariable($key, $val, 'Process')
  }
  if ($env:DB_PASSWORD) {
    $env:DATABASE_URL = "postgresql://$($env:DB_USER):$($env:DB_PASSWORD)@127.0.0.1:5433/$($env:DB_NAME)"
  }
}

$env:E2E_PUBLIC_APP_URL = if ($env:E2E_PUBLIC_APP_URL) { $env:E2E_PUBLIC_APP_URL } else { 'http://localhost:3006' }

Set-Location (Split-Path $PSScriptRoot -Parent)
npm run test:e2e
exit $LASTEXITCODE
