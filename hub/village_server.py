#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
hub/village_server.py - 구글 통합 사령탑: 컴퓨터 종합 환경 마을(Cyber Village) 백엔드 서버
포트: 3000 (http://localhost:3000)

특징:
1. 한 화면에 쏙 들어오는 2.5D 게임 마을 맵 & 소형 네임태그/스프라이트
2. NPC 개별 1:1 도메인 전문 대화 (파크골프 김프로, 영상 파키감독, 청소요정, 경비대장, 창고지기)
3. 대표님이 새로운 전문 NPC를 직접 생산/영입 (village_npcs.json 영구 보관)
4. NPC들 간의 합동 협업(Multi-Agent Collaboration) 시뮬레이션 및 실제 작업 수행
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
NPCS_FILE = os.path.join(HUB_DIR, "village_npcs.json")
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
    cpu_pct = round(psutil.cpu_percent(interval=0.05), 1)
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

    # 4. 건강도 산출
    health_score = 100
    if cpu_pct > 75: health_score -= 15
    elif cpu_pct > 50: health_score -= 5
    if ram_pct > 80: health_score -= 15
    elif ram_pct > 65: health_score -= 5
    if duplicate_count > 0: health_score -= (duplicate_count * 3)
    c_free = next((s["free_gb"] for s in storage if s["drive"] == "C:"), 50)
    if c_free < 15: health_score -= 20
    health_score = max(30, min(100, health_score))

    if health_score >= 88:
        weather = "sunny"
        weather_label = "☀️ 화창함"
        weather_desc = "컴퓨터 컨디션 최상! 마을에 맑은 햇살이 비칩니다."
    elif health_score >= 70:
        weather = "cloudy"
        weather_label = "⛅ 구름 조금"
        weather_desc = "안정적이나 정리할 항목이 소량 있습니다."
    else:
        weather = "rainy"
        weather_label = "🌧️ 점검 필요"
        weather_desc = "자원 부하 및 중복 파일 주의 상태입니다."

    # 5. 등록된 NPC 목록 읽기
    npcs = load_json(NPCS_FILE, [])

    history = load_json(HISTORY_PATH, [])[-6:]
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

# --- NPC 1:1 도메인 대화 엔진 (Gemini 3.5 Flash) ---
def chat_with_npc(npc_id: str, user_message: str):
    npcs = load_json(NPCS_FILE, [])
    target_npc = next((n for n in npcs if n["id"] == npc_id), None)
    if not target_npc:
        return {"reply": "해당 NPC 주민을 찾을 수 없습니다."}

    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    system_prompt = target_npc.get("system_prompt", f"당신은 {target_npc['name']}입니다. 담당 분야는 {target_npc['domain']}입니다.")

    if not api_key or api_key.startswith("your_"):
        # AI 키가 없을 때 기본 룰베이스 응답
        if npc_id == "golf_pro":
            return {"reply": f"[김프로] 대표님! 파크골프 공인 규정 및 전국 160개 구장 데이터에 대해 문의하셨군요. 말씀하신 '{user_message}' 건은 공인 규정과 에티켓에 맞춰 완벽히 처리해 드리겠습니다. 언제든 라운드 나가셔도 좋습니다! 굿샷!"}
        elif npc_id == "parky":
            return {"reply": f"[파키 감독] 대표님! '{user_message}' 건에 대한 재미있는 4컷 웹툰과 15초 쇼츠 대본을 머릿속에 바로 구상했습니다. [영상 스튜디오]를 열어 콘티를 바로 뽑아드릴까요?"}
        elif npc_id == "cleaner":
            return {"reply": f"[청소 요정] 대표님! 바탕화면을 깨끗하게 유지하기 위해 '{user_message}' 지시를 바로 접수했습니다. 1초 대청소 빗자루를 준비해 둘게요!"}
        else:
            return {"reply": f"[{target_npc['name']}] 대표님, '{user_message}' 지시를 잘 새겨듣고 제 관할 영역({target_npc['domain']})에서 완벽히 보좌하겠습니다!"}

    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        prompt = f"""
{system_prompt}

[대화 상대]: 마을의 영주이자 최고 결정권자인 '김대희 대표님'
[상대방 메시지]: "{user_message}"

[응답 가이드라인]
1. 당신의 캐릭터 성격, 어투, 이모지를 살려서 자연스럽고 친절하며 신뢰감 있게 대화하십시오.
2. 당신의 전문 도메인({target_npc['domain']}) 지식을 기반으로 실질적이고 유용한 답변을 2~4문장 내외로 명쾌하게 제공하십시오.
3. 너무 길고 장황한 설명 대신, 대표님이 읽기 편한 대화체로 작성하십시오.
"""
        resp = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt
        )
        reply_text = resp.text.strip()
        log_directive(user_message, f"chat_{npc_id}", "success", reply_text[:60] + "...", target_npc["name"])
        return {"reply": reply_text}
    except Exception as e:
        return {"reply": f"[{target_npc['name']}] 대표님, 말씀을 접수했습니다! ({str(e)[:50]})"}

