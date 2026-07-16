# Drive 전달과 신규 인프라 원칙

이 프로젝트의 현재 상태와 인수인계 방침은 다음과 같습니다.

- 현재 Vercel, Railway, Supabase, Toss Payments, Resend, 도메인/DNS 운영 계정이나 프로젝트는 생성·연결되어 있지 않습니다.
- 새 작업자가 자신의 계정 또는 자신의 조직에서 모든 외부 서비스를 새로 생성합니다.
- 전달자는 소스 코드, DB migration, 문서, 환경변수 example만 전달합니다.
- 실제 `.env`, secret, DB dump, 고객 데이터는 전달 패키지에 포함하지 않습니다.

## 1. Drive에 원본 폴더를 그대로 올리면 안 되는 이유

`.gitignore`는 Git commit 대상만 제어합니다. Google Drive의 폴더 동기화, 파일 복사, Windows ZIP은 `.gitignore`를 읽지 않습니다.

현재 개발 폴더처럼 실제 `apps/api/.env`와 `apps/web/.env.local`이 존재하는 상태에서 폴더 전체를 Drive에 올리면 해당 파일도 함께 전달됩니다. `node_modules`, `.next`, `.git` 같은 불필요한 대용량 파일도 같이 들어갈 수 있습니다.

따라서 원본 폴더가 아니라 저장소에서 제공하는 안전 ZIP을 전달합니다.

## 2. Drive 전달용 ZIP 생성

저장소 루트의 PowerShell에서:

```powershell
pnpm.cmd handoff:zip
```

기본 결과:

```text
C:\Users\...\Desktop\code\landnote-handoff.zip
```

원하는 경로를 직접 지정하려면:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass `
  -File scripts/create-handoff.ps1 `
  -OutputPath 'D:\공유\landnote-handoff.zip' `
  -Force
```

이 ZIP을 Drive에 올립니다. 원본 `landnote` 폴더는 공유하지 않습니다.

## 3. ZIP에 포함되는 것

- `apps/web`, `apps/api` 소스
- `packages/shared`
- `supabase/migrations/001~013`
- `README.md`, `GUIDE.md`, `HANDOFF.md`
- `AGENTS.md`, `CLAUDE.md`
- `docs/` 전체
- `Dockerfile`, `vercel.json`, `railway.json`
- `.github/workflows/`와 프로젝트 설정
- `apps/api/.env.example`
- `apps/web/.env.local.example`
- `HANDOFF_PACKAGE.txt`

## 4. ZIP에서 자동 제외되는 것

- 실제 `.env`, `.env.local`, `.env.production` 등
- Supabase elevated key, Toss secret, Resend key, VAPID private key가 들어갈 수 있는 credential 파일
- `.git`과 개인 Git 이력/설정
- `node_modules`, `.next`, `dist`, `.turbo`
- Playwright 결과, coverage, 로그
- 인증서/private key 파일
- DB dump/backup/SQLite 파일
- `tmp_*.html`과 ZIP 파일
- IDE/로컬 서비스 상태 폴더

환경변수 example은 값이 없는 템플릿이므로 포함됩니다.

## 5. 새 작업자가 직접 만들어야 하는 것

새 작업자는 전달 ZIP을 푼 뒤 다음을 자신의 계정으로 생성합니다.

| 서비스 | 새 작업자가 할 일 |
|---|---|
| GitHub | 새 repository 생성 후 전달 코드를 push |
| Supabase | 새 project 생성, migration 001~013 검토/실행, private bucket/Auth 설정 |
| Railway | 새 API service 생성, root Dockerfile 배포, 자기 환경변수 입력 |
| Vercel | 새 Web project 생성, Railway/Supabase URL 연결 |
| Toss Payments | 자신의 테스트 client/secret key 발급 |
| Resend | 자신의 API key와 sender 설정 |
| VAPID | 새 key pair 생성 |
| 전화번호 암호화 | 새 `PHONE_ENCRYPT_KEY` 생성 |
| 도메인/DNS | 필요하면 자신의 도메인을 구매하고 직접 연결 |

세부 순서는 `docs/deploy.md`를 따릅니다.

## 6. 별도로 제공되지 않는 것

- 서비스 로그인 권한
- 프로젝트 ID/URL
- 실제 API key/secret
- DB password
- 실제 `.env`
- 테스트 계정 비밀번호
- 운영/고객 데이터
- 개인 결제수단이나 도메인 계정

새 작업자는 example 파일의 변수명만 참고하여 자신의 값으로 새 `.env`를 만듭니다.

## 7. 새 작업자의 시작 순서

1. ZIP 압축 해제
2. `README.md`와 `HANDOFF.md` 확인
3. Node 20과 pnpm 8 설치
4. `pnpm install --frozen-lockfile`
5. 자신의 Supabase 개발 프로젝트 생성
6. example을 복사해 자신의 `.env` 작성
7. 로컬 테스트와 빌드
8. 자신의 Railway/Vercel에 staging 배포
9. Toss/Resend/VAPID/도메인을 필요 범위에서 연결

## 8. Drive 업로드 전 최종 확인

- [ ] 원본 폴더가 아니라 `landnote-handoff.zip`을 공유한다.
- [ ] ZIP 안에 `.env`와 `.env.local`이 없다.
- [ ] `.env.example`, `.env.local.example`은 있다.
- [ ] `node_modules`, `.next`, `.git`이 없다.
- [ ] DB dump나 고객 데이터가 없다.
- [ ] README, HANDOFF, docs, migration이 있다.
- [ ] 받는 사람에게 “외부 서비스는 모두 본인 계정으로 신규 생성”이라고 전달했다.
