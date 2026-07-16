# LandNote 배포 런북

대상 구성: Supabase(DB/Auth/private Storage) -> Railway(NestJS API/Docker/scheduler) -> Vercel(Next.js Web).

현재 연결된 production 계정이나 프로젝트는 없습니다. 이 문서는 새 작업자가 자신의 계정으로 staging과 production을 처음부터 만드는 기준입니다. Drive 전달 범위는 `docs/security-and-ownership.md`를 따릅니다. 대시보드 UI와 요금제는 바뀔 수 있으므로 실행 직전 공식 문서를 함께 확인합니다.

## 1. 배포 원칙

- 개인 계정 비밀번호를 공유하지 않고 제품용 Organization/Team/Workspace에서 운영합니다.
- staging과 production의 Supabase, Railway, Vercel, Toss, Resend 키를 분리합니다.
- API를 먼저 배포해 URL을 얻고, Web에 연결한 뒤 최종 Web URL을 API `APP_URL`에 되돌려 설정합니다.
- `NEXT_PUBLIC_*`는 빌드 시 포함되므로 값 변경 후 Vercel을 재배포합니다.
- Railway Serverless/App Sleeping은 끕니다. 이 API에는 결제·만료·로그 정리 scheduler가 있습니다.
- production DB에는 SQL을 처음부터 다시 실행하지 않습니다. 실제 적용 완료 migration 번호를 확인합니다.

## 2. 배포 전 로컬 확인

```powershell
git status --short
pnpm.cmd install --frozen-lockfile
pnpm.cmd test:api -- --runInBand
$env:PLAYWRIGHT_PORT='3100'; pnpm.cmd test:e2e; Remove-Item Env:PLAYWRIGHT_PORT
pnpm.cmd build
docker build -t landnote-api:preflight .
```

배포 대상 커밋과 브랜치를 기록합니다.

```powershell
git branch --show-current
git rev-parse HEAD
git remote -v
```

확인 체크리스트:

- [ ] API 77 tests, Web E2E 10 tests, 전체 build가 통과한다.
- [ ] Docker image가 빌드된다.
- [ ] `.env`, DB dump, 인증서, 실제 키가 Git 추적 대상이 아니다.
- [ ] `supabase/migrations/`의 마지막 번호와 원격 DB 적용 번호를 안다.
- [ ] `013_agents_insert_policy.sql`의 운영 적용 여부를 승인했다.
- [ ] 새 작업자가 자신의 GitHub와 외부 서비스 계정을 준비했다.

## 3. 환경변수 전체 맵

### Railway API

| 변수 | 필수 | 값/발급처 | 주의 |
|---|---|---|---|
| `NODE_ENV` | 예 | `production` | |
| `PORT` | 자동 | Railway가 주입 | 가능하면 수동 고정하지 않음 |
| `SUPABASE_URL` | 예 | Supabase Project URL | |
| `SUPABASE_SERVICE_ROLE_KEY` | 예 | secret 또는 legacy service_role | 서버 전용, RLS 우회 |
| `SUPABASE_ANON_KEY` | 호환 | publishable 또는 legacy anon | 현재 API 직접 사용 없음 |
| `TOSS_SECRET_KEY` | 결제 시 | Toss secret | 서버 전용 |
| `RESEND_API_KEY` | 메일 시 | Resend API key | 서버 전용 |
| `RESEND_FROM_EMAIL` | 예 | 검증된 sender | VAPID subject에도 사용 |
| `PHONE_ENCRYPT_KEY` | 예 | 64 hex | 운영 데이터가 있으면 단순 교체 금지 |
| `VAPID_PUBLIC_KEY` | Push 시 | VAPID pair public | Web 값과 동일 |
| `VAPID_PRIVATE_KEY` | Push 시 | VAPID pair private | 서버 전용 |
| `APP_URL` | 예 | 최종 Vercel/커스텀 Web URL | CORS origin, 끝 `/` 금지 |
| `API_URL` | 호환 | 최종 Railway/API URL | 현재 API 직접 사용 없음 |

### Vercel Web

| 변수 | 필수 | 값/발급처 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 예 | Railway의 `SUPABASE_URL`과 같은 프로젝트 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 예 | Supabase publishable/anon |
| `NEXT_PUBLIC_API_URL` | 예 | Railway public HTTPS URL, 끝 `/` 금지 |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | 결제 시 | Toss client key, API secret과 같은 환경 |
| `NEXT_PUBLIC_APP_URL` | 예 | 최종 Web URL, 끝 `/` 금지 |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Push 시 | API의 `VAPID_PUBLIC_KEY`와 동일 |

Vercel에는 `SUPABASE_SERVICE_ROLE_KEY`, `TOSS_SECRET_KEY`, `RESEND_API_KEY`, `PHONE_ENCRYPT_KEY`, `VAPID_PRIVATE_KEY`를 넣지 않습니다.

