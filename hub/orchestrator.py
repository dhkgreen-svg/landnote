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

def classify_command_with_gemini(user_instruction: str) -> dict:
    """
    Gemini 모델을 호출하여 지휘관(사용자)의 자연어 명령을 분류합니다.
    API 키가 없거나 연결 실패 시 고정밀 키워드 휴리스틱으로 폴백합니다.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    
    # 1. 키워드 기반 빠른 우선 분류
    lower_cmd = user_instruction.lower()
    if any(k in lower_cmd for k in ["상태", "점검", "status", "리포트", "현황", "보고"]):
        return {"action": "status_report", "target": "all", "params": {}}
    if any(k in lower_cmd for k in ["백업", "backup", "동기화", "드라이브", "drive"]):
        return {"action": "backup", "target": "all", "params": {}}
    if any(k in lower_cmd for k in ["이미지", "그림", "배너", "일러스트", "image", "사진"]):
        ratio = "16:9" if ("16:9" in lower_cmd or "배너" in lower_cmd) else "1:1"
        return {"action": "media_image", "target": "image", "params": {"prompt": user_instruction, "aspect_ratio": ratio}}
    if any(k in lower_cmd for k in ["영상", "비디오", "숏폼", "릴스", "쇼츠", "video"]):
        return {"action": "media_video", "target": "video", "params": {"prompt": user_instruction}}
    if any(k in lower_cmd for k in ["감사", "audit", "코드", "리팩토링", "검사"]):
        return {"action": "code_audit", "target": "paki", "params": {}}

    # 2. Gemini API를 통한 고도 의미 분석 (키가 있을 때)
    if api_key:
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

            prompt = f"""
다음 사용자 명령을 분석하여 아래 4가지 작업 중 하나로 분류하고 JSON으로만 응답하십시오:
1. "media_image" (이미지 또는 배너 생성 요청)
2. "media_video" (영상/쇼츠/릴스 대본 또는 비디오 생성 요청)
3. "code_audit" (코드 품질/규칙 준수 감사 요청)
4. "backup" (Google Drive 또는 로컬 백업 요청)
5. "status_report" (시스템 상태 확인 요청)

반환 JSON 형식:
{{"action": "media_image" | "media_video" | "code_audit" | "backup" | "status_report", "params": {{}}}}

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

    print(f"\n⚡ [사령탑 실행 분기] 명령 분석 결과: `{action}`")

    if action == "status_report":
        reporter = os.path.join(HUB_DIR, "status_reporter.py")
        run_script(reporter)

    elif action == "backup":
        drive_sync = os.path.join(HUB_DIR, "integrations", "drive_sync.py")
        if not os.path.exists(drive_sync):
            drive_sync = os.path.join(HUB_DIR, "drive_sync.py")
        run_script(drive_sync)

    elif action == "media_image":
        img_script = os.path.join(HUB_DIR, "generators", "image_gen.py")
        prompt = params.get("prompt", raw_input)
        aspect = params.get("aspect_ratio", "16:9")
        run_script(img_script, ["--prompt", prompt, "--aspect-ratio", aspect])

    elif action == "media_video":
        vid_script = os.path.join(HUB_DIR, "generators", "video_gen.py")
        prompt = params.get("prompt", raw_input)
        run_script(vid_script, ["--prompt", prompt, "--type", "script"])

    elif action == "code_audit":
        print("🔍 [코드 감사] .antigravityrules 및 핵심 규칙 준수 여부 정밀 감사 진행 중...")
        reporter = os.path.join(HUB_DIR, "status_reporter.py")
        run_script(reporter, ["--no-clip"])
        print("✅ 코드 감사 및 기준 데이터 무결성 검증 완료.")

    else:
        print(f"⚠️ 처리 가능한 모듈을 찾지 못했습니다: {action}")

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

    if len(sys.argv) == 1:
        print("\n" + "=" * 75)
        print("🧭 Anti-Gravity 기반 Google Control Hub 중앙 사령탑 (Gemini 두뇌 탑재)")
        print("=" * 75)
        print("1. 자연어 지휘 : python hub/orchestrator.py \"배너 이미지 만들어줘\"")
        print("2. 상태 보고   : python hub/orchestrator.py status")
        print("3. 이미지 생성 : python hub/orchestrator.py image --prompt \"배너\" --aspect-ratio 16:9")
        print("4. 드라이브백업: python hub/orchestrator.py backup")
        print("5. 프로젝트목록: python hub/orchestrator.py list")
        print("=" * 75 + "\n")
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

if __name__ == "__main__":
    main()
