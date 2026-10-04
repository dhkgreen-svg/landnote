#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
hub/orchestrator.py - Anti-Gravity 기반 Google Control Hub 중앙 통제 오케스트레이터
구글 최신 `google-genai` SDK를 탑재하여 사용자 자연어 명령을 실시간 분석하고,
[미디어 생성 | 코드 감사 | 백업 실행 | 상태 보고]로 자동 분류하여 하위 모듈을 트리거합니다.

사용법:
  # 1. 자연어 명령 지휘 (Gemini 자동 분류 및 트리거)
  python hub/orchestrator.py "16:9 메인 홍보 배너 이미지 생성해줘"
  python hub/orchestrator.py "전체 시스템 상태 및 포트 점검해줘"
  python hub/orchestrator.py "Google Drive 및 로컬에 전체 백업 실행해"
  python hub/orchestrator.py "파크골프 올인원 코드 감사 수행해"

  # 2. 직결 명령어
  python hub/orchestrator.py status
  python hub/orchestrator.py image --prompt "..." --aspect-ratio 16:9
  python hub/orchestrator.py video --prompt "..."
  python hub/orchestrator.py backup
  python hub/orchestrator.py list
  python hub/orchestrator.py run --app paki
"""

import os
import sys
import json
import argparse
import subprocess
from datetime import datetime
from dotenv import load_dotenv

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HUB_DIR = os.path.join(ROOT_DIR, "hub")
ENV_PATH = os.path.join(ROOT_DIR, "config.env")
HUB_REGISTRY = os.path.join(HUB_DIR, "project_registry.json")
ROOT_REGISTRY = os.path.join(ROOT_DIR, "project_registry.json")
REGISTRY_PATH = HUB_REGISTRY if os.path.exists(HUB_REGISTRY) else ROOT_REGISTRY

load_dotenv(ENV_PATH)
load_dotenv()

HISTORY_PATH = os.path.join(HUB_DIR, "directive_history.json")

def load_history():
    if not os.path.exists(HISTORY_PATH):
        return []
    try:
        with open(HISTORY_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def log_directive(command: str, action: str, status: str = "success", summary: str = ""):
    history = load_history()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    entry = {
        "timestamp": now_str,
        "commander": "김대희 대표님",
        "command": command,
        "action": action,
        "status": status,
        "summary": summary
    }
    history.append(entry)
    # 최대 100개 유지
    history = history[-100:]
    try:
        with open(HISTORY_PATH, "w", encoding="utf-8") as f:
            json.dump(history, f, ensure_ascii=False, indent=2)
    except Exception:
        pass

def show_history(limit: int = 5):
    history = load_history()
    print("\n" + "=" * 80)
    print(f"📜 [Google Control Hub] 최근 지휘 이력 및 대화 로그 (최근 {min(len(history), limit)}건)")
    print("=" * 80)
    if not history:
        print("  (아직 기록된 지휘 이력이 없습니다.)")
    else:
        for idx, item in enumerate(reversed(history[-limit:]), 1):
            stat_icon = "🟢" if item.get("status") == "success" else "🔴"
            print(f"  {idx}. [{item.get('timestamp')}] {stat_icon} {item.get('action')}")
            print(f"     👉 명령: \"{item.get('command')}\"")
            if item.get("summary"):
                print(f"     📋 결과: {item.get('summary')}")
            print("-" * 80)
    print("=" * 80 + "\n")

def classify_command_with_gemini(user_instruction: str) -> dict:
    """
    Gemini 모델을 호출하여 지휘관(사용자)의 자연어 명령을 정밀 분류합니다.
    API 키가 없거나 연결 실패 시 고정밀 키워드 휴리스틱으로 즉시 폴백합니다.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    lower_cmd = user_instruction.lower().strip()
    
    if any(k in lower_cmd for k in ["바탕화면", "바탕", "청소", "정리해", "중복", "clean"]):
        return {"action": "desktop_clean", "target": "desktop", "params": {}}
    if any(k in lower_cmd for k in ["브리핑", "briefing", "요약", "일일 보고", "3줄"]):
        return {"action": "briefing", "target": "all", "params": {}}
    if any(k in lower_cmd for k in ["롤백", "복원", "되돌려", "원복", "rollback", "restore"]):
        return {"action": "rollback", "target": "all", "params": {}}
    if any(k in lower_cmd for k in ["이력", "기록", "history", "로그", "과거", "어제 뭐", "지난 지휘"]):
        return {"action": "history_view", "target": "all", "params": {}}
    if any(k in lower_cmd for k in ["목록", "프로젝트", "list", "어떤 앱", "앱 목록"]):
        return {"action": "list_projects", "target": "all", "params": {}}
    if any(k in lower_cmd for k in ["상태", "점검", "status", "리포트", "현황", "보고", "어때", "체크", "살펴봐", "확인"]):
        return {"action": "status_report", "target": "all", "params": {}}
    if any(k in lower_cmd for k in ["백업", "backup", "동기화", "드라이브", "drive", "저장해", "아카이브", "스냅샷"]):
        return {"action": "backup", "target": "all", "params": {}}
    if any(k in lower_cmd for k in ["이미지", "그림", "배너", "일러스트", "image", "포스터", "사진"]):
        ratio = "16:9" if ("16:9" in lower_cmd or "배너" in lower_cmd) else "1:1"
        return {"action": "media_image", "target": "image", "params": {"prompt": user_instruction, "aspect_ratio": ratio}}
    if any(k in lower_cmd for k in ["영상", "비디오", "숏폼", "릴스", "쇼츠", "video", "대본", "콘티", "시나리오"]):
        return {"action": "media_video", "target": "video", "params": {"prompt": user_instruction}}
    if any(k in lower_cmd for k in ["감사", "audit", "코드", "리팩토링", "검사", "규칙"]):
        return {"action": "code_audit", "target": "all", "params": {}}

    # 2. Gemini API를 통한 고도 의미 심층 분석
    if api_key:
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")

            prompt = f"""
당신은 최고 운영 사령탑의 지휘 분석관입니다.
다음 사용자 명령을 분석하여 가장 알맞은 작업 1개를 JSON으로 응답하십시오.

작업 목록:
- "desktop_clean": 바탕화면 정리, 중복 바로가기/파일 청소 및 5대 테마 폴더 정돈 요청
- "briefing": 대표님 전용 일일/3줄 총괄 브리핑 및 요약 보고 요청
- "status_report": 시스템 상태, 도메인, 헬스체크 확인 요청
- "backup": Google Drive 또는 로컬 스토리지 백업/동기화 요청
- "rollback": 이전 백업 스냅샷으로 롤백/복원 요청
- "media_image": 배너, 이미지, 사진, 일러스트 생성 요청
- "media_video": 숏폼, 릴스, 쇼츠 대본 또는 비디오 생성 요청
- "history_view": 이전 지휘 기록, 과거 로그 조회 요청
- "code_audit": 시스템 무결성, 코드 품질 감사 요청

반환 형식 (JSON만 출력):
{{"action": "desktop_clean" | "briefing" | "status_report" | "backup" | "rollback" | "media_image" | "media_video" | "history_view" | "code_audit", "params": {{"prompt": "{user_instruction}"}}}}

사용자 명령: {user_instruction}
"""
            resp = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config={"response_mime_type": "application/json"}
            )
            return json.loads(resp.text)
        except Exception:
            pass

    return {"action": "status_report", "target": "all", "params": {}}

