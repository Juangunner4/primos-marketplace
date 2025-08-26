# Test public token discovery endpoint
$uri = "http://localhost:8080/api/trench/discover-primo-tokens"

Write-Host "Testing public token discovery endpoint..." -ForegroundColor Green
Write-Host "Endpoint: $uri" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $uri -Method POST -Headers @{
        "Content-Type" = "application/json"
    } -Body "{}"
    
    Write-Host "Discovery Result:" -ForegroundColor Green
    Write-Host "Success: $($response.success)" -ForegroundColor $(if($response.success) { "Green" } else { "Red" })
    Write-Host "Message: $($response.message)" -ForegroundColor White
} catch {
    Write-Host "Error occurred:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody" -ForegroundColor Yellow
    }
}

Read-Host "Press any key to continue"
