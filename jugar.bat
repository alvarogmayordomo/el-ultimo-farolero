@echo off
rem Doble clic para jugar a El Ultimo Farolero en local.
rem Construye la version final del juego, la sirve en http://localhost:4173
rem y abre el navegador. Para terminar, cierra esta ventana.
rem Necesita Node.js instalado.

title El Ultimo Farolero
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
    echo No se encuentra Node.js. Instalalo desde https://nodejs.org y vuelve a probar.
    pause
    exit /b 1
)

if not exist node_modules (
    echo Instalando las dependencias del juego, solo la primera vez...
    call npm ci
    if errorlevel 1 goto error
)

echo Preparando el juego...
call npm run build
if errorlevel 1 goto error

echo.
echo El juego se abre en el navegador: http://localhost:4173
echo Para terminar, cierra esta ventana.
echo.
call npm run preview -- --port 4173 --open
exit /b 0

:error
echo.
echo Algo ha fallado. Lee el mensaje de arriba.
pause
exit /b 1
