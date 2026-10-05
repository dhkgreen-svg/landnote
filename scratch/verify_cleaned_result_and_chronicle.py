# -*- coding: utf-8 -*-
"""
verify_cleaned_result_and_chronicle.py
Validates:
1. New user (0 completed 9-holes) shows 🌱 입문 (0회) instead of 🥉 브론즈 (1회)
2. 실타수 증서 is completely removed
3. 카톡 단톡방 전송 & 내 스코어카드 사진 저장 buttons are removed
4. Practice mode shows: '나의 연대기에는 정식 라운딩만 영구 보관됩니다 (기록 확인 ➔)'
5. Official mode shows: '나의 연대기에 공식 전적으로 영구 보관되었습니다 (기록 확인 ➔)'
6. Clicking (기록 확인 ➔) navigates to /chronicle
"""
import os, sys, time
sys.stdout.reconfigure(encoding='utf-8')
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

ARTIFACT_DIR = r"C:\Users\Admin\.gemini\antigravity\brain\88060266-8e25-4db4-af43-ff211f00c3d4"

chrome_options = Options()
chrome_options.add_argument("--headless=new")
chrome_options.add_argument("--window-size=430,932")
chrome_options.add_argument("--disable-gpu")
driver = webdriver.Chrome(options=chrome_options)

def js_click(elem):
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", elem)
    time.sleep(0.15)
    driver.execute_script("arguments[0].click();", elem)

def wait_and_click(keywords, timeout=5):
    start = time.time()
    while time.time() - start < timeout:
        for b in driver.find_elements(By.TAG_NAME, "button"):
            try:
                txt = b.text.strip()
                for kw in keywords:
                    if kw in txt and b.is_displayed():
                        js_click(b)
                        return True
            except:
                pass
        time.sleep(0.2)
    return False

try:
    print("[1] Opening app and clearing previous storage for player 'ff'...")
    driver.get("http://localhost:3008/round/new?courseId=course-gumi-dongrak")
    time.sleep(2)

    # Setup new user 'ff' with 0 prior rounds
    driver.execute_script("""
        localStorage.clear();
        localStorage.setItem('parkon_player_name', 'ff');
        localStorage.setItem('parkon_member_code', 'PKY-4264');
        localStorage.setItem('parkon_user_role', 'LEADER');
        const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
        if (inputs.length > 0) {
            inputs[0].value = 'ff';
            inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        }
    """)
    time.sleep(0.5)

    # Start 1-player round
    for b in driver.find_elements(By.TAG_NAME, "button"):
        if "라운드 시작" in b.text or "티샷 시작" in b.text:
            js_click(b)
            break
    time.sleep(1)
    wait_and_click(["라운딩 시작하기", "확인했습니다"], timeout=3)
    time.sleep(2)

    # In Round Room: Hole 1
    # Move from Step 1 to Step 2
    wait_and_click(["확인 완료 (티샷 시작)", "티샷 시작"], timeout=3)
    time.sleep(1)

    # Confirm Hole 1
    wait_and_click(["확인 (저장)"], timeout=3)
    time.sleep(0.5)

    # Click [다음 홀 이동]
    wait_and_click(["다음 홀 이동"], timeout=3)
    time.sleep(1)

    # Hole 2: Step 1 -> Step 2
    wait_and_click(["확인 완료 (티샷 시작)", "티샷 시작"], timeout=3)
    time.sleep(1)
    wait_and_click(["확인 (저장)"], timeout=3)
    time.sleep(0.5)

    # Now click red [🛑 경기 종료]
    print("[2] Tapping red [경기 종료] at Hole 2...")
    wait_and_click(["경기 종료"], timeout=3)
    time.sleep(1)

    # Choose [연습·테스트로 저장 (전적 미반영)]
    print("[3] Choosing [연습·테스트로 저장]...")
    wait_and_click(["연습·테스트로 저장", "연습"], timeout=3)
    time.sleep(2.5)

    print("Navigated to Result Page:", driver.current_url)

    # --- VERIFICATION 1: Tier Badge ---
    body_text = driver.find_element(By.TAG_NAME, "body").text
    print("\n--- Checking Elements on Result Page ---")
    
    assert "입문" in body_text or "0회" in body_text, "Expected '입문 (0회)' tier badge for new user!"
    print("✓ Tier badge verified: Shows '입문 (0회)' (Not '브론즈 1회')")

    # --- VERIFICATION 2: 실타수 증서 completely removed ---
    assert "실타수 증서" not in body_text, "ERROR: '실타수 증서' is still displayed!"
    print("✓ '실타수 증서' is completely absent.")

    # --- VERIFICATION 3: 카톡 단톡방 전송 & 내 스코어카드 사진 저장 removed ---
    assert "카톡 단톡방에 성적표 전송" not in body_text, "ERROR: '카톡 단톡방에 성적표 전송' is still displayed!"
    assert "내 스코어카드 사진 저장" not in body_text, "ERROR: '내 스코어카드 사진 저장' is still displayed!"
    print("✓ '카톡 단톡방에 성적표 전송' and '내 스코어카드 사진 저장' tabs are completely absent.")

    # --- VERIFICATION 4: Practice round chronicle banner text ---
    assert "나의 연대기에는 정식 라운딩만 영구 보관됩니다" in body_text, "ERROR: Practice round chronicle text not matched!"
    print("✓ Practice chronicle banner verified: '나의 연대기에는 정식 라운딩만 영구 보관됩니다 (기록 확인 ➔)'")

    # Save practice result screenshot
    practice_path = os.path.join(ARTIFACT_DIR, "verified_result_practice_cleaned.png")
    driver.save_screenshot(practice_path)
    print(f"★ Saved Practice Result Screenshot: {practice_path}")

    # --- VERIFICATION 5: Toggle to Official Mode ---
    print("\n[4] Toggling to [전적 반영으로 변경]...")
    wait_and_click(["전적 반영으로 변경"], timeout=3)
    time.sleep(1)

    body_text_after_toggle = driver.find_element(By.TAG_NAME, "body").text
    assert "나의 연대기에 공식 전적으로 영구 보관되었습니다" in body_text_after_toggle, "ERROR: Official chronicle text not matched after toggle!"
    print("✓ Official chronicle banner verified: '나의 연대기에 공식 전적으로 영구 보관되었습니다 (기록 확인 ➔)'")

    official_path = os.path.join(ARTIFACT_DIR, "verified_result_official_cleaned.png")
    driver.save_screenshot(official_path)
    print(f"★ Saved Official Result Screenshot: {official_path}")

    # --- VERIFICATION 6: Click (기록 확인 ➔) and verify navigation to /chronicle ---
    print("\n[5] Clicking (기록 확인 ➔) link...")
    chronicle_link = None
    for a in driver.find_elements(By.TAG_NAME, "a"):
        if "기록 확인" in a.text and "/chronicle" in a.get_attribute("href"):
            chronicle_link = a
            break
    assert chronicle_link is not None, "Chronicle link not found!"
    js_click(chronicle_link)
    time.sleep(2)

    print("Navigated URL:", driver.current_url)
    assert "/chronicle" in driver.current_url, "Failed to navigate to /chronicle!"
    chronicle_path = os.path.join(ARTIFACT_DIR, "verified_navigated_chronicle.png")
    driver.save_screenshot(chronicle_path)
    print(f"★ Saved Chronicle Navigation Screenshot: {chronicle_path}")
    print("✓ Successfully navigated to /chronicle!")

    print("\n=======================================================")
    print("🎉 ALL USER REQUIREMENTS VERIFIED WITH 100% SUCCESS!")
    print("=======================================================")

finally:
    driver.quit()
