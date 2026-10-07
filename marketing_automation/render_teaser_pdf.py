"""
김천 개령면 서부리 3,400평 토목완료 부지 - A4 1장 투자 제안서 PDF 자동 생성기
ReportLab을 활용하여 매수자 타깃 업종(logistics, storage, factory, all)에 따라
최적화된 1-page Investment Teaser PDF를 생성합니다.
"""

import os
import sys
import argparse
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# 출력 디렉토리
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "generated_assets")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 폰트 등록 (Windows 맑은 고딕)
FONT_NAME = "MalgunGothic"
FONT_BOLD_NAME = "MalgunGothicBold"

def register_fonts():
    font_path = "C:/Windows/Fonts/malgun.ttf"
    font_bold_path = "C:/Windows/Fonts/malgunbd.ttf"
    
    if os.path.exists(font_path):
        pdfmetrics.registerFont(TTFont(FONT_NAME, font_path))
    else:
        print("Warning: malgun.ttf not found, Korean text may not render correctly.")
        
    if os.path.exists(font_bold_path):
        pdfmetrics.registerFont(TTFont(FONT_BOLD_NAME, font_bold_path))
    else:
        pdfmetrics.registerFont(TTFont(FONT_BOLD_NAME, font_path))

# 타깃별 맞춤 강조 문구
TARGET_CONFIG = {
    "logistics": {
        "title": "[물류·유통 거점 특화 제안서] 김천 서부리 토목완료 3,400평",
        "focus_parcel": "B, C 필지 (물류창고·환적장·유통기지)",
        "headline": "쿠팡 메가물류 5분! 대형 윙바디·추레라 양방향 완벽 진출입",
        "desc": "쿠팡 김천 스마트 메가물류센터(준공 완료, 단계 가동)와 직결되는 5분 거리 요충지로, 3자물류(3PL), 택배 터미널 및 대형 물류 보관시설에 최적화된 토목 완료 부지입니다.",
        "badge_color": colors.HexColor("#0d9488")
    },
    "storage": {
        "title": "[야적장·자재적재·차고지 특화 제안서] 김천 서부리 850평~3,400평",
        "focus_parcel": "D 필지 (김천 최저가 2억대 야적장)",
        "headline": "평당 35만원 파격가! 100% 평탄화 완료로 계약 즉시 적재 가능",
        "desc": "토목공사비 수억 원이 이미 투입되어 평탄화와 옹벽이 완벽히 마감되었습니다. 건설자재 적치, 철강·중장비 차고지, 컨테이너 야적장으로 즉시 활용 가능합니다.",
        "badge_color": colors.HexColor("#7c3aed")
    },
    "factory": {
        "title": "[제조공장·기업사옥 특화 제안서] 김천 서부리 토목완료 부지",
        "focus_parcel": "A, B 필지 (서부길 접면 기업사옥·제조플랜트)",
        "headline": "천안대로·서부길 메인 접면! 김천1산단 4단계 착공 핵심 배후지",
        "desc": "가시성과 접근성이 뛰어난 전면 서부길 직접 접면 부지입니다. 제조업, 조립공장, 사옥 및 전시 유통시설 건축 인허가 즉시 진행 가능하며 법인 대출 최대 80% 지원됩니다.",
        "badge_color": colors.HexColor("#059669")
    },
    "all": {
        "title": "[통매각·개발사업 특화 제안서] 김천 서부리 3,400평 대토지",
        "focus_parcel": "3,400평 일괄 통매각 (14억 중반대 파격 협의)",
        "headline": "김천 서부리 3,400평 통매각 특가! 단독 복합 물류·산업 클러스터",
        "desc": "서부길 전면과 단지 내부 6m 도로를 완비한 3,400평 대규모 단일 부지입니다. 쿠팡 물류 배후단지 및 대기업 물류단지 개발에 탁월한 입지와 파격적인 매매가를 제공합니다.",
        "badge_color": colors.HexColor("#f59e0b")
    }
}

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        # 상단 헤더 라인
        self.setStrokeColor(colors.HexColor("#0f172a"))
        self.setLineWidth(4)
        self.line(30, 815, 565, 815)
        
        # 하단 푸터 바
        self.setFillColor(colors.HexColor("#0f172a"))
        self.rect(30, 20, 535, 30, fill=1, stroke=0)
        self.setFillColor(colors.white)
        self.setFont(FONT_BOLD_NAME, 9)
        self.drawString(45, 31, "현장 방문 예약 & 전담 공인중개사 직통 상담: 010-8806-0266 | 랜드노트(LandNote)")
        self.setFont(FONT_NAME, 8)
        self.drawRightString(550, 31, "김천 개령면 서부리 분양")

