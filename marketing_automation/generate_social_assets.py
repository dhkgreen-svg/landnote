"""
김천 개령면 서부리 3,400평 토목완료 부지 분양 - SNS 마케팅 이미지 자동 생성기
- 1:1 정방형 (1080x1080) 피드용 배너
- 9:16 세로형 (1080x1920) 스토리/릴스/쇼츠용 배너
"""

import os
from PIL import Image, ImageDraw, ImageFont

# 출력 디렉토리
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "generated_assets")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 폰트 설정 (Windows 맑은 고딕 기본 탑재 활용)
FONT_BOLD_PATH = "C:/Windows/Fonts/malgunbd.ttf"
FONT_REGULAR_PATH = "C:/Windows/Fonts/malgun.ttf"

def get_font(size, bold=True):
    path = FONT_BOLD_PATH if bold else FONT_REGULAR_PATH
    if os.path.exists(path):
        return ImageFont.truetype(path, size)
    return ImageFont.load_default()

# 필지 데이터
PARCELS = [
    {
        "id": "A",
        "name": "A필지 (기업 사옥·전시형 유통센터)",
        "area": "850평 (2,810㎡)",
        "price": "4억 2,500만 원 (평당 50만원)",
        "road": "전면 서부길 직접 접면 (양방향 대형차 교행)",
        "highlight": "서부길 메인 접면 기업 사옥·전시형 유통 거점",
        "equity": "실투자금 약 1억 2,750만 (LTV 70% 시)",
        "color": (5, 150, 105) # emerald
    },
    {
        "id": "B",
        "name": "B필지 (대형 물류창고·제조공장)",
        "area": "850평 (2,810㎡)",
        "price": "4억 2,500만 원 (평당 50만원)",
        "road": "서부길 & 단지내 6m도로 코너 양면 접면",
        "highlight": "코너 양방향 진출입 완벽 / 물류 환적 최적지",
        "equity": "실투자금 약 1억 2,750만 (LTV 70% 시)",
        "color": (13, 148, 136) # teal
    },
    {
        "id": "C",
        "name": "C필지 (실속형 공장·유통 거점)",
        "area": "850평 (2,810㎡)",
        "price": "3억 4,000만 원 (평당 40만원)",
        "road": "단지 내 6m 아스콘 연결도로 코너 접면",
        "highlight": "가성비 극대화 실속형 공장 및 유통 전진기지",
        "equity": "실투자금 약 1억 200만 (LTV 70% 시)",
        "color": (37, 99, 235) # blue
    },
    {
        "id": "D",
        "name": "D필지 (김천 최저가 2억대 야적장)",
        "area": "850평 (2,810㎡)",
        "price": "2억 9,750만 원 (평당 35만원)",
        "road": "단지 내 6m 아스콘 진입도로 완비",
        "highlight": "김천 최저가 평당 35만원! 야적장·자재적재·차고지",
        "equity": "실투자금 약 8,925만 (LTV 70% 시)",
        "color": (124, 58, 237) # purple
    },
    {
        "id": "ALL",
        "name": "3,400평 일괄 통매각 (파격 협의)",
        "area": "총 3,400평 (11,240㎡)",
        "price": "14억 중반대 (협의 가능)",
        "road": "서부길 전면 + 단지 전체 독점 개발",
        "highlight": "쿠팡 메가물류 5분! 단독 대형 물류센터·산단 배후지",
        "equity": "대출 최대 80% 가능 / 법인 담보대출 연계",
        "color": (217, 119, 6) # amber
    }
]

def draw_rounded_rect(draw, bbox, radius, fill, outline=None, width=1):
    x1, y1, x2, y2 = bbox
    draw.rounded_rectangle([x1, y1, x2, y2], radius=radius, fill=fill, outline=outline, width=width)

