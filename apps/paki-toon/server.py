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

def generate_cut_with_ai(topic: str, chapter_num: str):
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or api_key.startswith("your_"):
        return {
            "title": f"{topic} 기본 수칙",
            "badge": "핵심 수칙",
            "badgeType": "info",
            "situation": f"{topic} 상황에서 올바른 파크골프 플레이 방법은 무엇일까요?",
            "parkyDialogue": f"선배님들! {topic} 상황에서는 무리하지 마시고 안전을 지키면서 규정에 맞게 플레이하시는 게 최고예요!",
            "verdict": "규정 준수 및 안전 플레이",
            "penaltyText": "위반 시 2벌타 주의",
            "keyPoint": f"{topic}의 기본 원칙을 숙지하면 훨씬 더 즐거운 라운드가 됩니다.",
            "article": "대한파크골프협회 공인 규정"
        }

    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        prompt = f"""
당신은 대한민국 1등 파크골프 앱 '파키(ParkOn)'의 전속 웹툰 스토리 작가입니다.
사용자가 요청한 다음 파크골프 규칙/상황을 바탕으로, 어르신 동호인분들이 쉽고 재미있게 이해할 수 있는 1컷 만화 대본을 작성하십시오.

주제: {topic} (제 {chapter_num}장용)
마스코트 이름: '파키' (밝고 싹싹하고 예의 바른 귀여운 파크골프 요정 캐릭터)

반드시 아래 JSON 형식으로만 응답하십시오:
{{
  "title": "한눈에 꽂히는 컷 제목",
  "badge": "주의 배지 (예: 2벌타 주의, 무벌타 구제, 실격 주의, 에티켓)",
  "badgeType": "caution" (caution | penalty | info | safe 중 택1),
  "situation": "동호인이 코스에서 마주치는 구체적인 상황 1~2문장",
  "parkyDialogue": "파키가 어르신께 친절하게 설명해주는 명쾌한 대사 (2~3문장)",
  "verdict": "명확한 최종 판정 1문장 (예: 2클럽 이내 무벌타 드롭)",
  "penaltyText": "벌타 내용 (예: 2벌타, 무벌타, 1타 가산)",
  "keyPoint": "꼭 기억해야 할 핵심 팁 1문장",
  "article": "관련 협회 규정 조항 (예: 제4장 제21조)"
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
            "title": f"{topic} 규정 가이드",
            "badge": "규정 안내",
            "badgeType": "info",
            "situation": f"{topic}에 대한 규정을 안내합니다.",
            "parkyDialogue": f"선배님들! {topic} 상황을 재미있는 만화로 쉽게 익혀보세요!",
            "verdict": "규정에 맞게 처리",
            "penaltyText": "상황별 규정 적용",
            "keyPoint": "안전하고 즐거운 파크골프를 위해 규정을 숙지합시다.",
            "article": "파크골프 공인 규정"
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

        # 1. AI 컷 대본 자동 생성
        if parsed.path == '/api/generate_ai':
            topic = req_json.get('topic', 'OB 구제 규정')
            ch_num = req_json.get('chapterNumber', '1')
            generated = generate_cut_with_ai(topic, ch_num)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(generated, ensure_ascii=False).encode('utf-8'))
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
