#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
hub/orchestrator.py - Anti-Gravity 마스터 통합 오케스트레이터
사령탑 전체 도구(run, deploy, sync, report, backup)를 하나로 묶어 지휘하는 종합 컨트롤러입니다.

사용법:
  python hub/orchestrator.py status
  python hub/orchestrator.py run --app paki [--action dev|build|start]
  python hub/orchestrator.py deploy --app paki
  python hub/orchestrator.py sync
  python hub/orchestrator.py backup
  python hub/orchestrator.py list
"""

import os
import sys
import json
import argparse
import subprocess

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HUB_DIR = os.path.join(ROOT_DIR, "hub")
REGISTRY_PATH = os.path.join(ROOT_DIR, "project_registry.json")

def load_registry():
    if not os.path.exists(REGISTRY_PATH):
        return {}
    with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def run_script(script_name, args_list=None):
    script_path = os.path.join(HUB_DIR, script_name)
    if not os.path.exists(script_path):
        print(f"[오류] 도구 스크립트를 찾을 수 없습니다: {script_path}")
        return 1
    cmd = [sys.executable, script_path]
    if args_list:
        cmd.extend(args_list)
    return subprocess.call(cmd)

def list_projects():
    reg = load_registry()
    projects = reg.get("projects", {})
    print("\n" + "=" * 70)
    print("📋 [Anti-Gravity] 사령탑 등록 프로젝트 전체 목록")
    print("=" * 70)
    for k, v in projects.items():
        name = v.get("name", k)
        port = v.get("localPort", "-")
        url = v.get("productionUrl", "-")
        status = v.get("status", "Active")
        aliases = ", ".join(v.get("aliases", []))
        print(f"• [{k}] {name}")
        print(f"  - 로컬 포트: {port} | 상태: {status}")
        print(f"  - 공식 URL : {url}")
        print(f"  - 별칭 목록: {aliases}")
        print("-" * 70)

def main():
    parser = argparse.ArgumentParser(
        description="Anti-Gravity Master Control Tower Orchestrator",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    subparsers = parser.add_subparsers(dest="command", help="실행할 사령탑 명령")

    # status
    p_status = subparsers.add_parser("status", help="전체 프로젝트 실시간 상태 및 헬스체크 보고")
    p_status.add_argument("--json", action="store_true", help="JSON 형식 출력")

    # run
    p_run = subparsers.add_parser("run", help="특정 프로젝트 로컬 구동/빌드")
    p_run.add_argument("--app", required=True, help="앱 이름 (paki, landnote 등)")
    p_run.add_argument("--action", default="dev", choices=["dev", "build", "start", "status"], help="동작")
    p_run.add_argument("--port", type=int, help="포트 직접 지정")

    # deploy
    p_deploy = subparsers.add_parser("deploy", help="프로젝트 Vercel 프로덕션 배포 및 실기기 검증")
    p_deploy.add_argument("--app", required=True, help="배포할 앱 이름")

    # sync
    subparsers.add_parser("sync", help="SYSTEM_STATE.md 자동 동기화 및 3줄 보고 클립보드 복사")

    # backup
    p_backup = subparsers.add_parser("backup", help="프로젝트 핵심 문서 및 상태 백업")
    p_backup.add_argument("--target", default="all", help="백업 대상 경로 (local, drive, all)")

    # list
    subparsers.add_parser("list", help="사령탑에 등록된 전체 프로젝트 및 별칭 목록 출력")

    if len(sys.argv) == 1:
        # 인자 없이 실행 시 사령탑 대시보드 메뉴 표시
        print("\n" + "=" * 70)
        print("🧭 Anti-Gravity 최고 운영 사령탑 오케스트레이터 (Master Orchestrator)")
        print("=" * 70)
        print("1. 전체 프로젝트 실시간 상태 점검 : python hub/orchestrator.py status")
        print("2. 파크골프 올인원 로컬 구동     : python hub/orchestrator.py run --app paki")
        print("3. 파크골프 올인원 프로덕션 배포 : python hub/orchestrator.py deploy --app paki")
        print("4. 사령탑 상태 동기화 및 3줄보고 : python hub/orchestrator.py sync")
        print("5. Google Drive 및 로컬 백업    : python hub/orchestrator.py backup")
        print("6. 등록 프로젝트 목록 확인       : python hub/orchestrator.py list")
        print("=" * 70)
        print("💡 사용 팁: 위 명령어를 직접 터미널에 입력하거나 원하는 옵션을 덧붙여 실행하십시오.\n")
        return

    args = parser.parse_args()

    if args.command == "status":
        extra = ["--json"] if args.json else []
        run_script("status_reporter.py", extra)
    elif args.command == "run":
        cmd_args = ["--app", args.app, "--action", args.action]
        if args.port:
            cmd_args.extend(["--port", str(args.port)])
        run_script("run.py", cmd_args)
    elif args.command == "deploy":
        run_script("deploy.py", ["--app", args.app])
    elif args.command == "sync":
        run_script("sync.py")
    elif args.command == "backup":
        run_script("drive_sync.py", ["--target", args.target])
    elif args.command == "list":
        list_projects()

if __name__ == "__main__":
    main()
