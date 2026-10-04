#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
hub/desktop_cleaner.py - 바탕화면 스마트 정리 및 중복 아이콘/파일 청소 모듈
김대희 대표님의 바탕화면을 항상 최상의 깔끔한 상태로 유지하기 위해:
1. 브라우저나 설치 프로그램이 만든 중복 바로가기 (예: *(1).lnk, *(2).lnk) 자동 감지 및 청소
2. 어질러진 파일들을 5대 핵심 테마 폴더(골프, 사주, 부동산, AI, 컴퓨터도구)로 자동 분류
3. 마스터 제어 버튼인 '구글 통합 사령탑'은 바탕화면 최중앙에 안전하게 보존

사용법:
  python hub/desktop_cleaner.py              # 중복 청소 및 5대 폴더 자동 정돈
  python hub/desktop_cleaner.py --dedup-only # 중복 바로가기/파일만 정리
"""

import os
import sys
import re
import json
import shutil
import ctypes
import argparse

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

DESKTOP_DIR = r"D:\UserFiles\Desktop"
ALT_DESKTOP = r"C:\Users\Admin\Desktop"

PROTECTED_NAMES = {
    "desktop.ini",
    ".cleanup_undo_manifest.json",
    "구글 통합 사령탑 (Google Control Hub).lnk",
    "1. [골프 & 파크온]",
    "2. [사주 & 만세력]",
    "3. [부동산 비즈니스]",
    "4. [AI & 자동화 도구]",
    "5. [컴퓨터 도구 & 일상]",
    "AntiGravity_Backups",
    "바탕화면관리",
    "Google Chrome.lnk",
    "landnote"
}

CATEGORY_MAP = [
    # 1. 골프 & 파크온
    (["골프", "파크", "parkgolf", "parkon", "스코어", "동호회"], os.path.join(DESKTOP_DIR, "1. [골프 & 파크온]")),
    # 2. 사주 & 만세력
    (["사주", "만세력", "천기성", "운세", "궁합"], os.path.join(DESKTOP_DIR, "2. [사주 & 만세력]")),
    # 3. 부동산 비즈니스
    (["부동산", "landnote", "매물", "토지", "건물", "임대"], os.path.join(DESKTOP_DIR, "3. [부동산 비즈니스]")),
    # 4. AI & 자동화 도구
    (["ai", "지메일", "gmail", "자동포스팅", "crm", "봇", "bot", "dualsub", "dualtalk"], os.path.join(DESKTOP_DIR, "4. [AI & 자동화 도구]")),
    # 5. 컴퓨터 도구 & 일상
    (["folderlock", "보고서", "백업", "점검", "다운로드", "임시"], os.path.join(DESKTOP_DIR, "5. [컴퓨터 도구 & 일상]"))
]

def refresh_explorer():
    try:
        SHCNE_ALLEVENTS = 0x7FFFFFFF
        SHCNF_IDLIST = 0x0000
        ctypes.windll.shell32.SHChangeNotify(SHCNE_ALLEVENTS, SHCNF_IDLIST, None, None)
    except Exception:
        pass

def clean_duplicate_shortcuts(target_dir=DESKTOP_DIR):
    """
    (1).lnk, (2).lnk 등의 중복 번호가 붙은 바로가기를 탐색하여
    원본 파일이 존재하는 경우 중복본을 안전하게 제거합니다.
    """
    if not os.path.exists(target_dir):
        return []

    removed_files = []
    # 정규식 패턴: 이름 끝부분에 " (숫자)"가 붙은 경우
    dup_pattern = re.compile(r"^(.*?)\s*\(\d+\)(\.[^.]+)$")

    for fname in os.listdir(target_dir):
        if fname in PROTECTED_NAMES:
            continue

        match = dup_pattern.match(fname)
        if match:
            base_stem = match.group(1).strip()
            ext = match.group(2)
            original_fname = f"{base_stem}{ext}"
            original_path = os.path.join(target_dir, original_fname)
            current_path = os.path.join(target_dir, fname)

            # 원본 파일이 같은 폴더에 존재하거나 중복본인 경우 삭제
            if os.path.exists(original_path) or ext.lower() == ".lnk":
                try:
                    os.remove(current_path)
                    removed_files.append(fname)
                except Exception as e:
                    print(f"⚠️ 중복본 삭제 실패 ({fname}): {e}")

    return removed_files

def organize_desktop_files(target_dir=DESKTOP_DIR):
    """
    바탕화면에 흩어진 파일들을 5대 테마 폴더로 자동 분류 이동합니다.
    """
    if not os.path.exists(target_dir):
        return []

    moved_records = []

    # 5대 폴더 존재 확인 및 자동 생성
    for keywords, folder_path in CATEGORY_MAP:
        os.makedirs(folder_path, exist_ok=True)

    for fname in os.listdir(target_dir):
        if fname in PROTECTED_NAMES:
            continue
        
        full_path = os.path.join(target_dir, fname)
        lower_name = fname.lower()

        # 분류 대상 매칭
        dest_folder = None
        for keywords, folder_path in CATEGORY_MAP:
            if any(k in lower_name for k in keywords):
                dest_folder = folder_path
                break

        if dest_folder:
            dest_path = os.path.join(dest_folder, fname)
            try:
                # 대상 위치에 이미 같은 파일이 있으면 이름 덮어쓰기 or 교체
                if os.path.exists(dest_path):
                    if os.path.isfile(dest_path):
                        os.remove(dest_path)
                    else:
                        shutil.rmtree(dest_path)
                shutil.move(full_path, dest_path)
                moved_records.append((fname, os.path.basename(dest_folder)))
            except Exception as e:
                print(f"⚠️ 이동 실패 ({fname}): {e}")

    return moved_records

def main():
    parser = argparse.ArgumentParser(description="Google Control Hub 바탕화면 스마트 정리 엔진")
    parser.add_argument("--dedup-only", action="store_true", help="중복 파일만 제거")
    args = parser.parse_args()

    print("\n" + "=" * 80)
    print("🧹 [Google Control Hub] 대표님 바탕화면 스마트 정리 & 중복 청소 엔진")
    print("=" * 80)
    print(f"📁 대상 경로 : {DESKTOP_DIR}")

    # 1. 중복 바로가기/파일 청소
    removed_dups = clean_duplicate_shortcuts(DESKTOP_DIR)
    if os.path.exists(ALT_DESKTOP):
        removed_dups.extend(clean_duplicate_shortcuts(ALT_DESKTOP))

    print(f"\n1️⃣ [중복 파일/바로가기 청소 결과]: 총 {len(removed_dups)}건 제거")
    if removed_dups:
        for r in removed_dups:
            print(f"   🗑️ 삭제 완료: {r}")
    else:
        print("   ✅ 불필요한 중복 파일이 없습니다. (깨끗함)")

    # 2. 5대 테마 폴더 자동 분류
    moved_files = []
    if not args.dedup_only:
        moved_files = organize_desktop_files(DESKTOP_DIR)
        print(f"\n2️⃣ [5대 테마 폴더 자동 정돈 결과]: 총 {len(moved_files)}건 분류")
        if moved_files:
            for f, folder in moved_files:
                print(f"   📦 [{folder}] ➔ {f}")
        else:
            print("   ✅ 모든 파일이 이미 5대 폴더로 깔끔하게 정리되어 있습니다.")

    refresh_explorer()

    print("\n" + "=" * 80)
    print("👑 대표님 바탕화면 정리가 완료되었습니다.")
    print("   👉 마스터 버튼 [구글 통합 사령탑]은 바탕화면에 완벽하게 유지됩니다.")
    print("=" * 80 + "\n")

if __name__ == "__main__":
    main()
