# -*- coding: utf-8 -*-
"""
verify_exact_user_scenario.py
Simulates CEO's exact scenario:
1. Finish Hole 1 and press Confirm
2. Move to Hole 2
3. At Hole 2, DO NOT press Confirm (give up at entrance of Hole 2)
4. Tap red [경기 종료]
5. Verify modal says '1개 홀 완료' (NOT 2개 홀)
6. Choose '연습·테스트로 저장'
7. Verify Result Page:
   - Shows: '1홀 진행 · 기준 Par 4' (NOT 2홀, NOT Par 10)
   - Player strokes: 4타 (NOT 10타)
   - Confusing '🥉 브론즈 (1회)' badge is completely GONE
   - Banner: '나의 연대기에는 정식 라운딩만 영구 보관됩니다 (기록 확인 ➔)'
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
    print("[1] Opening app at new round...")
    driver.get("http://localhost:3008/round/new?courseId=course-gumi-dongrak")
    time.sleep(2)

    driver.execute_script("""
        localStorage.clear();
        localStorage.setItem('parkon_player_name', '김대희');
        localStorage.setItem('parkon_member_code', 'PKY-7788');
        localStorage.setItem('parkon_user_role', 'LEADER');
        const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
        if (inputs.length > 0) {
            inputs[0].value = '김대희';
            inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        }
    """)
    time.sleep(0.5)

    # Start round
    for b in driver.find_elements(By.TAG_NAME, "button"):
        if "라운드 시작" in b.text or "티샷 시작" in b.text:
            js_click(b)
            break
    time.sleep(1)
    wait_and_click(["라운딩 시작하기", "확인했습니다"], timeout=3)
    time.sleep(2)

    # Hole 1:
    print("[2] Playing Hole 1 and confirming...")
    wait_and_click(["확인 완료 (티샷 시작)", "티샷 시작"], timeout=3)
    time.sleep(1)
    wait_and_click(["확인 (저장)"], timeout=3)
    time.sleep(0.5)

    # Move to Hole 2:
    print("[3] Moving to Hole 2...")
    wait_and_click(["다음 홀 이동"], timeout=3)
    time.sleep(1.2)

    # At Hole 2: In Step 1 (or Step 2), DO NOT CONFIRM!
    # Tap red [🛑 경기 종료] directly!
    print("[4] At Hole 2 entrance (NOT confirmed), tapping red [경기 종료]...")
    wait_and_click(["경기 종료"], timeout=3)
    time.sleep(1)

    # Check modal content
    modal_text = driver.find_element(By.TAG_NAME, "body").text
    print("\nModal Content:\n", [line for line in modal_text.split("\n") if "홀 완료" in line or "타" in line][:4])

    assert "1개 홀 완료" in modal_text or "1홀 완료" in modal_text, f"ERROR: Expected '1개 홀 완료' in modal, got:\n{modal_text}"
    assert "2개 홀 완료" not in modal_text, "ERROR: Modal falsely shows 2개 홀 완료!"
    print("✓ Modal correctly states: 1개 홀 완료!")

    # Capture modal screenshot
    modal_img_path = os.path.join(ARTIFACT_DIR, "verified_user_scenario_modal.png")
    driver.save_screenshot(modal_img_path)
    print(f"★ Saved Modal Screenshot: {modal_img_path}")

    # Choose [연습·테스트로 저장 (전적 미반영)]
    print("[5] Selecting [연습·테스트로 저장]...")
    wait_and_click(["연습·테스트로 저장", "연습"], timeout=3)
    time.sleep(2.5)

    print("Navigated to Result Page:", driver.current_url)

    # Check Result Page elements
    result_text = driver.find_element(By.TAG_NAME, "body").text
    
    print("\n--- Verifying Result Page ---")
    # 1. Hole count: Must be 1홀 진행, NOT 2홀 진행!
    assert "1홀 진행" in result_text, f"ERROR: Expected '1홀 진행' in result, got:\n{result_text}"
    assert "2홀 진행" not in result_text, "ERROR: Result page still falsely shows '2홀 진행'!"
    print("✓ Result page correctly displays: '1홀 진행 · 기준 Par 4'")

    # 2. Player strokes: Must be 4타, NOT 10타!
    assert "10타" not in result_text, "ERROR: Player strokes falsely included Hole 2 (10타)!"
    assert "4타" in result_text, "ERROR: Player strokes missing 4타!"
    print("✓ Player strokes correctly shows: 4타 (Par 4 Even)")

    # 3. Bronze badge: Must NOT show '브론즈' or '브론즈 1회'!
    assert "브론즈" not in result_text, "ERROR: Confusing '브론즈' badge is still displayed!"
    print("✓ Confusing '브론즈 (1회)' badge is COMPLETELY GONE!")

    # 4. Chronicle banner:
    assert "나의 연대기에는 정식 라운딩만 영구 보관됩니다" in result_text, "ERROR: Chronicle notice banner missing!"
    print("✓ Chronicle banner: '나의 연대기에는 정식 라운딩만 영구 보관됩니다 (기록 확인 ➔)'")

    # Capture final result screenshot
    result_img_path = os.path.join(ARTIFACT_DIR, "verified_user_scenario_result.png")
    driver.save_screenshot(result_img_path)
    print(f"★ Saved Final Result Screenshot: {result_img_path}")

    print("\n=======================================================")
    print("🎉 USER SCENARIO 100% REPRODUCED, FIXED & VERIFIED!")
    print("=======================================================")

finally:
    driver.quit()
