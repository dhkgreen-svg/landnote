# Antigravity Workspace Instruction & Memory: ParkOn & LandNote Marketing Control

## 1. 대표님 및 프로젝트 개요
- **총괄 마스터**: 김대희 대표님
- **주요 서비스**:
  1. **파크온 (ParkOn)**: 전국 400여 개 파크골프장 실시간 날씨, 코스 정보, 스마트 길안내, 전국 통합 관제 센터 (https://www.parkongolf.com, 로컬 포트 3008)
  2. **랜드노트 (LandNote)**: 스마트 부동산 CRM 및 수성구 범어동 160억 통빌딩 매칭 플랫폼 (https://landnote-web.vercel.app)

---

## 2. 옴니채널 마케팅 총괄 관제 센터 (Omni-Channel Auto Marketing Hub)
- **위치**: C:\Users\Admin\Desktop\안티그래비티_마케팅_모음\마케팅_총괄_관제센터
- **웹 관제 대시보드 URL**: http://localhost:4005
- **바탕화면 실행 아이콘**: C:\Users\Admin\Desktop\📢_통합_마케팅_자동포스팅_센터.bat
- **지원 채널**:
  - **텍스트/카드뉴스**: 네이버 밴드 (Band), 페이스북 그룹/페이지 (Facebook), 네이버 카페 (Cafe), 카카오톡
  - **숏폼 영상**: 유튜브 쇼츠 (Shorts), 인스타그램 릴스 (Reels), 틱톡 (TikTok), 네이버 클립
- **계정 안전 수칙**:
  - 밴드 & 페이스북 도배 제재 방지를 위해 **채널당 1일 1~2회 (오전 10:00 / 오후 15:00)** 정기 스케줄 준수
  - 게시물 간 45~90초 지연(Delay) 필수 유지
  - 사용자 크롬과 충돌하지 않도록 전용 격리 프로필(temp/chrome_profile_band, temp/chrome_profile_fb) 사용

---

## 3. 안티그래비티 대화창 명령 실행 지침 (AI 행동 규칙)
대표님께서 대화창에서 마케팅 관련 명령을 내리시면, 별도의 질문 없이 즉시 아래 명령어를 백그라운드에서 실행하고 결과를 간결하고 명확한 카드/표 형태로 보고합니다.

### 명령어 매핑:
1. **"파크온 밴드(또는 페이스북)에 올려줘"**:
   ```powershell
   python "C:\Users\Admin\Desktop\안티그래비티_마케팅_모음\마케팅_총괄_관제센터\dispatcher.py" --campaign parkon --channels band,facebook
   ```
2. **"마케팅 현황 / 포스팅 결과 보여줘"**:
   - http://localhost:4005/api/status 및 http://localhost:4005/api/logs 조회 후 성공 건수와 최신 로그 요약 보고
3. **"랜드노트 매물 홍보 올려줘"**:
   ```powershell
   python "C:\Users\Admin\Desktop\안티그래비티_마케팅_모음\마케팅_총괄_관제센터\dispatcher.py" --campaign landnote --channels band,facebook
   ```
4. **"쇼츠 / 릴스 / 틱톡 올려줘"**:
   ```powershell
   python "C:\Users\Admin\Desktop\안티그래비티_마케팅_모음\마케팅_총괄_관제센터\dispatcher.py" --campaign parkon --channels shorts
   ```
