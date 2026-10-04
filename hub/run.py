#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
hub/run.py - 안티그래비티 앱 전환 및 로컬 실행 사령탑
사용법:
  python hub/run.py --app paki --action dev
  python hub/run.py --app paki --action build
  python hub/run.py --app paki --action start
  python hub/run.py --app landnote --action dev
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

REGISTRY_PATH = os.path.join(ROOT_DIR, "project_registry.json")

def load_registry():
    if not os.path.exists(REGISTRY_PATH):
        print(f"[오류] 레지스트리 파일을 찾을 수 없습니다: {REGISTRY_PATH}")
        sys.exit(1)
    with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def find_project(registry, target_app):
    target_app = target_app.lower()
    for key, proj in registry.get("projects", {}).items():
        if key.lower() == target_app or target_app in [a.lower() for a in proj.get("aliases", [])]:
            return key, proj
    return None, None

def main():
    parser = argparse.ArgumentParser(description="안티그래비티 프로젝트 실행기")
    parser.add_argument("--app", required=True, help="실행할 앱 이름 (paki, parkon, landnote 등)")
    parser.add_argument("--action", default="dev", choices=["dev", "build", "start", "status"], help="실행할 동작")
    parser.add_argument("--port", type=int, help="포트 직접 지정 (옵션)")
    args = parser.parse_args()

    registry = load_registry()
    key, proj = find_project(registry, args.app)

    if not proj:
        print(f"[오류] 등록되지 않은 프로젝트입니다: '{args.app}'")
        print("등록된 프로젝트 목록:", list(registry.get("projects", {}).keys()))
        sys.exit(1)

    proj_name = proj.get("name")
    proj_path = os.path.join(ROOT_DIR, proj.get("path"))
    pkg_name = proj.get("package")
    port = args.port or proj.get("localPort", 3000)

    print("==================================================================")
    print(f"🚀 [사령탑 실행] 프로젝트: {proj_name} ({key})")
    print(f"📁 경로: {proj_path}")
    print(f"🌐 지정 포트: {port} | 동작: {args.action.upper()}")
    print("==================================================================")

    if not os.path.exists(proj_path):
        print(f"[오류] 대상 디렉터리가 존재하지 않습니다: {proj_path}")
        sys.exit(1)

    if args.action == "status":
        print(f"상태: {proj.get('status')}")
        print(f"공식 도메인: {proj.get('productionUrl')}")
        print(f"로컬 접속 주소: http://localhost:{port}")
        return

    cmd = []
    if args.action == "dev":
        cmd = ["pnpm", "--filter", pkg_name, "dev", "-p", str(port)]
    elif args.action == "build":
        cmd = ["pnpm", "--filter", pkg_name, "build"]
    elif args.action == "start":
        cmd = ["pnpm", "--filter", pkg_name, "start", "-p", str(port)]

    shell_cmd = " ".join(cmd)
    print(f"실행 명령: {shell_cmd}")
    try:
        subprocess.run(shell_cmd, shell=True, cwd=ROOT_DIR)
    except KeyboardInterrupt:
        print("\n[알림] 실행이 중단되었습니다.")

if __name__ == "__main__":
    main()
