@echo off
echo Cerrando backend en puerto 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
  taskkill /PID %%a /F >nul 2>&1
)
echo Listo.
timeout /t 1 /nobreak >nul
