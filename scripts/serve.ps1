param(
  [int]$Port = 5500
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

Write-Host "Starting local server for TCS Video Essay" -ForegroundColor Cyan
Write-Host "Root: $repoRoot" -ForegroundColor DarkGray
Write-Host "URL:  http://localhost:$Port/" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop." -ForegroundColor Yellow

python -m http.server $Port
