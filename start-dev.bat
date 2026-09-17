@echo off
echo ========================================
echo  Coffee Shop - Development Servers
echo ========================================
echo.
echo Backend API : http://127.0.0.1:8000
echo Frontend    : http://localhost:5173
echo.
start "Coffee API" cmd /k "cd /d %~dp0backend && php artisan serve --host=127.0.0.1 --port=8000"
timeout /t 2 /nobreak >nul
start "Coffee Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.
echo Servers starting in separate windows...
echo Press any key to close this window.
pause >nul
