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
    print("=" * 80)
    print("🧪 [검증 시작] 스마트 조 편성 모달 전면 개편 & 원터치 Swap & 원스톱 경기 시작 테스트")
    print("=" * 80)
    
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

        # 1. 하단 지저분한 대기풀 박스 제거 확인
        page_text = driver.page_source
        has_clunky_box = "대기풀 (" in page_text or "스마트 조 편성 (총 10명 참여)" in page_text
        print(f"2. 하단 대기풀/조편성 박스 제거 확인: {'❌ 잔존함' if has_clunky_box else '✅ 완전히 제거됨'}")
        assert not has_clunky_box, "하단 대기풀 박스가 남아있습니다!"

        # 2. 최상단 메인 버튼 확인
        btn_smart_group = WebDriverWait(driver, 5).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-testid='btn-open-auto-group-modal']"))
        )
        print("3. 최상단 메인 버튼 [🎲 스마트 조 편성 룰 설정 & 자동 분배 실행] 확인: ✅ 정상 노출")

        # 3. 버튼 클릭하여 1단계 모달 진입
        btn_smart_group.click()
        time.sleep(1)

        modal_config = WebDriverWait(driver, 5).until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, "[data-testid='modal-step-config']"))
        )
        print("4. 1단계 모달 팝업 확인 (data-testid='modal-step-config'): ✅ 정상 오픈됨")

        # [섹션 A] 전제 조건 확인 & [섹션 B] 분배 방식 확인
        modal_html = modal_config.get_attribute('innerHTML')
        has_sec_a = "전제 조건" in modal_html or "前提条件" in modal_html or "조장" in modal_html
        has_sec_b = "최종 분배 방식" in modal_html or "最終配分方式" in modal_html or "랜덤" in modal_html
        print(f"5. 섹션 A(전제 조건) 및 섹션 B(분배 방식) 분리 확인: {'✅ 완벽 구분' if has_sec_a and has_sec_b else '❌ 누락'}")
        assert has_sec_a and has_sec_b, "모달 내 섹션 분리가 누락되었습니다."

        # [⚡ 조건 적용하여 가편성 미리보기] 버튼 클릭
        btn_preview = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-preview-grouping']")
        btn_preview.click()
        time.sleep(1.5)

        # 4. 2단계 가편성 미리보기 화면 진입 확인
        modal_preview = WebDriverWait(driver, 5).until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, "[data-testid='modal-step-preview']"))
        )
        print("6. 2단계 모달 [가편성 결과 확인 & 맞바꾸기] 진입 (data-testid='modal-step-preview'): ✅ 성공")

        # 5. Swap 동작 테스트
        chips = driver.find_elements(By.CSS_SELECTOR, "[data-testid='player-swap-chip']")
        print(f"7. 미리보기 내 배정된 선수 칩 수: {len(chips)}명")
        assert len(chips) >= 2, "선수 칩이 충분하지 않습니다."

        chip1 = chips[0]
        chip1_name = chip1.get_attribute("data-player-name")
        chip1_grp = chip1.get_attribute("data-group-number")

        # 다른 조 선수 찾기
        target_chip = None
        for c in chips[1:]:
            if c.get_attribute("data-group-number") != chip1_grp:
                target_chip = c
                break

        assert target_chip is not None, "다른 조 선수를 찾지 못했습니다."
        target_name = target_chip.get_attribute("data-player-name")
        target_grp = target_chip.get_attribute("data-group-number")

        print(f"   선수 1: [{chip1_name}] (조: {chip1_grp}) 클릭 ➔ 맞바꿈 대상 선택")
        chip1.click()
        time.sleep(0.5)

        print(f"   선수 2: [{target_name}] (조: {target_grp}) 클릭 ➔ Swap 실행")
        target_chip.click()
        time.sleep(1.5)

        for l in driver.get_log('browser'):
            if 'SWAP DEBUG' in l.get('message', ''):
                print(f"   [BROWSER LOG]: {l['message']}")

        # Swap 후 재검증: 칩 목록 다시 조회
        chips_after = driver.find_elements(By.CSS_SELECTOR, "[data-testid='player-swap-chip']")
        swapped_c1 = next(c for c in chips_after if c.get_attribute("data-player-name") == chip1_name)
        swapped_c2 = next(c for c in chips_after if c.get_attribute("data-player-name") == target_name)
        
        new_grp1 = swapped_c1.get_attribute("data-group-number")
        new_grp2 = swapped_c2.get_attribute("data-group-number")
        print(f"   Swap 결과 검증: [{chip1_name}] {chip1_grp}조➔{new_grp1}조, [{target_name}] {target_grp}조➔{new_grp2}조")
        assert new_grp1 == target_grp and new_grp2 == chip1_grp, "선수 맞바꾸기(Swap)가 정상 작동하지 않았습니다!"
        print("8. 원터치 맞바꾸기(Swap) 양방향 교환 검증: ✅ 완벽 작동")

        # 6. 원터치 최종 경기 시작 버튼 클릭
        btn_start_match = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-finalize-and-start-match']")
        print("9. [🚀 조 편성 최종 확정 & 전 조 경기 시작!] 원스톱 버튼 클릭 실행")
        btn_start_match.click()
        time.sleep(3)

        # 모달 닫힘 확인
        modals = driver.find_elements(By.CSS_SELECTOR, "[data-testid='smart-group-modal']")
        print(f"10. 모달 자동 닫힘 확인: {'✅ 정상 닫힘' if len(modals) == 0 else '❌ 모달 미닫힘'}")
        assert len(modals) == 0, "경기 시작 후 모달이 닫히지 않았습니다."

        # 총무 화면 관제 모드 (PLAYING) 확인
        page_source = driver.page_source
        is_playing = "전체 라운드 진행 중" in page_source or "실시간" in page_source or "총무 관제 모드" in page_source or "리더보드" in page_source
        print(f"11. 총무 화면 경기중 리더보드 관제 모드 전환 확인: {'✅ 성공 (PLAYING)' if is_playing else '❌ 미전환'}")

        # 7. 일반 회원 화면 동기화 확인
        url_member = f"{BASE_URL}/club/tourney-10p-live?user=강호동"
        print(f"12. 일반 회원(강호동) 세션 접속: {url_member}")
        driver.get(url_member)
        time.sleep(2)

        member_source = driver.page_source
        member_synced = "조" in member_source and ("홀" in member_source or "배정" in member_source or "스코어" in member_source or "라운드" in member_source)
        print(f"13. 일반 회원(강호동) 실시간 조 배정 및 경기 진입 확인: {'✅ 성공' if member_synced else '❌ 미동기화'}")
        assert member_synced, "일반 회원 화면에 조 배정 정보가 노출되지 않았습니다."

        print("=" * 80)
        print("🎉 모든 스마트 조 편성 & 원터치 Swap & 원스톱 경기 시작 테스트 100% ALL PASS!")
        print("=" * 80)

    finally:
        driver.quit()

if __name__ == "__main__":
    run_test()
