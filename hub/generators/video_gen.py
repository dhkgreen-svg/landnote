#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
hub/generators/video_gen.py - Google Veo / Gemini 기반 숏폼 영상 및 대본 합성 모듈
쇼츠/릴스/틱톡 홍보 영상 기획안 및 영상 생성 파이프라인을 지원합니다.

사용법:
  python hub/generators/video_gen.py --prompt "파크골프 올인원 홍보 15초 숏폼" --type script
  python hub/generators/video_gen.py --prompt "Scenic drone shot of golf green" --type video
"""

import os
import sys
import argparse
from datetime import datetime
from dotenv import load_dotenv

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUTPUTS_DIR = os.path.join(ROOT_DIR, "outputs")
ENV_PATH = os.path.join(ROOT_DIR, "config.env")

load_dotenv(ENV_PATH)
load_dotenv()

def generate_video_script(prompt: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("⚠️ [경고] GEMINI_API_KEY 가 설정되지 않았습니다.")
        return None

    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
        
        system_instruction = (
            "당신은 바이럴 숏폼 영상 최고 감독입니다. 15~30초 분량의 쇼츠/릴스 콘티와 대본, "
            "화면 연출 및 나레이션을 타임라인별로 명확하게 작성하십시오."
        )

        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config={"system_instruction": system_instruction}
        )
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        save_path = os.path.join(OUTPUTS_DIR, f"script_{timestamp}.md")
        os.makedirs(OUTPUTS_DIR, exist_ok=True)
        with open(save_path, "w", encoding="utf-8") as f:
            f.write(response.text)

        print(f"🎬 숏폼 대본 생성 완료: {save_path}")
        return save_path
    except Exception as e:
        print(f"❌ 대본 생성 중 오류 발생: {e}")
        return None

def main():
    parser = argparse.ArgumentParser(description="Google 숏폼 영상/대본 합성 모듈")
    parser.add_argument("--prompt", required=True, help="기획 내용 또는 비디오 설명 프롬프트")
    parser.add_argument("--type", default="script", choices=["script", "video"], help="생성 유형 (대본 또는 비디오)")
    args = parser.parse_args()

    if args.type == "script":
        generate_video_script(args.prompt)
    else:
        print(f"🎥 Veo 2.0 비디오 생성 파이프라인 대기 중: {args.prompt}")

if __name__ == "__main__":
    main()
