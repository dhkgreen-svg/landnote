#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
hub/integrations/drive_sync.py - Google Drive & 로컬 스토리지 실시간 동기화/백업 모듈
Google Drive Desktop (G:\\) 및 로컬 지정 스토리지에 핵심 문서와 outputs/ 미디어를 자동 아카이빙합니다.

사용법:
  python hub/integrations/drive_sync.py
  python hub/integrations/drive_sync.py --target gdrive
  python hub/integrations/drive_sync.py --target local
"""

import os
import sys
import shutil
import datetime
import argparse
from dotenv import load_dotenv

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ENV_PATH = os.path.join(ROOT_DIR, "config.env")
load_dotenv(ENV_PATH)
load_dotenv()

CORE_FILES = [
    ".antigravityrules",
    "MASTER_PROJECT_PLAN.md",
    "project_registry.json",
    "SYSTEM_STATE.md",
    "DIRECTIVE.md",
    "config.env"
]

CORE_DIRS = [
    "hub",
    "outputs"
]

def get_destinations():
    dests = []
    
    # 1. 내부 아카이브
    internal = os.path.join(ROOT_DIR, "backups_and_archives", "control_tower_snapshots")
    dests.append(("internal", "로컬 프로젝트 아카이브", internal))

    # 2. 로컬 백업 (D: 드라이브 등)
    local_cfg = os.getenv("LOCAL_BACKUP_PATH", "D:/UserFiles/Desktop/AntiGravity_Backups")
    if os.path.exists(os.path.dirname(local_cfg)):
        dests.append(("local", "로컬 외장/데스크톱 백업", local_cfg))

    # 3. 구글 드라이브 (G:)
    gdrive_candidates = [
        os.getenv("GOOGLE_DRIVE_BACKUP_PATH", "G:/내 드라이브/AntiGravity_Backups"),
        "G:/내 드라이브/AntiGravity_Backups",
        "G:/My Drive/AntiGravity_Backups"
    ]
    for gpath in gdrive_candidates:
        if os.path.exists(os.path.dirname(gpath)):
            dests.append(("gdrive", "Google Drive Desktop (G:)", gpath))
            break

    return dests

def perform_sync(target_filter="all"):
    now_tag = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    dests = get_destinations()

    print("\n" + "=" * 70)
    print("☁️ [Google Control Hub] 구글 드라이브 및 로컬 실시간 동기화")
    print(f"⏰ 타임스탬프: {now_tag}")
    print("=" * 70)

    success_list = []

    for key, label, base_path in dests:
        if target_filter != "all" and target_filter != key:
            continue

        snap_dir = os.path.join(base_path, f"snapshot_{now_tag}")
        latest_dir = os.path.join(base_path, "latest")

        try:
            os.makedirs(snap_dir, exist_ok=True)
            copied = 0

            # 파일 복사
            for fname in CORE_FILES:
                src = os.path.join(ROOT_DIR, fname)
                if os.path.exists(src):
                    shutil.copy2(src, os.path.join(snap_dir, fname))
                    copied += 1

            # 폴더 복사
            for dname in CORE_DIRS:
                src = os.path.join(ROOT_DIR, dname)
                if os.path.exists(src):
                    dst = os.path.join(snap_dir, dname)
                    if os.path.exists(dst):
                        shutil.rmtree(dst)
                    shutil.copytree(src, dst)
                    copied += 1

            # latest 갱신
            os.makedirs(latest_dir, exist_ok=True)
            for fname in CORE_FILES:
                src = os.path.join(ROOT_DIR, fname)
                if os.path.exists(src):
                    shutil.copy2(src, os.path.join(latest_dir, fname))

            print(f"✅ [{label}] 동기화 성공: {snap_dir} (총 {copied}개 자산)")
            success_list.append(label)
        except Exception as e:
            print(f"⚠️ [{label}] 동기화 중 오류: {e}")

    print("=" * 70)
    if success_list:
        print(f"🎉 총 {len(success_list)}개 저장소 동기화 완료: {', '.join(success_list)}")
    else:
        print("ℹ️ 사용 가능한 드라이브 스토리지 확인 필요.")
    print("=" * 70 + "\n")

def main():
    parser = argparse.ArgumentParser(description="Google Drive & 로컬 동기화 모듈")
    parser.add_argument("--target", default="all", choices=["all", "gdrive", "local", "internal"], help="동기화 대상")
    args = parser.parse_args()

    perform_sync(args.target)

if __name__ == "__main__":
    main()
