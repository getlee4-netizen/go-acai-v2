@echo off
echo ========================================
echo   GO ACAI v2 - Servidor de Desenvolvimento
echo ========================================
echo.
cd /d "%~dp0"
echo Iniciando servidor na porta 3001...
echo URL: http://localhost:3001
echo.
call npx next dev -p 3001
pause