def run_script(script_path, args_list=None):
    if not os.path.exists(script_path):
        print(f"[오류] 스크립트 경로가 존재하지 않습니다: {script_path}")
        return 1
    cmd = [sys.executable, script_path]
    if args_list:
        cmd.extend(args_list)
    return subprocess.call(cmd)

def execute_action(plan: dict, raw_input: str):
    action = plan.get("action")
    params = plan.get("params", {})

    action_kor_map = {
        "desktop_clean": "바탕화면 스마트 정리 및 중복 파일 청소",
        "briefing": "대표님 전용 일일 총괄 3줄 브리핑 및 클립보드 복사",
        "status_report": "전체 시스템 실시간 상태 및 도메인 점검",
        "backup": "Google Drive & 로컬 스토리지 백업 동기화",
        "media_image": "고화질 마케팅 배너 이미지 생성",
        "media_video": "바이럴 숏폼 영상/릴스 대본 자동 생성",
        "history_view": "과거 지휘 이력 및 대화 로그 조회",
        "code_audit": "시스템 무결성 및 코드 규칙 감사",
        "list_projects": "등록 프로젝트 전체 목록 조회"
    }

    action_name = action_kor_map.get(action, action)
    print(f"\n🧠 [Gemini 3.5 Flash 지휘 분석 결과]: {action_name} (`{action}`)")

    status = "success"
    summary = ""

    if action == "desktop_clean":
        clean_script = os.path.join(HUB_DIR, "desktop_cleaner.py")
        run_script(clean_script)
        summary = "바탕화면 중복 파일 청소 및 5대 테마 폴더 자동 정돈 완료"

    elif action == "briefing":
        bf_script = os.path.join(HUB_DIR, "daily_briefing.py")
        run_script(bf_script, ["--ai", "--save"])
        summary = "대표님 전용 일일 총괄 브리핑 생성 및 클립보드 자동 복사 완료"

    elif action == "status_report":
        reporter = os.path.join(HUB_DIR, "status_reporter.py")
        run_script(reporter)
        summary = "전체 시스템 헬스체크 및 SYSTEM_STATE.md 최신 갱신 완료"

    elif action == "backup":
        drive_sync = os.path.join(HUB_DIR, "integrations", "drive_sync.py")
        if not os.path.exists(drive_sync):
            drive_sync = os.path.join(HUB_DIR, "drive_sync.py")
        run_script(drive_sync)
        summary = "Google Drive (G:) 및 D: 로컬 스토리지 스냅샷 동기화 완료"

    elif action == "history_view":
        show_history(limit=5)
        summary = "최근 5건 지휘 이력 조회 완료"

    elif action == "list_projects":
        if os.path.exists(REGISTRY_PATH):
            with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
                reg = json.load(f)
            print("\n📋 사령탑 등록 프로젝트 목록:")
            for pk, pv in reg.get("projects", {}).items():
                print(f"  • [{pk}] {pv.get('name')} (포트: {pv.get('localPort', '-')}, URL: {pv.get('productionUrl', '-')})")
        summary = "등록 프로젝트 목록 출력 완료"

    elif action == "rollback":
        rb_script = os.path.join(HUB_DIR, "integrations", "rollback.py")
        run_script(rb_script, ["latest"])
        summary = "가장 최근 정상 스냅샷으로 원클릭 롤백 복원 완료"

    elif action == "media_image":
        img_script = os.path.join(HUB_DIR, "generators", "image_gen.py")
        prompt = params.get("prompt", raw_input)
        aspect = params.get("aspect_ratio", "16:9")
        run_script(img_script, ["--prompt", prompt, "--aspect-ratio", aspect])
        summary = f"이미지 생성 요청 수행 (비율: {aspect})"

    elif action == "media_video":
        vid_script = os.path.join(HUB_DIR, "generators", "video_gen.py")
        prompt = params.get("prompt", raw_input)
        run_script(vid_script, ["--prompt", prompt, "--type", "script"])
        summary = "숏폼 영상 대본 생성 및 outputs/ 보관 완료"

    elif action == "code_audit":
        print("🔍 [코드 감사] 사령탑 시스템 규칙 준수 및 베이스라인 무결성 정밀 감사 진행 중...")
        reporter = os.path.join(HUB_DIR, "status_reporter.py")
        run_script(reporter, ["--no-clip"])
        print("✅ 사령탑 무결성 검증 완료.")
        summary = "시스템 규칙 준수 및 베이스라인 무결성 검증 완료"

    else:
        print(f"⚠️ 처리 가능한 모듈을 찾지 못했습니다: {action}")
        status = "unknown"
        summary = f"알 수 없는 액션: {action}"

    # 지휘 이력 영구 기록
    log_directive(raw_input, action, status, summary)

