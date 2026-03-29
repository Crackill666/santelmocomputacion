@echo off
cd /d "%~dp0"
powershell -NoProfile -Command "(Get-Content .env) -replace '^MERCADO_PAGO_MODE=.*$','MERCADO_PAGO_MODE=mock' | Set-Content -Encoding UTF8 .env"
echo Mercado Pago en MODO MOCK.
echo Reinicia backend con CLICK_AQUI_CERRAR_TIENDA.cmd y CLICK_AQUI_INICIAR_TIENDA.cmd
pause
