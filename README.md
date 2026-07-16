# LandNote

공인중개사가 고객 문의, 보유 매물, 자동 매칭, 통계와 구독을 관리하는 부동산 CRM SaaS 모노레포입니다.

## 현재 기준

- Web: Next.js 14.2.x (`apps/web`, 포트 3000)
- API: NestJS 10.x (`apps/api`, 포트 3001)
- 공통 SSoT: `@landnote/shared` (`packages/shared`)
- 데이터/인증/파일: Supabase PostgreSQL + Auth + private Storage
- 배포: Vercel(Web) + Railway(API/Docker) + Supabase
- DB 마이그레이션: `supabase/migrations/001_extensions.sql`부터 `013_agents_insert_policy.sql`까지
- 2026-07-12 로컬 검증: API 77 tests 통과, Web E2E 10 tests 통과, 전체 빌드 통과

실제 원격 Vercel/Railway/Supabase 운영 상태는 이 저장소만으로 확인할 수 없습니다. 배포 전 각 대시보드의 현재 프로젝트, 환경변수, 마이그레이션 적용 상태를 별도로 확인해야 합니다.

## 문서 지도

| 목적 | 먼저 읽을 문서 |
|---|---|
| 5분 안에 구조 파악 | `GUIDE.md` |
| 로컬 설치, Supabase 초기화, 테스트 | `docs/local-development.md` |
| Vercel/Railway/Supabase 신규 배포 | `docs/deploy.md` |
| Drive 안전 전달, 신규 계정, 비밀값 제외 | `docs/security-and-ownership.md` |
| 현재 구현 상태와 다음 작업 | `HANDOFF.md` |
| 타입/API/DB 원본 명세 | `docs/PLAN.md` |
| AI/개발 작업 규칙 | `AGENTS.md`, `CLAUDE.md` |

`docs/PLAN.md`는 제품·기술 명세의 SSoT이고, `HANDOFF.md`는 현재 저장소에서 확인된 구현 상태의 기준입니다. 두 문서가 충돌하면 새 기능을 임의로 만들지 말고 코드와 DB 상태를 확인한 뒤 차이를 기록합니다.

## 빠른 시작

PowerShell에서 실행 정책 때문에 `pnpm`이 차단되면 아래처럼 `pnpm.cmd`를 사용합니다.

```powershell
pnpm.cmd install --frozen-lockfile
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.local.example apps/web/.env.local
```

두 환경변수 파일에 자신의 개발용 값을 입력한 뒤, 포트 점유를 확인하고 서버를 각각 실행합니다.

```powershell
Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object LocalPort -in 3000,3001

pnpm.cmd dev:api
pnpm.cmd dev:web
```

검증 명령:

```powershell
pnpm.cmd test:api
$env:PLAYWRIGHT_PORT='3100'; pnpm.cmd test:e2e
pnpm.cmd build
```

상세 절차와 기대 결과는 `docs/local-development.md`를 따릅니다.

## 비밀값 원칙

- 실제 `.env`, 서비스 키, 결제 키, DB 비밀번호, 전화번호 암호화 키를 Git·이슈·문서·메신저에 남기지 않습니다.
- 브라우저에는 `NEXT_PUBLIC_*` 값만 사용합니다. `SUPABASE_SERVICE_ROLE_KEY`, `TOSS_SECRET_KEY`, `RESEND_API_KEY`, `PHONE_ENCRYPT_KEY`, `VAPID_PRIVATE_KEY`는 서버 전용입니다.
- 후속 작업자는 자신의 GitHub, Vercel, Railway, Supabase, Toss, Resend, 도메인을 새로 만들고 자신의 값으로 배포합니다.
- 현재 외부 서비스와 운영 데이터는 구성되어 있지 않으며, 전달 ZIP에는 소스·문서·환경변수 example만 포함됩니다.

## Drive 전달 파일 만들기

원본 폴더를 그대로 공유하면 Git에서 무시되는 실제 `.env`도 Drive에는 포함될 수 있습니다. 아래 명령으로 안전 ZIP을 만든 뒤 그 ZIP만 전달합니다.

```powershell
pnpm.cmd handoff:zip
```

기본 출력은 저장소 상위 폴더의 `landnote-handoff.zip`입니다. 포함/제외 기준은 `docs/security-and-ownership.md`에 정리되어 있습니다.

## 핵심 구현 규칙

- API 응답은 `{ ok: true, data }` 또는 `{ ok: false, error: { code, message } }`입니다.
- `@Public()`이 없는 API 라우트에는 글로벌 `JwtAuthGuard`가 적용됩니다.
- private Storage에는 DB에 path만 저장하고 조회 시 signed URL을 발급합니다. `getPublicUrl()`은 사용하지 않습니다.
- `agents` 생성은 서버의 elevated Supabase 키를 통해 처리합니다.
- DB 마이그레이션은 기존 파일을 수정하지 않고 다음 번호부터 순차 추가합니다. 현재 다음 번호는 `014`입니다.
