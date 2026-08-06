@echo off
chcp 65001 > nul
title LandNote Program Launcher
cd /d "%~dp0"

echo [1/2] Starting LandNote Server (API & Web)...
start "" cmd /c "npx pnpm dev"

echo [2/2] Opening LandNote Browser...
timeout /t 5 > nul
start http://localhost:3000

echo LandNote is running in background.
