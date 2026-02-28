Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
$outFile = "C:\Users\pccra\OneDrive\سطح المكتب\bolad\real-estate-platform\error-response.txt"
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/ar" -TimeoutSec 15 -UseBasicParsing -MaximumRedirection 5 -ErrorAction Stop
    Write-Host "HTTP Status: $($response.StatusCode)"
    $response.Content | Out-File -FilePath $outFile -Encoding UTF8
    Write-Host "Saved to $outFile"
} catch {
    Write-Host "HTTP Error: $($_.Exception.Response.StatusCode)"
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $body = $reader.ReadToEnd()
    $body | Out-File -FilePath $outFile -Encoding UTF8
    Write-Host "Error body saved to $outFile"
    Write-Host "First 1000 chars:"
    Write-Host $body.Substring(0, [Math]::Min(1000, $body.Length))
}
