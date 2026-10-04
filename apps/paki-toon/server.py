#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
apps/paki-toon/server.py - 구글 통합 사령탑 올인원 멀티미디어 & 영상 스튜디오 백엔드
포트: 3050 (http://localhost:3050)

4대 통합 기능:
1. 🎨 만화/웹툰 스튜디오 (4컷/6컷 웹툰, 룰 가이드)
2. 🎬 숏폼/쇼츠·릴스 스튜디오 (15초/30초 영상 콘티, 타임코드, 자막)
3. 🖼️ 마케팅 배너/카드뉴스 스튜디오 (16:9 썸네일, 1:1 인스타 배너)
4. 👥 공용 캐릭터/인물 보관함 (Character Vault - 파키 및 동반자 4인방)
"""

import os
import sys
import json
import http.server
import socketserver
import urllib.parse
import datetime
from dotenv import load_dotenv

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

PORT = 3050
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(os.path.dirname(CURRENT_DIR))
ENV_PATH = os.path.join(ROOT_DIR, "config.env")
DATA_FILE = os.path.join(CURRENT_DIR, "chapters_data.json")
CHAR_FILE = os.path.join(CURRENT_DIR, "characters.json")
OUTPUTS_DIR = os.path.join(ROOT_DIR, "outputs")
PARKON_PUBLIC = os.path.join(ROOT_DIR, "apps", "parkon", "public")
if not os.path.exists(PARKON_PUBLIC):
    PARKON_PUBLIC = os.path.join(os.path.dirname(ROOT_DIR), "google_drive_docs_search", "apps", "parkon", "public")

load_dotenv(ENV_PATH)
load_dotenv()

# --- 데이터 읽기/쓰기 헬퍼 ---
def load_json(filepath, default_val):
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return default_val

def save_json(filepath, data):
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# --- 1. 만화 멀티컷 생성 엔진 ---
def generate_multi_cut_with_ai(topic: str, cut_count: int, pose: str, cast: list, chapter_num: str):
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    cut_count = int(cut_count) if str(cut_count).isdigit() else 4
    cast_str = ", ".join(cast) if cast else "파키 (마스코트)"

    fallback_cuts = []
    if not api_key or api_key.startswith("your_"):
        for i in range(1, cut_count + 1):
            fallback_cuts.append({
                "cutNumber": i,
                "title": f"{topic} - {i}단계 가이드",
                "badge": "핵심 규정" if i == cut_count else "상황 진행",
                "badgeType": "penalty" if i == 2 else ("caution" if i == 1 else "info"),
                "situation": f"{topic} 상황의 {i}번째 진행 단계입니다. (출연: {cast_str})",
                "parkyDialogue": f"선배님들! {i}번째 단계에서는 규칙을 차근차근 확인하며 안전하게 플레이해주세요!",
                "verdict": "규정에 맞게 처리",
                "penaltyText": "위반 시 2벌타 주의",
                "keyPoint": f"{topic}의 원칙을 숙지하면 파크골프가 더 즐겁습니다.",
                "article": f"대한파크골프협회 공인 규정 제{chapter_num}장",
                "pose": pose,
                "cast": cast_str
            })
        return {
            "chapterTitle": f"{topic} 완전 정복 ({cut_count}컷)",
            "cuts": fallback_cuts
        }

    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        prompt = f"""
당신은 대한민국 1등 파크골프 앱 '파키(ParkOn)'의 전문 웹툰 연출 감독 겸 스토리 작가입니다.
사용자가 요청한 상황을 바탕으로, 동호인 어르신들이 배꼽 잡고 공감하며 쉽게 룰을 배울 수 있는 {cut_count}컷 완결형 웹툰 대본을 작성하십시오.

주제: {topic}
총 컷수: {cut_count}컷 (반드시 정확히 {cut_count}개의 컷을 배열로 반환)
등장인물: {cast_str}
파키 포즈: {pose}

[컷별 연출 가이드]
- 1컷: 코스 상황 발생 (등장인물들의 일상적인 라운드 장면)
- 2컷: 실수나 규정 위반 위기 (동반자들의 웅성거림 또는 초보의 실수)
- 3컷 (또는 중간 컷): 파키가 짠! 나타나 정확한 룰과 판정 설명 (호루라기 또는 명쾌한 해설)
- 마지막 컷: 올바른 처리 후 멋지게 굿샷을 날리는 훈훈한 마무리

반드시 아래 JSON 형식으로만 응답하십시오:
{{
  "chapterTitle": "에피소드 전체 제목",
  "cuts": [
    {{
      "cutNumber": 1,
      "title": "1컷 제목",
      "badge": "상황 배지 (예: 2벌타 주의, 무벌타 구제 등)",
      "badgeType": "info" (info | caution | penalty | safe 중 택1),
      "situation": "만화 컷 연출 상황 1~2문장",
      "parkyDialogue": "파키 또는 등장인물 대사 2문장",
      "verdict": "공식 최종 판정 1문장",
      "penaltyText": "벌타 내용 (예: 2벌타, 무벌타, 1타 가산)",
      "keyPoint": "어르신이 꼭 기억할 핵심 팁 1문장",
      "article": "관련 협회 조항 (예: 제3장 제31조)",
      "pose": "{pose}",
      "cast": "{cast_str}"
    }}
  ]
}}
"""
        resp = client.models.generate_content(
            model=os.getenv("GEMINI_MODEL", "gemini-3.5-flash"),
            contents=prompt,
            config={"response_mime_type": "application/json"}
        )
        return json.loads(resp.text)
    except Exception as e:
        for i in range(1, cut_count + 1):
            fallback_cuts.append({
                "cutNumber": i,
                "title": f"{topic} {i}컷",
                "badge": "규정 안내",
                "badgeType": "info",
                "situation": f"{topic}에 대한 안내입니다. (출연: {cast_str})",
                "parkyDialogue": f"선배님들! {topic} 규칙을 지키면 더욱 품격 있는 라운드가 됩니다!",
                "verdict": "규정 준수 플레이",
                "penaltyText": "규정에 따른 처리",
                "keyPoint": "안전과 매너가 최우선입니다.",
                "article": "공인 규정",
                "pose": pose,
                "cast": cast_str
            })
        return {
            "chapterTitle": f"{topic} 에피소드",
            "cuts": fallback_cuts
        }

# --- 2. 쇼츠/릴스 영상 콘티 생성 엔진 ---
def generate_shorts_script_with_ai(topic: str, duration: int, style: str):
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    duration = int(duration) if str(duration).isdigit() else 15

    if not api_key or api_key.startswith("your_"):
        return {
            "title": f"15초 만에 배우는 파크골프: {topic}",
            "duration": f"{duration}초",
            "hook": "잠깐! 아직도 이렇게 치시다가 2벌타 받으시나요?",
            "scenes": [
                {"time": "0~3초", "visual": "화면 가득 빨간 경고 사이렌과 당황한 골퍼 모습", "audio": "선배님들! 이 실수 하나로 2벌타 날아갑니다!", "caption": "🚨 2벌타 주의! 흔한 실수"},
                {"time": f"3~{duration-4}초", "visual": "파키가 호루라기를 불며 정확한 티박스 규정을 짚어줌", "audio": f"{topic} 상황에서는 한 발이라도 꼭 매트 안에 닿아야 해요!", "caption": "✅ 올바른 해결법: 매트 안 접촉 필수"},
                {"time": f"{duration-4}~{duration}초", "visual": "멋지게 나이스 샷을 날리고 엄지척하는 파키", "audio": "더 많은 파크골프 꿀팁은 '파키' 앱에서 무료로 확인하세요!", "caption": "📲 파키 앱 다운받고 굿샷 날리세요!"}
            ],
            "bgm": "경쾌하고 통통 튀는 어쿠스틱 컨트리풍 음악",
            "voiceTone": "밝고 똑 부러지는 귀여운 파키 캐릭터 목소리"
        }

    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        prompt = f"""
당신은 유튜브 쇼츠 & 인스타그램 릴스 100만 뷰 바이럴 전문 PD입니다.
파크골프 동호인(50~70대 어르신)의 시선을 1초 만에 사로잡는 {duration}초 숏폼 영상 콘티와 대본을 작성하십시오.

주제: {topic}
스타일: {style} (유머/코믹, 1타레슨, 팩트체크 등)
영상 길이: {duration}초

반드시 아래 JSON 형식으로 응답하십시오:
{{
  "title": "쇼츠 영상 썸네일 제목 (어그로/궁금증 유발)",
  "duration": "{duration}초",
  "hook": "0~3초 이탈 방지 첫 대사",
  "scenes": [
    {{
      "time": "0~3초",
      "visual": "화면 연출 및 파키 캐릭터 애니메이션 지시문",
      "audio": "성우/파키 대사 (귀에 쏙쏙 박히는 구어체)",
      "caption": "화면 중앙에 큼직하게 띄울 핵심 자막"
    }},
    {{
      "time": "3~{duration-4}초",
      "visual": "본문 핵심 룰 설명 화면 연출",
      "audio": "정확한 룰 설명 대사",
      "caption": "핵심 요약 자막"
    }},
    {{
      "time": "{duration-4}~{duration}초",
      "visual": "구독/앱 유입 CTA 화면",
      "audio": "마무리 멘트 (파키 앱 추천)",
      "caption": "하단 다운로드 링크 안내"
    }}
  ],
  "bgm": "추천 배경음악 분위기",
  "voiceTone": "추천 목소리 톤앤매너"
}}
"""
        resp = client.models.generate_content(
            model=os.getenv("GEMINI_MODEL", "gemini-3.5-flash"),
            contents=prompt,
            config={"response_mime_type": "application/json"}
        )
        return json.loads(resp.text)
    except Exception as e:
        return {
            "title": f"파크골프 꿀팁: {topic}",
            "duration": f"{duration}초",
            "hook": f"선배님들! {topic} 아직도 헷갈리시나요?",
            "scenes": [
                {"time": "0~3초", "visual": "당황한 캐릭터 모습", "audio": "이 실수 꼭 알고 가세요!", "caption": "📢 꿀팁 대방출"},
                {"time": "3~12초", "visual": "파키의 친절한 룰 가이드", "audio": f"{topic}의 핵심은 안전과 규정 준수입니다!", "caption": "💡 핵심 수칙"},
                {"time": "12~15초", "visual": "엄지척 엔딩", "audio": "파크골프 올인원에서 함께해요!", "caption": "⛳ 파키 올인원"}
            ],
            "bgm": "밝은 행진곡",
            "voiceTone": "친절한 목소리"
        }

# --- 3. 마케팅 배너/이미지 생성 엔진 ---
def generate_banner_concept_with_ai(topic: str, ratio: str, target_platform: str):
    api_key = os.getenv("GEMINI_API_KEY", "").strip()

    if not api_key or api_key.startswith("your_"):
        return {
            "title": f"파크골프 {topic} 특강",
            "ratio": ratio,
            "headline": f"아는 사람만 아는 {topic}의 비밀!",
            "subhead": "대한파크골프협회 공인 규정 완벽 해설",
            "ctaText": "지금 무료로 확인하기 ➔",
            "colorPalette": ["#10b981", "#f59e0b", "#0f172a"],
            "imagePrompt": f"A vibrant 3D mascot park golf illustration of a cute yellow birdie wearing a green golf cap on a sunny golf course, topic: {topic}, clean modern graphic design, high resolution."
        }

    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        prompt = f"""
당신은 최고 실력의 모바일 앱 마케팅 아트 디렉터입니다.
다음 주제로 어르신 동호인들의 클릭률(CTR)을 극대화하는 마케팅 배너 카피와 Imagen 3 이미지 생성 프롬프트를 작성하십시오.

주제: {topic}
비율: {ratio} (16:9 유튜브 썸네일 | 1:1 인스타/카톡 카드뉴스 | 9:16 인스타 스토리)
타겟 플랫폼: {target_platform}

반드시 아래 JSON 형식으로 응답하십시오:
{{
  "title": "배너 프로젝트 제목",
  "ratio": "{ratio}",
  "headline": "한눈에 꽂히는 큼직한 메인 카피 (10자 내외)",
  "subhead": "신뢰감을 주는 서브 카피 1문장",
  "ctaText": "클릭 유도 버튼 문구 (예: 1초 만에 확인하기 ➔)",
  "colorPalette": ["메인색상(HEX)", "포인트색상(HEX)", "배경색상(HEX)"],
  "imagePrompt": "Google Imagen 3에 입력할 영어 이미지 프롬프트 (High quality 3D cartoon golf mascot, vivid green lawn, sunny day, professional vector/rendered style)"
}}
"""
        resp = client.models.generate_content(
            model=os.getenv("GEMINI_MODEL", "gemini-3.5-flash"),
            contents=prompt,
            config={"response_mime_type": "application/json"}
        )
        return json.loads(resp.text)
    except Exception as e:
        return {
            "title": f"{topic} 홍보 배너",
            "ratio": ratio,
            "headline": f"{topic} 완벽 마스터",
            "subhead": "파키가 알려주는 실전 파크골프 규정",
            "ctaText": "자세히 보기",
            "colorPalette": ["#10b981", "#3b82f6", "#0f172a"],
            "imagePrompt": f"High quality cartoon golf banner, park golf theme, bright colors, topic: {topic}"
        }

# --- HTTP 핸들러 ---
class OmniStudioHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        
        # 1. API: 만화 챕터 목록
        if parsed.path == '/api/chapters':
            data = load_json(DATA_FILE, {})
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
            return

        # 2. API: 캐릭터 보관함 목록
        if parsed.path == '/api/characters':
            data = load_json(CHAR_FILE, [])
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
            return

        # 3. 이미지 프록시 서빙 (/mascot/...)
        if parsed.path.startswith('/mascot/'):
            subpath = parsed.path.lstrip('/')
            img_path = os.path.join(PARKON_PUBLIC, subpath)
            if os.path.exists(img_path) and os.path.isfile(img_path):
                self.send_response(200)
                if img_path.endswith('.jpg') or img_path.endswith('.jpeg'):
                    self.send_header('Content-Type', 'image/jpeg')
                elif img_path.endswith('.png'):
                    self.send_header('Content-Type', 'image/png')
                self.end_headers()
                with open(img_path, 'rb') as f:
                    self.wfile.write(f.read())
                return

        # 4. 루트 및 정적 HTML
        if parsed.path in ['/', '/index.html']:
            html_file = os.path.join(CURRENT_DIR, "index.html")
            if os.path.exists(html_file):
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.end_headers()
                with open(html_file, 'rb') as f:
                    self.wfile.write(f.read())
                return

        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else "{}"
        
        try:
            req_json = json.loads(body)
        except Exception:
            req_json = {}

        # API 1: 만화 멀티컷 생성
        if parsed.path == '/api/generate_multi_cut':
            topic = req_json.get('topic', '티샷 매트 두 발 이탈 규정')
            cut_count = req_json.get('cutCount', 4)
            pose = req_json.get('pose', 'default')
            cast = req_json.get('cast', ['파키'])
            ch_num = req_json.get('chapterNumber', '1')
            result = generate_multi_cut_with_ai(topic, cut_count, pose, cast, ch_num)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(result, ensure_ascii=False).encode('utf-8'))
            return

        # API 2: 쇼츠/릴스 영상 콘티 생성
        if parsed.path == '/api/generate_shorts':
            topic = req_json.get('topic', '15초 티샷 규정')
            duration = req_json.get('duration', 15)
            style = req_json.get('style', '코믹/유머')
            result = generate_shorts_script_with_ai(topic, duration, style)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(result, ensure_ascii=False).encode('utf-8'))
            return

        # API 3: 마케팅 배너 콘셉트 생성
        if parsed.path == '/api/generate_banner':
            topic = req_json.get('topic', '파크골프 규정 마스터')
            ratio = req_json.get('ratio', '16:9')
            target_platform = req_json.get('target', '유튜브 썸네일')
            result = generate_banner_concept_with_ai(topic, ratio, target_platform)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(result, ensure_ascii=False).encode('utf-8'))
            return

        # API 4: 챕터 저장
        if parsed.path == '/api/save_chapter':
            ch_id = req_json.get('chapterId')
            chapter_data = req_json.get('chapter')
            if ch_id and chapter_data:
                all_data = load_json(DATA_FILE, {})
                all_data[ch_id] = chapter_data
                save_json(DATA_FILE, all_data)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "message": f"{ch_id} 저장 완료"}, ensure_ascii=False).encode('utf-8'))
                return

        # API 5: 새 캐릭터 보관함 등록
        if parsed.path == '/api/save_character':
            new_char = req_json.get('character')
            if new_char:
                chars = load_json(CHAR_FILE, [])
                chars.append(new_char)
                save_json(CHAR_FILE, chars)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "message": "새 캐릭터 등록 완료"}, ensure_ascii=False).encode('utf-8'))
                return

        self.send_response(404)
        self.end_headers()

def run_server():
    os.chdir(CURRENT_DIR)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), OmniStudioHandler) as httpd:
        print("\n" + "=" * 70)
        print(f"🎬 [Omni Studio] 사령탑 올인원 멀티미디어 & 영상 컨트롤 마법사 가동")
        print(f"👉 웹 주소: http://localhost:{PORT}")
        print("=" * 70)
        httpd.serve_forever()

if __name__ == "__main__":
    run_server()
