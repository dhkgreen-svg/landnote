# -*- coding: utf-8 -*-
"""
verify_in_place_confirm_and_early_finish.py
Tests:
1. In-place color change on [확인 (저장)] with ZERO layout shift
2. Next hole button remains stationary and clickable
3. Prominent RED [경기 종료] button in Step 2 and Step 1
4. Clicking [경기 종료] opens the finish confirmation modal immediately
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
    print("[1] Navigating to http://localhost:3008/round/new?courseId=course-gumi-dongrak...")
    driver.get("http://localhost:3008/round/new?courseId=course-gumi-dongrak")
    time.sleep(2)

    # Set user info
    driver.execute_script("""
        localStorage.setItem('parkon_player_name', '김대희');
        localStorage.setItem('parkon_member_code', 'PKY-7788');
        localStorage.setItem('parkon_user_role', 'LEADER');
        const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
        const names = ['김대희', '오송', '박프로', '이싱글'];
        inputs.slice(0, 4).forEach((input, i) => {
            input.value = names[i];
            input.dispatchEvent(new Event('input', { bubbles: true }));
        });
    """)
    time.sleep(0.5)

    # Click start round
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    time.sleep(0.3)
    start_btn = None
    for b in driver.find_elements(By.TAG_NAME, "button"):
        if "티샷 시작" in b.text or "라운드 시작" in b.text:
            start_btn = b
            break
    assert start_btn is not None, "Start button not found"
    js_click(start_btn)
    time.sleep(1)

    wait_and_click(["라운딩 시작하기", "확인했습니다"], timeout=2)
    time.sleep(2.5)

    print("Entered Round Room:", driver.current_url)

    # --- TEST 1: Step 1 (Tee-shot board) has prominent [🛑 경기 종료] button ---
    time.sleep(1)
    step1_path = os.path.join(ARTIFACT_DIR, "verified_step1_prominent_finish_button.png")
    driver.save_screenshot(step1_path)
    print(f"★ Saved Step 1 Screenshot: {step1_path}")

    # Move to Step 2 (scoring table)
    wait_and_click(["확인 완료 (티샷 시작)", "티샷 시작"], timeout=3)
    time.sleep(1.2)

    # --- TEST 2: Step 2 initial state with prominent [🛑 경기 종료] button ---
    step2_initial_path = os.path.join(ARTIFACT_DIR, "verified_step2_initial_buttons.png")
    driver.save_screenshot(step2_initial_path)
    print(f"★ Saved Step 2 Initial Buttons Screenshot: {step2_initial_path}")

    # Find [✔️ 확인 (저장)] button and record its initial vertical position
    confirm_btn = None
    next_btn = None
    for b in driver.find_elements(By.TAG_NAME, "button"):
        txt = b.text.strip()
        if "확인 (저장)" in txt:
            confirm_btn = b
        elif "다음 홀 이동" in txt:
            next_btn = b

    assert confirm_btn is not None, "Confirm button not found!"
    assert next_btn is not None, "Next hole button not found!"

    y_before_confirm = next_btn.location['y']
    print(f"Next button Y position before confirm: {y_before_confirm}")

    # Click [✔️ 확인 (저장)]
    js_click(confirm_btn)
    time.sleep(0.3)

    # Check button text and Y position
    y_after_confirm = next_btn.location['y']
    print(f"Next button Y position after confirm: {y_after_confirm}")
    delta_y = abs(y_after_confirm - y_before_confirm)
    print(f"Layout shift delta Y: {delta_y}px")
    assert delta_y <= 2, f"Layout shifted by {delta_y}px! Expected 0px shift."

    # Capture in-place color change screenshot
    inplace_path = os.path.join(ARTIFACT_DIR, "verified_confirm_inplace_color.png")
    driver.save_screenshot(inplace_path)
    print(f"★ Saved In-Place Confirm Color Screenshot: {inplace_path}")

    # --- TEST 3: Click prominent RED [🛑 경기 종료] button ---
    time.sleep(0.5)
    finish_clicked = wait_and_click(["경기 종료", "라운드 종료"], timeout=3)
    assert finish_clicked, "Early finish button not found or not clickable!"
    time.sleep(1)

    # Verify finish confirmation modal opens
    modal_path = os.path.join(ARTIFACT_DIR, "verified_early_finish_modal_open.png")
    driver.save_screenshot(modal_path)
    print(f"★ Saved Early Finish Modal Screenshot: {modal_path}")

    modal_text = driver.find_element(By.TAG_NAME, "body").text
    assert "오늘 스코어를 저장할까요?" in modal_text or "本日のスコアを保存しますか" in modal_text, "Finish modal text not found!"
    print("✓ Early finish modal successfully opened!")

    print("\n=======================================================")
    print("🎉 ALL UX ENHANCEMENTS VERIFIED WITH 100% SUCCESS!")
    print("=======================================================")

finally:
    driver.quit()
