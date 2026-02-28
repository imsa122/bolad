Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir
Write-Host "Installing dependencies in: $scriptDir" -ForegroundColor Green
Write-Host "This may take several minutes..." -ForegroundColor Yellow

# Remove incomplete node_modules to start fresh
if (Test-Path "node_modules") {
    Write-Host "Removing incomplete node_modules..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "node_modules"
}

# Run npm install and log to file
$logFile = Join-Path $scriptDir "npm-install.log"
Write-Host "Running npm install (logging to npm-install.log)..." -ForegroundColor Green
& "C:\Program Files\nodejs\npm.cmd" install --legacy-peer-deps 2>&1 | Tee-Object -FilePath $logFile
Write-Host "Done! Check npm-install.log for details." -ForegroundColor Green
