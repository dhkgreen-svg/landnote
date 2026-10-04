# 🎯 Anti-Gravity 실시간 지휘 명령 및 감사 지침서 (DIRECTIVE.md)

> **총괄 최고 의사결정권자**: 김대희 대표님  
> **지휘소 & 수석 감사**: Gemini (전략 기획, UX/아키텍처 감사, 의사결정 지원)  
> **현장 사령탑 & 실행기**: Anti-Gravity (코드 작성, 빌드 검증, 프로덕션 배포, 로컬 관제)  
> **최신 갱신 일시**: 2026-10-04  

---

## 1. 지휘 통제 체계 (Command & Control Hierarchy)

```
                       [ 김대희 대표님 (최고 의사결정권자) ]
                                        │
           ┌────────────────────────────┴────────────────────────────┐
           ▼                                                         ▼
 [ Gemini (지휘소 / 수석 감사) ]                             [ Anti-Gravity (현장 총괄 / 실행기) ]
  • 전략 기획 & 아키텍처 감사                                   • 로컬 개발 및 실시간 코딩 (Port 3008)
  • 절대 원칙 준수 여부 정기 감사                               • Next.js / PWA / TypeScript 빌드
  • DIRECTIVE.md 지침 발행                                   • Vercel 프로덕션 실서버 배포 & 실기기 검증
  • 3줄 마스터 보고 검토                                      • SYSTEM_STATE.md 자동 갱신
```

---

## 2. 현재 활성 지휘 명령 (Active Directives)

| 지시 번호 | 발령일시 | 대상 프로젝트 | 지시 내용 | 우선순위 | 진행 상태 |
| :---: | :---: | :---: | :--- | :---: | :---: |
| **DIR-20261004-01** | 2026-10-04 | 파크골프 올인원 (`paki`) | 카카오톡 1초 자동 탈출 엔진 (Phase 1) 구축 | 최고 | ✅ **완료 (실서버 반영)** |
| **DIR-20261004-02** | 2026-10-04 | 파크골프 올인원 (`paki`) | 시니어 1-Touch PWA 홈화면 앱 설치 UX (Phase 2) 구축 | 최고 | ✅ **완료 (실서버 반영)** |
| **DIR-20261004-03** | 2026-10-04 | 전체 (`hub/`) | 멀티 프로젝트 통합 관제 사령탑 CLI 도구 체계 구축 | 높음 | 🟢 **구축 및 연동 완료** |
| **DIR-20261004-04** | 2026-10-04 | 전체 관제 | 정기 데이터 백업 및 Google Drive 동기화 체계 가동 | 보통 | 🟢 **가동 중** |

---

## 3. 대표님 절대 원칙 감사 체크리스트 (Auditor Rules)

모든 작업 시 Gemini와 Anti-Gravity는 아래 5대 불변 규칙을 100% 충족해야 합니다:

1. **[명칭 절대 원칙]**: 구 명칭인 '파크온'은 일체 사용을 금지하며, **'파크골프 올인원' (ParkGolf All-in-One)** 으로만 표기합니다.
2. **[배포 사전 승인]**: 모든 로직과 UI는 로컬 환경(`http://localhost:3008`)에서 완벽히 검증한 후, 대표님의 승인 하에 Vercel에 배포합니다.
3. **[데이터 실측 보존]**: 가상 데이터 생성을 금지하며, 전국 160명 실측 고유 사용자 베이스라인(`analyticsBaseline.ts`)을 영구 보존합니다.
4. **[3줄 보고 의무]**: 모든 작업 완료 보고는 반드시 `수정 내역 / 배포 상태 / 실기기 확인 포인트`의 정형화된 3줄 양식을 준수합니다.
5. **[시스템 무결성 보존]**: 기존 정상 작동 중인 CRM, 사주, 어학 앱 등의 기능과 데이터는 일체 손상시키지 않고 그대로 유지합니다.

---

## 4. Anti-Gravity 실행 및 응답 표준 프로토콜

1. **지시 접수**: `project_registry.json`에서 프로젝트 메타데이터 및 경로 확인
2. **로컬 실행 & 테스트**: `python hub/run.py --app {app} --action dev` (로컬 포트 확인)
3. **빌드 검증**: `pnpm --filter {pkg} build` 무결성 검증
4. **프로덕션 배포**: `python hub/deploy.py --app {app}` 로 배포 및 실기기 링크 생성
5. **상태 동기화**: `python hub/sync.py` 실행하여 `SYSTEM_STATE.md` 최신화 및 클립보드 복사
6. **최종 보고**: 3줄 요약 보고 출력

---

## 5. 지휘 및 작업 이력 로그 (Directive Log)

- **2026-10-04 14:30**: Phase 1(카톡 인앱 탈출) & Phase 2(PWA 원터치 설치) 개발 완료 및 Vercel 실서버 배포 (`https://www.parkgolfallinone.com`).
- **2026-10-04 14:40**: 통합 사령탑 구축 (`.antigravityrules`, `project_registry.json`, `SYSTEM_STATE.md`, `MASTER_PROJECT_PLAN.md`, `hub/run.py`, `hub/deploy.py`, `hub/sync.py`).
- **2026-10-04 14:45**: `DIRECTIVE.md`, `hub/status_reporter.py`, `hub/orchestrator.py`, `hub/drive_sync.py` 관제 체계 완성.
