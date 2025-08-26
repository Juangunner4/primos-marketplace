# Test token discovery from database holders
$adminWallet = "EB5uzfZZrWQ8BPEmMNrgrNMNCHR1qprrsspHNNgVEZa6"
$uri = "http://localhost:8080/api/admin/discover-primo-tokens"

Write-Host "Testing token discovery endpoint..." -ForegroundColor Green
Write-Host "Using admin wallet: $adminWallet" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $uri -Method POST -Headers @{
        "X-Public-Key" = $adminWallet
        "Content-Type" = "application/json"
    } -Body "{}"
    
    Write-Host "Discovery Result:" -ForegroundColor Green
    Write-Host $response -ForegroundColor White
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
