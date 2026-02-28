Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir
Write-Host "Starting dev server in: $scriptDir" -ForegroundColor Green
& "C:\Program Files\nodejs\npm.cmd" run dev