def generate_square_card(parcel):
    """1:1 정방형 (1080x1080) 카드 생성"""
    width, height = 1080, 1080
    img = Image.new("RGB", (width, height), (15, 23, 42)) # Slate-900
    draw = ImageDraw.Draw(img)

    # 1. 상단 그라데이션 및 긴급 띠 배너
    draw.rectangle([0, 0, width, 55], fill=(220, 38, 38)) # Red Urgent
    font_urgent = get_font(24, bold=True)
    draw.text((width // 2, 27), "[초단기 급매] 경북 김천 개령면 서부리 토목완료 부지", font=font_urgent, fill=(255, 255, 255), anchor="mm")

    # 2. 메인 헤더
    font_sub = get_font(30, bold=False)
    font_title = get_font(52, bold=True)
    draw.text((60, 95), "쿠팡 메가물류센터 5분 거리 | 평탄화 100% 완료 즉시 착공", font=font_sub, fill=(16, 185, 129))
    draw.text((60, 145), parcel["name"], font=font_title, fill=(255, 255, 255))

    # 3. 핵심 배지 3개
    badges = ["토목공사비 0원 절감", "대형 추레라·윙바디 완벽진출입", "대출 최대 70~80%"]
    badge_x = 60
    font_badge = get_font(22, bold=True)
    for b in badges:
        bw = draw.textlength(b, font=font_badge) + 32
        draw_rounded_rect(draw, (badge_x, 225, badge_x + bw, 270), 12, fill=(30, 41, 59), outline=(71, 85, 105), width=2)
        draw.text((badge_x + bw // 2, 247), b, font=font_badge, fill=(226, 232, 240), anchor="mm")
        badge_x += bw + 15

    # 4. 중앙 메인 스펙 카드 (골드 하이라이트 테두리)
    draw_rounded_rect(draw, (60, 300, width - 60, 830), 24, fill=(11, 15, 25), outline=parcel["color"], width=3)

    # 필지 배지
    draw_rounded_rect(draw, (95, 335, 220, 395), 12, fill=parcel["color"])
    font_badge_p = get_font(28, bold=True)
    draw.text((157, 365), f"필지 {parcel['id']}", font=font_badge_p, fill=(255, 255, 255), anchor="mm")

    # 면적 및 분양가
    font_label = get_font(26, bold=False)
    font_val_large = get_font(46, bold=True)
    font_val = get_font(32, bold=True)

    draw.text((95, 420), "부지 면적", font=font_label, fill=(148, 163, 184))
    draw.text((95, 460), parcel["area"], font=font_val, fill=(255, 255, 255))

    draw.text((95, 520), "확정 분양가", font=font_label, fill=(148, 163, 184))
    draw.text((95, 560), parcel["price"], font=font_val_large, fill=(250, 204, 21))

    draw.text((95, 630), "접면 도로", font=font_label, fill=(148, 163, 184))
    draw.text((95, 670), parcel["road"], font=font_val, fill=(52, 211, 153))

    draw.text((95, 730), "추천 및 자금", font=font_label, fill=(148, 163, 184))
    draw.text((95, 770), f"{parcel['highlight']} ({parcel['equity']})", font=get_font(26, bold=True), fill=(226, 232, 240))

    # 5. 하단 CTA 배너
    draw_rounded_rect(draw, (60, 860, width - 60, 1000), 20, fill=(5, 150, 105)) # Emerald Button
    font_cta_main = get_font(38, bold=True)
    font_cta_sub = get_font(24, bold=False)
    draw.text((width // 2, 915), "현장 방문 예약 및 직통 상담 : 010-8806-0266", font=font_cta_main, fill=(255, 255, 255), anchor="mm")
    draw.text((width // 2, 965), "공인중개사 현장 브리핑 상시 대기 | 천안대로·서부길 접면", font=font_cta_sub, fill=(209, 250, 229), anchor="mm")

    output_path = os.path.join(OUTPUT_DIR, f"social_feed_1x1_{parcel['id']}.jpg")
    img.save(output_path, quality=95)
    print(f"Generated 1:1 Feed: {output_path}")

def generate_vertical_card(parcel):
    """9:16 세로형 (1080x1920) 릴스/스토리/쇼츠 배너 생성"""
    width, height = 1080, 1920
    img = Image.new("RGB", (width, height), (15, 23, 42))
    draw = ImageDraw.Draw(img)

    # 1. 상단 긴급 배너
    draw.rectangle([0, 0, width, 80], fill=(220, 38, 38))
    draw.text((width // 2, 40), "★ 경북 김천 개령면 서부리 토목완료 3,400평 급매 ★", font=get_font(30, bold=True), fill=(255, 255, 255), anchor="mm")

    # 2. 헤더
    draw.text((60, 140), "COUPANG 메가물류 5분 거리", font=get_font(34, bold=True), fill=(16, 185, 129))
    draw.text((60, 195), "토목완료 즉시착공 부지", font=get_font(60, bold=True), fill=(255, 255, 255))
    draw.text((60, 275), parcel["name"], font=get_font(44, bold=True), fill=(250, 204, 21))

    # 3. 인포그래픽 박스 (왜 서부리인가?)
    draw_rounded_rect(draw, (60, 360, width - 60, 720), 24, fill=(30, 41, 59), outline=(71, 85, 105), width=2)
    draw.text((95, 400), "투자 및 실사용 핵심 호재", font=get_font(32, bold=True), fill=(52, 211, 153))

    points = [
        ("① 쿠팡 메가물류센터 5분", "1,000억 투자 연면적 9천평 물류 인접 / 연계수요 풍부"),
        ("② 토목·평탄화 100% 완료", "계약 즉시 착공 가능 / 수억 원 토목공사비 절감"),
        ("③ 대형 추레라·윙바디 완벽", "천안대로 직결 및 서부길 접면 / 단지내 6m도로 완비"),
        ("④ 김천 최저가 평당 35만원부터", "김천산단 4단계 착공 배후지 / 대출 최대 70~80%")
    ]
    y_pt = 460
    for title, desc in points:
        draw.text((95, y_pt), title, font=get_font(28, bold=True), fill=(255, 255, 255))
        draw.text((95, y_pt + 35), desc, font=get_font(22, bold=False), fill=(148, 163, 184))
        y_pt += 65

    # 4. 상세 제원 메인 카드
    draw_rounded_rect(draw, (60, 760, width - 60, 1550), 24, fill=(11, 15, 25), outline=parcel["color"], width=3)
    
    # 배지
    draw_rounded_rect(draw, (95, 800, 260, 870), 14, fill=parcel["color"])
    draw.text((177, 835), f"필지 {parcel['id']} 스펙", font=get_font(32, bold=True), fill=(255, 255, 255), anchor="mm")

    specs = [
        ("부지 면적", parcel["area"]),
        ("확정 분양가", parcel["price"]),
        ("도로 조건", parcel["road"]),
        ("추천 업종", parcel["highlight"]),
        ("대출 및 실투자", parcel["equity"])
    ]

    y_sp = 920
    for label, val in specs:
        draw.text((95, y_sp), label, font=get_font(26, bold=False), fill=(148, 163, 184))
        draw.text((95, y_sp + 38), val, font=get_font(36 if "분양가" in label else 30, bold=True), fill=(250, 204, 21) if "분양가" in label else (255, 255, 255))
        draw.line([95, y_sp + 95, width - 95, y_sp + 95], fill=(30, 41, 59), width=1)
        y_sp += 120

    # 5. 하단 CTA
    draw_rounded_rect(draw, (60, 1600, width - 60, 1820), 24, fill=(5, 150, 105))
    draw.text((width // 2, 1670), "현장 방문 예약 & 상담 문의", font=get_font(36, bold=True), fill=(209, 250, 229), anchor="mm")
    draw.text((width // 2, 1735), "010-8806-0266", font=get_font(58, bold=True), fill=(255, 255, 255), anchor="mm")
    draw.text((width // 2, 1785), "전문 공인중개사 직접 안내 / 토목 도면 열람 가능", font=get_font(22, bold=False), fill=(209, 250, 229), anchor="mm")

    output_path = os.path.join(OUTPUT_DIR, f"social_story_9x16_{parcel['id']}.jpg")
    img.save(output_path, quality=95)
    print(f"Generated 9:16 Story: {output_path}")

def main():
    print("Generating Social Media Assets for Gimcheon Seoburi Land...")
    for p in PARCELS:
        generate_square_card(p)
        generate_vertical_card(p)
    print("All social assets successfully generated in:", OUTPUT_DIR)

if __name__ == "__main__":
    main()
