# LandNote 로컬 개발 및 테스트

이 문서는 새 PC에서 개발 환경을 재현하고, 실제 비밀값을 Git에 남기지 않은 채 로컬 검증까지 완료하는 절차입니다. Windows PowerShell 기준이며 저장소 루트에서 실행합니다.

## 1. 요구 도구

```powershell
node --version
pnpm.cmd --version
git --version
```

- Node.js 20 이상
- pnpm 8.x (`packageManager`는 8.15.0)
- Git
- 선택: Docker Desktop
- Web E2E 최초 1회: Playwright Chromium 설치

```powershell
pnpm.cmd install --frozen-lockfile
pnpm.cmd --filter @landnote/web exec playwright install chromium
```

`pnpm.ps1 cannot be loaded because running scripts is disabled`가 나오면 PowerShell 정책을 바꿀 필요 없이 `pnpm.cmd`를 사용합니다.

## 2. 환경변수 파일

템플릿을 복사합니다. 기존 실환경 파일이 있으면 덮어쓰지 않습니다.

```powershell
if (-not (Test-Path apps/api/.env)) {
  Copy-Item apps/api/.env.example apps/api/.env
}

if (-not (Test-Path apps/web/.env.local)) {
  Copy-Item apps/web/.env.local.example apps/web/.env.local
}
```

두 실환경 파일은 `.gitignore` 대상입니다. 값 자체를 문서, 이슈, 채팅, 스크린샷에 붙이지 않습니다.

### API: `apps/api/.env`

| 변수 | 로컬 예시/출처 | 공개 여부 | 현재 코드 사용 |
|---|---|---|---|
| `NODE_ENV` | `development` | 비밀 아님 | 런타임 관례 |
| `PORT` | `3001` | 비밀 아님 | API listen |
| `SUPABASE_URL` | Supabase Project URL | URL 자체는 비밀 아님 | 필수 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secret 또는 legacy service_role | 서버 비밀 | 필수 |
| `SUPABASE_ANON_KEY` | publishable 또는 legacy anon | 공개 가능 | PLAN 호환용, 현재 API 직접 사용 없음 |
| `TOSS_SECRET_KEY` | Toss 테스트 secret | 서버 비밀 | 결제 테스트 시 필수 |
| `RESEND_API_KEY` | Resend 개발 키 | 서버 비밀 | 메일 테스트 시 필수 |
| `RESEND_FROM_EMAIL` | 검증된 sender | 주소 공개 가능 | 이메일/Push subject |
| `PHONE_ENCRYPT_KEY` | 32 bytes -> 64 hex | 핵심 비밀 | 필수, 운영 키 재사용 금지 |
| `VAPID_PUBLIC_KEY` | VAPID 키 쌍의 public | 공개 가능 | Push 테스트 시 필요 |
| `VAPID_PRIVATE_KEY` | VAPID 키 쌍의 private | 서버 비밀 | Push 테스트 시 필요 |
| `APP_URL` | `http://localhost:3000` | 비밀 아님 | CORS, QR, 메일 링크 |
| `API_URL` | `http://localhost:3001` | 비밀 아님 | 예약/문서 호환, 현재 API 직접 사용 없음 |

