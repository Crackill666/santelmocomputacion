@echo off
setlocal
cd /d "%~dp0"

if not exist node_modules (
  echo Instalando dependencias por primera vez...
  npm.cmd install --cache .npm-cache
  if errorlevel 1 (
    echo.
    echo Error instalando dependencias. Cerra esta ventana y avisame.
    pause
    exit /b 1
  )
)

echo.
echo Iniciando tienda... no cierres esta ventana.
echo.

start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000/index.html"

node server.js

echo.
echo El backend se detuvo. Si no fue intencional, avisame y lo reviso.
pause
endlocal
