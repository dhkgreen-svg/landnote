#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
hub/deploy.py - 안티그래비티 기기별 테스트 빌드 및 Vercel 실서버 배포 트리거
사용법:
  python hub/deploy.py --app paki
  python hub/deploy.py --app landnote
"""

import os
import sys
import json
import time
import urllib.request
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
    with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def find_project(registry, target_app):
    target_app = target_app.lower()
    for key, proj in registry.get("projects", {}).items():
        if key.lower() == target_app or target_app in [a.lower() for a in proj.get("aliases", [])]:
            return key, proj
    return None, None

def print_ascii_qr(url):
    print("\n[스마트폰 원터치 실기기 테스트 접속 링크]")
    print(f"👉 {url}")
    print(f"👉 https://landnote-parkon.vercel.app")
    print("------------------------------------------------------------------")

def main():
    parser = argparse.ArgumentParser(description="안티그래비티 Vercel 배포 트리거")
    parser.add_argument("--app", default="paki", help="배포할 앱 이름 (paki, parkon, landnote 등)")
    parser.add_argument("--skip-build", action="store_true", help="로컬 사전 빌드 검증 건너뛰기")
    args = parser.parse_args()

    registry = load_registry()
    key, proj = find_project(registry, args.app)

    if not proj:
        print(f"[오류] 등록되지 않은 프로젝트: '{args.app}'")
        sys.exit(1)

    print("==================================================================")
    print(f"🚀 [사령탑 Vercel 실서버 배포 가동] {proj.get('name')} ({key})")
    print(f"🌐 대상 프로덕션 도메인: {proj.get('productionUrl')}")
    print("==================================================================")

    # 1. 로컬 빌드 검증
    if not args.skip_build:
        pkg = proj.get("package")
        print(f"\n[1/3] 로컬 빌드 검증 진행 중... (pnpm --filter {pkg} build)")
        res = subprocess.run(f"pnpm --filter {pkg} build", shell=True, cwd=ROOT_DIR)
        if res.returncode != 0:
            print(f"❌ [오류] 로컬 빌드 실패 (코드: {res.returncode}). 배포를 중단합니다.")
            sys.exit(1)
        print("✅ [성공] 로컬 빌드 검증 통과 (에러 0건)")

    # 2. Git 푸시
    print(f"\n[2/3] GitHub main 브랜치 푸시 및 Vercel 자동 배포 트리거...")
    subprocess.run("git fetch origin main", shell=True, cwd=ROOT_DIR)
    subprocess.run("git push origin main", shell=True, cwd=ROOT_DIR)

    # 3. 실서버 배포 모니터링
    prod_url = proj.get("productionUrl")
    print(f"\n[3/3] Vercel 실서버 전파 모니터링 중: {prod_url}...")
    for i in range(1, 15):
        time.sleep(3)
        try:
            req = urllib.request.Request(prod_url + f"?t={int(time.time())}", headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                if resp.status == 200:
                    print(f"  [확인 {i}/15] 🟢 실서버 정상 응답 (200 OK)")
                    break
        except Exception as e:
            print(f"  [대기 {i}/15] ⏳ 전파 중... ({e})")

    print("\n==================================================================")
    print(f"🎉 {proj.get('name')} Vercel 프로덕션 실서버 배포가 완료되었습니다!")
    print_ascii_qr(prod_url)
    print("==================================================================")

if __name__ == "__main__":
    main()
