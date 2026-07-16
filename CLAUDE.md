# LandNote 프로젝트 작업 규칙

## 시작 전 필수 확인

1. `HANDOFF.md`에서 현재 확인된 상태와 P0/P1을 읽는다.
2. 변경 기능에 해당하는 `docs/PLAN.md` 장을 먼저 읽는다.
3. `git status --short`로 기존 작업자의 변경을 확인하고 보존한다.
4. 로컬/배포/소유권 작업은 각각 아래 문서를 따른다.
   - 로컬 및 테스트: `docs/local-development.md`
   - Vercel/Railway/Supabase 배포: `docs/deploy.md`
   - Drive 전달·신규 계정·비밀정보 제외: `docs/security-and-ownership.md`

`docs/PLAN.md`는 제품·기술 명세 SSoT이고, `HANDOFF.md`는 현재 저장소에서 확인한 구현 상태의 기준이다. 충돌이 있으면 임의로 한쪽을 가정하지 말고 코드/DB 상태를 확인하고 차이를 기록한다.

## 모노레포 구조

- 패키지 매니저: pnpm 8 workspace
- `apps/web`: Next.js 14.2.x 프론트엔드. 15.x로 올리지 않는다.
- `apps/api`: NestJS 10.x API와 scheduler
- `packages/shared`: 공통 상수/타입 SSoT, `@landnote/shared`로 import
- `supabase/migrations`: 순차 SQL. 현재 저장소 마지막은 `013_agents_insert_policy.sql`

## 반드시 지킬 구현 규칙

- ENUM, 요금제, 카테고리, 상태, 공통 타입은 `@landnote/shared`에서 사용하고 Web/API에 중복 정의하지 않는다.
- API 응답은 `{ ok: true, data }` 또는 `{ ok: false, error: { code, message } }`이며 GlobalExceptionFilter/ResponseInterceptor 흐름을 유지한다.
- 가격 검증은 프론트 실시간, DTO class-validator, DB CHECK 세 층을 유지한다.
- private Storage에는 path만 DB에 저장하고 조회 시 signed URL을 발급한다. `getPublicUrl()`을 사용하지 않는다.
- `@Public()`이 없는 라우트에는 글로벌 JwtAuthGuard가 적용된다는 전제로 설계한다.
- agents 생성은 서버의 elevated Supabase key 경유를 원칙으로 한다.
- 입력 DTO는 whitelist와 validator를 사용하고 서비스 레이어의 소유권 조건을 유지한다.
- 새 환경변수를 추가하면 example 파일, 로컬 문서, 배포 문서를 함께 갱신한다.

## DB migration 규칙

- 이미 적용 가능성이 있는 `001~013` 파일은 수정하지 않는다.
- 다음 신규 migration은 `014_설명.sql`부터 번호를 순차 증가시킨다.
- 새 Phase나 DB 변경 전 `docs/PLAN.md` 5장, 6장, 19장의 관련 체크리스트를 확인한다.
- SQL은 기존 원격 DB에 무조건 재실행하지 않는다. 실제 마지막 적용 번호, 백업, 부분 적용 여부를 먼저 확인한다.
- `013_agents_insert_policy.sql`은 서버 경유 원칙과 충돌 가능성이 있으므로 `HANDOFF.md` P0 결정을 확인한다. 제거 시 기존 파일 편집 대신 새 migration에서 정책을 DROP한다.

## 하지 말 것

- Next.js 15.x 설치 또는 업그레이드
- `getPublicUrl()` 사용
- 브라우저 코드에 `SUPABASE_SERVICE_ROLE_KEY`, Toss secret, Resend key, `PHONE_ENCRYPT_KEY`, VAPID private key 삽입
- 실제 `.env`, 서비스 키, DB 비밀번호, 테스트/운영 로그인 비밀번호를 Git·문서·이슈·로그에 기록
- 고객 이름/전화번호/이메일, 사용자 UUID, project ref를 핸드오프 문서에 기록
- API envelope 임의 변경
- `PLAN.md`의 ENUM/상수 값 임의 변경
- 기존 작업자의 관련 없는 변경을 삭제하거나 덮어쓰기
- 실제 원격 배포/DB 상태를 대시보드 확인 없이 완료로 단정

## 개발 서버

기본 포트:

- Web: 3000, `pnpm.cmd dev:web`
- API: 3001, `pnpm.cmd dev:api`

실행 전 포트 점유를 확인한다. 다른 프로젝트가 사용 중이면 무단 종료하거나 중복 실행하지 않는다.

```powershell
Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object LocalPort -in 3000,3001
```

PowerShell 실행 정책으로 `pnpm.ps1`이 차단되면 `pnpm.cmd`를 사용한다.

## 검증

루트에서:

```powershell
pnpm.cmd test:api
$env:PLAYWRIGHT_PORT='3100'; pnpm.cmd test:e2e; Remove-Item Env:PLAYWRIGHT_PORT
pnpm.cmd build
```

- 테스트/빌드에는 개발 서버를 별도로 띄울 필요가 없다.
- Playwright 기본 포트 3000에 다른 앱이 있으면 반드시 `PLAYWRIGHT_PORT`로 격리한다.
- 변경 범위에 맞는 테스트뿐 아니라 최종 전체 빌드를 실행한다.
- 2026-07-12 기준선은 API 77 tests, Web E2E 10 tests, build 3 tasks 통과다. 이후 숫자가 변하면 `HANDOFF.md`도 갱신한다.

## 배포 설정

- Vercel 프로젝트 Root Directory는 repository root `/`로 사용한다.
- root `vercel.json`의 Web output은 `apps/web/.next`다.
- Railway는 shared workspace와 root Dockerfile을 사용하므로 Root Directory를 repository root `/`로 둔다.
- Railway Serverless/App Sleeping을 끈다. API scheduler가 상시 실행되어야 한다.
- `APP_URL`은 API CORS origin이므로 최종 Web origin과 정확히 일치시키고 끝 `/`를 붙이지 않는다.
- 원격 서비스 변경 전 `docs/deploy.md`와 `docs/security-and-ownership.md`를 확인한다.

## PLAN 참조 매핑

- 프로젝트/모노레포: 2장
- 환경변수: 3장
- DB/마이그레이션: 5장
- RLS: 6장
- API 응답/엔드포인트: 7~8장
- 인증/가드: 9장
- NestJS 조립: 10장
- 가입: 11장
- 고객 접수: 12장
- 대시보드: 13장
- 매칭: 14장
- 통계: 15장
- 이미지: 16장
- Toss: 17장
- 이메일: 18장
- Phase 검증: 19장
- 관리자: 20장