## 4. Supabase

공식 참고:

- API keys: <https://supabase.com/docs/guides/getting-started/api-keys>
- Auth redirect URLs: <https://supabase.com/docs/guides/auth/redirect-urls>
- Private Storage: <https://supabase.com/docs/guides/storage/buckets/fundamentals>
- Production checklist: <https://supabase.com/docs/guides/deployment/going-into-prod>

### 4-1. 프로젝트 생성

1. 제품 Organization을 선택하거나 생성합니다.
2. staging 프로젝트를 먼저 만들고 region과 DB password를 정합니다.
3. DB password는 제품 비밀번호 관리자에 저장합니다.
4. Project URL과 두 종류의 키를 확인합니다.

키 매핑:

- 브라우저: publishable key 권장, legacy 프로젝트는 anon key 가능
- API: secret key 권장, legacy 프로젝트는 service_role key 가능

코드의 변수명은 호환성을 위해 `NEXT_PUBLIC_SUPABASE_ANON_KEY`와 `SUPABASE_SERVICE_ROLE_KEY`를 유지하지만 권한 수준이 맞는 새 키를 넣을 수 있습니다.

### 4-2. DB migration 적용

현재 저장소에는 Supabase CLI 설정/자동 원격 migration 이력이 없으므로, 새 빈 프로젝트는 Dashboard SQL Editor에서 아래 순서로 한 파일씩 실행합니다.

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

각 실행 후 파일명, 실행 시각, 실행자, 결과를 저장소 밖 migration 기록에 남깁니다.

production 또는 기존 staging:

1. 백업/PITR 가능 상태를 확인합니다.
2. 이미 적용된 마지막 번호를 운영 기록과 실제 schema로 대조합니다.
3. 누락된 다음 번호만 실행합니다.
4. 실패하면 같은 파일을 무조건 재실행하지 말고 부분 적용 여부를 확인합니다.

`013_agents_insert_policy.sql`은 authenticated 사용자의 자기 agents 행 INSERT를 허용합니다. 서버 elevated key만 agents를 생성한다는 프로젝트 원칙과 충돌하므로 production 적용 전에 승인하고, 제거 결정 시 새 `014` migration으로 DROP합니다.

### 4-3. private Storage

1. Storage -> New bucket에서 `landnote-media`를 생성합니다.
2. public 옵션은 끕니다.
3. 파일 크기/MIME 제한은 `docs/PLAN.md` 16장과 맞춥니다.
4. 앱에서 업로드 후 DB에는 path만 저장되는지 확인합니다.
5. 조회 URL이 `createSignedUrl` 결과인지 확인합니다.

private bucket은 인증 또는 시간 제한 signed URL로만 내려받아야 합니다. `getPublicUrl()`을 사용하지 않습니다.

### 4-4. Auth

staging:

- Site URL: staging Vercel URL
- Redirect URLs: `http://localhost:3000/**`, staging URL의 필요한 경로

production:

- Site URL: 최종 production Web URL
- Redirect URLs: production의 정확한 callback 경로를 우선 사용

Vercel Preview wildcard는 개발 편의용으로만 사용하고 production은 가능한 정확한 URL을 등록합니다. 현재 가입은 API가 admin createUser + `email_confirm: true`로 처리하므로 일반 email-confirm 흐름과 다르다는 점도 테스트합니다.

### 4-5. 관리자 계정

관리자가 필요하면 Auth 사용자를 만든 뒤 `app_metadata.is_admin=true`와 `admin_users` 행을 설정합니다. 값과 SQL 결과에 실제 이메일/UUID가 포함되므로 저장소에 복사하지 않습니다. 스키마는 `012_admin.sql`, 인증 흐름은 `docs/PLAN.md` 20장을 따릅니다.

### 4-6. Supabase 검증

- [ ] 001~마지막 승인 migration이 실제 적용되었다.
- [ ] 모든 앱 테이블의 RLS 상태와 정책을 확인했다.
- [ ] 다른 중개사 2명으로 SELECT/UPDATE/DELETE 격리를 확인했다.
- [ ] `landnote-media`가 private이다.
- [ ] 브라우저 key로 elevated 작업을 할 수 없다.
- [ ] Auth Site URL/Redirect URLs가 staging/production과 일치한다.
- [ ] Security Advisor 경고를 검토했다.

## 5. Railway API

공식 참고:

- Shared monorepo: <https://docs.railway.com/deployments/monorepo>
- Dockerfile: <https://docs.railway.com/builds/dockerfiles>
- Public networking/PORT: <https://docs.railway.com/public-networking>
- Serverless: <https://docs.railway.com/deployments/serverless>

