# LandNote 인수인계 현황

기준일: 2026-07-17

이 문서는 과거 작업 로그가 아니라 다음 작업자가 바로 판단할 수 있는 현재 기준입니다. 원격 서비스 상태는 대시보드 접근 없이 추정하지 않습니다.

## 1. 한 줄 상태

주요 제품 기능과 배포 설정은 코드에 구현되어 있고 로컬 API 테스트·Web 스모크 테스트·전체 빌드는 통과합니다. 현재 Vercel/Railway/Supabase 등 외부 서비스와 운영 데이터는 구성되어 있지 않으며, 새 작업자가 자신의 계정으로 처음부터 생성해 배포합니다.

## 2. 이번 점검에서 직접 확인한 사실

| 항목 | 결과 | 검증 방법 |
|---|---|---|
| API 테스트 | 통과, 8 suites / 77 tests | `pnpm.cmd test:api -- --runInBand` |
| Web E2E smoke | 통과, 10 tests | `PLAYWRIGHT_PORT=3100` 격리 실행 |
| 전체 빌드 | 통과, 3 packages | `pnpm.cmd build` |
| Railway API image | Docker build 통과 | `docker build -t landnote-api:handoff-check .` |
| Railway API runtime | 컨테이너 기동, `/auth/me` 예상 401 envelope | host 3101 격리 실행 후 컨테이너 제거 |
| Next.js | 14.2.35 빌드 확인 | 빌드 로그 |
| DB SQL 파일 | 001~013 존재 | `supabase/migrations/` 파일 확인 |
| 실제 비밀값 Git 추적 | 탐지되지 않음 | 추적 파일 대상 키 패턴 검사 |
| 로컬 실환경 파일 | 존재하지만 Git ignore 상태 | `apps/api/.env`, `apps/web/.env.local` 추적 여부 확인 |
| 원격 배포/DB | 확인하지 않음 | Vercel/Railway/Supabase 대시보드 접근 없음 |
| 매칭 센터 | 양방향 UI (고객/매물 탭) 및 자동 매칭 연동 | 로컬 테스트 완료 및 Git Push |

처음 E2E 실행은 포트 3000의 다른 프로젝트를 재사용해 잘못 실패했습니다. `apps/web/playwright.config.ts`가 `PLAYWRIGHT_PORT`를 받도록 보완한 뒤 3100 포트의 LandNote 서버에서 10개 모두 통과했습니다.

처음 Docker build에서는 source COPY 후 pnpm workspace 링크가 사라져 shared TypeScript 실행 파일을 찾지 못했습니다. builder 단계에서 `pnpm install --frozen-lockfile`로 링크를 재구성하도록 수정한 뒤 실제 image build가 통과했습니다.

## 3. 구현되어 있는 영역

코드 존재와 로컬 테스트/빌드 기준이며, 실제 결제·메일·푸시·운영 DB 통합 성공을 의미하지는 않습니다.

- 공개 마케팅, 가격, 약관, 개인정보처리방침
- Supabase Auth 기반 가입/로그인과 4단계 온보딩 (로그인 유지 확인)
- 중개사 프로필, 카테고리, QR/링크
- 고객 공개 접수 폼과 이미지 업로드 (접수 시 자동 매칭 트리거 구현)
- 문의·매물 CRUD와 구독 보호
- 점수 기반 문의/매물 양방향 매칭 시스템 구축 (매칭 센터 탭 분리 UI 완성)
- 통계 대시보드와 RPC 함수 (허수 데이터 정리 완료)
- Toss 빌링 로직과 NestJS 스케줄러
- Resend 이메일과 VAPID Web Push
- PWA와 TanStack Query 캐싱
- 별도 관리자 인증, 중개사/수익/접속 통계 화면과 API
- Vercel, Railway Docker, GitHub Actions용 설정 파일

## 4. 현재 아키텍처와 책임 경계

| 영역 | 위치 | 운영 대상 |
|---|---|---|
| Web | `apps/web` | Vercel |
| API + scheduler | `apps/api` | Railway Docker, 상시 실행 |
| 공통 상수/타입 | `packages/shared` | Web/API 빌드에 포함 |
| DB/Auth/Storage | `supabase/migrations` + Supabase | Supabase 프로젝트 |
| 제품·기술 명세 | `docs/PLAN.md` | 변경 전 필수 확인 |
| 실제 현재 상태 | 이 문서 | 확인할 때마다 갱신 |

브라우저는 Supabase publishable/anon 키와 `NEXT_PUBLIC_*`만 사용합니다. Elevated Supabase 키, Toss secret, Resend key, 전화번호 암호화 키, VAPID private key는 Railway API에만 둡니다.

## 5. 데이터베이스

저장소의 순서는 다음과 같습니다.

```text
001 extensions
002 enum types
003 agents
004 customer inquiries
005 property listings
006 matches
007 billing
008 stats RPC
009 cleanup
010 RLS
011 push/location
012 admin
013 agents INSERT policy
```

주의사항:

