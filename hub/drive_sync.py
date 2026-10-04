#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
hub/drive_sync.py - Anti-Gravity 마스터 사령탑 핵심 문서 및 상태 동기화/백업 도구
로컬 아카이브, D/E 드라이브, Google Drive(G:\\)에 핵심 설정 및 마스터 계획서를 안전하게 동기화합니다.

사용법:
  python hub/drive_sync.py
  python hub/drive_sync.py --target local
  python hub/drive_sync.py --target drive
  python hub/drive_sync.py --target all
"""

import os
import sys
import shutil
import datetime
import argparse

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CORE_FILES = [
    ".antigravityrules",
    "MASTER_PROJECT_PLAN.md",
    "project_registry.json",
    "SYSTEM_STATE.md",
    "DIRECTIVE.md"
]

CORE_DIRS = [
    "hub"
]

EXTRA_KEY_FILES = [
    os.path.join("apps", "parkon", "src", "lib", "kakaoEscape.ts"),
    os.path.join("apps", "parkon", "src", "components", "InstallPrompt.tsx"),
    os.path.join("apps", "parkon", "src", "components", "InstallGuideModal.tsx")
]

def get_possible_backup_destinations():
    destinations = []
    
    # 1. 로컬 아카이브 디렉터리
    local_archive = os.path.join(ROOT_DIR, "backups_and_archives", "control_tower_snapshots")
    destinations.append(("local", "로컬 아카이브 디렉터리", local_archive))

    # 2. D 드라이브 데스크톱 백업
    desktop_backup = "D:\\UserFiles\\Desktop\\AntiGravity_Backups"
    if os.path.exists("D:\\UserFiles\\Desktop"):
        destinations.append(("desktop", "D 드라이브 바탕화면 백업", desktop_backup))

    # 3. Google Drive (G: 드라이브)
    gdrive_candidates = [
        "G:\\내 드라이브\\AntiGravity_Backups",
        "G:\\My Drive\\AntiGravity_Backups"
    ]
    for gpath in gdrive_candidates:
        parent = os.path.dirname(gpath)
        if os.path.exists(parent):
            destinations.append(("gdrive", "구글 드라이브 (G:)", gpath))
            break

    return destinations

def copy_bundle_to(dest_dir):
    os.makedirs(dest_dir, exist_ok=True)
    copied_count = 0

    # 1. 루트 핵심 파일
    for fname in CORE_FILES:
        src = os.path.join(ROOT_DIR, fname)
        if os.path.exists(src):
            dst = os.path.join(dest_dir, fname)
            shutil.copy2(src, dst)
            copied_count += 1

    # 2. 디렉터리 (hub)
    for dname in CORE_DIRS:
        src = os.path.join(ROOT_DIR, dname)
        if os.path.exists(src):
            dst = os.path.join(dest_dir, dname)
            if os.path.exists(dst):
                shutil.rmtree(dst)
            shutil.copytree(src, dst)
            copied_count += 1

    # 3. 주요 핵심 소스
    for rel_path in EXTRA_KEY_FILES:
        src = os.path.join(ROOT_DIR, rel_path)
        if os.path.exists(src):
            dst = os.path.join(dest_dir, rel_path)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(src, dst)
            copied_count += 1

    return copied_count

def main():
    parser = argparse.ArgumentParser(description="사령탑 핵심 문서 및 설정 동기화 백업 도구")
    parser.add_argument("--target", default="all", choices=["all", "local", "desktop", "gdrive"], help="백업 대상 위치")
    args = parser.parse_args()

    now_tag = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    destinations = get_possible_backup_destinations()

    print("\n" + "=" * 70)
    print("💾 [Anti-Gravity] 마스터 사령탑 핵심 설정 및 문서 백업/동기화 시작")
    print(f"⏰ 백업 타임스탬프: {now_tag}")
    print("=" * 70)

    success_destinations = []

    for key, label, base_path in destinations:
        if args.target != "all" and args.target != key:
            continue

        target_snap_dir = os.path.join(base_path, f"snapshot_{now_tag}")
        try:
            count = copy_bundle_to(target_snap_dir)
            
            # 최신 상태를 가리키는 latest 폴더 동기화
            latest_dir = os.path.join(base_path, "latest")
            copy_bundle_to(latest_dir)

            print(f"✅ [{label}] 백업 완료: {target_snap_dir} (항목 {count}개 복사)")
            success_destinations.append(label)
        except Exception as e:
            print(f"⚠️ [{label}] 백업 중 일부 오류 발생: {e}")

    print("=" * 70)
    if success_destinations:
        print(f"🎉 총 {len(success_destinations)}개 저장소에 안전하게 백업 및 동기화되었습니다:")
        for s in success_destinations:
            print(f"   • {s}")
    else:
        print("⚠️ 백업 가능한 대상 스토리지를 찾지 못했습니다.")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    main()
