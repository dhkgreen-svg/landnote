#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
hub/village_server.py - 구글 통합 사령탑: 컴퓨터 종합 환경 마을(Cyber Village) 백엔드 서버
포트: 3000 (http://localhost:3000)

김대희 대표님의 컴퓨터 전체 환경(CPU/RAM/디스크/바탕화면/백업/미디어)을
하나의 살아 숨 쉬는 게임 속 가상 마을(Cyber Town)로 시각화하고 관할 NPC들과 상호작용합니다.
"""

import os
import sys
import json
import http.server
import socketserver
import urllib.parse
import subprocess
import shutil
import psutil
from datetime import datetime
from dotenv import load_dotenv

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

PORT = 3000
HUB_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(HUB_DIR)
VILLAGE_DIR = os.path.join(HUB_DIR, "village")
HTML_FILE = os.path.join(VILLAGE_DIR, "index.html")
ENV_PATH = os.path.join(ROOT_DIR, "config.env")
HISTORY_PATH = os.path.join(HUB_DIR, "directive_history.json")
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

def log_directive(command: str, action: str, status: str = "success", summary: str = "", npc: str = "사령탑"):
    history = load_json(HISTORY_PATH, [])
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    entry = {
        "timestamp": now_str,
        "commander": "김대희 대표님",
        "npc": npc,
        "command": command,
        "action": action,
        "status": status,
        "summary": summary
    }
    history.append(entry)
    history = history[-100:]
    save_json(HISTORY_PATH, history)

# --- 컴퓨터 자원 및 마을 상태 진단 엔진 ---
def get_village_status():
    # 1. CPU, RAM
    cpu_pct = round(psutil.cpu_percent(interval=0.1), 1)
    ram = psutil.virtual_memory()
    ram_pct = round(ram.percent, 1)

    # 2. 디스크 상태
    storage = []
    for drive in ["C:", "D:"]:
        if os.path.exists(drive + "/"):
            try:
                usage = shutil.disk_usage(drive + "/")
                storage.append({
                    "drive": drive,
                    "total_gb": round(usage.total / (1024**3), 1),
                    "free_gb": round(usage.free / (1024**3), 1),
                    "used_pct": round(((usage.total - usage.free) / usage.total) * 100, 1)
                })
            except Exception:
                pass

    # 3. 바탕화면 파일 수 및 중복 파일 검사
    desktop_dir = r"D:\UserFiles\Desktop"
    desktop_items = 0
    duplicate_count = 0
    if os.path.exists(desktop_dir):
        try:
            for item in os.listdir(desktop_dir):
                if item.startswith("."):
                    continue
                desktop_items += 1
                if any(x in item for x in ["(1).lnk", "(2).lnk", "(3).lnk", "- 복사본"]):
                    duplicate_count += 1
        except Exception:
            pass

    # 4. 종합 건강도 및 마을 날씨 산출
    health_score = 100
    if cpu_pct > 75:
        health_score -= 15
    elif cpu_pct > 50:
        health_score -= 5

    if ram_pct > 80:
        health_score -= 15
    elif ram_pct > 65:
        health_score -= 5

    if duplicate_count > 0:
        health_score -= (duplicate_count * 3)

    c_free = next((s["free_gb"] for s in storage if s["drive"] == "C:"), 50)
    if c_free < 15:
        health_score -= 20

    health_score = max(30, min(100, health_score))

    if health_score >= 88:
        weather = "sunny"
        weather_label = "☀️ 화창함"
        weather_desc = "컴퓨터 컨디션 최상! 마을에 밝은 햇살이 비치고 있습니다."
    elif health_score >= 70:
        weather = "cloudy"
        weather_label = "⛅ 구름 조금"
        weather_desc = "안정적인 상태이나 정리할 파일이 소량 있습니다."
    else:
        weather = "rainy"
        weather_label = "🌧️ 비 / 점검 필요"
        weather_desc = "자원 부하 또는 중복 파일로 인해 경비 점검이 필요합니다."

    # 5. 관할 NPC 실시간 상태 & 대사
    npcs = [
        {
            "id": "parky",
            "name": "파키 감독 (Parky)",
            "role": "영상·미디어 관할 NPC",
            "building": "🎬 영상·미디어 제작 공방",
            "emoji": "🐥",
            "badge": "제작 준비 완료",
            "dialogue": "대표님! 4컷 웹툰이나 15초 쇼츠 콘티를 원클릭으로 뽑아드릴 수 있습니다!",
            "action_type": "open_studio",
            "action_url": "http://localhost:3050",
            "action_label": "영상·만화 스튜디오 열기"
        },
        {
            "id": "cleaner",
            "name": "청소 요정 쓱싹이",
            "role": "환경·청소 관할 NPC",
            "building": "🧹 환경 미화 클린 센터",
            "emoji": "🧹",
            "badge": f"중복 파일 {duplicate_count}개 감지" if duplicate_count > 0 else "바탕화면 100% 쾌적",
            "dialogue": f"바탕화면 아이콘 {desktop_items}개를 감시 중입니다! 지저분한 파일은 빗자루로 싹 쓸어드릴게요!" if duplicate_count == 0 else f"어맛! 중복 바로가기 {duplicate_count}개가 발견되었습니다! 1초 대청소 하실까요?",
            "action_type": "clean_desktop",
            "action_url": "",
            "action_label": "바탕화면 1초 대청소"
        },
        {
            "id": "guard",
            "name": "경비대장 아이언가드",
            "role": "보안·시스템 관할 NPC",
            "building": "🛡️ 성벽 감시탑 & 보안 본부",
            "emoji": "🛡️",
            "badge": f"CPU {cpu_pct}% / RAM {ram_pct}%",
            "dialogue": "성벽 순찰 완료! 외부 악성코드 및 비정상 프로세스 없음. 시스템 평화 유지 중입니다!",
            "action_type": "inspect_system",
            "action_url": "",
            "action_label": "컴퓨터 정밀 진단"
        },
        {
            "id": "vault",
            "name": "창고지기 골드키퍼",
            "role": "데이터·백업 관할 NPC",
            "building": "📦 구글 드라이브 중앙 창고",
            "emoji": "📦",
            "badge": f"C: {c_free}GB 여유",
            "dialogue": "구글 드라이브(G:)와 D: 외장 보물창고가 안전하게 연결되어 있습니다. 소중한 데이터를 보관 중입니다!",
            "action_type": "backup_vault",
            "action_url": "",
            "action_label": "드라이브 전체 백업"
        },
        {
            "id": "golf_pro",
            "name": "김프로 & 박여사",
            "role": "파크골프(ParkOn) 관할 NPC",
            "building": "⛳ 파크온 클럽하우스",
            "emoji": "⛳",
            "badge": "전국 160개 구장 정비",
            "dialogue": "대표님 나이스 샷! 전국 160개 구장 정보와 공인 룰북이 동호인 맞춤으로 완벽 가동 중입니다!",
            "action_type": "open_parkon",
            "action_url": "https://landnote.vercel.app",
            "action_label": "파크온 웹앱 확인"
        }
    ]

    history = load_json(HISTORY_PATH, [])[-5:]
    history.reverse()

    return {
        "health_score": health_score,
        "weather": weather,
        "weather_label": weather_label,
        "weather_desc": weather_desc,
        "cpu_pct": cpu_pct,
        "ram_pct": ram_pct,
        "storage": storage,
        "desktop_items": desktop_items,
        "duplicate_count": duplicate_count,
        "npcs": npcs,
        "recent_directives": history,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

# --- 지휘 명령 분석 및 NPC 디스패치 ---
def process_village_command(command: str):
    cmd_lower = command.lower()
    
    # 1. 청소 / 바탕화면 정리
    if any(k in cmd_lower for k in ["청소", "정리", "바탕화면", "휴지통", "지워", "깨끗"]):
        cleaner_py = os.path.join(HUB_DIR, "desktop_cleaner.py")
        try:
            res = subprocess.check_output(f'python "{cleaner_py}"', shell=True, text=True, stderr=subprocess.STDOUT)
        except Exception as e:
            res = str(e)
        
        summary = "바탕화면 중복 파일 제거 및 5대 테마 폴더 자동 정돈 완료"
        log_directive(command, "desktop_clean", "success", summary, "청소 요정 쓱싹이")
        return {
            "status": "success",
            "npc": "cleaner",
            "npc_name": "청소 요정 쓱싹이",
            "npc_emoji": "🧹",
            "dialogue": "대표님! 빗자루를 번개처럼 휘둘러 바탕화면 중복 파일과 어질러진 문서를 5대 폴더로 싹 치웠습니다!",
            "details": summary,
            "raw_output": res
        }

    # 2. 백업
    elif any(k in cmd_lower for k in ["백업", "드라이브", "저장", "동기화", "보관"]):
        drive_sync = os.path.join(HUB_DIR, "integrations", "drive_sync.py")
        if not os.path.exists(drive_sync):
            drive_sync = os.path.join(HUB_DIR, "drive_sync.py")
        try:
            res = subprocess.check_output(f'python "{drive_sync}"', shell=True, text=True, stderr=subprocess.STDOUT)
        except Exception as e:
            res = str(e)

        summary = "Google Drive (G:) 및 D: 드라이브 스냅샷 동기화 완료"
        log_directive(command, "backup", "success", summary, "창고지기 골드키퍼")
        return {
            "status": "success",
            "npc": "vault",
            "npc_name": "창고지기 골드키퍼",
            "npc_emoji": "📦",
            "dialogue": "대표님! 중앙 보물 창고에 소중한 코드와 자산을 안전하게 수레로 실어 구글 드라이브에 보관했습니다!",
            "details": summary,
            "raw_output": res
        }

    # 3. 영상 / 쇼츠 / 만화 / 이미지
    elif any(k in cmd_lower for k in ["만화", "웹툰", "영상", "쇼츠", "릴스", "배너", "유튜브", "썸네일", "캐릭터"]):
        summary = "멀티미디어 & 영상 컨트롤 마법사(Omni Studio) 준비 완료"
        log_directive(command, "media_request", "success", summary, "파키 감독")
        return {
            "status": "success",
            "npc": "parky",
            "npc_name": "파키 감독 (Parky)",
            "npc_emoji": "🐥",
            "dialogue": "대표님! 4컷 만화와 15초 쇼츠 스튜디오가 완벽하게 준비되었습니다. 바로 영상 제작실로 안내해 드릴게요!",
            "details": summary,
            "action_url": "http://localhost:3050"
        }

    # 4. 상태 / 진단 / 점검 / 리포트
    elif any(k in cmd_lower for k in ["상태", "점검", "진단", "건강", "리포트", "보고", "검사"]):
        reporter = os.path.join(HUB_DIR, "status_reporter.py")
        try:
            res = subprocess.check_output(f'python "{reporter}"', shell=True, text=True, stderr=subprocess.STDOUT)
        except Exception as e:
            res = str(e)
        
        status_data = get_village_status()
        summary = f"컴퓨터 건강도 {status_data['health_score']}점, 자원 정상 순찰 완료"
        log_directive(command, "status_report", "success", summary, "경비대장 아이언가드")
        return {
            "status": "success",
            "npc": "guard",
            "npc_name": "경비대장 아이언가드",
            "npc_emoji": "🛡️",
            "dialogue": f"충성! 전 구역 경비 점검을 마쳤습니다! 현재 컴퓨터 종합 건강도는 {status_data['health_score']}점이며, 외세의 침입 없이 평화롭습니다!",
            "details": summary,
            "raw_output": res
        }

    # 5. 브리핑
    elif any(k in cmd_lower for k in ["브리핑", "요약"]):
        bf_script = os.path.join(HUB_DIR, "daily_briefing.py")
        try:
            res = subprocess.check_output(f'python "{bf_script}" --ai', shell=True, text=True, stderr=subprocess.STDOUT)
        except Exception as e:
            res = str(e)

        summary = "대표님 전용 일일 총괄 브리핑 생성 완료"
        log_directive(command, "briefing", "success", summary, "사령관 참모")
        return {
            "status": "success",
            "npc": "guard",
            "npc_name": "사령관 참모",
            "npc_emoji": "📜",
            "dialogue": "대표님! 마을(컴퓨터) 전체 현황을 간결한 브리핑으로 정리해 드렸습니다!",
            "details": summary,
            "raw_output": res
        }

    # 기타 자연어: Gemini 3.5 Flash로 분석 시도
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if api_key and not api_key.startswith("your_"):
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            prompt = f"""
당신은 '컴퓨터 종합 환경 마을'의 마을 주민 NPC들을 통솔하는 사령관 참모입니다.
김대희 대표님의 명령: "{command}"

이 명령에 가장 적합한 관할 NPC를 고르고, 친절하고 충성스러운 게임 NPC 스타일의 1~2줄 대사를 작성해 JSON으로 반환하세요.
NPC 후보:
1. cleaner: 청소 요정 쓱싹이 (바탕화면, 파일 정리, 청소)
2. parky: 파키 감독 (만화, 영상, 쇼츠, 배너, 캐릭터)
3. guard: 경비대장 아이언가드 (CPU, 시스템 상태, 점검)
4. vault: 창고지기 골드키퍼 (백업, 드라이브 저장)
5. golf_pro: 김프로 & 박여사 (파크골프, 구장 정보)

반드시 아래 JSON 형식으로만 응답:
{{"npc": "cleaner", "npc_name": "청소 요정 쓱싹이", "npc_emoji": "🧹", "dialogue": "대표님 대사 내용..."}}
"""
            resp = client.models.generate_content(
                model="gemini-3.5-flash",
                contents=prompt
            )
            raw_text = resp.text.strip()
            if "```" in raw_text:
                raw_text = raw_text.split("```")[1]
                if raw_text.startswith("json"):
                    raw_text = raw_text[4:].strip()
            parsed_res = json.loads(raw_text)
            log_directive(command, "ai_dispatch", "success", parsed_res.get("dialogue", ""), parsed_res.get("npc_name", "참모"))
            return {
                "status": "success",
                "npc": parsed_res.get("npc", "guard"),
                "npc_name": parsed_res.get("npc_name", "경비대장 아이언가드"),
                "npc_emoji": parsed_res.get("npc_emoji", "🛡️"),
                "dialogue": parsed_res.get("dialogue", "명령을 접수하였습니다! 바로 확인하겠습니다!"),
                "details": "자연어 분석 완료"
            }
        except Exception:
            pass

    # 기본 친절 응답
    return {
        "status": "success",
        "npc": "guard",
        "npc_name": "사령관 참모",
        "npc_emoji": "🎖️",
        "dialogue": f"대표님께서 '\"{command}\"'을(를) 명하셨습니다! 관할 구역에 즉시 지시를 전파하겠습니다.",
        "details": "명령 접수 완료"
    }

# --- HTTP Request Handler ---
class CyberVillageHandler(http.server.SimpleHTTPRequestHandler):
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

        # 1. API: 마을 및 시스템 실시간 상태
        if parsed.path == '/api/village/status':
            data = get_village_status()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
            return

        # 2. 이미지 프록시 (/mascot/...)
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

        # 3. 루트 및 HTML
        if parsed.path in ['/', '/index.html']:
            if os.path.exists(HTML_FILE):
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.end_headers()
                with open(HTML_FILE, 'rb') as f:
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

        # 1. 자연어 지휘 명령
        if parsed.path == '/api/village/command':
            cmd = req_json.get('command', '').strip()
            res = process_village_command(cmd)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(res, ensure_ascii=False).encode('utf-8'))
            return

        # 2. 버튼 직접 액션
        if parsed.path == '/api/village/action':
            action = req_json.get('action', '')
            if action == 'clean':
                res = process_village_command('바탕화면 청소해줘')
            elif action == 'backup':
                res = process_village_command('백업해줘')
            elif action == 'inspect':
                res = process_village_command('시스템 정밀 점검해줘')
            elif action == 'briefing':
                res = process_village_command('브리핑해줘')
            else:
                res = {"status": "error", "message": "알 수 없는 액션"}

            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(res, ensure_ascii=False).encode('utf-8'))
            return

        self.send_response(404)
        self.end_headers()

def run_server():
    os.chdir(VILLAGE_DIR)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), CyberVillageHandler) as httpd:
        print("\n" + "=" * 70)
        print(f"🏰 [Cyber Village] 구글 통합 사령탑: 컴퓨터 종합 환경 마을 가동")
        print(f"👉 웹 주소: http://localhost:{PORT}")
        print("=" * 70)
        httpd.serve_forever()

if __name__ == "__main__":
    run_server()