- 이 SQL들은 대체로 재실행 안전성이 보장되지 않습니다. 기존 DB에 처음부터 다시 실행하지 않습니다.
- 저장소에는 자동 migration runner와 원격 적용 이력 파일이 없습니다. Supabase SQL Editor나 별도 운영 기록으로 실제 마지막 적용 번호를 확인해야 합니다.
- 다음 신규 마이그레이션 번호는 `014`입니다.
- `013_agents_insert_policy.sql`은 인증 사용자의 자기 행 INSERT를 허용합니다. 이는 프로젝트 규칙의 “agents 생성은 서버 elevated key 경유”와 충돌하므로 배포 전에 정책 필요성을 재검토해야 합니다. 제거하기로 결정하면 기존 파일을 수정하지 말고 `014`에서 `agents_insert_own` 정책을 DROP하는 방식으로 처리합니다.
- `landnote-media` 버킷은 private이어야 하며 DB에는 object path만 저장합니다.

## 6. 배포 상태

저장소에 아래 설정은 있습니다.

- `vercel.json`: 루트에서 Web과 shared를 빌드하고 `apps/web/.next`를 출력
- `Dockerfile`: shared와 API를 빌드하는 multi-stage 이미지
- `railway.json`: Dockerfile builder와 실패 재시작 정책
- `.github/workflows/deploy.yml`: Node 20, pnpm 8, build + API test

확인하지 못한 항목:

- GitHub 원격 저장소와 Actions의 현재 성공 상태
- Vercel 프로젝트 연결, 프로덕션/Preview 환경변수, 도메인
- Railway 서비스 연결, 변수, Public Domain, Serverless 비활성 상태
- Supabase 조직 소유권, 적용 migration, Auth URL, Storage bucket/RLS
- Toss 라이브 상점 승인과 실결제 키
- Resend 발신 도메인 인증

따라서 후속 작업자는 `docs/deploy.md`의 사전 점검부터 실행하고 체크 결과를 이 문서에 날짜와 함께 반영해야 합니다.

## 7. 가장 중요한 위험과 미완료 작업

### P0 — 배포 전에 확인

1. **신규 인프라 방침 확정**: 현재 연결된 외부 서비스가 없으므로 새 작업자가 자신의 계정으로 전부 신규 생성합니다.
2. **Drive 전달 파일**: 원본 폴더가 아니라 `pnpm.cmd handoff:zip`으로 만든 ZIP만 공유합니다.
3. **013 RLS 정책 검토**: 클라이언트 직접 agents INSERT 금지 원칙과 충돌합니다.
4. **새 Supabase 적용 기록**: 빈 프로젝트에 실행한 migration 번호와 결과를 새 작업자가 기록합니다.

### P1 — 런칭 전 검증

1. staging Supabase/Railway/Vercel로 전체 플로우를 한 번 배포합니다.
2. 가입 → 카드 등록 → 고객 접수 → 이미지 → 문의/매물 → 매칭 → 관리자 흐름을 실제 외부 서비스와 검증합니다.
3. Toss 성공·실패·재시도·만료·다운그레이드 시나리오를 테스트합니다.
4. Resend 발신 도메인, Web Push 권한/구독, Railway scheduler 로그를 확인합니다.
5. 두 계정으로 RLS 데이터 격리를 확인합니다.

### P2 — 운영성 개선 후보

1. Railway용 공개 `200 OK` health endpoint를 PLAN에 추가한 뒤 구현합니다. 현재 문서의 수동 liveness 확인은 보호 라우트의 예상 `401`을 사용합니다.
2. API CORS가 `APP_URL` 한 개만 허용하므로 Vercel Preview를 실제 API와 연결하려면 명시적 허용 목록 설계가 필요합니다.
3. SQL 수동 적용 대신 Supabase CLI 기반 migration 이력/CI를 도입할지 결정합니다.
4. 현재 Web E2E는 UI smoke 중심입니다. 별도 staging 데이터로 실제 DB E2E를 추가합니다.

## 8. 다음 작업자가 시작하는 순서

1. `README.md`와 이 문서를 읽습니다.
2. `docs/security-and-ownership.md`에서 Drive ZIP의 포함/제외 범위를 확인합니다.
3. `docs/local-development.md`로 개인 개발 환경을 만들고 세 검증을 재실행합니다.
4. 자신의 Supabase/Railway/Vercel/Toss/Resend 계정을 새로 만듭니다.
5. `docs/deploy.md`로 자신의 staging을 먼저 배포합니다.
6. 013 정책을 검토하고 전체 흐름을 검증한 뒤 자신의 production과 도메인을 연결합니다.

## 9. 인수인계 시 금지되는 정보

이 저장소나 문서에 아래 값을 다시 적지 않습니다.

- Supabase project ref, DB password, elevated key
- 실제 로그인 이메일/비밀번호, 사용자/에이전트 UUID
- 고객 이름, 전화번호, 이메일, 문의 ID
- Toss/Resend/VAPID private/전화번호 암호화 키
- 개인 결제수단, 개인 계정 복구 정보

필요한 것은 값 자체가 아니라 변수명, 발급 위치, 소유 역할, 회전 여부입니다. 실제 전달은 프로젝트용 비밀번호 관리자나 각 서비스의 조직 초대 기능을 사용합니다.
