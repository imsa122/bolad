Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/ar" -TimeoutSec 15 -UseBasicParsing -MaximumRedirection 5
    Write-Host "HTTP Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Content-Type: $($response.Headers['Content-Type'])" -ForegroundColor Cyan
    $preview = $response.Content.Substring(0, [Math]::Min(800, $response.Content.Length))
    Write-Host "Content Preview:" -ForegroundColor Yellow
    Write-Host $preview
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "The server may still be compiling. Try again in a few seconds." -ForegroundColor Yellow
}
