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
    print("🧪 [검증] '복수 동반 묶음(Together)' & '절대 분리 기피(Separate)' 다중 그룹 E2E 테스트")
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

        # 1. 스마트 조 편성 버튼 클릭하여 모달 열기
        btn_open = WebDriverWait(driver, 5).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-testid='btn-open-auto-group-modal']"))
        )
        btn_open.click()
        time.sleep(1)
        print("2. 스마트 조 편성 모달 1단계 오픈: ✅ 성공")

        modal_config = WebDriverWait(driver, 5).until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, "[data-testid='modal-step-config']"))
        )

        # 2. [반드시 함께 묶을 동반 그룹] 체크박스 활성화
        # Checkbox for together
        together_checkbox = driver.find_element(
            By.XPATH, "//input[@type='checkbox' and following-sibling::*[contains(., '반드시 함께 묶을 동반 그룹')]]"
        )
        if not together_checkbox.is_selected():
            together_checkbox.click()
            time.sleep(0.5)
        print("3. [🔗 반드시 함께 묶을 동반 그룹] 체크박스 활성화: ✅ 완료")

        # 묶음 1팀에 [강호동, 송지효] 선택
        print("4. 동반 묶음 #1팀에 [강호동, 송지효] 2명 묶기 설정")
        tog_cards = driver.find_elements(By.XPATH, "//div[contains(@class, 'border-blue-200')]")
        assert len(tog_cards) >= 1, "동반 묶음 카드가 1개 이상이어야 합니다."
        card1 = tog_cards[0]
        btn_hodong = card1.find_element(By.XPATH, ".//button[contains(., '강호동')]")
        btn_hodong.click()
        time.sleep(0.3)
        btn_jihyo = card1.find_element(By.XPATH, ".//button[contains(., '송지효')]")
        btn_jihyo.click()
        time.sleep(0.3)

        # [+ 동반 묶음 팀 추가] 클릭
        btn_add_tog = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-add-together-group']")
        btn_add_tog.click()
        time.sleep(0.5)
        print("5. [+ 동반 묶음 팀 추가] 클릭 ➔ #2팀 생성 완료: ✅ 성공")

        # 묶음 2팀에 [유재석, 하동훈] 선택 (2번째 팀 내부의 칩 찾기)
        print("6. 동반 묶음 #2팀에 [유재석, 하동훈(조장2)] 2명 묶기 설정")
        # Find buttons inside the second together team card
        tog_cards = driver.find_elements(By.XPATH, "//div[contains(@class, 'border-blue-200')]")
        assert len(tog_cards) >= 2, f"동반 묶음 카드가 2개 이상이어야 합니다. 현재: {len(tog_cards)}"
        
        card2 = tog_cards[1]
        btn_jaesuk2 = card2.find_element(By.XPATH, ".//button[contains(., '유재석')]")
        btn_jaesuk2.click()
        time.sleep(0.3)
        btn_donghoon2 = card2.find_element(By.XPATH, ".//button[contains(., '하동훈')]")
        btn_donghoon2.click()
        time.sleep(0.3)

        # 3. [절대 분리 기피 대상] 체크박스 활성화
        sep_checkbox = driver.find_element(
            By.XPATH, "//input[@type='checkbox' and following-sibling::*[contains(., '반드시 서로 다른 조로 분리할 그룹')]]"
        )
        if not sep_checkbox.is_selected():
            sep_checkbox.click()
            time.sleep(0.5)
        print("7. [🚫 반드시 서로 다른 조로 분리할 그룹] 체크박스 활성화: ✅ 완료")

        # 분리 세트 1에 [신동엽, 이수근] 선택
        print("8. 분리 세트 #1에 [신동엽 ⚡ 이수근] 2명 기피 지정")
        sep_card = driver.find_element(By.XPATH, "//div[contains(@class, 'border-rose-200')]")
        btn_dongyeob = sep_card.find_element(By.XPATH, ".//button[contains(., '신동엽')]")
        btn_dongyeob.click()
        time.sleep(0.3)
        btn_soogeun = sep_card.find_element(By.XPATH, ".//button[contains(., '이수근')]")
        btn_soogeun.click()
        time.sleep(0.3)

        # 4. [ ⚡ 조건 적용하여 가편성 미리보기 ] 실행
        print("9. [ ⚡ 조건 적용하여 가편성 미리보기 ] 클릭")
        btn_preview = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-preview-grouping']")
        btn_preview.click()
        time.sleep(2)

        # 5. 2단계 모달에서 조별 배정 결과 추출 및 제약 조건 전수 검증
        WebDriverWait(driver, 5).until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, "[data-testid='modal-step-preview']"))
        )

        chips = driver.find_elements(By.CSS_SELECTOR, "[data-testid='player-swap-chip']")
        player_group_map = {}
        for c in chips:
            p_name = c.get_attribute("data-player-name")
            p_grp = int(c.get_attribute("data-group-number"))
            player_group_map[p_name] = p_grp

        print("\n📋 [가편성 배정 결과 집계]:")
        for p_name, p_grp in sorted(player_group_map.items(), key=lambda x: x[1]):
            print(f"   - {p_name} ➔ {p_grp}조")

        # 검증 1: [강호동] & [송지효] 동일 조 여부
        hodong_grp = player_group_map.get("강호동")
        jihyo_grp = player_group_map.get("송지효")
        print(f"\n🔍 [검증 1] 묶음 1팀 [강호동({hodong_grp}조), 송지효({jihyo_grp}조)]")
        assert hodong_grp is not None and hodong_grp == jihyo_grp, f"❌ 강호동({hodong_grp})과 송지효({jihyo_grp})가 다른 조에 배정됨!"
        print(f"   👉 100% 동일 조 ({hodong_grp}조) 안착 성공! ✅")

        # 검증 2: [유재석] & [하동훈(조장2)] 동일 조 여부
        jaesuk_grp = player_group_map.get("유재석")
        donghoon_grp = player_group_map.get("하동훈(조장2)")
        print(f"🔍 [검증 2] 묶음 2팀 [유재석({jaesuk_grp}조), 하동훈({donghoon_grp}조)]")
        assert jaesuk_grp is not None and jaesuk_grp == donghoon_grp, f"❌ 유재석({jaesuk_grp})과 하동훈({donghoon_grp})이 다른 조에 배정됨!"
        print(f"   👉 100% 동일 조 ({jaesuk_grp}조) 안착 성공! ✅")

        # 검증 3: [신동엽] & [이수근] 절대 분리 여부 (서로 다른 조)
        dongyeob_grp = player_group_map.get("신동엽")
        soogeun_grp = player_group_map.get("이수근")
        print(f"🔍 [검증 3] 분리 기피 [신동엽({dongyeob_grp}조) ⚡ 이수근({soogeun_grp}조)]")
        assert dongyeob_grp is not None and soogeun_grp is not None and dongyeob_grp != soogeun_grp, f"❌ 신동엽({dongyeob_grp})과 이수근({soogeun_grp})이 같은 조에 배정됨!"
        print(f"   👉 100% 서로 다른 조 ({dongyeob_grp}조 vs {soogeun_grp}조) 분산 성공! ✅")

        # 6. 최종 경기 시작 버튼 클릭
        btn_start_match = driver.find_element(By.CSS_SELECTOR, "[data-testid='btn-finalize-and-start-match']")
        print("\n10. [🚀 조 편성 최종 확정 & 전 조 경기 시작!] 원스톱 버튼 클릭 실행")
        btn_start_match.click()
        time.sleep(2.5)

        # 모달 닫힘 확인
        modals = driver.find_elements(By.CSS_SELECTOR, "[data-testid='smart-group-modal']")
        assert len(modals) == 0, "경기 시작 후 모달이 닫히지 않았습니다."
        print("11. 모달 자동 닫힘 및 전 조 실시간 출발 확인: ✅ 성공")

        print("=" * 85)
        print("🎉 [최종 통과] 복수 동반 묶음(Together) 2팀 + 절대 분리(Separate) 1팀 완벽 충족 ALL PASS!")
        print("=" * 85)

    finally:
        driver.quit()

if __name__ == "__main__":
    run_test()
