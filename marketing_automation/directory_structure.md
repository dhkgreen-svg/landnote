# 김천 개령면 서부리 3,400평 토목완료 부지 마케팅 자동화 파이프라인

## 1. 디렉토리 구조 (Directory Structure)

```text
├── seoburi-land-app/                     # [Module 1] 인터랙티브 분양 웹 앱 (모바일/웹 반응형)
│   └── index.html                        # SVG 인터랙티브 구획도, 금융 계산기, 쿠팡 로드맵, CTA 모달 통합 SPA
│
├── marketing_automation/                 # [Module 2] 다채널 마케팅 자동화 스크립트 팩
│   ├── .env.example                      # 환경 변수 템플릿 (Gemini API 키, 브로커 정보)
│   ├── directory_structure.md            # 본 파이프라인 전체 문서 및 실행 가이드
│   ├── generate_social_assets.py         # Pillow 기반 1:1 및 9:16 인스타/페이스북 배너 생성기
│   ├── render_teaser_pdf.py              # ReportLab 기반 A4 1장 투자 제안서 PDF 생성기 (타깃별 특화)
│   ├── generate_marketing_copy.py        # Gemini API 기반 다채널 마케팅 카피 자동 양산기
│   └── generated_assets/                 # 자동 생성된 산출물 저장 디렉토리
│       ├── social_feed_1x1_A.jpg         # A필지 1:1 인스타그램 피드 배너
│       ├── social_feed_1x1_B.jpg         # B필지 1:1 인스타그램 피드 배너
│       ├── social_feed_1x1_C.jpg         # C필지 1:1 인스타그램 피드 배너
│       ├── social_feed_1x1_D.jpg         # D필지 1:1 인스타그램 피드 배너 (최저가 2억대)
│       ├── social_feed_1x1_ALL.jpg       # 통매각 1:1 인스타그램 피드 배너
│       ├── social_story_9x16_A.jpg       # A필지 9:16 릴스/스토리 배너
│       ├── social_story_9x16_B.jpg       # B필지 9:16 릴스/스토리 배너
│       ├── social_story_9x16_C.jpg       # C필지 9:16 릴스/스토리 배너
│       ├── social_story_9x16_D.jpg       # D필지 9:16 릴스/스토리 배너
│       ├── social_story_9x16_ALL.jpg     # 통매각 9:16 릴스/스토리 배너
│       ├── investment_teaser_logistics.pdf # 물류/창고 기업 특화 A4 1장 제안서
│       ├── investment_teaser_storage.pdf   # 야적장/자재적재 특화 A4 1장 제안서
│       ├── investment_teaser_factory.pdf   # 제조공장/사옥 특화 A4 1장 제안서
│       ├── investment_teaser_all.pdf       # 통매각/개발사업 특화 A4 1장 제안서
│       └── marketing_copies.md            # 중개사/기업관재팀/실수요자/블로그 카피 모음집
```

---

## 2. 모듈별 실행 및 사용법

### [Module 1] 인터랙티브 분양 웹 앱 (`seoburi-land-app`)
- **실행 방법**:
  - 브라우저에서 `seoburi-land-app/index.html` 파일을 더블 클릭하거나 로컬 웹 서버로 열람합니다.
  - Vercel, Netlify, Cloudflare Pages 등에 단독 정적 호스팅 배포 즉시 가능합니다.
- **주요 기능**:
  1. **SVG 인터랙티브 구획도**: A, B, C, D 필지 및 일괄 통매각 클릭 시 하이라이트 및 실시간 상세 제원 모달 표출.
  2. **금융 시뮬레이터**: 대출 비율(60~80%), 금리(3.5~6.5%) 슬라이더 조절 시 실투자금(자기자본) 및 월 예상 금융비용 실시간 계산.
  3. **쿠팡 메가물류센터 인포그래픽**: 5분 거리 연계 호재 및 토목완료 vs 원형지 비교 분석표.
  4. **플로팅 CTA**: 직통 전화 연결(`010-8806-0266`), 카카오톡 1:1 실시간 상담, 현장 방문 예약 모달.

### [Module 2] 자동화 마케팅 스크립트 팩 (`marketing_automation`)

#### 1. SNS 배너 이미지 생성기 (`generate_social_assets.py`)
```bash
python marketing_automation/generate_social_assets.py
```
- A/B/C/D 및 통매각 1:1 정방형(1080x1080) 피드 배너 5종 자동 생성
- A/B/C/D 및 통매각 9:16 세로형(1080x1920) 릴스/스토리/쇼츠 배너 5종 자동 생성

#### 2. 투자 제안서 PDF 생성기 (`render_teaser_pdf.py`)
```bash
# 전체 타깃 PDF 생성
python marketing_automation/render_teaser_pdf.py

# 특정 타깃 특화 PDF 생성
python marketing_automation/render_teaser_pdf.py --target logistics
python marketing_automation/render_teaser_pdf.py --target storage
python marketing_automation/render_teaser_pdf.py --target factory
```
- 매수자 업종에 따라 강조 레이아웃과 추천 필지가 자동 전환되는 A4 1장 제안서 PDF 출력

#### 3. 다채널 마케팅 카피 자동 생성기 (`generate_marketing_copy.py`)
```bash
python marketing_automation/generate_marketing_copy.py
```
- 공인중개사 단체 카톡/문자 (공동중개용)
- 기업 총무팀/관재팀 타깃팅 제안서 카피
- 야적장/자재적재 실수요자용 타깃 카피 (김천 최저가 2억대)
- 네이버 블로그 SEO 맞춤형 전문 칼럼 포스팅 원고 (2,000자 이상)
- 인스타그램 / 페이스북 캡션 및 해시태그
