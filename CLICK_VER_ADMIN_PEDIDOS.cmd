@echo off
setlocal
cd /d "%~dp0"

echo Abriendo panel admin de pedidos...
start "" "http://localhost:3000/stc-admin-orders-9x7q"

echo.
if exist .env (
  for /f "tokens=1,* delims==" %%A in ('findstr /R "^ADMIN_PANEL_TOKEN=" .env') do set "ADMIN_TOKEN=%%B"
  if defined ADMIN_TOKEN (
    echo Si el panel pide token, usa este valor:
    echo %ADMIN_TOKEN%
  ) else (
    echo No se encontro ADMIN_PANEL_TOKEN en .env
  )
) else (
  echo No se encontro archivo .env
)

echo.
echo Si no abre la pagina, primero inicia backend con CLICK_PROBAR_PEDIDOS.cmd
pause
endlocal
