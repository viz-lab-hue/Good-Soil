@echo off
title Good Soil STEM Kit Catalogue Server
echo ========================================================
echo   Starting Good Soil STEM Kit Catalogue Web Server
echo ========================================================
echo.

set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8

echo Localhost Server URL: http://127.0.0.1:8080
echo Press Ctrl+C in this window to stop the server.
echo.

python -m http.server 8080 --bind 127.0.0.1
pause
