# Good Soil STEM Kit Catalogue Server Launcher
$env:PYTHONUTF8 = "1"
$env:PYTHONIOENCODING = "utf-8"

Write-Host "========================================================" -ForegroundColor Green
Write-Host "  Starting Good Soil STEM Kit Catalogue Web Server" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Localhost Server URL: http://127.0.0.1:8080" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server." -ForegroundColor Yellow
Write-Host ""

python -m http.server 8080 --bind 127.0.0.1
