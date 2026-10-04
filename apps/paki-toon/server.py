#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
apps/paki-toon/server.py - 파크온 만화/웹툰 생성 스튜디오 백엔드 서버
포트: 3050 (http://localhost:3050)
기능:
1. 파크골프 웹툰 챕터 및 컷 데이터 제공 (GET /api/chapters)
2. 컷 수정 및 저장 (POST /api/save_chapter)
3. Gemini 3.5 Flash 기반 웹툰 컷/대본 자동 창작 (POST /api/generate_ai)
4. 웹 UI 정적 파일 서빙
"""

import os
import sys
import json
import http.server
import socketserver
import urllib.parse
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
PARKON_PUBLIC = os.path.join(ROOT_DIR, "apps", "parkon", "public")
if not os.path.exists(PARKON_PUBLIC):
    # Fallback to sibling workspace
    PARKON_PUBLIC = os.path.join(os.path.dirname(ROOT_DIR), "google_drive_docs_search", "apps", "parkon", "public")

load_dotenv(ENV_PATH)
load_dotenv()

def load_data():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def save_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def generate_multi_cut_with_ai(topic: str, cut_count: int, pose: str, chapter_num: str):
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    cut_count = int(cut_count) if str(cut_count).isdigit() else 4

    fallback_cuts = []
    pose_map = {
        "default": "🐥 친절 안내",
        "referee": "🚩 호루라기 심판",
        "swing": "🏌️ 나이스 샷",
        "shock": "😱 앗! 실수 당황",
        "thumb": "👍 매너 엄지척"
    }
    pose_name = pose_map.get(pose, "🐥 친절 안내")

    if not api_key or api_key.startswith("your_"):
        for i in range(1, cut_count + 1):
            fallback_cuts.append({
                "cutNumber": i,
                "title": f"{topic} - {i}단계 가이드",
                "badge": "핵심 규정" if i == cut_count else "상황 진행",
                "badgeType": "penalty" if i == 2 else ("caution" if i == 1 else "info"),
                "situation": f"{topic} 상황의 {i}번째 진행 단계입니다.",
                "parkyDialogue": f"선배님들! {i}번째 단계에서는 규칙을 차근차근 확인하며 안전하게 플레이해주세요!",
                "verdict": "규정에 맞게 처리",
                "penaltyText": "위반 시 2벌타 주의",
                "keyPoint": f"{topic}의 원칙을 숙지하면 파크골프가 더 즐겁습니다.",
                "article": f"대한파크골프협회 공인 규정 제{chapter_num}장",
                "pose": pose
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
대표 마스코트: '파키' (포즈 컨셉: {pose_name})

[컷별 스토리 연출 가이드]
- 1컷: 코스에서의 실제 동호인 상황 발생 (일상적인 라운드 장면)
- 2컷: 흔히 하는 실수나 규정 위반 위기 (동반자들의 웅성거림)
- 3컷 (또는 중간 컷): 파키가 짠! 나타나 정확한 룰과 판정 설명 (호루라기 또는 명쾌한 해설)
- 마지막 컷: 올바른 처리 후 멋지게 굿샷을 날리는 훈훈한 마무리

반드시 아래 JSON 형식으로만 응답하십시오:
{{
  "chapterTitle": "에피소드 전체 제목 (예: 티샷 매트 두 발 이탈의 비밀)",
  "cuts": [
    {{
      "cutNumber": 1,
      "title": "1컷 제목",
      "badge": "상황 배지 (예: 티샷 준비, 2벌타 주의, 무벌타 구제 등)",
      "badgeType": "info" (info | caution | penalty | safe 중 택1),
      "situation": "구체적인 만화 연출 상황 1~2문장",
      "parkyDialogue": "파키가 정답게 설명하는 찰진 대사 2문장",
      "verdict": "공식 최종 판정 1문장",
      "penaltyText": "벌타 내용 (예: 2벌타, 무벌타, 1타 가산)",
      "keyPoint": "어르신이 꼭 기억해야 할 핵심 팁 1문장",
      "article": "관련 협회 조항 (예: 제3장 제31조)",
      "pose": "{pose}"
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
        # Fallback
        for i in range(1, cut_count + 1):
            fallback_cuts.append({
                "cutNumber": i,
                "title": f"{topic} {i}컷",
                "badge": "규정 안내",
                "badgeType": "info",
                "situation": f"{topic}에 대한 안내입니다.",
                "parkyDialogue": f"선배님들! {topic} 규칙을 지키면 더욱 품격 있는 라운드가 됩니다!",
                "verdict": "규정 준수 플레이",
                "penaltyText": "규정에 따른 처리",
                "keyPoint": "안전과 매너가 최우선입니다.",
                "article": "공인 규정",
                "pose": pose
            })
        return {
            "chapterTitle": f"{topic} 에피소드",
            "cuts": fallback_cuts
        }

class ToonStudioHandler(http.server.SimpleHTTPRequestHandler):
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
        
        # 1. API: 챕터 목록
        if parsed.path == '/api/chapters':
            data = load_data()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
            return

        # 2. 파크온 이미지 프록시 서빙 (/mascot/...)
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

        # 3. 루트 및 정적 HTML
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

        # 1. AI 단일 컷 대본 자동 생성
        if parsed.path == '/api/generate_ai':
            topic = req_json.get('topic', 'OB 구제 규정')
            ch_num = req_json.get('chapterNumber', '1')
            generated = generate_multi_cut_with_ai(topic, 1, 'default', ch_num)
            cut_data = generated['cuts'][0] if generated.get('cuts') else {}
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(cut_data, ensure_ascii=False).encode('utf-8'))
            return

        # 1-2. AI 멀티 컷 (4컷 / 6컷 / 1컷) 에피소드 자동 생성
        if parsed.path == '/api/generate_multi_cut':
            topic = req_json.get('topic', '티샷 매트 두 발 이탈 규정')
            cut_count = req_json.get('cutCount', 4)
            pose = req_json.get('pose', 'default')
            ch_num = req_json.get('chapterNumber', '1')
            result = generate_multi_cut_with_ai(topic, cut_count, pose, ch_num)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(result, ensure_ascii=False).encode('utf-8'))
            return

        # 2. 챕터/컷 저장
        if parsed.path == '/api/save_chapter':
            ch_id = req_json.get('chapterId')
            chapter_data = req_json.get('chapter')
            if ch_id and chapter_data:
                all_data = load_data()
                all_data[ch_id] = chapter_data
                save_data(all_data)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "message": f"{ch_id} 저장 완료"}, ensure_ascii=False).encode('utf-8'))
                return

        self.send_response(404)
        self.end_headers()

def run_server():
    os.chdir(CURRENT_DIR)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), ToonStudioHandler) as httpd:
        print("\n" + "=" * 70)
        print(f"🎨 [Paki Toon Studio] 파크온 만화/웹툰 생성 스튜디오 가동")
        print(f"👉 웹 주소: http://localhost:{PORT}")
        print("=" * 70)
        httpd.serve_forever()

if __name__ == "__main__":
    run_server()
