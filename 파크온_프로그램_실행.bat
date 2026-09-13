@echo off
chcp 65001 > nul
title 파크온 (ParkOn) - 1인 오토파일럿 파크골프 실행기
cd /d "%~dp0"

echo ===================================================
echo [파크온 (ParkOn)] 파크골프 웹앱 서버를 실행합니다...
echo ===================================================
start "" powershell -NoExit -ExecutionPolicy Bypass -Command "pnpm start:parkon"

echo [2/2] 브라우저에서 파크온을 엽니다...
timeout /t 4 > nul
start http://localhost:3005

echo 파크온이 포트 3005에서 정상 실행 중입니다.
