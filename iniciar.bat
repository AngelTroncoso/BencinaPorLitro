@echo off
chcp 65001 > nul
title Bencinas Mas Baratas de Chile + Waze
echo ===================================================
echo   🚗 Bencinas Mas Baratas de Chile + Waze
echo ===================================================
echo Iniciando servidor local en http://localhost:3000 ...
timeout /t 2 /nobreak > nul
start "" "http://localhost:3000"
node server.js
pause