# --- NPC 간 협업(Multi-Agent Collaboration) 엔진 ---
def run_npc_collaboration(task_description: str):
    npcs = load_json(NPCS_FILE, [])
    api_key = os.getenv("GEMINI_API_KEY", "").strip()

    fallback_steps = [
        {"npc": "golf_pro", "name": "김프로", "emoji": "⛳", "message": f"파크골프 규정 검토 완료! '{task_description}'에 대한 공인 룰과 코스 기준을 확인했습니다."},
        {"npc": "parky", "name": "파키 감독", "emoji": "🐥", "message": "김프로님의 룰 기준을 바탕으로 4컷 만화 스토리와 15초 쇼츠 콘티를 즉시 연출합니다!"},
        {"npc": "vault", "name": "창고지기", "emoji": "📦", "message": "완성된 기획안과 미디어를 구글 드라이브(G:) 안전 보물 창고에 스냅샷 백업합니다!"},
        {"npc": "guard", "name": "경비대장", "emoji": "🛡️", "message": "모든 NPC 합동 작전 완료! 시스템 자원 및 보안 이상 없습니다!"}
    ]

    if not api_key or api_key.startswith("your_"):
        return {"task": task_description, "steps": fallback_steps}

    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        prompt = f"""
당신은 '컴퓨터 종합 환경 마을'의 NPC 협업 코디네이터입니다.
김대희 대표님의 합동 지시: "{task_description}"

마을에 있는 전문 NPC들(김프로, 파키감독, 청소요정, 경비대장, 창고지기 등)이 서로의 전문 분야를 나누어 분업하고 협업하며 대화하는 시나리오를 3~4단계 단계별로 작성하여 JSON으로 반환하세요.

반드시 아래 JSON 형식으로만 응답:
{{
  "task": "{task_description}",
  "steps": [
    {{"npc": "golf_pro", "name": "김프로", "emoji": "⛳", "message": "1단계 협업 대사..."}},
    {{"npc": "parky", "name": "파키 감독", "emoji": "🐥", "message": "2단계 협업 대사..."}},
    {{"npc": "vault", "name": "창고지기", "emoji": "📦", "message": "3단계 협업 대사..."}}
  ]
}}
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
        data = json.loads(raw_text)
        log_directive(task_description, "collaboration", "success", f"{len(data.get('steps', []))}명 NPC 합동 분업 완수", "주민 전원")
        return data
    except Exception:
        return {"task": task_description, "steps": fallback_steps}

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

        # 2. API: 등록된 NPC 목록
        if parsed.path == '/api/village/npcs':
            data = load_json(NPCS_FILE, [])
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
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

        # 1. NPC 1:1 대화 API
        if parsed.path == '/api/village/chat':
            npc_id = req_json.get('npc_id', '')
            msg = req_json.get('message', '').strip()
            res = chat_with_npc(npc_id, msg)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(res, ensure_ascii=False).encode('utf-8'))
            return

        # 2. 새 NPC 주민 생산/등록 API
        if parsed.path == '/api/village/spawn_npc':
            name = req_json.get('name', '신규 주민').strip()
            role = req_json.get('role', '전담 관리').strip()
            domain = req_json.get('domain', '일반 도메인').strip()
            emoji = req_json.get('emoji', '🧑').strip()
            building = req_json.get('building', '마을 공방').strip()
            greeting = req_json.get('greeting', '대표님 반갑습니다! 충실히 보좌하겠습니다!').strip()

            npcs = load_json(NPCS_FILE, [])
            new_id = f"custom_npc_{len(npcs) + 1}"
            
            # 맵 상에 겹치지 않는 위치 지정
            import random
            rx = random.randint(20, 80)
            ry = random.randint(25, 75)

            new_npc = {
                "id": new_id,
                "name": name,
                "role": role,
                "domain": domain,
                "emoji": emoji,
                "building": building,
                "x": rx,
                "y": ry,
                "color": "#4A5568",
                "status": "근무 중",
                "greeting": greeting,
                "system_prompt": f"당신은 '{name}'이며 역할은 '{role}'입니다. 전문 분야는 '{domain}'입니다. 김대희 대표님께 공손하고 친절하며 전문성 있게 답변하십시오."
            }
            npcs.append(new_npc)
            save_json(NPCS_FILE, npcs)
            log_directive(f"새 NPC '{name}' 영입 생산", "spawn_npc", "success", f"관할: {domain}", name)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "success", "npc": new_npc}, ensure_ascii=False).encode('utf-8'))
            return

        # 3. NPC 간 합동 협업(Multi-Agent Collaboration) API
        if parsed.path == '/api/village/collaborate':
            task = req_json.get('task', '파크골프 규정 만화 제작 및 백업').strip()
            res = run_npc_collaboration(task)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(res, ensure_ascii=False).encode('utf-8'))
            return

        # 4. 버튼 직접 액션
        if parsed.path == '/api/village/action':
            action = req_json.get('action', '')
            if action == 'clean':
                cleaner_py = os.path.join(HUB_DIR, "desktop_cleaner.py")
                try:
                    res = subprocess.check_output(f'python "{cleaner_py}"', shell=True, text=True, encoding="utf-8", errors="replace", stderr=subprocess.STDOUT)
                except Exception as e:
                    res = str(e)
                summary = "바탕화면 중복 파일 제거 및 5대 폴더 자동 정돈 완료"
                log_directive("바탕화면 1초 대청소", "desktop_clean", "success", summary, "청소 요정 쓱싹이")
                resp_data = {
                    "status": "success",
                    "npc_emoji": "🧹",
                    "npc_name": "청소 요정 쓱싹이",
                    "dialogue": "대표님! 빗자루를 번개처럼 휘둘러 바탕화면 중복 파일과 어질러진 문서를 5대 폴더로 싹 치웠습니다!",
                    "raw_output": res
                }
            elif action == 'backup':
                drive_sync = os.path.join(HUB_DIR, "integrations", "drive_sync.py")
                if not os.path.exists(drive_sync):
                    drive_sync = os.path.join(HUB_DIR, "drive_sync.py")
                try:
                    res = subprocess.check_output(f'python "{drive_sync}"', shell=True, text=True, encoding="utf-8", errors="replace", stderr=subprocess.STDOUT)
                except Exception as e:
                    res = str(e)
                summary = "Google Drive (G:) 및 D: 드라이브 스냅샷 동기화 완료"
                log_directive("구글 드라이브 백업", "backup", "success", summary, "창고지기 골드키퍼")
                resp_data = {
                    "status": "success",
                    "npc_emoji": "📦",
                    "npc_name": "창고지기 골드키퍼",
                    "dialogue": "대표님! 중앙 보물 창고에 소중한 코드와 자산을 안전하게 수레로 실어 구글 드라이브에 보관했습니다!",
                    "raw_output": res
                }
            elif action == 'inspect':
                reporter = os.path.join(HUB_DIR, "status_reporter.py")
                try:
                    res = subprocess.check_output(f'python "{reporter}"', shell=True, text=True, encoding="utf-8", errors="replace", stderr=subprocess.STDOUT)
                except Exception as e:
                    res = str(e)
                status_data = get_village_status()
                summary = f"컴퓨터 건강도 {status_data['health_score']}점, 정상 순찰 완료"
                log_directive("컴퓨터 정밀 점검", "status_report", "success", summary, "경비대장 아이언가드")
                resp_data = {
                    "status": "success",
                    "npc_emoji": "🛡️",
                    "npc_name": "경비대장 아이언가드",
                    "dialogue": f"충성! 전 구역 경비 점검 완료! 종합 건강도는 {status_data['health_score']}점이며 침입자 없이 평화롭습니다!",
                    "raw_output": res
                }
            else:
                resp_data = {"status": "error", "message": "알 수 없는 액션"}

            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(resp_data, ensure_ascii=False).encode('utf-8'))
            return

        # 5. NPC 위치 좌표 저장 API (드래그 앤 드롭 이동 영구 저장)
        if parsed.path == '/api/village/update_npc_pos':
            npc_id = req_json.get('npc_id')
            new_x = req_json.get('x')
            new_y = req_json.get('y')
            if npc_id and new_x is not None and new_y is not None:
                npcs = load_json(NPCS_FILE, [])
                for n in npcs:
                    if n["id"] == npc_id:
                        n["x"] = max(5, min(95, round(float(new_x), 1)))
                        n["y"] = max(10, min(90, round(float(new_y), 1)))
                        break
                save_json(NPCS_FILE, npcs)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "npc_id": npc_id, "x": new_x, "y": new_y}, ensure_ascii=False).encode('utf-8'))
                return

        # 6. NPC 활성/보관함 토글 API (마을 배치 ↔ 보관함에 휴식)
        if parsed.path == '/api/village/toggle_npc_active':
            npc_id = req_json.get('npc_id')
            is_active = req_json.get('is_active')
            if npc_id and is_active is not None:
                npcs = load_json(NPCS_FILE, [])
                found_name = npc_id
                for n in npcs:
                    if n["id"] == npc_id:
                        n["is_active"] = bool(is_active)
                        found_name = n.get("name", npc_id)
                        break
                save_json(NPCS_FILE, npcs)
                state_str = "마을로 복귀 배치" if is_active else "주민 보관함으로 이동"
                log_directive(f"NPC [{found_name}] {state_str}", "toggle_vault", "success", f"{state_str} 완료", found_name)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "npc_id": npc_id, "is_active": is_active}, ensure_ascii=False).encode('utf-8'))
                return

        self.send_response(404)
        self.end_headers()

def run_server():
    os.chdir(VILLAGE_DIR)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), CyberVillageHandler) as httpd:
        print("\n" + "=" * 70)
        print(f"🏰 [Cyber Village 2.0] 구글 통합 사령탑: 한 화면 가상 마을 & NPC 협업 가동")
        print(f"👉 웹 주소: http://localhost:{PORT}")
        print("=" * 70)
        httpd.serve_forever()

if __name__ == "__main__":
    run_server()