### 5-1. 서비스 생성

1. 제품 Workspace에서 새 project를 만듭니다.
2. GitHub repository와 배포 브랜치를 연결합니다.
3. API 서비스 하나만 남깁니다. 자동으로 Web 서비스가 staging되면 Vercel에서 배포할 것이므로 제거합니다.
4. 이 저장소는 shared workspace 의존성이 있는 monorepo이므로 service Root Directory는 repository root `/`로 둡니다.
5. 루트 `railway.json`과 `Dockerfile`을 사용하도록 확인합니다.

Docker build context를 `apps/api`로 줄이면 `packages/shared`, root lockfile, workspace 파일을 읽지 못해 빌드가 깨집니다.

### 5-2. 변수 입력

Railway Variables에 3장의 API 변수만 넣습니다. 실제 값은 대시보드 또는 비밀번호 관리자에서 직접 복사합니다.

첫 배포 전 `APP_URL`은 임시 staging Web URL 또는 `https://pending.invalid`로 둘 수 있습니다. API가 기동한 뒤 Vercel URL을 확정하고 즉시 실제 값으로 교체해야 브라우저 CORS가 동작합니다.

Railway가 `PORT`를 제공하므로 앱은 `process.env.PORT`로 listen합니다. 현재 `main.ts`가 이를 사용합니다.

### 5-3. 배포와 domain

1. 배포 로그에서 root Dockerfile 사용을 확인합니다.
2. build에서 shared -> API가 성공하는지 확인합니다.
3. Settings -> Networking -> Public Networking에서 Generate Domain을 실행합니다.
4. 발급된 `https://...up.railway.app` URL을 `API_URL`과 Vercel `NEXT_PUBLIC_API_URL`에 사용합니다.
5. custom domain이면 Railway가 제시하는 CNAME/TXT를 DNS에 모두 추가합니다.

### 5-4. scheduler와 재시작

- Settings -> Deploy -> Serverless는 비활성화합니다.
- `railway.json`은 `ON_FAILURE`, 최대 3회 재시작입니다.
- 결제, trial 만료, 재시도, 취소 정리, access log 정리 scheduler가 실제 로그에 나타나는지 확인합니다.
- 사용량 alert/hard limit을 설정하되, hard limit 도달로 API/scheduler가 중단될 수 있음을 운영자가 알아야 합니다.

### 5-5. API 확인

현재 공개 `200` health endpoint가 없으므로 수동 확인은 보호 라우트의 예상 `401`을 사용합니다.

```powershell
$api = 'https://YOUR_API_DOMAIN'
try {
  Invoke-WebRequest "$api/auth/me"
} catch {
  $_.Exception.Response.StatusCode.value__
}
```

예상: `401`. Envelope body가 `{ ok: false, error: ... }`인지 로그/응답에서 확인합니다. Railway healthcheck path에는 `200` route가 생기기 전까지 `/auth/me`를 설정하지 않습니다.

## 6. Vercel Web

공식 참고:

- Monorepos: <https://vercel.com/docs/monorepos>
- `vercel.json`: <https://vercel.com/docs/project-configuration/vercel-json>

### 6-1. 프로젝트 생성

이 저장소는 루트 `vercel.json`이 shared와 Web을 함께 빌드하도록 구성되어 있으므로 아래 한 방식으로 통일합니다.

- Git repository: LandNote repository
- Root Directory: `/` (repository root)
- Framework Preset: Next.js
- Build Command: `pnpm turbo build --filter=@landnote/web...`
- Output Directory: `apps/web/.next`
- Install Command: `pnpm install`

대시보드에서 Build/Output override를 별도로 바꾸지 말고 root `vercel.json`과 표시 값이 일치하는지 확인합니다. Root Directory를 `apps/web`으로 바꾸면 루트 설정 파일 경로와 output 경로 의미가 달라지므로 이 런북과 섞지 않습니다.

### 6-2. 변수와 환경 구분

3장의 Web 변수 6개를 입력합니다.

- Production은 production Supabase/Railway/Toss를 사용합니다.
- Preview는 별도 staging 리소스를 사용하거나 외부 기능 없는 UI preview로 제한합니다.
- production elevated key는 Preview에 넣지 않습니다.

현재 API CORS는 `APP_URL` 한 origin만 허용합니다. 따라서 임의 Vercel Preview URL에서 production API 호출은 CORS로 막히는 것이 정상입니다. Preview 통합이 필요하면 PLAN에 CORS allowlist를 먼저 정의하고 구현합니다.

### 6-3. 첫 배포

1. Deploy를 실행합니다.
2. build 로그에서 shared와 Web build 성공을 확인합니다.
3. 발급된 production URL을 기록합니다.
4. Vercel `NEXT_PUBLIC_APP_URL`을 이 URL로 확정합니다.
5. Railway `APP_URL`을 같은 URL로 확정합니다.
6. 두 서비스 모두 재배포합니다.