def render_teaser_pdf(target="all"):
    register_fonts()
    config = TARGET_CONFIG.get(target, TARGET_CONFIG["all"])
    pdf_path = os.path.join(OUTPUT_DIR, f"investment_teaser_{target}.pdf")

    # A4: 595 x 842 pt
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        leftMargin=30,
        rightMargin=30,
        topMargin=35,
        bottomMargin=55
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        fontName=FONT_BOLD_NAME,
        fontSize=17,
        leading=22,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=3
    )

    sub_style = ParagraphStyle(
        'DocSub',
        fontName=FONT_BOLD_NAME,
        fontSize=10,
        leading=13,
        textColor=colors.HexColor("#059669"),
        spaceAfter=8
    )

    body_style = ParagraphStyle(
        'DocBody',
        fontName=FONT_NAME,
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#334155")
    )

    highlight_style = ParagraphStyle(
        'Highlight',
        fontName=FONT_BOLD_NAME,
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#0f172a")
    )

    story = []

    # 1. 문서 헤더
    story.append(Paragraph(config["title"], title_style))
    story.append(Paragraph(f"위치: 경북 김천시 개령면 서부리 일원 | 총 면적: 3,400평 (4개 필지 분할 및 통매각)", sub_style))

    # 2. 타깃 맞춤 강조 박스
    focus_data = [
        [
            Paragraph(f"<b>[타깃 핵심 제안] {config['headline']}</b>", highlight_style),
        ],
        [
            Paragraph(f"• 집중 추천 필지: <b>{config['focus_parcel']}</b><br/>• {config['desc']}", body_style)
        ]
    ]
    t_focus = Table(focus_data, colWidths=[535])
    t_focus.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor("#059669")),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(t_focus)
    story.append(Spacer(1, 10))

    # 3. 4개 필지 구성 및 확정 분양가 표
    story.append(Paragraph("<b>■ 필지별 분할 매각 제원 및 확정 분양가</b>", highlight_style))
    story.append(Spacer(1, 4))

    table_data = [
        [
            Paragraph("<b>구분</b>", highlight_style),
            Paragraph("<b>면적</b>", highlight_style),
            Paragraph("<b>평당 단가</b>", highlight_style),
            Paragraph("<b>확정 분양가</b>", highlight_style),
            Paragraph("<b>도로 접면 조건</b>", highlight_style),
            Paragraph("<b>추천 및 특화 용도</b>", highlight_style),
        ],
        [
            Paragraph("<b>A 필지</b>", highlight_style),
            Paragraph("850평<br/>(2,810㎡)", body_style),
            Paragraph("50만 원", body_style),
            Paragraph("<b>4억 2,500만</b>", highlight_style),
            Paragraph("전면 서부길 직접 접면", body_style),
            Paragraph("기업 사옥, 전시형 유통센터, 본사 거점", body_style),
        ],
        [
            Paragraph("<b>B 필지</b>", highlight_style),
            Paragraph("850평<br/>(2,810㎡)", body_style),
            Paragraph("50만 원", body_style),
            Paragraph("<b>4억 2,500만</b>", highlight_style),
            Paragraph("서부길 & 내부 6m 코너 접면", body_style),
            Paragraph("대형 물류창고, 첨단 제조공장, 환적장", body_style),
        ],
        [
            Paragraph("<b>C 필지</b>", highlight_style),
            Paragraph("850평<br/>(2,810㎡)", body_style),
            Paragraph("40만 원", body_style),
            Paragraph("<b>3억 4,000만</b>", highlight_style),
            Paragraph("내부 6m 도로 코너 접면", body_style),
            Paragraph("실속형 물류창고, 유통 거점, 중소 제조공장", body_style),
        ],
        [
            Paragraph("<b>D 필지</b>", highlight_style),
            Paragraph("850평<br/>(2,810㎡)", body_style),
            Paragraph("<font color='#7c3aed'><b>35만 원</b></font>", highlight_style),
            Paragraph("<font color='#7c3aed'><b>2억 9,750만</b></font>", highlight_style),
            Paragraph("단지 내부 6m 도로 완비", body_style),
            Paragraph("<b>김천 최저가 야적장, 자재적재, 차고지</b>", highlight_style),
        ],
        [
            Paragraph("<font color='#d97706'><b>통매각</b></font>", highlight_style),
            Paragraph("<b>총 3,400평</b>", highlight_style),
            Paragraph("평당 42만선", body_style),
            Paragraph("<font color='#d97706'><b>14억 중반 협의</b></font>", highlight_style),
            Paragraph("서부길 전면 + 독점 부지", body_style),
            Paragraph("대기업 복합 물류센터, 산단 협력 물류단지", highlight_style),
        ],
    ]

    t_parcels = Table(table_data, colWidths=[55, 65, 65, 80, 110, 160])
    t_parcels.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_parcels)
    story.append(Spacer(1, 10))

    # 4. 4대 투자 메리트
    story.append(Paragraph("<b>■ 본 토목완료 부지의 4대 압도적 프리미엄</b>", highlight_style))
    story.append(Spacer(1, 4))

    merits = [
        [
            Paragraph("<b>① 쿠팡 메가물류센터 차량 5분</b><br/><font color='#64748b'>1,000억 규모 메가물류 준공·가동으로 배후 유통 수요 폭발</font>", body_style),
            Paragraph("<b>② 토목·평탄화 100% 완료 (비용 0원)</b><br/><font color='#64748b'>평당 10~15만원 수억 원 토목공사비 절감, 계약 즉시 착공</font>", body_style),
        ],
        [
            Paragraph("<b>③ 대형 추레라·윙바디 완벽 진출입</b><br/><font color='#64748b'>천안대로 국도 교차로 직결 + 서부길 접면 + 6m 아스콘 도로</font>", body_style),
            Paragraph("<b>④ 감정가 우수 제1금융권 대출 70~80%</b><br/><font color='#64748b'>실투자금 8천만원~1억원대 진입 가능, 정책자금 연계 우대</font>", body_style),
        ]
    ]
    t_merits = Table(merits, colWidths=[265, 270])
    t_merits.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_merits)
    story.append(Spacer(1, 10))

    # 5. 금융 시뮬레이션 요약 (자기자본 및 월 이자)
    story.append(Paragraph("<b>■ 금융 조달 및 실투자금 시뮬레이션 (LTV 70% / 금리 4.8% 기준)</b>", highlight_style))
    story.append(Spacer(1, 4))

    calc_data = [
        [
            Paragraph("<b>대상 필지</b>", highlight_style),
            Paragraph("<b>총 매입가</b>", highlight_style),
            Paragraph("<b>대출 가능액 (70%)</b>", highlight_style),
            Paragraph("<b>필요 실투자금 (30%)</b>", highlight_style),
            Paragraph("<b>예상 월 금융이자</b>", highlight_style),
        ],
        [
            Paragraph("A, B 필지 (850평)", body_style),
            Paragraph("4억 2,500만 원", body_style),
            Paragraph("2억 9,750만 원", body_style),
            Paragraph("<b>1억 2,750만 원</b>", highlight_style),
            Paragraph("약 119만 원 / 월", body_style),
        ],
        [
            Paragraph("C 필지 (850평)", body_style),
            Paragraph("3억 4,000만 원", body_style),
            Paragraph("2억 3,800만 원", body_style),
            Paragraph("<b>1억 200만 원</b>", highlight_style),
            Paragraph("약 95만 원 / 월", body_style),
        ],
        [
            Paragraph("D 필지 (850평 / 최저가)", highlight_style),
            Paragraph("2억 9,750만 원", body_style),
            Paragraph("2억 825만 원", body_style),
            Paragraph("<font color='#7c3aed'><b>8,925만 원</b></font>", highlight_style),
            Paragraph("약 83만 원 / 월", body_style),
        ],
        [
            Paragraph("3,400평 일괄 통매각", highlight_style),
            Paragraph("14억 5,000만 원선", body_style),
            Paragraph("10억 1,500만 원", body_style),
            Paragraph("<font color='#d97706'><b>4억 3,500만 원</b></font>", highlight_style),
            Paragraph("약 406만 원 / 월", body_style),
        ]
    ]
    t_calc = Table(calc_data, colWidths=[115, 105, 105, 105, 105])
    t_calc.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_calc)

    # 빌드
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Generated Teaser PDF [{target}]: {pdf_path}")
    return pdf_path

def main():
    parser = argparse.ArgumentParser(description="Gimcheon Seoburi Land A4 1-Page Teaser PDF Generator")
    parser.add_argument("--target", choices=["logistics", "storage", "factory", "all"], default="all",
                        help="Target buyer segment (logistics, storage, factory, all)")
    args = parser.parse_args()

    print("Generating Investment Teaser PDF(s)...")
    if args.target == "all" and len(sys.argv) == 1:
        # 인자 없이 실행 시 모든 타깃 PDF 자동 생성
        for t in ["logistics", "storage", "factory", "all"]:
            render_teaser_pdf(t)
    else:
        render_teaser_pdf(args.target)

if __name__ == "__main__":
    main()