개발용 키 생성:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
pnpm.cmd dlx web-push generate-vapid-keys
```

운영 `PHONE_ENCRYPT_KEY`를 로컬에 복사하는 대신 개발 DB와 개발 키를 사용합니다. 운영 키를 바꾸면 기존 암호화 전화번호를 복호화하지 못하므로 운영 키 회전은 데이터 재암호화 계획 없이 수행하면 안 됩니다.

### Web: `apps/web/.env.local`

| 변수 | 로컬 값/출처 | 공개 여부 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | API의 `SUPABASE_URL`과 같은 개발 프로젝트 | 브라우저 공개 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable 또는 legacy anon | 브라우저 공개 |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | 브라우저 공개 |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | Toss 테스트 client key | 브라우저 공개 |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | 브라우저 공개 |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | API의 `VAPID_PUBLIC_KEY`와 같은 값 | 브라우저 공개 |

`NEXT_PUBLIC_*`는 빌드 결과에 포함됩니다. 여기에 elevated/secret/private key를 절대 넣지 않습니다.

## 3. 개발 Supabase 준비

운영 프로젝트 대신 별도 개발 프로젝트 사용을 권장합니다.

### 3-1. 새 프로젝트

1. Supabase 조직에서 개발 프로젝트를 생성합니다.
2. Project URL, publishable/anon key, secret/service_role key를 각각 Web/API 파일에 넣습니다.
3. 운영 DB 비밀번호나 운영 키를 이 프로젝트에 재사용하지 않습니다.

### 3-2. 마이그레이션

새 빈 프로젝트에서만 SQL Editor로 아래 파일을 번호 순서대로 한 번씩 실행합니다.

```text
001_extensions.sql
002_types.sql
003_agents.sql
004_customer_inquiries.sql
005_property_listings.sql
006_matches.sql
007_billing.sql
008_stats_functions.sql
009_cleanup.sql
010_rls.sql
011_push_and_location.sql
012_admin.sql
013_agents_insert_policy.sql
```

기존 프로젝트라면 전체 재실행을 금지합니다. 먼저 적용 완료 번호를 확인합니다. 현재 저장소에는 자동 migration runner가 없고 SQL 일부는 재실행 시 `already exists` 오류가 날 수 있습니다.

`013_agents_insert_policy.sql`은 프로젝트의 서버 경유 원칙과 충돌할 수 있으므로 `HANDOFF.md`의 P0 항목을 읽고 운영 적용 여부를 별도로 결정합니다.

### 3-3. Storage

1. Storage에서 `landnote-media` 버킷을 생성합니다.
2. 반드시 private로 둡니다.
3. 공개 URL 설정을 켜지 않습니다.
4. 앱은 API를 통해 업로드하고 signed URL로 조회합니다.

### 3-4. Auth URL

- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/**`
- 이메일 확인을 켰다면 개발 중 실제 메일 전달 경로도 확인합니다.

### 3-5. 관리자 계정(선택)

관리자 화면을 테스트할 때만 개발용 Auth 사용자를 만든 뒤 `app_metadata.is_admin=true`와 `admin_users` 행을 설정합니다. 실제 이메일/비밀번호를 문서에 기록하지 않습니다. 절차의 스키마 근거는 `supabase/migrations/012_admin.sql`과 `docs/PLAN.md` 20장입니다.

## 4. 서버 실행

먼저 포트를 확인합니다.

```powershell
Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object LocalPort -in 3000,3001 |
  Select-Object LocalAddress,LocalPort,OwningProcess
```

다른 프로젝트가 포트를 사용 중이면 무단 종료하지 않습니다. 해당 작업을 정리하거나 LandNote 환경변수와 실행 포트를 함께 변경합니다. `APP_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`도 실제 포트와 일치해야 합니다.

터미널 1:

```powershell
pnpm.cmd dev:api
```

터미널 2:

```powershell
pnpm.cmd dev:web
```

기대 주소:

- Web: `http://localhost:3000`
- API: `http://localhost:3001`
- 보호 API liveness: `GET http://localhost:3001/auth/me` -> envelope 형태의 예상 `401`

현재 별도 공개 health route는 없습니다. `401`은 보호 라우트가 응답한다는 수동 확인일 뿐 서비스 healthcheck용 `200` endpoint는 아닙니다.

## 5. 자동 검증

### 5-1. API Jest

```powershell
pnpm.cmd test:api -- --runInBand
```

2026-07-12 기준 기대 결과: 8 suites, 77 tests 통과.

### 5-2. Web Playwright smoke

기본 포트 3000이 비어 있으면:

```powershell
pnpm.cmd test:e2e
```

