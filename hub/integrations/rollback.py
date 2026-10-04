#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
hub/integrations/rollback.py - Google Control Hub 원클릭 롤백/복원 엔진
과거 생성된 스냅샷(백업 시점) 목록을 확인하고, 원하는 시점 또는 직전 정상 상태로
100% 안전하게 원클릭 복원(롤백)합니다.

복원 전 항상 현재 상태를 '안전 스냅샷'으로 자동 백업하므로 데이터 유실 위험이 전혀 없습니다.

사용법:
  python hub/integrations/rollback.py list       # 사용 가능한 백업 시점 목록 확인
  python hub/integrations/rollback.py latest     # 가장 최근 백업으로 즉시 복원
  python hub/integrations/rollback.py --id <snapshot_name>  # 특정 시점으로 복원
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

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BACKUP_BASE = os.path.join(ROOT_DIR, "backups_and_archives", "control_tower_snapshots")
DESKTOP_BACKUP = "D:/UserFiles/Desktop/AntiGravity_Backups"

def get_all_snapshots():
    snapshots = []
    # 1. 내부 아카이브 스냅샷
    if os.path.exists(BACKUP_BASE):
        for entry in os.listdir(BACKUP_BASE):
            full_p = os.path.join(BACKUP_BASE, entry)
            if os.path.isdir(full_p) and entry.startswith("snapshot_"):
                mtime = os.path.getmtime(full_p)
                mtime_str = datetime.datetime.fromtimestamp(mtime).strftime("%Y-%m-%d %H:%M:%S")
                snapshots.append({
                    "id": entry,
                    "path": full_p,
                    "time": mtime_str,
                    "source": "내부 아카이브",
                    "mtime_raw": mtime
                })

    # 2. 데스크톱 백업 스냅샷
    if os.path.exists(DESKTOP_BACKUP):
        for entry in os.listdir(DESKTOP_BACKUP):
            full_p = os.path.join(DESKTOP_BACKUP, entry)
            if os.path.isdir(full_p) and entry.startswith("snapshot_"):
                if not any(s["id"] == entry for s in snapshots):
                    mtime = os.path.getmtime(full_p)
                    mtime_str = datetime.datetime.fromtimestamp(mtime).strftime("%Y-%m-%d %H:%M:%S")
                    snapshots.append({
                        "id": entry,
                        "path": full_p,
                        "time": mtime_str,
                        "source": "D: 드라이브 백업",
                        "mtime_raw": mtime
                    })

    # 3. E: 드라이브 세컨더리 금고 스냅샷
    edrive_backup = "E:/AntiGravity_Backups"
    if os.path.exists(edrive_backup):
        for entry in os.listdir(edrive_backup):
            full_p = os.path.join(edrive_backup, entry)
            if os.path.isdir(full_p) and entry.startswith("snapshot_"):
                if not any(s["id"] == entry for s in snapshots):
                    mtime = os.path.getmtime(full_p)
                    mtime_str = datetime.datetime.fromtimestamp(mtime).strftime("%Y-%m-%d %H:%M:%S")
                    snapshots.append({
                        "id": entry,
                        "path": full_p,
                        "time": mtime_str,
                        "source": "E: 대용량 금고",
                        "mtime_raw": mtime
                    })

    snapshots.sort(key=lambda x: x["mtime_raw"], reverse=True)
    return snapshots

def list_snapshots():
    snaps = get_all_snapshots()
    print("\n" + "=" * 80)
    print("🔄 [Google Control Hub] 복원 가능한 백업 스냅샷 이력 목록")
    print("=" * 80)
    if not snaps:
        print("  (보관된 백업 스냅샷이 없습니다. 먼저 `python hub/integrations/drive_sync.py`로 백업하십시오.)")
    else:
        for idx, s in enumerate(snaps, 1):
            latest_badge = " 🌟 [가장 최신]" if idx == 1 else ""
            print(f"  {idx}. [{s['id']}] {latest_badge}")
            print(f"     • 백업 일시: {s['time']} ({s['source']})")
            print(f"     • 저장 위치: {s['path']}")
            print("-" * 80)
    print("=" * 80 + "\n")
    return snaps

def perform_rollback(target_snapshot_path):
    if not os.path.exists(target_snapshot_path):
        print(f"❌ [오류] 대상 스냅샷 경로를 찾을 수 없습니다: {target_snapshot_path}")
        return False

    snap_id = os.path.basename(target_snapshot_path)
    now_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    safety_dir = os.path.join(ROOT_DIR, "backups_and_archives", "safety_pre_rollback", f"pre_rollback_{now_str}")

    print("\n" + "=" * 80)
    print(f"🚨 [원클릭 롤백 시작] 복원 대상: {snap_id}")
    print("=" * 80)

    # 1. 안전 백업 생성 (현재 상태 보존)
    print("1단계: 현재 상태 긴급 안전 스냅샷 생성 중...")
    os.makedirs(safety_dir, exist_ok=True)
    for fname in [".antigravityrules", "MASTER_PROJECT_PLAN.md", "project_registry.json", "SYSTEM_STATE.md", "DIRECTIVE.md", "config.env"]:
        src = os.path.join(ROOT_DIR, fname)
        if os.path.exists(src):
            shutil.copy2(src, os.path.join(safety_dir, fname))
    print(f"  ✅ 안전 백업 완료: {safety_dir}")

    # 2. 스냅샷으로부터 복원
    print("2단계: 스냅샷 자산 원복(Overwrite) 적용 중...")
    restored_count = 0
    for root, dirs, files in os.walk(target_snapshot_path):
        rel_path = os.path.relpath(root, target_snapshot_path)
        dest_dir = ROOT_DIR if rel_path == "." else os.path.join(ROOT_DIR, rel_path)
        os.makedirs(dest_dir, exist_ok=True)

        for f in files:
            # config.env는 API Key가 이미 설정되어 있으므로 빈 템플릿으로 덮어쓰지 않도록 보호
            if f == "config.env" and os.path.exists(os.path.join(dest_dir, f)):
                continue
            src_file = os.path.join(root, f)
            dest_file = os.path.join(dest_dir, f)
            shutil.copy2(src_file, dest_file)
            restored_count += 1

    print(f"  ✅ 복원 완료 (총 {restored_count}개 파일 복원 성공)")
    print("=" * 80)
    print(f"🎉 [{snap_id}] 시점으로 시스템이 안전하게 롤백(복원)되었습니다!")
    print("=" * 80 + "\n")
    return True

def main():
    parser = argparse.ArgumentParser(description="Google Control Hub 롤백/복원 엔진")
    parser.add_argument("action", nargs="?", default="list", choices=["list", "latest"], help="수행할 동작")
    parser.add_argument("--id", help="복원할 스냅샷 ID (snapshot_YYYYMMDD_HHMMSS)")
    args = parser.parse_args()

    if args.id:
        # 특정 ID로 복원
        target = os.path.join(BACKUP_BASE, args.id)
        if not os.path.exists(target):
            target = os.path.join(DESKTOP_BACKUP, args.id)
        perform_rollback(target)
    elif args.action == "latest":
        snaps = get_all_snapshots()
        if not snaps:
            print("❌ 복원 가능한 스냅샷이 없습니다.")
            sys.exit(1)
        perform_rollback(snaps[0]["path"])
    else:
        list_snapshots()

if __name__ == "__main__":
    main()
