#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
apps/paki-toon/studio_engine.py - 6단 만화 원클릭 & 실시간 비주얼 편집 렌더링 코어 엔진
- 100% 무결점 한글/일본어 렌더링 (외계어 0%)
- 마스코트 캐릭터 (PARKY) 1번 기준원형 무결성 유지
- 상단 고대비 헤더 + 각 컷별 고유 노란색 안내 뱃지 + 말풍선 자동 레이아웃
- SNS(밴드/페이스북/인스타) 전용 1080x1080 6장 카드 자동 슬라이싱
"""

import os
import sys
import json
import shutil
import re
from PIL import Image, ImageDraw, ImageFont

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_IMAGES_DIR = os.path.join(CURRENT_DIR, "base_images")
CONFIG_PATH = os.path.join(CURRENT_DIR, "episodes_config.json")
OUTPUTS_DIR = os.path.join(CURRENT_DIR, "static", "outputs")
os.makedirs(OUTPUTS_DIR, exist_ok=True)

DESKTOP_DIR = r"D:\UserFiles\Desktop"
if not os.path.exists(DESKTOP_DIR):
    DESKTOP_DIR = os.path.join(os.environ.get("USERPROFILE", "C:/Users/Admin"), "Desktop")

COLLECTION_DIR = os.path.join(DESKTOP_DIR, "🎨_파크골프_공식만화_모음")
os.makedirs(COLLECTION_DIR, exist_ok=True)

# Font configurations
FONT_KR_BOLD = "C:/Windows/Fonts/NanumGothicBold.ttf"
if not os.path.exists(FONT_KR_BOLD):
    FONT_KR_BOLD = "C:/Windows/Fonts/malgunbd.ttf"

FONT_KR_REG = "C:/Windows/Fonts/NanumGothic.ttf"
if not os.path.exists(FONT_KR_REG):
    FONT_KR_REG = "C:/Windows/Fonts/malgun.ttf"

FONT_JA_BOLD = "C:/Windows/Fonts/YuGothB.ttc"
if not os.path.exists(FONT_JA_BOLD):
    FONT_JA_BOLD = "C:/Windows/Fonts/msgothic.ttc"

FONT_JA_REG = "C:/Windows/Fonts/YuGothM.ttc"
if not os.path.exists(FONT_JA_REG):
    FONT_JA_REG = "C:/Windows/Fonts/msgothic.ttc"

def get_font(lang="ko", size=16, bold=True):
    try:
        if lang == "ja":
            return ImageFont.truetype(FONT_JA_BOLD if bold else FONT_JA_REG, size, index=0)
        else:
            return ImageFont.truetype(FONT_KR_BOLD if bold else FONT_KR_REG, size)
    except Exception:
        return ImageFont.load_default()

def load_episodes_config():
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

# Cut regions in 1024x1024 master canvas
CUT_AREAS = [
    {"cut": 1, "box": (8, 96, 514, 400), "badge_pos": (18, 108)},
    {"cut": 2, "box": (514, 96, 1016, 400), "badge_pos": (526, 108)},
    {"cut": 3, "box": (8, 400, 514, 704), "badge_pos": (18, 405)},
    {"cut": 4, "box": (514, 400, 1016, 704), "badge_pos": (526, 405)},
    {"cut": 5, "box": (8, 704, 514, 1016), "badge_pos": (18, 702)},
    {"cut": 6, "box": (514, 704, 1016, 1016), "badge_pos": (526, 702)},
]

def draw_yellow_badge(draw, x, y, text, lang="ko", font_size=15):
    """Draws high-contrast yellow badge with black border, occluding underlying text"""
    if not text or not text.strip():
        return
    text = text.strip()
    if not text.startswith("["):
        display_text = f"[{text}]"
    else:
        display_text = text

    font = get_font(lang=lang, size=font_size, bold=True)
    bbox = draw.textbbox((0, 0), display_text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]

    pad_x = 16
    pad_y = 10
    w = max(210, tw + pad_x * 2)
    h = max(44, th + pad_y * 2)

    x2 = x + w
    y2 = y + h
    # Draw yellow box with 2px black border
    draw.rectangle([x, y, x2, y2], fill="#FFE033", outline="#000000", width=2)
    # Draw text centered
    draw.text(((x + x2) // 2, (y + y2) // 2), display_text, fill="#000000", font=font, anchor="mm")

def draw_speech_bubble(draw, box, text, lang="ko", font_size=14, tail_point=None):
    """Draws clean white speech bubble with crisp text"""
    if not text:
        return
    x1, y1, x2, y2 = box
    font = get_font(lang=lang, size=font_size, bold=True)

    # Wrap text if multi-line or contains / or \n
    if "/" in text:
        lines = [l.strip() for l in text.split("/")]
    elif "\n" in text:
        lines = [l.strip() for l in text.split("\n")]
    else:
        # Auto wrap long lines (approx 16 chars per line)
        words = text.split(" ")
        lines = []
        cur = ""
        for w in words:
            if len(cur) + len(w) > 15:
                if cur:
                    lines.append(cur)
                cur = w
            else:
                cur = (cur + " " + w).strip()
        if cur:
            lines.append(cur)

    # Draw tail if specified
    if tail_point:
        tx, ty = tail_point
        cx = (x1 + x2) // 2
        tail_poly = [(cx - 10, y2 - 2), (tx, ty), (cx + 10, y2 - 2)]
        draw.polygon(tail_poly, fill="#FFFFFF", outline="#000000")
        draw.line(tail_poly, fill="#000000", width=2)

    # Draw rounded rectangle
    draw.rounded_rectangle([x1, y1, x2, y2], radius=18, fill="#FFFFFF", outline="#000000", width=2)

    # If tail, fill inside overlap
    if tail_point:
        draw.polygon([(cx - 8, y2 - 4), (tx, ty - 2), (cx + 8, y2 - 4)], fill="#FFFFFF")

    # Draw text lines
    line_h = font_size + 5
    total_h = len(lines) * line_h
    start_y = (y1 + y2 - total_h) // 2 + line_h // 2
    for i, line in enumerate(lines):
        cy = start_y + i * line_h
        draw.text(((x1 + x2) // 2, cy), line, fill="#000000", font=font, anchor="mm")

def render_episode_8_overlay(draw, lang="ko", overrides=None):
    """
    Episode 8 specialized overlay:
    Replaces garbled AI Korean text in Cut 2 & Cut 5 narration boxes with 100% crisp typography,
    and applies clean badges for Cuts 1, 3, 4, 6 without overlapping speech bubbles or blur smudges.
    """
    font_bold = get_font(lang=lang, size=15, bold=True)
    font_reg = get_font(lang=lang, size=12, bold=False)

    # Cut 1 Badge: [15개 구장 순회] / [15コース巡礼]
    b1 = overrides.get("cuts", [{}])[0].get("badge", "") if overrides and "cuts" in overrides and len(overrides["cuts"]) > 0 else ""
    if not b1 or re.match(r'^\[?CUT\s*\d+\]?$', b1, re.IGNORECASE):
        b1 = "[15개 구장 순회]" if lang == "ko" else "[15コース巡礼]"
    draw.rectangle([17, 108, 235, 148], fill="#FFFFFF", outline="#000000", width=2)
    draw.text(((17 + 235) // 2, (108 + 148) // 2), b1, fill="#000000", font=font_bold, anchor="mm")

    # Cut 2 Narration Box
    b2 = overrides.get("cuts", [{}])[1].get("badge", "") if overrides and "cuts" in overrides and len(overrides["cuts"]) > 1 else ""
    if not b2 or re.match(r'^\[?CUT\s*\d+\]?$', b2, re.IGNORECASE):
        b2 = "[원정 내공 폭발]" if lang == "ko" else "[全国ランキング確認]"
    draw.rectangle([518, 106, 768, 254], fill="#FFFFFF", outline="#000000", width=2)
    draw.text(((518 + 768) // 2, 130), b2, fill="#000000", font=font_bold, anchor="mm")
    if lang == "ja":
        lines2 = [
            "15コースの遠征を終えた先輩、",
            "帰宅後すぐにPARKYアプリ起動！",
            "胸を高鳴らせてランキング確認！"
        ]
    else:
        lines2 = [
            "선산·영천 등 15개 구장을 완주한",
            "정 형님, 집에 오자마자 파키 앱 켜고",
            "두근거리는 마음으로 [전국 랭킹] 탭 클릭!"
        ]
    for idx, l in enumerate(lines2):
        draw.text(((518 + 768) // 2, 160 + idx * 24), l, fill="#1E293B", font=font_reg, anchor="mm")

    # Cut 3 Badge
    b3 = overrides.get("cuts", [{}])[2].get("badge", "") if overrides and "cuts" in overrides and len(overrides["cuts"]) > 2 else ""
    if not b3 or re.match(r'^\[?CUT\s*\d+\]?$', b3, re.IGNORECASE):
        b3 = "[전국 랭킹 TOP 100]" if lang == "ko" else "[全国ランキングTOP100]"
    draw.rectangle([17, 396, 235, 436], fill="#FFFFFF", outline="#000000", width=2)
    draw.text(((17 + 235) // 2, (396 + 436) // 2), b3, fill="#000000", font=font_bold, anchor="mm")

    # Cut 4 Badge
    b4 = overrides.get("cuts", [{}])[3].get("badge", "") if overrides and "cuts" in overrides and len(overrides["cuts"]) > 3 else ""
    if not b4 or re.match(r'^\[?CUT\s*\d+\]?$', b4, re.IGNORECASE):
        b4 = "[다이아몬드 마스터 훈장]" if lang == "ko" else "[ダイヤモンドマスター勲章]"
    draw.rectangle([518, 396, 808, 436], fill="#FFFFFF", outline="#000000", width=2)
    draw.text(((518 + 808) // 2, (396 + 436) // 2), b4, fill="#000000", font=font_bold, anchor="mm")

    # Cut 5 Narration Box
    b5 = overrides.get("cuts", [{}])[4].get("badge", "") if overrides and "cuts" in overrides and len(overrides["cuts"]) > 4 else ""
    if not b5 or re.match(r'^\[?CUT\s*\d+\]?$', b5, re.IGNORECASE):
        b5 = "[동호회 단톡방 1초 공유]" if lang == "ko" else "[グループLINEへ1秒共有]"
    draw.rectangle([17, 690, 422, 852], fill="#FFFFFF", outline="#000000", width=2)
    draw.text(((17 + 422) // 2, 716), b5, fill="#000000", font=font_bold, anchor="mm")
    if lang == "ja":
        lines5 = [
            "獲得した公式勲章12枚と",
            "全国94位ランキングカードを",
            "グループLINEへ1秒共有！"
        ]
    else:
        lines5 = [
            "공식 인증 전국 94위 랭킹 카드와",
            "마스터 훈장을 단톡방에 원터치 공유!",
            "동호회 회원들의 감탄과 축하 쇄도!"
        ]
    for idx, l in enumerate(lines5):
        draw.text(((17 + 422) // 2, 750 + idx * 26), l, fill="#1E293B", font=font_reg, anchor="mm")

    # Cut 6 Badge
    b6 = overrides.get("cuts", [{}])[5].get("badge", "") if overrides and "cuts" in overrides and len(overrides["cuts"]) > 5 else ""
    if not b6 or re.match(r'^\[?CUT\s*\d+\]?$', b6, re.IGNORECASE):
        b6 = "[동호회 단톡방 반응 쇄도!]" if lang == "ko" else "[仲間から称賛の嵐！]"
    draw.rectangle([518, 690, 808, 742], fill="#FFFFFF", outline="#000000", width=2)
    draw.text(((518 + 808) // 2, (690 + 742) // 2), b6, fill="#000000", font=font_bold, anchor="mm")

    # In Japanese mode, translate bottom yellow badges too!
    if lang == "ja":
        def draw_ja_box(box, text):
            x1, y1, x2, y2 = box
            font_ja = get_font(lang="ja", size=15, bold=True)
            draw.rectangle([x1, y1, x2, y2], fill="#FFE033", outline="#000000", width=2)
            draw.text(((x1 + x2) // 2, (y1 + y2) // 2), text, fill="#000000", font=font_ja, anchor="mm")

        draw_ja_box([245, 322, 485, 368], "15コース巡礼完走")
        draw_ja_box([768, 318, 975, 368], "全国ランキング確認")
        draw_ja_box([28, 622, 248, 668], "TOP 100 突破！")
        draw_ja_box([288, 622, 485, 668], "TOP 100 突破！")
        draw_ja_box([515, 622, 698, 668], "マスター勲章授与")
        draw_ja_box([792, 622, 972, 668], "マスター勲章授与")
        draw_ja_box([25, 930, 205, 975], "LINE 1秒共有")

def render_episode(ep_id: int, lang: str = "ko", overrides: dict = None, save_to_desktop: bool = True):
    """
    Renders a complete 6-cut master comic and slices 6 SNS cards.
    """
    episodes = load_episodes_config()
    ep_data = next((e for e in episodes if e["id"] == ep_id), None)
    if not ep_data:
        raise ValueError(f"Episode {ep_id} not found in configuration")

    # Base image path
    base_img_path = os.path.join(BASE_IMAGES_DIR, f"ep_{ep_id:02d}_base.jpg")
    if not os.path.exists(base_img_path):
        raise FileNotFoundError(f"Base image not found: {base_img_path}")

    # Open base image
    im = Image.open(base_img_path).convert("RGB")
    draw = ImageDraw.Draw(im)

    # Determine Title
    if overrides and overrides.get("title"):
        title = overrides["title"]
    else:
        title = ep_data.get(f"title_{lang}", ep_data.get("title_ko", ""))

    # 1. Render Top Header Banner (White banner with 4px border)
    draw.rectangle([8, 8, 1016, 92], fill="#FFFFFF", outline="#000000", width=4)
    # Header font scaling
    header_font_size = 40
    if len(title) > 22:
        header_font_size = 32
    if len(title) > 28:
        header_font_size = 26
    h_font = get_font(lang=lang, size=header_font_size, bold=True)
    draw.text((512, 50), title, fill="#000000", font=h_font, anchor="mm")

    # Cuts data
    cuts_key = f"cuts_{lang}"
    default_cuts = ep_data.get(cuts_key, ep_data.get("cuts_ko", []))

    # Check if Episode 8 specialized clean overlay
    if ep_id == 8:
        render_episode_8_overlay(draw, lang, overrides=overrides)
    else:
        # Generic rendering for other episodes
        for i in range(6):
            cut_num = i + 1
            cut_area = CUT_AREAS[i]
            c_default = default_cuts[i] if i < len(default_cuts) else {"badge": "", "bubble": ""}
            
            # Check for overrides
            badge_text = c_default.get("badge", "")
            bubble_text = c_default.get("bubble", "")
            if overrides and "cuts" in overrides and len(overrides["cuts"]) > i:
                c_over = overrides["cuts"][i]
                if "badge" in c_over:
                    badge_text = c_over["badge"]
                if "bubble" in c_over:
                    bubble_text = c_over["bubble"]

            # 2. Draw Yellow Badge (Suppressed if [CUT X])
            bx, by = cut_area["badge_pos"]
            if badge_text and not re.match(r'^\[?CUT\s*\d+\]?$', badge_text.strip(), re.IGNORECASE):
                draw_yellow_badge(draw, bx, by, badge_text, lang=lang, font_size=15)

            # 3. Draw Speech Bubble if present
            if bubble_text and bubble_text.strip():
                cx1, cy1, cx2, cy2 = cut_area["box"]
                if cut_num in [1, 3]:
                    b_box = [cx1 + 220, cy1 + 20, cx2 - 20, cy1 + 95]
                    tail = (cx1 + 250, cy1 + 115)
                elif cut_num in [2, 4]:
                    b_box = [cx1 + 200, cy1 + 20, cx2 - 20, cy1 + 95]
                    tail = (cx1 + 240, cy1 + 115)
                elif cut_num == 5:
                    b_box = [cx1 + 20, cy1 + 40, cx1 + 280, cy1 + 120]
                    tail = (cx1 + 120, cy1 + 145)
                else: # Cut 6
                    b_box = [cx1 + 180, cy1 + 30, cx2 - 20, cy1 + 125]
                    tail = (cx1 + 220, cy1 + 150)
                
                draw_speech_bubble(draw, b_box, bubble_text, lang=lang, font_size=13, tail_point=tail)

    # File naming
    safe_title = "".join(c for c in title if c.isalnum() or c in (" ", "_", "-")).strip()
    safe_title = safe_title.replace(" ", "_")[:35]
    lang_suffix = "일본어판" if lang == "ja" else "완성본"
    master_filename = f"제{ep_id}화_{safe_title}_6단만화_{lang_suffix}.jpg"
    
    # Save master image to static outputs
    web_master_path = os.path.join(OUTPUTS_DIR, f"ep_{ep_id:02d}_{lang}_master.jpg")
    im.save(web_master_path, quality=95)

    # Save directly and strictly inside the official collection folder (🎨_파크골프_공식만화_모음)
    collection_master_path = os.path.join(COLLECTION_DIR, master_filename)
    im.save(collection_master_path, quality=95)
    desktop_master_path = collection_master_path

    # 4. Slicing 6 individual 1080x1080 cards for SNS
    sliced_cards = []
    cards_subfolder_name = f"제{ep_id}화_{safe_title}_{lang_suffix}_카드뉴스_6컷"
    desktop_cards_folder = os.path.join(COLLECTION_DIR, cards_subfolder_name)
    web_cards_folder = os.path.join(OUTPUTS_DIR, f"ep_{ep_id:02d}_{lang}_cards")
    os.makedirs(desktop_cards_folder, exist_ok=True)
    os.makedirs(web_cards_folder, exist_ok=True)

    for i in range(6):
        cut_num = i + 1
        box = CUT_AREAS[i]["box"]
        cut_crop = im.crop(box)

        # Create 1080x1080 canvas
        card_canvas = Image.new("RGB", (1080, 1080), color="#F8FAF9")
        c_draw = ImageDraw.Draw(card_canvas)

        # Header banner on Card
        c_draw.rectangle([0, 0, 1080, 110], fill="#FFFFFF", outline="#000000", width=3)
        card_header_text = f"제{ep_id}화 {title}  |  CUT {cut_num}" if lang == "ko" else f"第{ep_id}話 {title}  |  CUT {cut_num}"
        c_font = get_font(lang=lang, size=28, bold=True)
        c_draw.text((540, 55), card_header_text, fill="#000000", font=c_font, anchor="mm")

        # Scale and fit panel into 1000x820 area
        target_w = 1000
        target_h = int(cut_crop.height * (target_w / cut_crop.width))
        if target_h > 820:
            target_h = 820
            target_w = int(cut_crop.width * (target_h / cut_crop.height))
        
        resized_crop = cut_crop.resize((target_w, target_h), Image.Resampling.LANCZOS)
        paste_x = (1080 - target_w) // 2
        paste_y = 130 + (820 - target_h) // 2
        
        # Paste image with black border
        card_canvas.paste(resized_crop, (paste_x, paste_y))
        c_draw.rectangle([paste_x - 3, paste_y - 3, paste_x + target_w + 3, paste_y + target_h + 3], outline="#000000", width=3)

        # Footer branding
        c_draw.rectangle([0, 980, 1080, 1080], fill="#1B4D3E")
        brand_text = "🏌️ 대한민국 No.1 파크골프 공식 앱 — 파키 (PARKY APP)" if lang == "ko" else "🏌️ 韓国＆日本公式 パークゴルフ・ポータル — PARKY APP"
        b_font = get_font(lang=lang, size=24, bold=True)
        c_draw.text((540, 1030), brand_text, fill="#FFFFFF", font=b_font, anchor="mm")

        # Save card
        card_filename = f"카드_{cut_num:02d}컷_{lang}.jpg"
        web_card_filename = f"card_{cut_num:02d}_{lang}.jpg"
        web_card_path = os.path.join(web_cards_folder, web_card_filename)
        desktop_card_path = os.path.join(desktop_cards_folder, card_filename)
        
        card_canvas.save(web_card_path, quality=95)
        card_canvas.save(desktop_card_path, quality=95)
        
        sliced_cards.append({
            "cut": cut_num,
            "filename": card_filename,
            "web_url": f"/outputs/ep_{ep_id:02d}_{lang}_cards/{web_card_filename}",
            "desktop_path": desktop_card_path
        })

    return {
        "status": "success",
        "episode_id": ep_id,
        "lang": lang,
        "title": title,
        "master_web_url": f"/outputs/ep_{ep_id:02d}_{lang}_master.jpg?t={int(os.path.getmtime(web_master_path))}",
        "desktop_master_path": desktop_master_path,
        "collection_master_path": collection_master_path,
        "cards_folder": desktop_cards_folder,
        "cards": sliced_cards
    }

if __name__ == "__main__":
    print("Testing render_episode for Episode 1 (KO)...")
    res1 = render_episode(1, lang="ko")
    print("Episode 1 KO rendered:", res1["title"])
    print("Desktop master:", res1["desktop_master_path"])
    print(f"Cards sliced: {len(res1['cards'])} items")

    print("\nTesting render_episode for Episode 10 (JA)...")
    res10 = render_episode(10, lang="ja")
    print("Episode 10 JA rendered:", res10["title"])
    print("Desktop master:", res10["desktop_master_path"])
    print("All engine tests passed!")
