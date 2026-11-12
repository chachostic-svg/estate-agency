@echo off
chcp 65001 >nul
title Vanguard Realty — Локальный сервер
cd /d "%~dp0"
echo Запуск платформы Vanguard Realty на http://localhost:3000 ...
start "" "http://localhost:3000"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-server.ps1"
pause
