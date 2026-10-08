#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
apps/paki-toon/translator.py - 파키 앱 6단 만화 전용 한/일 스마트 번역 및 초정밀 콘티 파서 엔진
- 제미나이 6단 콘티 원문 텍스트 자동 분석 (에피소드 번호, 제목, 1~6컷 배지, 말풍선 대사 추출)
- (도입), (전개), (위기) 등 콘티 메타태그 자동 정제 및 펀치라인 배지 추출
- 고품격 파크골프 전문 용어 기반 한국어 -> 일본어 자동 변환
"""

import re
import sys
import urllib.request
import urllib.parse
import json

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Episode keyword detection mapping
EPISODE_KEYWORDS = [
    (1, ["낙동강", "동락", "홈마스터", "맹호", "홈그라운드"]),
    (2, ["대구", "수성", "봉덕", "달구벌", "원정대장"]),
    (3, ["화천", "산천어", "최북단", "강원"]),
    (4, ["상주", "문경", "곶감", "경북 벨트", "로드마스터"]),
    (5, ["홋카이도", "마쿠베쓰", "일본", "글로벌 개척자"]),
    (6, ["박 형님", "박형님", "밀양", "비회원", "게스트"]),
    (7, ["수중전", "영천", "비 오는 날", "비바람", "전천후"]),
    (8, ["전국 랭킹", "100위", "선산", "정 형님", "정형님", "공인 랭킹"]),
    (9, ["홀인원", "기적", "에이스", "경주"]),
    (10, ["400개", "은퇴", "부부", "캠핑카", "로드무비", "전국일주"])
]

def detect_episode_id(raw_text: str) -> int:
    """Detects which episode (1-10) the conti belongs to"""
    # 1. Match explicit episode pattern: 제8편, 제8화, 8편, 8화, Episode 8
    m = re.search(r'(?:제\s*)?([1-9]|10)\s*(?:편|화|부|장|탄|단계|Episode|Ep)', raw_text, re.IGNORECASE)
    if m:
        try:
            return int(m.group(1))
        except ValueError:
            pass

    # 2. Match by keywords
    for ep_id, keywords in EPISODE_KEYWORDS:
        for kw in keywords:
            if kw in raw_text:
                return ep_id

    return 1

def translate_text(text: str) -> str:
    """Translates Korean text to Japanese with park golf domain enhancements"""
    if not text or not text.strip():
        return ""
    
    clean_text = text.strip()
    clean_text = clean_text.replace("파키 앱", "PARKYアプリ").replace("파크온", "PARKYアプリ")
    
    try:
        url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=ja&dt=t&q=" + urllib.parse.quote(clean_text)
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        res = urllib.request.urlopen(req, timeout=6)
        data = json.loads(res.read().decode("utf-8"))
        translated = "".join([part[0] for part in data[0] if part[0]])
    except Exception as e:
        translated = clean_text

    translated = translated.replace("【", "[").replace("】", "]")
    translated = translated.replace("ParkOn", "PARKYアプリ").replace("PARKON", "PARKYアプリ")
    return translated.strip()

def parse_conti(raw_text: str) -> dict:
    """Intelligently parses Gemini 6-cut conti script into structured JSON"""
    lines = [l.strip() for l in raw_text.strip().split("\n") if l.strip()]
    
    detected_ep_id = detect_episode_id(raw_text)

    # 1. Extract Title
    title = ""
    # Try pattern: 제8편: "제목" or 제8화: 제목 or 제목: ...
    t_match1 = re.search(r'(?:제\s*[0-9]+[편화]\s*[:\-]\s*)?["“]?([^"”\n\r]+)["”]?(?:\s*\([^)]+\))?', raw_text)
    t_match2 = re.search(r'(?:제목|타이틀|TITLE|Title)[:\s]*(.+)', raw_text)
    
    if t_match2:
        title = t_match2.group(1).strip()
    elif t_match1 and ("편" in raw_text[:50] or "화" in raw_text[:50] or "제" in raw_text[:50]):
        # Match lines like: ### 제8편: "전국 랭킹 100위 진입, 전국 순회의 결실"
        for line in lines[:5]:
            if any(k in line for k in ["편:", "화:", "편 :", "화 :", "제"]):
                clean_l = re.sub(r'^[#*\s\-]+', '', line)
                clean_l = re.sub(r'^제\s*[0-9]+[편화]\s*[:\-]\s*', '', clean_l)
                clean_l = clean_l.replace('"', '').replace('“', '').replace('”', '')
                clean_l = re.sub(r'\(.*?\)', '', clean_l).strip()
                if len(clean_l) >= 4:
                    title = clean_l
                    break

    if not title:
        # Fallback to first line
        if lines:
            first = lines[0]
            clean_first = re.sub(r'^[#*\s\-]+', '', first)
            clean_first = re.sub(r'^제\s*[0-9]+[편화]\s*[:\-]\s*', '', clean_first)
            clean_first = clean_first.replace('"', '').replace('“', '').replace('”', '').strip()
            if len(clean_first) < 40 and not re.match(r'^[0-9]+[\.\)컷]', clean_first):
                title = clean_first

    if not title:
        title = f"제{detected_ep_id}화 파키 앱 전국 순회 연대기"

    # 2. Extract 6 cut blocks
    cut_blocks = {}
    current_cut = 0

    for line in lines:
        # Match lines like: 1. (도입) ..., 1컷: ..., CUT 1: ...
        # Ensure we don't match '* 6컷 구성:'
        if "6컷 구성" in line or "6컷 콘티" in line:
            continue
        m = re.search(r'^(?:[#*\s\-])*(?:제\s*)?([1-6])(?:컷|\.|\)|단계|번|\s*Cut|\s*CUT)\s*[:\.]?\s*(.*)', line, re.IGNORECASE)
        if m:
            current_cut = int(m.group(1))
            cut_blocks[current_cut] = m.group(2) if m.group(2) else ""
        elif 0 < current_cut <= 6:
            # Append continuation line
            if not any(k in line for k in ["* 등장인물", "* 핵심 포인트", "핵심 포인트:"]):
                cut_blocks[current_cut] = cut_blocks.get(current_cut, "") + " " + line

    cuts = []
    STAGE_TAGS = ["(도입)", "(전개)", "(위기)", "(반전)", "(보상)", "(감동)", "(결말)", "(도착)", "(액션)", "(공유)", "(배려)", "(결과)"]

    for i in range(1, 7):
        block = cut_blocks.get(i, "")
        
        # Clean dramatic meta-tags from block
        cleaned_block = block
        for tag in STAGE_TAGS:
            cleaned_block = cleaned_block.replace(tag, "").strip()

        # Extract badge
        badge = ""
        badge_m = re.search(r'\[([^\]]+)\]', cleaned_block)
        if badge_m:
            badge = badge_m.group(1).strip()
            # If badge has trophy text or label like [🏆 낙동강의 맹호: 구미 동락구장 홈마스터 훈장]
            if ":" in badge:
                badge = badge.split(":")[0].strip()
        else:
            # Pick a punchy 2-4 word phrase from beginning
            parts = cleaned_block.split(",")
            first_clause = parts[0].strip()
            # Remove quotes
            first_clause = first_clause.replace('"', '').replace("'", "").strip()
            if 0 < len(first_clause) <= 16:
                badge = first_clause
            elif len(first_clause) > 16:
                # Take first 15 chars
                words = first_clause.split()
                badge = " ".join(words[:3])[:15]

        # Extract bubble dialogue
        bubble = ""
        quotes = re.findall(r'["“]([^"”]+)["”]', block)
        if quotes:
            bubble = " / ".join(quotes)
        else:
            # Check for SFX words like 팡!, 깡!, 땡그랑!, Birdie!, CLANK!
            sfx_m = re.findall(r'(?:팡!|깡!|땡그랑!|버디!|홀인원!|굿샷!|나이스!|Birdie!|CLANK!|THWACK)', block)
            if sfx_m:
                bubble = " ".join(sfx_m)
            else:
                bubble = "" # Leave empty if purely narrative descriptive cut!

        if not badge or re.match(r'^\[?CUT\s*\d+\]?$', badge, re.IGNORECASE):
            canonical = ""
            try:
                cfg_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "episodes_config.json")
                if os.path.exists(cfg_path):
                    with open(cfg_path, "r", encoding="utf-8") as f:
                        all_eps = json.load(f)
                        cur_ep = next((e for e in all_eps if e.get("id") == detected_ep_id), None)
                        if cur_ep and "cuts_ko" in cur_ep and len(cur_ep["cuts_ko"]) >= i:
                            canonical = cur_ep["cuts_ko"][i - 1].get("badge", "")
            except Exception:
                pass
            badge = canonical if canonical else f"에피소드 {detected_ep_id}화 {i}컷"

        # Clean badge brackets
        badge = badge.replace("[", "").replace("]", "").strip()

        # For Episode 8 Cut 6, artwork already has dialogue; suppress duplicate
        if detected_ep_id == 8 and i == 6 and ("정 형님" in bubble or "전국구 랭커" in bubble or "전국 랭커" in bubble):
            bubble = ""

        cuts.append({
            "cut": i,
            "badge": f"[{badge[:16]}]",
            "bubble": bubble[:45]
        })

    return {
        "episode_id": detected_ep_id,
        "title": title[:35],
        "cuts": cuts
    }

def translate_conti(parsed_data: dict) -> dict:
    """Translates the parsed title and 6 cuts into Japanese"""
    ja_title = translate_text(parsed_data.get("title", ""))
    ja_cuts = []
    for c in parsed_data.get("cuts", []):
        b_ja = translate_text(c.get("badge", ""))
        bb_ja = translate_text(c.get("bubble", ""))
        ja_cuts.append({
            "cut": c.get("cut"),
            "badge": b_ja,
            "bubble": bb_ja
        })
    return {
        "episode_id": parsed_data.get("episode_id", 1),
        "title": ja_title,
        "cuts": ja_cuts
    }

if __name__ == "__main__":
    sample = """
    ### 제8편: "전국 랭킹 100위 진입, 전국 순회의 결실" (공인 랭킹 편)

    * 등장인물/배경: 전국 투어 열혈 골퍼 정 형님 / 구미 선산 파크골프장
    * 6컷 구성:
    1. (도입) 전국 구장을 누비며 수십 개 스탬프를 모은 정 형님, 1번 홀 티박스에 당당히 섬.
    2. (전개) 오늘따라 드라이버 티샷이 빨랫줄처럼 뻗어나가며 원정 내공 폭발!
    3. (위기) 18홀 종료 후 파키 앱의 [전국 실시간 랭킹] 탭을 떨리는 손으로 터치.
    4. (보상) 랭킹 그래프가 수직 상승하며 축포 팝업: [전국 상위 4.8% / TOP 100위 랭커 진입 훈장]!
    5. (감동) 파키 앱 화면에 선명하게 뜬 '공식 인증 전국 94위' 훈장과 트로피.
    6. (결말) 단톡방이 발칵 뒤집힘: "정 형님, 전국 구장 돌더니 진짜 전국구 랭커가 되셨네요!"

    * 핵심 포인트: 여러 구장을 다니며 쌓은 실력이 공인된 전국 순위와 상위 퍼센트로 증명.
    """
    p = parse_conti(sample)
    print("Detected Ep ID:", p["episode_id"])
    print("Title:", p["title"])
    for c in p["cuts"]:
        print(f"Cut {c['cut']}: Badge={c['badge']}, Bubble={c['bubble']}")
