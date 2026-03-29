@echo off
cd /d "%~dp0"
powershell -NoProfile -Command "$c=Get-Content .env; $c=$c -replace '^MERCADO_PAGO_MODE=.*$','MERCADO_PAGO_MODE=real'; $c=$c -replace '^MERCADO_PAGO_FALLBACK_TO_MOCK=.*$','MERCADO_PAGO_FALLBACK_TO_MOCK=true'; $c=$c -replace '^MERCADO_PAGO_TEST_TOKEN_FORCE_MOCK=.*$','MERCADO_PAGO_TEST_TOKEN_FORCE_MOCK=true'; $c | Set-Content -Encoding UTF8 .env"
echo Mercado Pago en MODO DEMO-REAL ^(real + fallback mock^).
echo Reinicia backend con CLICK_AQUI_CERRAR_TIENDA.cmd y CLICK_AQUI_INICIAR_TIENDA.cmd
pause