`APP_URL`/`NEXT_PUBLIC_APP_URL`에는 끝 `/`를 붙이지 않습니다.

## 7. URL 교차 설정

최종 상태 예시:

```text
Railway
  APP_URL=https://web.example.com
  API_URL=https://api.example.com

Vercel
  NEXT_PUBLIC_APP_URL=https://web.example.com
  NEXT_PUBLIC_API_URL=https://api.example.com

Supabase Auth
  Site URL=https://web.example.com
  Redirect URLs=http://localhost:3000/** + 필요한 staging/production URL
```

변경 순서:

1. Railway Public Domain 확정
2. Vercel `NEXT_PUBLIC_API_URL` 설정 후 deploy
3. Vercel production URL 확정
4. Railway `APP_URL` 설정 후 redeploy
5. Vercel `NEXT_PUBLIC_APP_URL` 설정 후 redeploy
6. Supabase Auth URL 설정
7. 로그인/CORS/결제 callback 검증

## 8. custom domain

권장 예:

```text
web.example.com 또는 example.com -> Vercel
api.example.com                  -> Railway
mail.example.com                 -> Resend용 DNS
```

1. Vercel Domains에 Web domain을 추가하고 안내 DNS를 설정합니다.
2. Railway Public Networking에 API custom domain을 추가하고 안내 CNAME/TXT를 모두 설정합니다.
3. Resend에서 sender domain을 검증합니다.
4. 모든 URL 환경변수와 Supabase Auth URL을 custom domain으로 교체합니다.
5. Vercel/Railway를 재배포합니다.
6. 브라우저에서 TLS, CORS, callback을 다시 검증합니다.

플랫폼이 TLS 인증서를 자동 발급하더라도 DNS 검증이 끝나기 전에 production 전환하지 않습니다.

## 9. 배포 후 검증

### 인프라

- [ ] Vercel production deploy가 대상 commit이다.
- [ ] Railway deployment가 같은 commit이다.
- [ ] API는 예상 `401` envelope로 응답하고 Railway logs에 crash loop가 없다.
- [ ] Railway Serverless가 꺼져 있고 scheduler 로그가 확인된다.
- [ ] Supabase migration/RLS/Storage/Auth 설정을 확인했다.

### 제품 흐름

- [ ] 랜딩/가격/약관/개인정보 페이지
- [ ] 가입 -> 플랜 -> 테스트 카드 -> 완료
- [ ] 로그인/로그아웃/세션 갱신
- [ ] 공개 고객 접수와 private 이미지
- [ ] 문의/매물 CRUD와 타 계정 격리
- [ ] 매칭과 통계
- [ ] 이메일과 Web Push
- [ ] 관리자 로그인/권한 분리/감사 로그

### 결제

- [ ] Toss staging/test key가 Web/API에서 한 쌍이다.
- [ ] 성공, 실패, 재시도, 만료, 해지, 업/다운그레이드를 검증했다.
- [ ] live 전환은 사업자/정산/약관 승인 후 별도 변경으로 진행한다.

## 10. 배포와 롤백 운영

권장 흐름:

```text
feature branch -> pull request -> CI build/test -> staging -> 승인 -> main -> production
```

롤백 시 데이터베이스와 앱을 분리해서 판단합니다.

- Web/API 코드: Vercel/Railway에서 이전 성공 deployment를 재배포할 수 있습니다.
- DB: destructive down migration을 즉흥 실행하지 않습니다. forward fix migration을 우선 검토합니다.
- 환경변수: 이전 값 복구가 필요한 경우 비밀번호 관리자 version과 변경 이력을 사용합니다.
- secret 유출: 코드 롤백만으로 해결되지 않습니다. 발급처에서 키를 회전하고 모든 배포를 갱신합니다.

장애 기록에는 secret/PII 대신 시각, commit, deployment ID, 증상, 영향 범위, 조치만 남깁니다.

## 11. 새 작업자의 production 구축 완료 조건

- [ ] 새 작업자가 자신의 GitHub/Vercel/Railway/Supabase/Resend/Toss/DNS를 생성했다.
- [ ] 모든 `.env`와 대시보드 변수는 새 작업자가 발급한 값이다.
- [ ] 새 `PHONE_ENCRYPT_KEY`와 VAPID pair를 생성하고 안전하게 보관했다.
- [ ] migration 적용 번호, 백업, RLS, Storage 상태가 기록되었다.
- [ ] staging 전체 플로우와 production smoke가 통과했다.
- [ ] 다른 사람의 계정, project ref, secret, 고객 데이터 없이 독립적으로 운영된다.
