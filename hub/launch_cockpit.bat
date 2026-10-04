@echo off
chcp 65001 > nul
title [Google Control Hub] 구글 통합 사령탑 - 컴퓨터 종합 환경 마을
color 0A

cd /d "C:\Users\Admin\.gemini\antigravity\worktrees\landnote\computer_management_app"

echo ==============================================================================
echo   🏰 [구글 통합 사령탑] 컴퓨터 종합 환경 마을(Cyber Village)을 가동합니다.
echo   👑 김대희 사령관님의 가상 마을로 즉시 이동합니다...
echo ==============================================================================

:: 1. 마을 서버(포트 3000) 가동 여부 확인 및 백그라운드 기동
netstat -ano | findstr :3000 >nul 2>nul
if %errorlevel% neq 0 (
    echo [1/2] 🏰 마을 관할 서버(Port 3000)를 가동합니다...
    start /b python hub\village_server.py >nul 2>nul
    timeout /t 1 /nobreak >nul
)

:: 2. 영상·만화 스튜디오(포트 3050) 가동 여부 확인 및 백그라운드 기동
netstat -ano | findstr :3050 >nul 2>nul
if %errorlevel% neq 0 (
    echo [2/2] 🎬 영상·미디어 공방 서버(Port 3050)를 가동합니다...
    start /b python apps\paki-toon\server.py >nul 2>nul
    timeout /t 1 /nobreak >nul
)

:: 3. 브라우저로 마을 전경 즉시 오픈
echo 🚀 대표님 모니터에 컴퓨터 종합 환경 마을을 펼칩니다!
start http://localhost:3000

timeout /t 2 /nobreak >nul
exit
