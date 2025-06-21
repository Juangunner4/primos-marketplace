#!/usr/bin/env pwsh
# Starts backend and frontend servers for development.
# Requires Maven and Node.js installed locally.

$backend = Start-Process "mvn" "-f backend/pom.xml quarkus:dev" -PassThru -NoNewWindow
$frontend = Start-Process "npm.cmd" "--prefix frontend start" -PassThru -NoNewWindow

try {
    if ($backend -and $frontend) {
        Wait-Process -Id $backend.Id, $frontend.Id
    } else {
        Write-Host "One or both processes failed to start."
    }
} finally {
        if ($backend -and -not $backend.HasExited) { Stop-Process -Id $backend.Id }
        if ($frontend -and -not $frontend.HasExited) { Stop-Process -Id $frontend.Id }
    }