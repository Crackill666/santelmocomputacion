@echo off
setlocal
cd /d "%~dp0"

if not exist .env (
  if exist .env.example (
    copy /Y .env.example .env >nul
  ) else (
    echo No existe .env ni .env.example.
    pause
    exit /b 1
  )
)

echo Configurando modo MOCK para pruebas...
powershell -NoProfile -Command "$path='.env'; $c=Get-Content $path; function SetKey([string]$k,[string]$v){ $p='^'+[regex]::Escape($k)+'=.*$'; if($c -match $p){ $script:c = $script:c -replace $p, ($k+'='+$v) } else { $script:c += ($k+'='+$v) } }; SetKey 'MERCADO_PAGO_MODE' 'mock'; SetKey 'MERCADO_PAGO_FALLBACK_TO_MOCK' 'true'; SetKey 'MERCADO_PAGO_TEST_TOKEN_FORCE_MOCK' 'true'; Set-Content -Encoding UTF8 $path $c"
if errorlevel 1 (
  echo No se pudo actualizar .env
  pause
  exit /b 1
)

echo Cerrando backend previo en puerto 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
  taskkill /PID %%a /F >nul 2>&1
)

if not exist node_modules (
  echo Instalando dependencias...
  npm.cmd install --cache .npm-cache
  if errorlevel 1 (
    echo Error instalando dependencias.
    pause
    exit /b 1
  )
)

echo.
echo ===============================================
echo Backend iniciando en MOCK...
echo No cierres esta ventana.
echo ===============================================
echo Cuando veas "Servidor listo", abrir:
echo http://localhost:3000/catalogo.html
echo ===============================================
echo.

npm.cmd start

endlocal
