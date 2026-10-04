@echo off
chcp 65001 > nul
title [Google Control Hub] 안티그래비티 최고 운영 사령탑 - 김대희 대표님
mode con: cols=92 lines=34
color 0F

cd /d "C:\Users\Admin\.gemini\antigravity\worktrees\landnote\computer_management_app"

:: 파이썬 실행 환경 확인
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [오류] Python이 시스템 PATH에 등록되어 있지 않습니다.
    pause
    exit /b 1
)

:: 사령탑 오케스트레이터 인터랙티브 콘솔 기동
python hub\orchestrator.py

if %errorlevel% neq 0 (
    echo.
    echo [안내] 사령탑 콘솔이 종료되었습니다. 창을 닫으려면 아무 키나 누르세요.
    pause > nul
)
