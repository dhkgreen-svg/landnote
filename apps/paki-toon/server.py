#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
apps/paki-toon/server.py - 파키 앱 (PARKY APP) 공식 6단 만화 원클릭 & 실시간 비주얼 편집 스튜디오
포트: 3050 (http://localhost:3050)
"""

import os
import sys
import json
import http.server
import socketserver
import urllib.parse
import subprocess

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

PORT = 3050
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(CURRENT_DIR, "static")
OUTPUTS_DIR = os.path.join(STATIC_DIR, "outputs")
BASE_IMAGES_DIR = os.path.join(CURRENT_DIR, "base_images")
CONFIG_PATH = os.path.join(CURRENT_DIR, "episodes_config.json")

os.makedirs(OUTPUTS_DIR, exist_ok=True)
os.makedirs(BASE_IMAGES_DIR, exist_ok=True)

# Import rendering engine & translator
try:
    from studio_engine import render_episode, load_episodes_config, COLLECTION_DIR, DESKTOP_DIR
    from translator import parse_conti, translate_conti
except ImportError:
    sys.path.append(CURRENT_DIR)
    from studio_engine import render_episode, load_episodes_config, COLLECTION_DIR, DESKTOP_DIR
    from translator import parse_conti, translate_conti

class StudioHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path in ["/", "/index.html"]:
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            with open(os.path.join(CURRENT_DIR, "index.html"), "rb") as f:
                self.wfile.write(f.read())
            return

        elif path == "/api/episodes":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            data = load_episodes_config()
            self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))
            return

        elif path.startswith("/outputs/"):
            # Serve from static/outputs
            raw_rel = path[len("/outputs/"):].split("?")[0]
            rel_path = urllib.parse.unquote(raw_rel)
            file_path = os.path.join(OUTPUTS_DIR, rel_path)
            if os.path.exists(file_path) and os.path.isfile(file_path):
                self.send_response(200)
                if file_path.endswith(".jpg") or file_path.endswith(".jpeg"):
                    self.send_header("Content-Type", "image/jpeg")
                elif file_path.endswith(".png"):
                    self.send_header("Content-Type", "image/png")
                self.end_headers()
                with open(file_path, "rb") as f:
                    self.wfile.write(f.read())
                return
            else:
                self.send_error(404, "Output file not found")
                return

        elif path.startswith("/base_images/"):
            # Serve from base_images
            rel_path = path[len("/base_images/"):].split("?")[0]
            file_path = os.path.join(BASE_IMAGES_DIR, rel_path)
            if os.path.exists(file_path) and os.path.isfile(file_path):
                self.send_response(200)
                if file_path.endswith(".jpg") or file_path.endswith(".jpeg"):
                    self.send_header("Content-Type", "image/jpeg")
                elif file_path.endswith(".png"):
                    self.send_header("Content-Type", "image/png")
                self.end_headers()
                with open(file_path, "rb") as f:
                    self.wfile.write(f.read())
                return
            else:
                self.send_error(404, "Base image not found")
                return

        # Default fallback
        super().do_GET()

    def send_json(self, data, code=200):
        resp_bytes = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(resp_bytes)))
        self.end_headers()
        self.wfile.write(resp_bytes)

    def do_POST(self):
        try:
            parsed = urllib.parse.urlparse(self.path)
            path = parsed.path
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)

            try:
                body = json.loads(post_data.decode("utf-8")) if post_data else {}
            except Exception:
                body = {}

            if path == "/api/render":
                ep_id = int(body.get("episode_id", 1))
                lang = body.get("lang", "ko")
                overrides = body.get("overrides", None)
                save_desktop = body.get("save_desktop", True)

                try:
                    result = render_episode(ep_id, lang=lang, overrides=overrides, save_to_desktop=save_desktop)
                    self.send_json(result, 200)
                except Exception as e:
                    self.send_json({"status": "error", "message": str(e)}, 500)
                return

            elif path == "/api/open_folder":
                target_folder = body.get("folder", COLLECTION_DIR)
                if not os.path.exists(target_folder):
                    target_folder = DESKTOP_DIR
                try:
                    if sys.platform == 'win32':
                        os.startfile(target_folder)
                    self.send_json({"status": "success", "folder": target_folder}, 200)
                except Exception as e:
                    self.send_json({"status": "error", "message": str(e)}, 500)
                return

            elif path == "/api/parse_conti":
                raw_text = body.get("raw_text", "")
                try:
                    parsed = parse_conti(raw_text)
                    self.send_json({"status": "success", "data": parsed}, 200)
                except Exception as e:
                    self.send_json({"status": "error", "message": str(e)}, 500)
                return

            elif path == "/api/translate":
                try:
                    translated = translate_conti(body)
                    self.send_json({"status": "success", "data": translated}, 200)
                except Exception as e:
                    self.send_json({"status": "error", "message": str(e)}, 500)
                return

            self.send_error(404, "API route not found")
        except Exception as e:
            import traceback
            print("Error in do_POST:\n", traceback.format_exc())
            try:
                self.send_json({"status": "error", "message": str(e)}, 500)
            except Exception:
                pass

def run_server():
    socketserver.ThreadingTCPServer.allow_reuse_address = False
    with socketserver.ThreadingTCPServer(("", PORT), StudioHTTPHandler) as httpd:
        print(f"🚀 [PARKY APP STUDIO] 6단 만화 원클릭 & 실시간 편집 통합 서버 가동 완료!")
        print(f"👉 로컬 웹 관제 대시보드: http://localhost:{PORT}")
        print(f"📂 공식 만화 저장 위치: {COLLECTION_DIR}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n서버 종료")

if __name__ == "__main__":
    run_server()
