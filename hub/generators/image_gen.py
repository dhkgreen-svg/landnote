#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
hub/generators/image_gen.py - Imagen 3 기반 미디어 생성 모듈
Google AI Studio의 imagen-3.0-generate-002 모델을 사용하여
1:1 또는 16:9 비율의 고화질 이미지를 생성하고 outputs/ 디렉터리에 자동 저장합니다.

사용법:
  python hub/generators/image_gen.py --prompt "A futuristic golf course banner" --aspect-ratio 16:9
  python hub/generators/image_gen.py --prompt "Mascot character" --aspect-ratio 1:1 --filename mascot.jpg
"""

import os
import sys
import io
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

# 환경 변수 로드
load_dotenv(ENV_PATH)
load_dotenv()

def get_api_key():
    return os.getenv("GEMINI_API_KEY")

def generate_image(prompt: str, aspect_ratio: str = "1:1", filename: str = None, model: str = None) -> str:
    """
    Imagen 3 모델을 호출하여 이미지를 생성하고 outputs/에 저장합니다.
    """
    api_key = get_api_key()
    if not api_key:
        print("⚠️ [경고] GEMINI_API_KEY 가 설정되지 않았습니다.")
        print(f"👉 {ENV_PATH} 파일 또는 환경 변수에 GEMINI_API_KEY 를 등록해주세요.")
        return None

    model_name = model or os.getenv("IMAGEN_MODEL", "imagen-3.0-generate-002")

    print(f"🎨 [Imagen 3 이미지 생성 시작]")
    print(f"• 모델: {model_name}")
    print(f"• 프롬프트: {prompt}")
    print(f"• 비율: {aspect_ratio}")

    try:
        from google import genai
        from google.genai import types
        from PIL import Image

        client = genai.Client(api_key=api_key)

        result = client.models.generate_images(
            model=model_name,
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                output_mime_type="image/jpeg",
                aspect_ratio=aspect_ratio,
            )
        )

        os.makedirs(OUTPUTS_DIR, exist_ok=True)

        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"image_{timestamp}.jpg"
        
        save_path = os.path.join(OUTPUTS_DIR, filename)

        for generated_image in result.generated_images:
            image = Image.open(io.BytesIO(generated_image.image.image_bytes))
            image.save(save_path)
            print(f"✅ 이미지 생성 완료 및 저장 성공: {save_path}")
            return save_path

    except Exception as e:
        print(f"❌ 이미지 생성 중 오류 발생: {e}")
        return None

def main():
    parser = argparse.ArgumentParser(description="Google Imagen 3 이미지 생성기")
    parser.add_argument("--prompt", required=True, help="생성할 이미지 설명(프롬프트)")
    parser.add_argument("--aspect-ratio", default="1:1", choices=["1:1", "16:9", "9:16", "4:3", "3:4"], help="이미지 화면 비율")
    parser.add_argument("--filename", help="저장할 파일명 (outputs/ 기준)")
    parser.add_argument("--model", help="사용할 Imagen 모델명")
    args = parser.parse_args()

    generate_image(
        prompt=args.prompt,
        aspect_ratio=args.aspect_ratio,
        filename=args.filename,
        model=args.model
    )

if __name__ == "__main__":
    main()
