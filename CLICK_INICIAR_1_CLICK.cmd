@echo off
setlocal
cd /d "%~dp0"

set "PROFILE=%~1"
if /I "%PROFILE%"=="" set "PROFILE=demo"
if /I "%PROFILE%"=="real" set "PROFILE=estricto"

if /I not "%PROFILE%"=="demo" if /I not "%PROFILE%"=="estricto" (
  echo Perfil invalido: %PROFILE%
  echo Uso: CLICK_INICIAR_1_CLICK.cmd [demo^|estricto]
  pause
  exit /b 1
)

if not exist .env (
  if exist .env.example (
    copy /Y .env.example .env >nul
  ) else (
    echo No existe .env ni .env.example. No se puede iniciar.
    pause
    exit /b 1
  )
)

set "RUNTIME_LABEL=DEMO-REAL"
set "MP_MODE=real"
set "MP_FALLBACK=true"
set "MP_FORCE_MOCK=true"
if /I "%PROFILE%"=="estricto" (
  set "RUNTIME_LABEL=REAL ESTRICTO"
  set "MP_MODE=real"
  set "MP_FALLBACK=false"
  set "MP_FORCE_MOCK=false"
)

powershell -NoProfile -Command "$path='.env'; $c=Get-Content $path; function SetKey([string]$k,[string]$v){ $p='^'+[regex]::Escape($k)+'=.*$'; if($c -match $p){ $script:c = $script:c -replace $p, ($k+'='+$v) } else { $script:c += ($k+'='+$v) } }; SetKey 'MERCADO_PAGO_MODE' '%MP_MODE%'; SetKey 'MERCADO_PAGO_FALLBACK_TO_MOCK' '%MP_FALLBACK%'; SetKey 'MERCADO_PAGO_TEST_TOKEN_FORCE_MOCK' '%MP_FORCE_MOCK%'; Set-Content -Encoding UTF8 $path $c"
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

echo Iniciando tienda en modo %RUNTIME_LABEL%...
start "Santelmo Backend" /D "%~dp0" cmd /k "node server.js"

ping 127.0.0.1 -n 4 >nul
start "" "http://localhost:3000/index.html"

echo.
echo Tienda iniciada en modo %RUNTIME_LABEL%.
echo Si queres forzar MP real sin fallback: CLICK_INICIAR_1_CLICK.cmd estricto
endlocal
