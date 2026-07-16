# LandNote 작업 가이드

이 문서는 새 개발자나 AI agent가 저장소의 문서 역할과 안전한 작업 순서를 빠르게 파악하기 위한 입구입니다. 긴 설정값이나 운영 비밀은 이 문서에 적지 않습니다.

## 1. 처음 10분

1. `HANDOFF.md`에서 현재 확인된 상태와 다음 작업을 읽습니다.
2. 변경하려는 기능에 대응하는 `docs/PLAN.md` 장을 읽습니다.
3. `git status --short`로 기존 작업자의 변경을 확인하고 보존합니다.
4. `@landnote/shared`에 이미 있는 상수·타입인지 먼저 검색합니다.
5. 변경 후 API 테스트, Web E2E, 전체 빌드 중 영향 범위에 맞는 검증을 실행합니다.

```powershell
git status --short
rg -n "찾을_상수나_타입" packages/shared apps
pnpm.cmd test:api
$env:PLAYWRIGHT_PORT='3100'; pnpm.cmd test:e2e
pnpm.cmd build
```

PowerShell에서 `pnpm.ps1 cannot be loaded`가 나오면 저장소 문제가 아니라 실행 정책 문제입니다. 정책을 바꾸지 않아도 `pnpm.cmd`로 실행할 수 있습니다.

## 2. 문서 역할

| 문서 | 역할 | 갱신 시점 |
|---|---|---|
| `README.md` | 프로젝트 소개와 문서 지도 | 진입점이나 핵심 스택이 바뀔 때 |
| `docs/PLAN.md` | 제품·기술 명세 SSoT | 요구사항, 타입, API, DB 설계가 합의되어 바뀔 때 |
| `HANDOFF.md` | 코드로 확인한 현재 상태와 남은 일 | 기능 완료, 위험 발견, 검증 결과 변경 시 |
| `docs/local-development.md` | 로컬 설치·DB 초기화·테스트 절차 | 명령, 포트, 테스트 방식 변경 시 |
| `docs/deploy.md` | Supabase→Railway→Vercel 배포 런북 | 배포 설정이나 서비스 구조 변경 시 |
| `docs/security-and-ownership.md` | Drive 안전 ZIP과 신규 계정 원칙 | 전달 범위나 제외 규칙 변경 시 |
| `AGENTS.md`, `CLAUDE.md` | 사람과 AI가 지킬 작업 규칙 | 반드시 두 파일을 동일하게 유지 |

문서에 실제 프로젝트 ID, 이메일/비밀번호, 고객 전화번호, 사용자 UUID, API 키를 기록하지 않습니다. 운영 현황은 비밀값 대신 대시보드 경로, 변수명, 확인일, 담당 역할로 표현합니다.

## 3. 아키텍처

```text
Browser
  ├─ Next.js 14 Web (Vercel)
  │    ├─ Supabase Auth: publishable/anon key
  │    └─ NestJS API 호출: Bearer JWT
  └─ PWA / Web Push

NestJS 10 API (Railway, Docker)
  ├─ JwtAuthGuard + SubscriptionGuard + AdminAuthGuard
  ├─ Supabase elevated key: DB/Auth/Storage 서버 작업
  ├─ Toss Payments: 빌링
  ├─ Resend: 이메일
  └─ Scheduler: 결제, 만료, 로그 정리

Supabase
  ├─ PostgreSQL + PostGIS
  ├─ Auth
  └─ private Storage -> signed URL
```

## 4. 저장소 구조

```text
apps/web/                 Next.js App Router, UI, Playwright E2E
apps/api/                 NestJS API, Jest 테스트
packages/shared/          공통 상수와 타입 SSoT
supabase/migrations/      순차 SQL 마이그레이션 001~013
docs/PLAN.md              전체 기술 명세
docs/local-development.md 로컬/테스트 런북
docs/deploy.md            배포 런북
```

## 5. 기능별 시작 위치

| 작업 | PLAN 장 | 코드 시작점 |
|---|---:|---|
| 모노레포/설정 | 2 | 루트 설정 파일, 각 `package.json` |
| 환경변수 | 3 | 두 `.env*.example`, `process.env` 검색 |
| DB/RLS | 5~6 | `supabase/migrations/` |
| API/응답 | 7~10 | `apps/api/src/app.module.ts`, 각 module |
| 가입/인증 | 9, 11 | `modules/auth`, `app/(auth)` |
| 고객 접수 | 12 | `modules/inquiries`, `app/(form)` |
| 대시보드 | 13, 15 | `app/(dashboard)`, stats module |
| 매칭 | 14 | matching module, shared weights |
| 이미지 | 16 | storage service |
| 결제 | 17 | billing module |
| 이메일/푸시 | 18 | email/notifications modules |
| 관리자 | 20 | admin module, `app/(admin)` |

## 6. 구현 규칙

- 공통 ENUM, 요금제, 카테고리, 상태 값은 `@landnote/shared`에서 가져옵니다.
- API envelope는 글로벌 인터셉터/필터가 담당하므로 컨트롤러에서 임의 형식을 만들지 않습니다.
- 입력값은 DTO allowlist와 class-validator를 사용합니다.
- 가격 필드는 프론트, DTO, DB CHECK 세 층에서 검증합니다.
- `@Public()`은 실제 공개가 필요한 라우트에만 붙입니다.
- private Storage path만 DB에 저장하고 API에서 signed URL을 만듭니다.
- 새 DB 변경은 현재 마지막 `013` 다음인 `014_설명.sql`부터 추가합니다. 적용된 기존 SQL은 수정하지 않습니다.
- 실제 원격 DB에 적용하기 전 백업, 대상 프로젝트, 적용 완료 번호를 확인합니다.

## 7. 작업 완료 기준

기능 코드를 작성했다는 것만으로 완료하지 않습니다.

- 코드와 `docs/PLAN.md`의 타입/API/DB 정의가 일치합니다.
- 관련 테스트가 통과합니다.
- `pnpm.cmd build`가 통과합니다.
- 환경변수 추가 시 두 example 파일과 로컬·배포 문서를 함께 갱신합니다.
- 마이그레이션 추가 시 `HANDOFF.md`와 배포 순서를 갱신합니다.
- 배포 설정 변경 시 `vercel.json`, `railway.json`, `Dockerfile`, `docs/deploy.md`를 함께 대조합니다.
- 현재 상태가 달라졌다면 `HANDOFF.md`를 과거 작업일지가 아니라 최신 운영 기준으로 고쳐 씁니다.

## 8. 다음 문서

- 로컬에서 처음 실행: `docs/local-development.md`
- 다른 사람의 계정으로 새 배포: `docs/deploy.md`
- Drive로 안전하게 전달: `docs/security-and-ownership.md`
- 후속 개발 우선순위: `HANDOFF.md`
