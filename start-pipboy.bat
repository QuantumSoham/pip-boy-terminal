@echo off
echo ☢️  BOOTING PIP-BOY SYSTEM...
echo.

REM Get directory where this .bat file lives
set ROOT=%~dp0

echo 🔧 Starting backend...
start "Pip-Boy Backend" cmd /k "cd /d %ROOT%pip-boy-backend && node index.js"

REM Small delay so backend starts first
timeout /t 1 /nobreak >nul

echo 🖥️  Starting frontend...
start "Pip-Boy Frontend" cmd /k "cd /d %ROOT%pip-boy-frontend && npx serve ."

echo.
echo ✅ PIP-BOY ONLINE
echo.
pause
