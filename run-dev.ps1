#!/usr/bin/env pwsh
# Starts backend and frontend servers for development.
# Requires Maven and Node.js installed locally.

$backend = Start-Process "mvn" "-f backend/pom.xml quarkus:dev" -PassThru -NoNewWindow
$frontend = Start-Process "npm" "--prefix frontend start" -PassThru -NoNewWindow

try {
    Wait-Process -Id $backend.Id, $frontend.Id
} finally {
    if (-not $backend.HasExited) { Stop-Process -Id $backend.Id }
    if (-not $frontend.HasExited) { Stop-Process -Id $frontend.Id }
}
