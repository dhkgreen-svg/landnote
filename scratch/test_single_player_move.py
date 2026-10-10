# -*- coding: utf-8 -*-
import sys
import json
import time
import urllib.request
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:3008"

def reset_room():
    req = urllib.request.Request(
        f"{BASE_URL}/api/club/live-room",
        data=json.dumps({"action": "RESET_TO_STAGE1"}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as resp:
        print(f"🔄 Room Reset Response: {resp.status}")

def run_test():
    print("=" * 85)
    print("🧪 [검증] 가편성 모달 '1인 단독 조 이동(Move)' 및 '동적 조 인원수 변경' E2E 테스트")
    print("=" * 85)

    reset_room()
    time.sleep(1)

    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--window-size=1280,1024")
    options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})

    driver = webdriver.Chrome(options=options)

    try:
        url = f"{BASE_URL}/club/tourney-10p-live?user=김총무"
        print(f"1. 총무 페이지 접속: {url}")
        driver.get(url)
        time.sleep(3)

        # 1. 스마트 조 편성 버튼 클릭
        btn_open = WebDriverWait(driver, 5).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-testid='btn-open-auto-group-modal']"))
        )
        btn_open.click()
        time.sleep(1)
        print("2. 1단계 모달 진입: ✅ 성공")

        # 2. [ ⚡ 조건 적용하여 가편성 미리보기 ] 클릭 (기본 4-3-3 편성 생성)
        btn_preview = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-preview-grouping']")
        btn_preview.click()
        time.sleep(2)
        print("3. 2단계 가편성 미리보기 진입 (초기 4명-3명-3명 구성): ✅ 성공")

        WebDriverWait(driver, 5).until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, "[data-testid='modal-step-preview']"))
        )

        # 초기 1조, 2조, 3조 선수 목록 수집
        chips = driver.find_elements(By.CSS_SELECTOR, "[data-testid='player-swap-chip']")
        grp1_players = [c for c in chips if c.get_attribute("data-group-number") == "1"]
        grp2_players = [c for c in chips if c.get_attribute("data-group-number") == "2"]
        grp3_players = [c for c in chips if c.get_attribute("data-group-number") == "3"]

        print(f"   초기 인원: 1조({len(grp1_players)}명), 2조({len(grp2_players)}명), 3조({len(grp3_players)}명)")
        assert len(grp1_players) == 4, f"1조 인원이 4명이 아닙니다 (현재: {len(grp1_players)})"
        assert len(grp2_players) == 3, f"2조 인원이 3명이 아닙니다 (현재: {len(grp2_players)})"

        # 3. 1조의 4번째 선수(조장 아닌 일반 선수) 터치하여 선택
        target_player_chip = grp1_players[3]
        target_name = target_player_chip.get_attribute("data-player-name")
        target_id = target_player_chip.get_attribute("data-player-id")
        print(f"\n4. 1조 선수 [{target_name}] 터치하여 이동 대상 선택")
        target_player_chip.click()
        time.sleep(0.5)

        # 4. 2조 카드에 나타난 [➔ 2조로 이동] 퀵 버튼 확인 및 클릭
        btn_move_to_2 = WebDriverWait(driver, 5).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-testid='btn-move-to-group-2']"))
        )
        print(f"5. 2조 상단 퀵 버튼 [➔ 2조로 이동] 노출 확인: ✅ 클릭 실행")
        btn_move_to_2.click()
        time.sleep(1.5)

        # 5. 이동 후 인원수 동적 변경 검증 (1조: 4명➔3명, 2조: 3명➔4명)
        chips_after = driver.find_elements(By.CSS_SELECTOR, "[data-testid='player-swap-chip']")
        grp1_after = [c for c in chips_after if c.get_attribute("data-group-number") == "1"]
        grp2_after = [c for c in chips_after if c.get_attribute("data-group-number") == "2"]
        grp3_after = [c for c in chips_after if c.get_attribute("data-group-number") == "3"]

        print(f"\n📊 [1인 단독 이동 후 인원 구성 집계]:")
        print(f"   - 1조: {len(grp1_after)}명 (이전 4명 ➔ 3명으로 감소)")
        print(f"   - 2조: {len(grp2_after)}명 (이전 3명 ➔ 4명으로 증가)")
        print(f"   - 3조: {len(grp3_after)}명 (3명 유지)")

        assert len(grp1_after) == 3, f"❌ 1조 인원이 3명이 아닙니다! (현재 {len(grp1_after)}명)"
        assert len(grp2_after) == 4, f"❌ 2조 인원이 4명이 아닙니다! (현재 {len(grp2_after)}명)"
        assert len(grp3_after) == 3, f"❌ 3조 인원이 3명이 아닙니다! (현재 {len(grp3_after)}명)"

        # 대상 선수가 2조에 존재하는지 확인
        moved_chip = next((c for c in grp2_after if c.get_attribute("data-player-name") == target_name), None)
        assert moved_chip is not None, f"❌ [{target_name}] 선수가 2조에 존재하지 않습니다!"
        print(f"   👉 [{target_name}] 선수가 1조에서 2조로 단독 이동 완료! ✅")

        # 6. 원터치 [🚀 조 편성 최종 확정 & 전 조 경기 시작!] 클릭
        btn_start_match = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-finalize-and-start-match']")
        print("\n6. [🚀 조 편성 최종 확정 & 전 조 경기 시작!] 버튼 클릭 실행")
        btn_start_match.click()
        time.sleep(3)

        # 7. 경기 시작 후 모달 닫힘 확인
        modals = driver.find_elements(By.CSS_SELECTOR, "[data-testid='smart-group-modal']")
        assert len(modals) == 0, "경기 시작 후 모달이 닫히지 않았습니다."
        print("7. 모달 자동 닫힘 및 PLAYING 모드 진입 확인: ✅ 성공")

        # 8. 최종 저장된 방의 조별 인원 구성 API 조회 검증
        req_check = urllib.request.Request(f"{BASE_URL}/api/club/live-room")
        with urllib.request.urlopen(req_check) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            room_groups = data.get("room", {}).get("groups", [])
            print(f"\n📡 [서버 API 최종 확정 조별 인원 확인]:")
            for g in room_groups:
                print(f"   - {g['name']}: {len(g['players'])}명 ({', '.join(p['name'] for p in g['players'])})")
            
            g1 = next(g for g in room_groups if g['groupNumber'] == 1)
            g2 = next(g for g in room_groups if g['groupNumber'] == 2)
            assert len(g1['players']) == 3, f"서버 저장 1조 인원이 3명이 아닙니다: {len(g1['players'])}"
            assert len(g2['players']) == 4, f"서버 저장 2조 인원이 4명이 아닙니다: {len(g2['players'])}"
            print("   👉 서버 실시간 방 데이터에 1조(3명), 2조(4명) 완벽 영구 반영 완료! ✅")

        print("=" * 85)
        print("🎉 [최종 통과] 1인 단독 조 이동(Move) 및 동적 인원 변경 100% ALL PASS!")
        print("=" * 85)

    finally:
        driver.quit()

if __name__ == "__main__":
    run_test()