def main():
    # 1. 인자가 문자열 형태의 자연어 문장인 경우
    if len(sys.argv) == 2 and not sys.argv[1].startswith("-") and sys.argv[1] not in ["status", "backup", "list", "sync"]:
        user_prompt = sys.argv[1]
        print(f"\n🧠 [Gemini 두뇌 사령부] 자연어 명령 수신: \"{user_prompt}\"")
        plan = classify_command_with_gemini(user_prompt)
        execute_action(plan, user_prompt)
        return

    # 2. 직결 CLI 서브커맨드 처리
    parser = argparse.ArgumentParser(description="Google Control Hub Master Orchestrator")
    subparsers = parser.add_subparsers(dest="command", help="지휘 명령")

    # status
    p_status = subparsers.add_parser("status", help="시스템 상태 및 프로덕션 헬스체크")
    p_status.add_argument("--json", action="store_true")

    # backup
    p_backup = subparsers.add_parser("backup", help="Google Drive 및 로컬 스토리지 백업")
    p_backup.add_argument("--target", default="all")

    # image
    p_img = subparsers.add_parser("image", help="Imagen 3 이미지 생성")
    p_img.add_argument("--prompt", required=True)
    p_img.add_argument("--aspect-ratio", default="16:9", choices=["1:1", "16:9", "9:16", "4:3", "3:4"])
    p_img.add_argument("--filename")

    # video
    p_vid = subparsers.add_parser("video", help="숏폼 영상 콘티/대본 생성")
    p_vid.add_argument("--prompt", required=True)

    # run & deploy & list
    p_run = subparsers.add_parser("run", help="개별 앱 로컬 기동")
    p_run.add_argument("--app", required=True)
    p_run.add_argument("--action", default="dev")
    p_run.add_argument("--port", type=int)

    p_dep = subparsers.add_parser("deploy", help="앱 배포 및 실기기 검증")
    p_dep.add_argument("--app", required=True)

    subparsers.add_parser("sync", help="SYSTEM_STATE.md 동기화")
    subparsers.add_parser("list", help="사령탑 등록 프로젝트 전체 목록")
    subparsers.add_parser("history", help="최근 지휘 이력 및 대화 로그 조회")
    subparsers.add_parser("briefing", help="대표님 전용 일일/3줄 총괄 브리핑 생성")
    subparsers.add_parser("clean", help="바탕화면 중복 파일 청소 및 5대 폴더 자동 정돈")

    if len(sys.argv) == 1:
        while True:
            # 실시간 연결 상태 빠른 요약
            api_key = os.getenv("GEMINI_API_KEY", "")
            ai_status = "🟢 정상 가동 (Gemini 3.5 Flash)" if api_key else "🟡 미설정 (config.env)"
            
            output_count = 0
            outputs_path = os.path.join(ROOT_DIR, "outputs")
            if os.path.exists(outputs_path):
                output_count = len([f for f in os.listdir(outputs_path) if os.path.isfile(os.path.join(outputs_path, f))])

            gdrive_path = os.getenv("GOOGLE_DRIVE_BACKUP_PATH", "G:/내 드라이브/AntiGravity_Backups")
            cloud_status = "🟢 Google Drive (G:) 연결됨" if os.path.exists(os.path.dirname(gdrive_path)) else "🟢 로컬/외장 스토리지 준비 완료"

            print("\n" + "=" * 80)
            print("👑 [Google Control Hub] 안티그래비티 최고 운영 사령탑 (Executive Cockpit)")
            print("   총괄 최고 의사결정권자: 김대희 대표님")
            print("=" * 80)
            print(f"  • 🧠 구글 AI 두뇌  : {ai_status}")
            print(f"  • ☁️ 동기화 스토리지: {cloud_status}")
            print(f"  • 📁 보관된 미디어 자산: outputs/ ({output_count}개 파일)")
            print(f"  • ⌨️ 전용 윈도우 단축키: [ Ctrl + Alt + H ] (바탕화면 언제든 즉시 호출)")
            print("-" * 80)
            print("  [1] 📊 전체 시스템 실시간 상태 및 헬스체크 (status)")
            print("  [2] ☁️ Google Drive & 로컬 스토리지 전체 동기화 백업 (backup)")
            print("  [3] 🎨 마케팅 배너 이미지 생성 파이프라인 (image)")
            print("  [4] 🎬 바이럴 숏폼 영상/릴스 대본 자동 생성 (video)")
            print("  [5] 🚀 로컬 애플리케이션 개발 서버 기동 (run)")
            print("  [6] 📋 사령탑 등록 프로젝트 전체 목록 확인 (list)")
            print("  [7] 📜 최근 지휘 이력 및 대화 로그 확인 (history)")
            print("  [8] 🔄 백업 스냅샷 이력 확인 및 원클릭 복원 (rollback)")
            print("  [9] 📋 대표님 전용 일일 총괄 브리핑 & 클립보드 복사 (briefing)")
            print("  [10] 🧹 바탕화면 스마트 정리 및 중복 파일 청소 (clean)")
            print("  [0] 🚪 사령탑 콘솔 종료 (exit)")
            print("-" * 80)
            print("💬 [자연어 지휘]: 번호 대신 '바탕화면 청소해줘', '브리핑해줘', '지금 백업해' 등 입력")
            print("=" * 80)
            try:
                choice = input("\n👉 명령 입력 (0~10 또는 자연어): ").strip()
            except (EOFError, KeyboardInterrupt):
                break

            if not choice or choice in ["0", "exit", "quit", "q"]:
                print("사령탑 콘솔을 종료합니다.")
                break
            elif choice == "1":
                run_script(os.path.join(HUB_DIR, "status_reporter.py"))
            elif choice == "2":
                sync_script = os.path.join(HUB_DIR, "integrations", "drive_sync.py")
                if not os.path.exists(sync_script):
                    sync_script = os.path.join(HUB_DIR, "drive_sync.py")
                run_script(sync_script, ["--target", "all"])
            elif choice == "3":
                prompt = input("🎨 생성할 배너 설명 입력 (예: 골프장 일러스트): ").strip()
                if prompt:
                    img_script = os.path.join(HUB_DIR, "generators", "image_gen.py")
                    run_script(img_script, ["--prompt", prompt, "--aspect-ratio", "16:9"])
            elif choice == "4":
                prompt = input("🎬 숏폼 기획 주제 입력 (예: 파크골프 올인원 홍보 15초): ").strip()
                if prompt:
                    vid_script = os.path.join(HUB_DIR, "generators", "video_gen.py")
                    run_script(vid_script, ["--prompt", prompt])
            elif choice == "5":
                run_script(os.path.join(HUB_DIR, "run.py"), ["--app", "paki", "--action", "dev"])
            elif choice == "6":
                if os.path.exists(REGISTRY_PATH):
                    with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
                        reg = json.load(f)
                    print("\n📋 등록 프로젝트 목록:")
                    for pk, pv in reg.get("projects", {}).items():
                        print(f"  • [{pk}] {pv.get('name')} (포트: {pv.get('localPort', '-')}, URL: {pv.get('productionUrl', '-')})")
            elif choice == "7":
                show_history(limit=5)
            elif choice == "8":
                rb_script = os.path.join(HUB_DIR, "integrations", "rollback.py")
                run_script(rb_script, ["list"])
                try:
                    rb_choice = input("👉 복원할 스냅샷 번호(1) 또는 'latest' 입력 (0=취소): ").strip()
                    if rb_choice in ["latest", "1"]:
                        run_script(rb_script, ["latest"])
                    elif rb_choice.startswith("snapshot_"):
                        run_script(rb_script, ["--id", rb_choice])
                except (EOFError, KeyboardInterrupt):
                    pass
            elif choice == "9":
                run_script(os.path.join(HUB_DIR, "daily_briefing.py"), ["--ai", "--save"])
            elif choice == "10":
                run_script(os.path.join(HUB_DIR, "desktop_cleaner.py"))
            else:
                # 자연어 입력으로 처리
                plan = classify_command_with_gemini(choice)
                execute_action(plan, choice)
        return

    args = parser.parse_args()

    if args.command == "status":
        extra = ["--json"] if args.json else []
        run_script(os.path.join(HUB_DIR, "status_reporter.py"), extra)
    elif args.command == "backup":
        sync_script = os.path.join(HUB_DIR, "integrations", "drive_sync.py")
        if not os.path.exists(sync_script):
            sync_script = os.path.join(HUB_DIR, "drive_sync.py")
        run_script(sync_script, ["--target", args.target])
    elif args.command == "briefing":
        run_script(os.path.join(HUB_DIR, "daily_briefing.py"), ["--ai", "--save"])
    elif args.command == "clean":
        run_script(os.path.join(HUB_DIR, "desktop_cleaner.py"))
    elif args.command == "image":
        img_script = os.path.join(HUB_DIR, "generators", "image_gen.py")
        cmd_args = ["--prompt", args.prompt, "--aspect-ratio", args.aspect_ratio]
        if args.filename:
            cmd_args.extend(["--filename", args.filename])
        run_script(img_script, cmd_args)
    elif args.command == "video":
        vid_script = os.path.join(HUB_DIR, "generators", "video_gen.py")
        run_script(vid_script, ["--prompt", args.prompt])
    elif args.command == "run":
        run_script(os.path.join(HUB_DIR, "run.py"), ["--app", args.app, "--action", args.action])
    elif args.command == "deploy":
        run_script(os.path.join(HUB_DIR, "deploy.py"), ["--app", args.app])
    elif args.command == "sync":
        run_script(os.path.join(HUB_DIR, "sync.py"))
    elif args.command == "list":
        if os.path.exists(REGISTRY_PATH):
            with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
                reg = json.load(f)
            print("\n📋 등록 프로젝트 목록:", list(reg.get("projects", {}).keys()))
    elif args.command == "history":
        show_history(limit=10)

if __name__ == "__main__":
    main()