3000이 다른 프로젝트에서 사용 중이면 격리 포트를 지정합니다.

```powershell
$env:PLAYWRIGHT_PORT='3100'
pnpm.cmd test:e2e
Remove-Item Env:PLAYWRIGHT_PORT
```

이미 실행 중인 LandNote Web을 재사용하려면:

```powershell
$env:PLAYWRIGHT_BASE_URL='http://localhost:3000'
pnpm.cmd test:e2e
Remove-Item Env:PLAYWRIGHT_BASE_URL
```

`reuseExistingServer`는 해당 포트의 앱이 LandNote인지 확인하지 않습니다. 다른 앱을 재사용하면 테스트 결과가 무효입니다. 2026-07-12 기준 기대 결과: 10 tests 통과.

### 5-3. 전체 빌드

```powershell
pnpm.cmd build
```

기대 결과: shared, API, Web 3 tasks 성공. Web 빌드는 `.env.local` 값을 사용하므로 개발용 값이 올바르게 들어 있어야 합니다.

### 5-4. 한 번에 기본 검증

```powershell
pnpm.cmd verify
```

`verify`는 API 테스트와 전체 빌드를 실행합니다. E2E는 포트 조건과 브라우저 설치가 필요하므로 별도로 실행합니다.

## 6. 실제 서비스 통합 테스트

자동 smoke는 실제 Supabase/Toss/Resend/Web Push 전체를 보장하지 않습니다. staging에서 아래를 수동 검증합니다.

- 가입 -> 로그인 -> 플랜 선택 -> 테스트 카드 등록
- 공개 폼 -> 문의 생성 -> 전화번호가 DB에서 암호문인지 확인
- private 이미지 업로드 -> DB에는 path -> UI에는 signed URL
- 문의/매물 CRUD -> 매칭 생성 -> 통계 반영
- 서로 다른 중개사 2명으로 타 사용자 데이터 격리
- 관리자 로그인 -> 일반 중개사 토큰의 관리자 API 거부
- 신규 문의 메일과 Web Push
- scheduler의 trial 만료, 결제 재시도, 로그 정리

테스트 계정 값과 고객 샘플 개인정보는 저장소에 적지 말고 staging 비밀번호 관리자에 보관합니다.

## 7. Docker로 API 검증

3001이 비어 있을 때:

```powershell
docker build -t landnote-api:local .
docker run --rm -p 3001:3001 --env-file apps/api/.env landnote-api:local
```

다른 프로세스가 3001을 사용하면 호스트 포트만 바꿉니다.

```powershell
docker run --rm -p 3101:3001 --env-file apps/api/.env landnote-api:local
```

확인:

```powershell
curl.exe -i http://localhost:3101/auth/me
```

예상 상태는 `HTTP/1.1 401`이고 body는 `{ "ok": false, "error": ... }` 형식입니다.

## 8. 자주 발생하는 문제

| 증상 | 확인 |
|---|---|
| `pnpm.ps1` 실행 차단 | `pnpm.cmd` 사용 |
| Web이 다른 앱 화면을 보임 | 3000 PID/CommandLine 확인, E2E는 `PLAYWRIGHT_PORT` 사용 |
| CORS 오류 | API `APP_URL`과 브라우저 origin이 정확히 같은지 확인, 끝 `/` 제거 |
| API env undefined | 파일 위치가 `apps/api/.env`인지 확인 |
| Supabase auth redirect가 localhost/오류 | Auth Site URL/Redirect URLs 확인 |
| 이미지 URL 404 | private bucket인지, path 저장/signed URL 흐름인지 확인 |
| 전화번호 복호화 오류 | 같은 DB에 사용한 `PHONE_ENCRYPT_KEY`인지 확인 |
| shared import 오류 | `pnpm.cmd --filter @landnote/shared build` 후 재시작 |
| Playwright browser 없음 | `pnpm.cmd --filter @landnote/web exec playwright install chromium` |
