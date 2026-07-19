# 랜드노트 (LandNote) — 공인중개사 전용 스마트 부동산 CRM
# 기술 명세서 v3.5 (Claude Code 작업용)

> 이 문서는 Claude Code가 오류 없이 구현할 수 있도록 모든 상수, 타입, API, DB 스키마, 디렉토리 구조를 명확히 정의한다.
> 모호한 표현 대신 실제 값과 구조를 사용한다.
>
> **v3.5 핵심 변경 요약** (v3.4 대비)
> - Phase 8 추가: 총관리자(Super Admin) 대시보드 — 중개사 관리, 수익 관리, 접속 통계, 플랫폼 KPI
> - `admin_users`, `access_logs`, `admin_audit_logs` 테이블 추가 (012_admin.sql)
> - `AdminAuthGuard` + `AccessLogInterceptor` 추가 (Guard/Interceptor 패턴)
> - 20장 '총관리자 대시보드' 신규 — 화면 구성, 보안 원칙, 데이터 흐름
> - `@landnote/shared`에 `AdminUser`, `PlatformKpis`, `ADMIN_ROLE` 추가
>
> **v3.4 핵심 변경 요약** (v3.3 대비)
> - Phase 7 추가: 상업형 UI/UX 개선 — 카피 리프레이밍, 잠금 표현 통일, 가격 일 환산, CTA 개선 (프론트엔드 10개 파일)
> - 공개 폼 카테고리: 4개 고정 렌더링 + Starter 잠금 카드 패턴
> - UpgradeModal: 손실 프레이밍 적용 ("잠겨 있습니다" → "해제")
> - 전화번호 regex 검증 추가 (암호문 노출 방지)
>
> **v3.3 핵심 변경 요약** (v3.2 대비)
> - Phase 6 추가: 보안 강화(Mass Assignment 차단, 고아 스토리지 방지) + 기능 정합성(카테고리별 QR, 최소 카테고리 검증) + UX 퍼널(잠금 UI, 업그레이드 모달, 퀵 액션) + 테스트 인프라(Jest, 13건)
> - `UpdateAgentProfileDto`, `ChangeCategoriesDto` DTO 추가 — 대량 할당 취약점 차단
> - `CATEGORY_LABELS` 상수를 `@landnote/shared`에 SSoT로 추가
> - `UpgradeModal.tsx` 재사용 컴포넌트 추가
> - `/dashboard/links` 페이지를 `apiFetch` 기반으로 리팩토링 (Supabase 클라이언트 직접 접근 제거)
>
> **v3.2 핵심 변경 요약** (v3.1 대비)
> - 모노레포 설정 추가: `pnpm-workspace.yaml`, `turbo.json`, `tsconfig` paths, 패키지 참조 방식 명시
> - NestJS 모듈 등록 구조 추가: `app.module.ts`, 모듈간 imports/exports 관계 정의
> - `customer_inquiries` 테이블에 `images JSONB` 컬럼 추가 (고객 접수 이미지 저장)
> - Public API 라우트 인증 우회: `@Public()` 데코레이터 + `JwtAuthGuard` 글로벌 등록 시 제외 처리
> - `agents` INSERT RLS 제거 → 서버(SERVICE_ROLE_KEY) 전용 INSERT 원칙 명시
> - DTO 클래스 정의 추가: `CreateInquiryDto`, `CreateListingDto` (class-validator 기반 가격 3중 검증)
> - 플랜 변경 비즈니스 로직 확정: 업그레이드=즉시(일할계산 없음), 다운그레이드=다음 결제일 예약
> - Next.js 버전 `14.2.x` 고정 + `package.json` 버전 제약 명시
> - 글로벌 `ExceptionFilter` 추가 → 모든 예외를 공통 응답 Envelope로 변환
> - Phase별 검증 기준 추가: seed 데이터, 스모크 테스트 체크리스트
>
> **v3.1 핵심 변경 요약** (이전 버전 대비)
> - JSONB 배열 컬럼 → Postgres 배열(`TEXT[]` / ENUM[])으로 전환 — 매칭 쿼리 단순화
> - DB ENUM 타입 도입 — 오타 제거, TypeScript 타입과 일치
> - Storage: private 버킷 + path 저장 + 조회 시 signed URL 발급 (`getPublicUrl()` 사용 금지)
> - RLS: `FOR ALL` 단일 정책 → SELECT/INSERT/UPDATE/DELETE 분리 + `WITH CHECK` 추가
> - `property_listings`: `latitude`/`longitude` 원천 컬럼 + `location` generated column
> - Toss Payments: 빌링키 발급 엔드포인트 교정 (`/billing/authorizations/issue`)
> - 스케줄러: trial → active 전환 로직 완성
> - 공통 API 응답 Envelope + 에러 코드 세트 고정

---

## 목차

1. 프로젝트 개요 및 핵심 원칙
2. 기술 스택 및 프로젝트 구조
3. 환경 변수 전체 목록
4. 공통 상수 및 타입 정의
5. 데이터베이스 전체 스키마 (마이그레이션 순서 포함)
6. Row Level Security (RLS) 정책
7. 공통 API 응답 규격
8. API 엔드포인트 전체 명세
9. 인증 및 권한 미들웨어
10. NestJS 모듈 구조 및 등록
11. 메인 랜딩 및 가입 온보딩
12. 4단계 고객 접수 UX
13. 중개사 대시보드 — 화면 목록 및 기능
14. 스마트 매칭 알고리즘
15. 통계 대시보드
16. 이미지 업로드 시스템
17. Toss Payments 정기결제
18. 이메일 알림
19. 개발 로드맵 및 Phase별 검증 기준
20. 총관리자 대시보드 (관리자 시스템)

---

## 1. 프로젝트 개요 및 핵심 원칙

### 서비스 정의

랜드노트는 공인중개사 전용 CRM SaaS다. 중개사가 월 구독료를 내고 자신만의 매물·고객 관리 시스템을 임대한다. 고객은 중개사가 발급한 링크/QR로 접속해 조건만 접수한다.

### 절대 원칙 (구현 시 예외 없음)

1. **고객은 매물 리스트를 볼 수 없다.** 고객 웹폼은 조건 접수 전용이다.
2. **중개사는 자신의 데이터만 볼 수 있다.** RLS + agent_id로 DB 레벨에서 강제한다.
3. **가격 정보 없는 매물은 등록 불가.** 3중 검증(프론트/백엔드 DTO/DB CHECK)으로 강제한다.
4. **매칭 결과는 중개사 대시보드에서만 확인 가능하다.**

### 접근 권한 매트릭스

| 기능 | 비인증 고객 | 중개사(trial/active) | 만료 중개사 | 총관리자 |
|------|-----------|-------------------|-----------|---------|
| 조건 접수 웹폼 | 가능 | - | - | - |
| 매물 리스트 열람 | 불가 | 가능 | 불가 | 불가 |
| 매물 상세 조회 | 불가 | 가능 | 불가 | 불가 |
| 매칭 결과 열람 | 불가 | 가능 | 불가 | 불가 |
| 타 중개사 데이터 | 불가 | 불가 | 불가 | 불가 |
| 대시보드 접근 | 불가 | 가능 | 구독 만료 안내만 | 불가 |
| 관리자 대시보드 | 불가 | 불가 | 불가 | 가능 |
| 전체 중개사 관리 | 불가 | 불가 | 불가 | 가능 |
| 수익/결제 조회 | 불가 | 불가 | 불가 | 가능 |
| 접속 통계 조회 | 불가 | 불가 | 불가 | 가능 |

---

## 2. 기술 스택 및 프로젝트 구조

### 기술 스택

| 레이어 | 기술 | 버전 |
|--------|------|------|
| 프론트엔드 | Next.js (App Router) | ^14.2.0 (15.x 사용 금지) |
| UI 컴포넌트 | shadcn/ui + Tailwind CSS | latest |
| 상태관리 | Zustand | 4.x |
| 서버 상태 | TanStack Query (React Query) | 5.x |
| 백엔드 | NestJS (TypeScript) | 10.x |
| DB 클라이언트 | Supabase JS Client | 2.x |
| 데이터베이스 | PostgreSQL (Supabase) | 15.x |
| 지리정보 | PostGIS | 3.x |
| 인증 | Supabase Auth | - |
| 파일 저장 | Supabase Storage | - |
| 결제 | Toss Payments | v1 API |
| 스케줄러 | @nestjs/schedule | - |
| 이메일 | Resend + React Email | - |
| QR 생성 | qrcode (npm) | - |
| 모노레포 | pnpm workspaces + Turborepo | pnpm 8.x / turbo 2.x |
| 배포 (프론트) | Vercel | - |
| 배포 (백엔드) | Railway | - |

> **Next.js 버전 고정 이유**: 15.x에서 `cookies()` 동기→비동기 전환, `fetch()` 캐싱 기본값 변경 등 호환성 이슈가 있다.
> `package.json`에서 `"next": "^14.2.0"`으로 고정한다. `^15` 또는 `latest` 사용 금지.

### 모노레포 디렉토리 구조

```
landnote/
├── pnpm-workspace.yaml
├── turbo.json
├── package.json                              # 루트 (scripts만, dependencies 없음)
├── tsconfig.base.json                        # 공용 tsconfig
├── apps/
│   ├── web/                                  # Next.js 앱
│   │   ├── package.json
│   │   ├── tsconfig.json                     # extends ../../tsconfig.base.json
│   │   ├── next.config.mjs
│   │   ├── app/
│   │   │   ├── (marketing)/                  # 랜딩 레이아웃 (헤더+푸터)
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx                  # 메인 랜딩
│   │   │   │   └── pricing/page.tsx
│   │   │   ├── (auth)/                       # 인증 레이아웃 (로고만)
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/
│   │   │   │       ├── page.tsx              # Step 1: 기본 정보
│   │   │   │       ├── plan/page.tsx         # Step 2: 플랜 선택
│   │   │   │       ├── billing/
│   │   │   │       │   ├── page.tsx          # Step 3: 카드 등록
│   │   │   │       │   ├── success/page.tsx  # Toss 콜백 — 가입용
│   │   │   │       │   └── fail/page.tsx
│   │   │   │       └── done/page.tsx         # Step 4: 가입 완료
│   │   │   ├── (admin)/                      # 관리자 대시보드 (관리자 인증 필요)
│   │   │   │   ├── layout.tsx               # 다크 사이드바 레이아웃
│   │   │   │   └── admin/
│   │   │   │       ├── page.tsx             # 대시보드 홈 (KPI)
│   │   │   │       ├── login/page.tsx       # 관리자 로그인
│   │   │   │       ├── agents/
│   │   │   │       │   ├── page.tsx         # 중개사 목록
│   │   │   │       │   └── [id]/page.tsx    # 중개사 상세
│   │   │   │       ├── revenue/page.tsx     # 수익 관리
│   │   │   │       └── stats/page.tsx       # 접속 통계
│   │   │   ├── dashboard/                    # 중개사 대시보드 (인증 필요)
│   │   │   │   ├── layout.tsx                # 사이드바, 상단 헤더
│   │   │   │   ├── page.tsx                  # 메인 현황
│   │   │   │   ├── inquiries/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── listings/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── matching/page.tsx
│   │   │   │   ├── stats/page.tsx
│   │   │   │   ├── links/page.tsx
│   │   │   │   └── settings/
│   │   │   │       ├── page.tsx              # 프로필, 카테고리
│   │   │   │       └── billing/
│   │   │   │           ├── page.tsx          # 구독 현황, 카드 변경
│   │   │   │           ├── success/page.tsx  # Toss 콜백 — 카드 변경용
│   │   │   │           └── fail/page.tsx
│   │   │   └── form/                         # 고객 접수 웹폼 (인증 불필요)
│   │   │       └── [agentCode]/
│   │   │           ├── page.tsx
│   │   │           ├── category/page.tsx
│   │   │           ├── detail/page.tsx
│   │   │           ├── input/page.tsx
│   │   │           └── done/page.tsx
│   │   ├── components/
│   │   │   ├── ui/                           # shadcn/ui
│   │   │   ├── marketing/                    # 랜딩 전용 컴포넌트
│   │   │   ├── dashboard/                    # 대시보드 전용
│   │   │   ├── form/                         # 고객 접수폼
│   │   │   └── charts/                       # recharts 래퍼
│   │   ├── lib/
│   │   │   ├── supabase/
│   │   │   │   ├── client.ts                 # 브라우저용
│   │   │   │   └── server.ts                 # 서버 컴포넌트용
│   │   │   ├── stores/
│   │   │   │   ├── form-store.ts             # 고객 접수폼 상태
│   │   │   │   └── register-store.ts         # 가입 온보딩 상태
│   │   │   ├── constants.ts
│   │   │   ├── types.ts
│   │   │   └── utils.ts
│   │   └── middleware.ts
│   │
│   └── api/                                  # NestJS 백엔드
│       ├── package.json
│       ├── tsconfig.json                     # extends ../../tsconfig.base.json
│       ├── nest-cli.json
│       └── src/
│           ├── main.ts
│           ├── app.module.ts
│           ├── common/
│           │   ├── guards/
│           │   │   ├── jwt-auth.guard.ts
│           │   │   ├── subscription.guard.ts
│           │   │   └── admin-auth.guard.ts       # ← v3.5 신규
│           │   ├── decorators/
│           │   │   ├── current-agent.decorator.ts
│           │   │   ├── current-admin.decorator.ts # ← v3.5 신규
│           │   │   └── public.decorator.ts       # ← v3.2 신규
│           │   ├── filters/
│           │   │   └── global-exception.filter.ts # ← v3.2 신규
│           │   ├── interceptors/
│           │   │   ├── response.interceptor.ts
│           │   │   └── access-log.interceptor.ts # ← v3.5 신규
│           │   ├── pipes/
│           │   │   └── validation.pipe.ts
│           │   └── utils/
│           │       └── crypto.util.ts
│           └── modules/
│               ├── auth/
│               │   ├── auth.module.ts
│               │   ├── auth.controller.ts
│               │   └── auth.service.ts
│               ├── agents/
│               │   ├── agents.module.ts
│               │   ├── agents.controller.ts
│               │   └── agents.service.ts
│               ├── inquiries/
│               │   ├── inquiries.module.ts
│               │   ├── inquiries.controller.ts
│               │   ├── inquiries.service.ts
│               │   └── dto/
│               │       └── create-inquiry.dto.ts  # ← v3.2 신규
│               ├── listings/
│               │   ├── listings.module.ts
│               │   ├── listings.controller.ts
│               │   ├── listings.service.ts
│               │   └── dto/
│               │       └── create-listing.dto.ts  # ← v3.2 신규
│               ├── matching/
│               │   ├── matching.module.ts
│               │   ├── matching.controller.ts
│               │   └── matching.service.ts
│               ├── billing/
│               │   ├── billing.module.ts
│               │   ├── billing.controller.ts
│               │   ├── billing.service.ts
│               │   └── billing.scheduler.ts
│               ├── stats/
│               │   ├── stats.module.ts
│               │   ├── stats.controller.ts
│               │   └── stats.service.ts
│               ├── storage/
│               │   ├── storage.module.ts
│               │   └── storage.service.ts
│               ├── email/
│               │   ├── email.module.ts
│               │   └── email.service.ts
│               └── admin/                        # ← v3.5 신규
│                   ├── admin.module.ts
│                   ├── admin-auth.controller.ts
│                   ├── admin-agents.controller.ts
│                   ├── admin-revenue.controller.ts
│                   ├── admin-stats.controller.ts
│                   └── admin.service.ts
│
└── packages/
    └── shared/
        ├── package.json
        ├── tsconfig.json
        ├── constants.ts
        └── types.ts
```

### 모노레포 설정 파일 (v3.2 신규)

#### pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

#### 루트 package.json

```json
{
  "name": "landnote",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "dev:web": "turbo dev --filter=@landnote/web",
    "dev:api": "turbo dev --filter=@landnote/api",
    "db:migrate": "cd apps/api && pnpm run db:migrate"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  },
  "packageManager": "pnpm@8.15.0",
  "engines": {
    "node": ">=20.0.0"
  }
}
```

#### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "lint": {
      "dependsOn": ["^build"]
    }
  }
}
```

#### tsconfig.base.json (루트)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

#### packages/shared/package.json

```json
{
  "name": "@landnote/shared",
  "version": "0.0.0",
  "private": true,
  "main": "./index.ts",
  "types": "./index.ts",
  "scripts": {
    "build": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

#### packages/shared/index.ts (barrel export)

```typescript
export * from './constants';
export * from './types';
```

#### packages/shared/tsconfig.json

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["./**/*.ts"]
}
```

#### apps/web/package.json (발췌)

```json
{
  "name": "@landnote/web",
  "version": "0.0.0",
  "private": true,
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@supabase/ssr": "^0.4.0",
    "@tosspayments/payment-sdk": "^2.0.0",
    "zustand": "^4.5.0",
    "@tanstack/react-query": "^5.0.0",
    "recharts": "^2.12.0",
    "qrcode": "^1.5.0",
    "@landnote/shared": "workspace:*"
  }
}
```

> **`@landnote/shared`를 `workspace:*`로 참조한다.** pnpm이 자동으로 심링크를 생성하므로
> 빌드 없이 바로 import 가능하다. `import { PLAN_LIMITS } from '@landnote/shared'` 사용.

#### apps/web/tsconfig.json (발췌)

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./app/*", "./components/*", "./lib/*"],
      "@landnote/shared": ["../../packages/shared"]
    },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", "../../packages/shared/**/*.ts"]
}
```

#### apps/web/next.config.mjs

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // pnpm workspace의 shared 패키지를 트랜스파일
  transpilePackages: ['@landnote/shared'],
};

export default nextConfig;
```

#### apps/api/package.json (발췌)

```json
{
  "name": "@landnote/api",
  "version": "0.0.0",
  "private": true,
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/schedule": "^4.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "resend": "^3.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.0",
    "@landnote/shared": "workspace:*"
  }
}
```

#### apps/api/tsconfig.json (발췌)

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "paths": {
      "@landnote/shared": ["../../packages/shared"]
    }
  },
  "include": ["src/**/*.ts", "../../packages/shared/**/*.ts"]
}
```

#### apps/api/nest-cli.json

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

---

## 3. 환경 변수 전체 목록

### apps/api/.env

```bash
NODE_ENV=development
PORT=3001

# Supabase
SUPABASE_URL=https://xxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # 서버 전용 — 절대 클라이언트 노출 금지
SUPABASE_ANON_KEY=eyJ...

# Toss Payments
TOSS_SECRET_KEY=test_sk_...        # 서버 전용

# Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@landnote.app

# 전화번호 암호화 키 (32바이트 hex — node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
PHONE_ENCRYPT_KEY=your-64-char-hex-string

# URL
APP_URL=http://localhost:3000
API_URL=http://localhost:3001
```

### apps/web/.env.local

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 4. 공통 상수 및 타입 정의

> 아래 값들이 DB·API·프론트 전체에서 사용하는 단일 진실 공급원(SSoT)이다.

### 4-1. 구독 플랜

```typescript
// packages/shared/constants.ts

export const SUBSCRIPTION_PLAN = {
  STARTER: 'starter',
  PRO: 'pro',
} as const;

export const SUBSCRIPTION_STATUS = {
  TRIAL: 'trial',         // 가입 후 7일 무료 체험
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled', // 해지 요청 완료 (데이터 영구 보존)
} as const;

export const PLAN_PRICE: Record<string, number> = {
  starter: 10000,
  pro: 15000,
};

export const PLAN_LIMITS = {
  starter: {
    max_categories: 2,
    max_listings_per_month: 0,        // 0 = 무제한
    max_qr_codes: 1,
    max_images_per_listing: 5,
    category_changes_per_month: 1,   // 월 1회로 제한 (0 = 무제한)
  },
  pro: {
    max_categories: 4,
    max_listings_per_month: 0,       // 0 = 무제한
    max_qr_codes: 4,
    max_images_per_listing: 20,
    category_changes_per_month: 0,   // 무제한
  },
} as const;

export const TRIAL_DAYS = 7;
export const CANCELLED_DATA_RETENTION_DAYS = 30;

// 0 = 무제한을 명시적으로 판별하는 헬퍼
// PLAN_LIMITS.starter.max_listings_per_month 같은 값이 0이면 무제한을 의미한다.
// 직접 비교하면 실수하기 쉬우므로 이 함수를 사용한다.
export function isUnlimited(limit: number): boolean {
  return limit === 0;
}

// billing_day: 등록일이 29~31이면 28로 clamp (매월 28일 이하 강제)
export function clampBillingDay(day: number): number {
  return Math.min(day, 28);
}
```

### 4-2. 카테고리 코드

```typescript
export const CATEGORY_CODE = {
  RESIDENTIAL: 'residential',
  COMMERCIAL:  'commercial',
  INDUSTRIAL:  'industrial',
  LAND:        'land',
} as const;

export type CategoryCode = typeof CATEGORY_CODE[keyof typeof CATEGORY_CODE];

// v3.1: DB에서는 Postgres ENUM category_code로 정의됨.
// TypeScript 타입과 DB ENUM 값이 동일하게 유지되어야 한다.

export const SUBCATEGORIES: Record<CategoryCode, Record<string, string[]>> = {
  residential: {
    apartment: ['일반아파트', '주상복합', '재건축', '분양권'],
    villa:     ['다세대', '연립', '다가구', '도시형생활주택'],
    house:     ['도심단독', '전원주택', '한옥', '타운하우스'],
    small:     ['원룸', '투룸', '주거용오피스텔', '고시원'],
  },
  commercial: {
    store:             ['1층점포', '고층점포', '지하점포', '복합층점포'],
    business_transfer: ['음식점', '서비스업', '소매업', '학원', '전문업종'],
    office:            ['프라임오피스', '일반오피스', '소호오피스', '공유오피스'],
    building:          ['꼬마빌딩', '근생빌딩', '상가주택', '통빌딩'],
  },
  industrial: {
    factory:   ['일반제조', '식품공장', '첨단공장', '화학공장'],
    warehouse: ['일반창고', '냉동창고', '물류센터', '배송센터', '보세창고'],
    knowledge: ['제조사무겸용', 'R&D중심', 'IT특화', '분양형'],
    workshop:  ['소형작업장', '자동차관련', '야적장', '특수시설'],
  },
  land: {
    buildable: ['대지', '상업용지', '공업용지', '주거용지'],
    farm:      ['전', '답', '과수원', '임야', '재개발예정', '재건축예정'],
    special:   ['펜션/모텔', '요양원', '종교시설', '에너지시설', '주차장'],
  },
};
```

### 4-3. 거래 유형 코드

```typescript
export const TRANSACTION_TYPE = {
  SALE:             'sale',
  JEONSE:           'jeonse',
  MONTHLY_RENT:     'monthly_rent',
  PREMIUM_TRANSFER: 'premium_transfer',  // 권리양도
} as const;

export type TransactionType = typeof TRANSACTION_TYPE[keyof typeof TRANSACTION_TYPE];

// v3.1: DB에서는 Postgres ENUM transaction_type으로 정의됨.

// 거래 유형별 필수 필드 (프론트·백엔드 공용)
export const REQUIRED_PRICE_FIELDS: Record<TransactionType, string[]> = {
  sale:             ['price_sale'],
  jeonse:           ['deposit', 'maintenance_fee'],
  monthly_rent:     ['deposit', 'monthly_rent', 'maintenance_fee'],
  premium_transfer: ['deposit', 'monthly_rent', 'maintenance_fee',
                     'premium_price', 'contract_remaining_months'],
};
```

### 4-4. 상태 코드

```typescript
export const INQUIRY_STATUS = {
  NEW:         'new',
  CONTACTED:   'contacted',
  VIEWING:     'viewing',
  NEGOTIATING: 'negotiating',
  CONTRACTED:  'contracted',
  CLOSED:      'closed',
} as const;

export const LISTING_STATUS = {
  ACTIVE:     'active',
  PENDING:    'pending',
  CONTRACTED: 'contracted',
  CLOSED:     'closed',
} as const;
```

### 4-5. TypeScript 타입

```typescript
// packages/shared/types.ts

export interface Agent {
  id: string;
  user_id: string;
  email: string;               // auth.users에서 조인, agents 테이블에도 저장
  agent_name: string;
  license_number: string;
  office_name: string | null;
  phone: string | null;
  agent_code: string;          // URL 단축 코드 (예: A1B2C)
  profile_image_url: string | null;

  // 구독
  subscription_plan: 'starter' | 'pro';
  subscription_status: 'trial' | 'active' | 'expired' | 'cancelled';
  selected_categories: CategoryCode[];
  pending_plan: 'starter' | 'pro' | null;       // 다운그레이드 예약
  category_changed_at: string | null;           // 카테고리 마지막 변경일 (월 1회 제한용)
  trial_ends_at: string | null;
  cancelled_at: string | null;                  // 해지 시각

  // 결제
  billing_key: string | null;
  billing_card_info: {
    company: string;
    number: string;    // 마스킹 (예: 4330-****-****-5321)
    card_type: string;
  } | null;
  subscription_start: string | null;
  subscription_end: string | null;
  next_billing_date: string | null;
  billing_day: number;                          // 매월 결제일 (1~28)

  created_at: string;
  updated_at: string;
}

export interface CustomerInquiry {
  id: string;
  agent_id: string;
  inquiry_type: 'looking_for' | 'listing';
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  category_codes: CategoryCode[];
  subcategory_codes: string[];
  tags: string[];
  transaction_types: TransactionType[];
  detailed_conditions: Record<string, unknown>;
  images: InquiryImage[];                       // v3.2: 고객 접수 첨부 이미지
  status: 'new' | 'contacted' | 'viewing' | 'negotiating' | 'contracted' | 'closed';
  priority: number;
  agent_memo: string | null;
  created_at: string;
  updated_at: string;
}

// v3.2 신규
export interface InquiryImage {
  path: string;
  signed_url?: string;          // 조회 응답 시 서버가 발급 (1시간 유효)
  uploaded_at: string;
}

export interface PropertyListing {
  id: string;
  agent_id: string;
  category_codes: CategoryCode[];    // v3.1: DB는 category_code[]
  subcategory_codes: string[];       // v3.1: DB는 text[]
  tags: string[];                    // v3.1: DB는 text[]
  transaction_types: TransactionType[]; // v3.1: DB는 transaction_type[]
  address_full: string | null;
  address_road: string | null;
  address_jibun: string | null;
  dong_name: string | null;
  // v3.1: latitude/longitude가 원천. location은 DB generated column (TS에서 직접 쓰지 않음)
  latitude: number | null;
  longitude: number | null;
  price_sale: number | null;
  deposit: number | null;
  monthly_rent: number | null;
  maintenance_fee: number | null;
  premium_price: number | null;
  premium_floor: number | null;
  premium_facility: number | null;
  premium_business: number | null;
  contract_remaining_months: number | null;
  area_supply: number | null;
  area_exclusive: number | null;
  floor_current: number | null;
  floor_total: number | null;
  built_year: number | null;
  direction: string | null;
  images: ListingImage[];
  detail_info: Record<string, unknown>;
  status: 'active' | 'pending' | 'contracted' | 'closed';
  agent_memo: string | null;
  source_inquiry_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListingImage {
  // v3.1: DB에는 path만 저장. signed_url은 API 응답에서만 포함 (DB 저장 금지)
  path: string;
  signed_url?: string;          // 조회 응답 시 서버가 발급 (1시간 유효)
  is_representative: boolean;
  label: string | null;
  uploaded_at: string;
}

export interface MatchResult {
  id: string;
  agent_id: string;
  inquiry_id: string;
  property_id: string;
  score: number;
  score_breakdown: {
    category: number;
    price: number;
    area: number;
    location: number;
  };
  is_shown: boolean;
  is_liked: boolean;
  created_at: string;
}

// v3.2 신규: 공통 API 응답 타입
export type ApiResponse<T> =
  | { ok: true;  data: T }
  | { ok: false; error: { code: string; message: string; details?: unknown } };
```

---

## 5. 데이터베이스 전체 스키마

> **v3.1 원칙**
> - "리스트 성격" 데이터(category_codes, tags 등)는 Postgres 배열(`TEXT[]` 또는 ENUM[])
> - "가변 구조" 데이터(detailed_conditions, detail_info 등)만 JSONB
> - Storage 이미지는 path 저장. `getPublicUrl()` 사용 금지.

### 001_extensions.sql

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### 002_types.sql  ← v3.1 신규 (ENUM 정의)

```sql
-- DB 레벨에서 오타·불일치 제거
CREATE TYPE subscription_plan_t   AS ENUM ('starter','pro');
CREATE TYPE subscription_status_t AS ENUM ('trial','active','expired','cancelled');
CREATE TYPE category_code_t       AS ENUM ('residential','commercial','industrial','land');
CREATE TYPE transaction_type_t    AS ENUM ('sale','jeonse','monthly_rent','premium_transfer');
CREATE TYPE inquiry_status_t      AS ENUM ('new','contacted','viewing','negotiating','contracted','closed');
CREATE TYPE listing_status_t      AS ENUM ('active','pending','contracted','closed');
```

### 003_agents.sql

```sql
CREATE TABLE agents (
  id                    UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID                  UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 VARCHAR(255)          NOT NULL,
  agent_name            VARCHAR(50)           NOT NULL,
  license_number        VARCHAR(20)           UNIQUE NOT NULL,
  office_name           VARCHAR(100),
  phone                 VARCHAR(20),
  agent_code            VARCHAR(10)           UNIQUE NOT NULL DEFAULT '',
  profile_image_url     TEXT,

  -- 구독
  subscription_plan     subscription_plan_t   NOT NULL DEFAULT 'starter',
  subscription_status   subscription_status_t NOT NULL DEFAULT 'trial',
  selected_categories   category_code_t[]     NOT NULL DEFAULT '{}'::category_code_t[],
  pending_plan          subscription_plan_t,
  category_changed_at   TIMESTAMPTZ,
  trial_ends_at         TIMESTAMPTZ,
  cancelled_at          TIMESTAMPTZ,

  -- 결제
  billing_key           TEXT,
  billing_card_info     JSONB,
  subscription_start    TIMESTAMPTZ,
  subscription_end      TIMESTAMPTZ,
  next_billing_date     TIMESTAMPTZ,
  billing_day           INTEGER               NOT NULL DEFAULT 1 CHECK (billing_day BETWEEN 1 AND 28),

  created_at            TIMESTAMPTZ           NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ           NOT NULL DEFAULT now()
);

-- agent_code 자동 생성
CREATE OR REPLACE FUNCTION generate_agent_code()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE v_code TEXT;
BEGIN
  LOOP
    v_code := 'A' || UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT) FROM 1 FOR 4));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM agents WHERE agent_code = v_code);
  END LOOP;
  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION set_agent_defaults()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.agent_code = '' OR NEW.agent_code IS NULL THEN
    NEW.agent_code := generate_agent_code();
  END IF;
  IF NEW.trial_ends_at IS NULL THEN
    NEW.trial_ends_at := now() + INTERVAL '7 days';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_agent_defaults
  BEFORE INSERT ON agents
  FOR EACH ROW EXECUTE FUNCTION set_agent_defaults();

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 004_customer_inquiries.sql

```sql
CREATE TABLE customer_inquiries (
  id                  UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id            UUID               NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  inquiry_type        VARCHAR(20)        NOT NULL CHECK (inquiry_type IN ('looking_for','listing')),
  customer_name       VARCHAR(50),
  customer_phone      TEXT,              -- AES-256-CBC 암호화 저장 (crypto.util.ts 참조)
  customer_email      VARCHAR(100),

  -- v3.1: JSONB 배열 → Postgres 배열
  category_codes      category_code_t[]    NOT NULL DEFAULT '{}'::category_code_t[],
  subcategory_codes   TEXT[]               NOT NULL DEFAULT '{}'::TEXT[],
  tags                TEXT[]               NOT NULL DEFAULT '{}'::TEXT[],
  transaction_types   transaction_type_t[] NOT NULL DEFAULT '{}'::transaction_type_t[],

  detailed_conditions JSONB              NOT NULL DEFAULT '{}',

  -- v3.2: 고객 접수 시 첨부 이미지 (path만 저장, signed_url은 조회 시 발급)
  -- 구조: [{ "path": "agents/{agent_id}/inquiries/{inquiry_id}/xxx.jpg", "uploaded_at": "..." }]
  images              JSONB              NOT NULL DEFAULT '[]',

  status              inquiry_status_t   NOT NULL DEFAULT 'new',
  priority            INTEGER            NOT NULL DEFAULT 0 CHECK (priority BETWEEN 0 AND 5),
  agent_memo          TEXT,
  created_at          TIMESTAMPTZ        NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ        NOT NULL DEFAULT now()
);

CREATE INDEX idx_inquiries_agent_status
  ON customer_inquiries(agent_id, status, created_at DESC);

CREATE INDEX idx_inquiries_categories
  ON customer_inquiries USING GIN(category_codes);

CREATE TRIGGER trigger_inquiries_updated_at
  BEFORE UPDATE ON customer_inquiries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

> **전화번호 암호화**: `customer_phone`은 NestJS 레이어에서 AES-256-CBC 암호화 후 저장.
>
> ```typescript
> // src/common/utils/crypto.util.ts
> import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
> const ALGORITHM = 'aes-256-cbc';
> const KEY = Buffer.from(process.env.PHONE_ENCRYPT_KEY!, 'hex');
>
> export function encryptPhone(phone: string): string {
>   const iv = randomBytes(16);
>   const cipher = createCipheriv(ALGORITHM, KEY, iv);
>   const enc = Buffer.concat([cipher.update(phone, 'utf8'), cipher.final()]);
>   return iv.toString('hex') + ':' + enc.toString('hex');
> }
> export function decryptPhone(stored: string): string {
>   const [ivHex, encHex] = stored.split(':');
>   const decipher = createDecipheriv(ALGORITHM, KEY, Buffer.from(ivHex, 'hex'));
>   return Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]).toString('utf8');
> }
> ```
> 키 생성: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 005_property_listings.sql

```sql
CREATE TABLE property_listings (
  id                        UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id                  UUID                   NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

  -- v3.1: JSONB 배열 → Postgres 배열
  category_codes            category_code_t[]      NOT NULL DEFAULT '{}'::category_code_t[],
  subcategory_codes         TEXT[]                 NOT NULL DEFAULT '{}'::TEXT[],
  tags                      TEXT[]                 NOT NULL DEFAULT '{}'::TEXT[],
  transaction_types         transaction_type_t[]   NOT NULL DEFAULT '{}'::transaction_type_t[],

  address_full              TEXT,
  address_road              TEXT,
  address_jibun             TEXT,
  dong_name                 VARCHAR(50),

  -- v3.1: lat/lng 원천 컬럼 + location generated column (PostGIS)
  latitude                  DOUBLE PRECISION,
  longitude                 DOUBLE PRECISION,
  location                  GEOGRAPHY(POINT, 4326)
    GENERATED ALWAYS AS (
      CASE
        WHEN latitude IS NOT NULL AND longitude IS NOT NULL
        THEN ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
        ELSE NULL
      END
    ) STORED,

  price_sale                NUMERIC(15,0),
  deposit                   NUMERIC(15,0),
  monthly_rent              NUMERIC(10,0),
  maintenance_fee           NUMERIC(10,0),
  premium_price             NUMERIC(15,0),
  premium_floor             NUMERIC(15,0),
  premium_facility          NUMERIC(15,0),
  premium_business          NUMERIC(15,0),
  contract_remaining_months INTEGER,
  area_supply               NUMERIC(8,2),
  area_exclusive            NUMERIC(8,2),
  floor_current             SMALLINT,
  floor_total               SMALLINT,
  built_year                SMALLINT,
  direction                 VARCHAR(10)
                            CHECK (direction IN
                              ('남향','남동향','남서향','동향','서향','북향','북동향','북서향')),

  -- v3.1: URL 대신 path 저장 (getPublicUrl() 사용 금지)
  images                    JSONB                  NOT NULL DEFAULT '[]',
  detail_info               JSONB                  NOT NULL DEFAULT '{}',
  status                    listing_status_t       NOT NULL DEFAULT 'active',
  agent_memo                TEXT,
  source_inquiry_id         UUID REFERENCES customer_inquiries(id) ON DELETE SET NULL,
  created_at                TIMESTAMPTZ            NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ            NOT NULL DEFAULT now(),

  -- 가격 3중 검증 (DB 레벨 — enum[] 배열 문법)
  CONSTRAINT chk_sale_price
    CHECK (NOT ('sale' = ANY(transaction_types))
           OR (price_sale IS NOT NULL AND price_sale > 0)),
  CONSTRAINT chk_jeonse_price
    CHECK (NOT ('jeonse' = ANY(transaction_types))
           OR (deposit IS NOT NULL AND deposit > 0 AND maintenance_fee IS NOT NULL)),
  CONSTRAINT chk_monthly_rent_price
    CHECK (NOT ('monthly_rent' = ANY(transaction_types))
           OR (deposit IS NOT NULL
               AND monthly_rent IS NOT NULL AND monthly_rent > 0
               AND maintenance_fee IS NOT NULL)),
  CONSTRAINT chk_premium_transfer_price
    CHECK (NOT ('premium_transfer' = ANY(transaction_types))
           OR (deposit IS NOT NULL
               AND monthly_rent IS NOT NULL AND monthly_rent > 0
               AND maintenance_fee IS NOT NULL
               AND premium_price IS NOT NULL AND premium_price >= 0
               AND contract_remaining_months IS NOT NULL AND contract_remaining_months > 0))
);

CREATE INDEX idx_listings_agent_status
  ON property_listings(agent_id, status, created_at DESC);

CREATE INDEX idx_listings_location
  ON property_listings USING GIST(location);

CREATE INDEX idx_listings_categories
  ON property_listings USING GIN(category_codes);

CREATE TRIGGER trigger_listings_updated_at
  BEFORE UPDATE ON property_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 006_matches.sql

```sql
CREATE TABLE matches (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id        UUID          NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  inquiry_id      UUID          NOT NULL REFERENCES customer_inquiries(id) ON DELETE CASCADE,
  property_id     UUID          NOT NULL REFERENCES property_listings(id) ON DELETE CASCADE,
  score           NUMERIC(4,3)  NOT NULL CHECK (score BETWEEN 0 AND 1),
  score_breakdown JSONB         NOT NULL DEFAULT '{}',
  is_shown        BOOLEAN       NOT NULL DEFAULT FALSE,
  is_liked        BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  UNIQUE (inquiry_id, property_id)
);

CREATE INDEX idx_matches_agent_inquiry
  ON matches(agent_id, inquiry_id, score DESC);

CREATE INDEX idx_matches_pending
  ON matches(agent_id, is_shown) WHERE is_shown = FALSE;
```

### 007_billing.sql

```sql
CREATE TABLE billing_histories (
  id              UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id        UUID                  NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  order_id        TEXT                  UNIQUE NOT NULL,
  payment_key     TEXT,
  plan            subscription_plan_t   NOT NULL,
  amount          INTEGER               NOT NULL CHECK (amount > 0),
  status          VARCHAR(20)           NOT NULL
                  CHECK (status IN ('success','failed','cancelled','refunded')),
  failure_reason  TEXT,
  billed_at       TIMESTAMPTZ           NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ           NOT NULL DEFAULT now()
);

CREATE INDEX idx_billing_agent_date
  ON billing_histories(agent_id, billed_at DESC);
```

### 008_stats_functions.sql

```sql
CREATE OR REPLACE FUNCTION get_inquiry_stats(
  p_agent_id UUID, p_start TIMESTAMPTZ, p_end TIMESTAMPTZ
)
RETURNS TABLE (month TEXT, total BIGINT, looking_for BIGINT, listing BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM'),
    COUNT(*),
    COUNT(*) FILTER (WHERE inquiry_type = 'looking_for'),
    COUNT(*) FILTER (WHERE inquiry_type = 'listing')
  FROM customer_inquiries
  WHERE agent_id = p_agent_id AND created_at BETWEEN p_start AND p_end
  GROUP BY DATE_TRUNC('month', created_at) ORDER BY 1;
$$;

CREATE OR REPLACE FUNCTION get_funnel_stats(
  p_agent_id UUID, p_start TIMESTAMPTZ, p_end TIMESTAMPTZ
)
RETURNS TABLE (status TEXT, count BIGINT, ratio NUMERIC)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH total AS (
    SELECT COUNT(*) AS cnt FROM customer_inquiries
    WHERE agent_id = p_agent_id AND created_at BETWEEN p_start AND p_end
  )
  SELECT status::TEXT, COUNT(*),
    ROUND(COUNT(*) * 100.0 / NULLIF((SELECT cnt FROM total), 0), 1)
  FROM customer_inquiries
  WHERE agent_id = p_agent_id AND created_at BETWEEN p_start AND p_end
  GROUP BY status
  ORDER BY ARRAY_POSITION(
    ARRAY['new','contacted','viewing','negotiating','contracted','closed']::TEXT[], status::TEXT
  );
$$;

CREATE OR REPLACE FUNCTION get_listing_status_stats(p_agent_id UUID)
RETURNS TABLE (status TEXT, count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT status::TEXT, COUNT(*) FROM property_listings
  WHERE agent_id = p_agent_id GROUP BY status;
$$;

CREATE OR REPLACE FUNCTION get_listing_category_stats(
  p_agent_id UUID, p_start TIMESTAMPTZ, p_end TIMESTAMPTZ
)
RETURNS TABLE (month TEXT, category TEXT, count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
    UNNEST(category_codes)::TEXT AS category,
    COUNT(*)
  FROM property_listings
  WHERE agent_id = p_agent_id AND created_at BETWEEN p_start AND p_end
  GROUP BY 1, 2 ORDER BY 1, 2;
$$;

CREATE OR REPLACE FUNCTION get_contract_duration_stats(p_agent_id UUID)
RETURNS TABLE (duration_range TEXT, count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    CASE
      WHEN EXTRACT(DAY FROM updated_at - created_at) <= 7  THEN '1주이내'
      WHEN EXTRACT(DAY FROM updated_at - created_at) <= 14 THEN '1~2주'
      WHEN EXTRACT(DAY FROM updated_at - created_at) <= 30 THEN '2~4주'
      WHEN EXTRACT(DAY FROM updated_at - created_at) <= 90 THEN '1~3개월'
      ELSE '3개월이상'
    END,
    COUNT(*)
  FROM customer_inquiries
  WHERE agent_id = p_agent_id AND status = 'contracted'
  GROUP BY 1 ORDER BY MIN(EXTRACT(DAY FROM updated_at - created_at));
$$;
```

### 009_cleanup.sql

```sql
CREATE OR REPLACE FUNCTION cleanup_cancelled_agents()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_count INTEGER;
BEGIN
  DELETE FROM agents
  WHERE subscription_status = 'cancelled'
    AND cancelled_at < now() - INTERVAL '30 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
```

### 012_admin.sql (v3.5 신규)

```sql
-- ── 관리자 계정 테이블 ──
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(50) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'admin',  -- 'superadmin' | 'admin'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 접속 로그 테이블 (중개사 API 호출 추적) ──
CREATE TABLE access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  action VARCHAR(10) NOT NULL,   -- 'GET', 'POST', 'PATCH', 'DELETE'
  path VARCHAR(255) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 관리자 감사 로그 (관리자 쓰기 작업 추적) ──
CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,          -- 'change_agent_status', 'change_agent_plan' 등
  target_type VARCHAR(50) NOT NULL,      -- 'agent', 'billing' 등
  target_id UUID NOT NULL,
  before_value JSONB,
  after_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 인덱스 ──
CREATE INDEX idx_access_logs_agent_created ON access_logs(agent_id, created_at);
CREATE INDEX idx_access_logs_created ON access_logs(created_at);
CREATE INDEX idx_admin_audit_created ON admin_audit_logs(created_at);

-- ── RLS: 정책 없음 → SERVICE_ROLE_KEY만 접근 가능 ──
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- ── access_logs 보관 정리 함수 (90일 기본) ──
CREATE OR REPLACE FUNCTION cleanup_old_access_logs(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE deleted_count INTEGER;
BEGIN
  DELETE FROM access_logs WHERE created_at < now() - make_interval(days => retention_days);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
```

---

## 6. Row Level Security (RLS) 정책

> **v3.1 원칙**: `FOR ALL USING(...)` 단일 정책은 INSERT의 `WITH CHECK` 누락을 야기한다.
> 모든 테이블은 SELECT / INSERT / UPDATE / DELETE를 분리 작성한다.
>
> **v3.2 추가 원칙**: `agents` 테이블의 INSERT는 **서버(SERVICE_ROLE_KEY)만 수행**한다.
> 가입 시 클라이언트(anon key)로 직접 INSERT하지 않는다.
> `POST /auth/register` → NestJS 서버가 SERVICE_ROLE_KEY로 agents INSERT를 실행한다.
> 따라서 agents에 INSERT 정책은 정의하지 않는다.

```sql
-- ────────────────────────────────────────────
-- agents
-- v3.2: INSERT 정책 없음 (서버 SERVICE_ROLE_KEY 전용)
-- 가입 플로우: 클라이언트 → POST /auth/register → NestJS → SERVICE_ROLE_KEY로 INSERT
-- ────────────────────────────────────────────
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY agents_select_own ON agents FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY agents_update_own ON agents FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ────────────────────────────────────────────
-- customer_inquiries
-- v3.2: INSERT는 서버(SERVICE_ROLE_KEY)가 수행한다.
-- 비인증 고객의 접수는 NestJS Public API를 경유하므로
-- 클라이언트 RLS INSERT 정책도 필요 없다.
-- 단, 중개사가 직접 문의를 등록하는 케이스를 위해 INSERT 정책 유지.
-- ────────────────────────────────────────────
ALTER TABLE customer_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY inquiries_select_own ON customer_inquiries FOR SELECT
  USING (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()));
CREATE POLICY inquiries_insert_own ON customer_inquiries FOR INSERT
  WITH CHECK (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()));
CREATE POLICY inquiries_update_own ON customer_inquiries FOR UPDATE
  USING  (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()))
  WITH CHECK (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()));
CREATE POLICY inquiries_delete_own ON customer_inquiries FOR DELETE
  USING (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()));

-- ────────────────────────────────────────────
-- property_listings
-- ────────────────────────────────────────────
ALTER TABLE property_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY listings_select_own ON property_listings FOR SELECT
  USING (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()));
CREATE POLICY listings_insert_own ON property_listings FOR INSERT
  WITH CHECK (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()));
CREATE POLICY listings_update_own ON property_listings FOR UPDATE
  USING  (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()))
  WITH CHECK (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()));
CREATE POLICY listings_delete_own ON property_listings FOR DELETE
  USING (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()));

-- ────────────────────────────────────────────
-- matches
-- ────────────────────────────────────────────
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY matches_select_own ON matches FOR SELECT
  USING (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()));
CREATE POLICY matches_insert_own ON matches FOR INSERT
  WITH CHECK (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()));
CREATE POLICY matches_update_own ON matches FOR UPDATE
  USING  (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()))
  WITH CHECK (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()));

-- ────────────────────────────────────────────
-- billing_histories
-- ────────────────────────────────────────────
ALTER TABLE billing_histories ENABLE ROW LEVEL SECURITY;

CREATE POLICY billing_select_own ON billing_histories FOR SELECT
  USING (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()));
-- INSERT/UPDATE는 서버(SERVICE_ROLE_KEY)만 수행하므로 클라이언트 정책 불필요

-- ────────────────────────────────────────────
-- Storage (버킷: landnote-media, private)
-- 업로드: agents/{agent_id}/ 경로에만 허용
-- ────────────────────────────────────────────
CREATE POLICY storage_insert_own ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'landnote-media'
    AND (storage.foldername(name))[2] = (
      SELECT id::TEXT FROM agents WHERE user_id = auth.uid()
    )
  );
CREATE POLICY storage_delete_own ON storage.objects FOR DELETE
  USING (
    bucket_id = 'landnote-media'
    AND (storage.foldername(name))[2] = (
      SELECT id::TEXT FROM agents WHERE user_id = auth.uid()
    )
  );
-- SELECT 정책 없음: private 버킷은 서버가 SERVICE_ROLE_KEY로 signed URL 발급
```

> **고객 접수 폼 이미지**: 비인증 고객은 Storage 직접 접근 불가.
> NestJS 서버가 `SUPABASE_SERVICE_ROLE_KEY`로 대신 업로드한다.

```sql
-- ────────────────────────────────────────────
-- admin_users, access_logs, admin_audit_logs (v3.5 신규)
-- RLS 활성 + 정책 없음 → SERVICE_ROLE_KEY만 접근 가능
-- 클라이언트(anon key)로는 어떤 조작도 불가
-- ────────────────────────────────────────────
-- ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
-- (정책 없음 — 012_admin.sql에서 RLS 활성화만 수행)
```

---

## 7. 공통 API 응답 규격

### 응답 Envelope

모든 엔드포인트는 아래 형식을 강제한다. Claude Code가 응답 파싱 시 예외 없이 `ok` 필드로 분기한다.

```typescript
// packages/shared/types.ts (4-5절에서 이미 정의됨)
export type ApiResponse<T> =
  | { ok: true;  data: T }
  | { ok: false; error: { code: string; message: string; details?: unknown } };
```

### 에러 코드 세트

| code | HTTP | 사용처 |
|------|------|--------|
| `VALIDATION_ERROR` | 400 | DTO 검증, 가격 3중 검증 실패 |
| `UNAUTHORIZED` | 401 | 토큰 누락 또는 무효 |
| `FORBIDDEN` | 403 | RLS 위반, 권한 부족 |
| `SUBSCRIPTION_EXPIRED` | 403 | SubscriptionGuard 차단 |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `BILLING_FAILED` | 400 | Toss 청구 실패 |
| `STORAGE_UPLOAD_FAILED` | 400 | 이미지 업로드 실패 |
| `PLAN_LIMIT_EXCEEDED` | 403 | 월 매물 한도, 카테고리 변경 제한 초과 |

### NestJS 공통 응답 인터셉터

```typescript
// src/common/interceptors/response.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map(data => ({ ok: true, data })));
  }
}
```

### 글로벌 ExceptionFilter (v3.2 신규)

> **왜 필요한가**: `ResponseInterceptor`만으로는 성공 응답만 `{ ok: true, data }` 형태가 된다.
> NestJS의 `HttpException`이 throw되면 인터셉터를 우회하므로, 에러 응답도 공통 Envelope을
> 따르게 하려면 글로벌 `ExceptionFilter`가 필수다.

```typescript
// src/common/filters/global-exception.filter.ts
import {
  ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = '서버 내부 오류가 발생했습니다';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === 'object' && body !== null) {
        const obj = body as Record<string, unknown>;
        code = (obj['code'] as string) ?? this.statusToCode(status);
        message = (obj['message'] as string) ?? exception.message;
        details = obj['details'] ?? undefined;

        // class-validator 배열 메시지 처리
        if (Array.isArray(obj['message'])) {
          message = (obj['message'] as string[]).join(', ');
          details = obj['message'];
        }
      } else {
        code = this.statusToCode(status);
        message = typeof body === 'string' ? body : exception.message;
      }
    } else {
      this.logger.error('Unhandled exception', exception);
    }

    res.status(status).json({
      ok: false,
      error: { code, message, ...(details ? { details } : {}) },
    });
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      400: 'VALIDATION_ERROR',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      429: 'RATE_LIMITED',
    };
    return map[status] ?? 'INTERNAL_ERROR';
  }
}
```

> `app.module.ts`에서 `APP_FILTER`로 전역 등록한다 (10장 참조).

---

## 8. API 엔드포인트 전체 명세

Base URL: `https://api.landnote.app` (개발: `http://localhost:3001`)  
인증 필요 엔드포인트: `Authorization: Bearer {supabase_access_token}`

### 인증

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | /auth/register | 불필요 | 가입 Step 1 — Supabase Auth signUp() 후 **서버가 SERVICE_ROLE_KEY로** agents INSERT. email은 auth.users와 동일 값을 agents.email에도 저장한다. (이메일 변경은 v2 과제) |
| POST | /auth/login | 불필요 | 로그인 |
| POST | /auth/logout | 필요 | 로그아웃 |
| GET  | /auth/me | 필요 | 내 정보 (agent 레코드 전체) |

> **v3.2 명시**: `/auth/register`와 `/auth/login`은 `@Public()` 데코레이터를 적용하여
> `JwtAuthGuard` 글로벌 적용에서 제외한다 (9장 참조).

### 고객 접수 (Public)

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET  | /public/agent/:agentCode | 불필요 | 중개사 공개 프로필 (agent_name, office_name, phone, selected_categories만) |
| POST | /public/inquiries/:agentCode | 불필요 | 고객 조건 접수 → 응답: { inquiryId } |
| POST | /public/inquiries/:agentCode/images/:inquiryId | 불필요 | 접수 첨부 이미지 (inquiry 생성 후 호출) |

> **v3.2 명시**: `/public/*` 하위 모든 엔드포인트는 `@Public()` 데코레이터를 적용한다.
> `PublicController`에 클래스 레벨로 `@Public()` 적용 권장.

### 문의 관리

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET    | /inquiries | 필요 | 목록 (query: status, inquiry_type, category_code, page, limit) |
| GET    | /inquiries/:id | 필요 | 상세 |
| PATCH  | /inquiries/:id | 필요 | 상태/우선순위/메모 수정 |
| DELETE | /inquiries/:id | 필요 | 삭제 |
### 매물 관리

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET    | /listings | 필요 | 목록 (query: status, category_code, transaction_type, page, limit) |
| GET    | /listings/:id | 필요 | 상세 |
| POST   | /listings | 필요 | 등록 |
| PATCH  | /listings/:id | 필요 | 수정 |
| DELETE | /listings/:id | 필요 | 삭제 |
| POST   | /listings/:id/images | 필요 | 이미지 업로드 (multipart/form-data) |
| DELETE | /listings/:id/images | 필요 | 이미지 삭제 (body: { imagePath: string }) — v3.1: URL 아닌 Storage path |

### 매칭

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET    | /matching | 필요 | 전체 매칭 현황 (미검토 우선 정렬) |
| GET    | /matching/:inquiryId | 필요 | 특정 문의의 매칭 결과 조회 |
| PATCH  | /matching/:matchId | 필요 | is_shown / is_liked 업데이트 |
| POST   | /matching/run/:inquiryId | 필요 | 매칭 재실행 |

### 통계

| Method | Path | 인증 | query 파라미터 | 설명 |
|--------|------|------|--------------|------|
| GET | /stats/summary | 필요 | - | 요약 카드 4종 |
| GET | /stats/inquiries | 필요 | start, end (ISO 8601, 예: 2025-01-01T00:00:00+09:00) | 월별 문의 추이 |
| GET | /stats/funnel | 필요 | start, end (ISO 8601) | 전환 퍼널 |
| GET | /stats/listings/status | 필요 | - | 매물 상태 분포 |
| GET | /stats/listings/categories | 필요 | start, end (ISO 8601) | 카테고리별 등록 추이 |
| GET | /stats/contracts/duration | 필요 | - | 계약 소요 기간 분포 |

> `start` / `end` 파라미터는 ISO 8601 문자열로 전달한다. DB 함수가 `TIMESTAMPTZ`를 받으므로
> 프론트는 `new Date(year, month, 1).toISOString()` 형태로 변환 후 전송한다.
> `YYYY-MM` 또는 `YYYY-MM-DD` 단순 문자열은 Postgres에서 암묵적으로 파싱하지만 타임존이 UTC 고정되므로 사용 금지.
>
> `/stats/listings`를 단일 엔드포인트로 쓰지 않는다. 두 차트가 다른 집계를 사용하므로 `/stats/listings/status`와 `/stats/listings/categories`로 분리한다.

### 구독 및 결제

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET    | /billing/subscription | 필요 | 현재 구독 정보 |
| POST   | /billing/register | 필요 | 빌링키 발급 (가입 시 또는 카드 변경 시 공용) |
| PATCH  | /billing/plan | 필요 | 플랜 변경 (v3.2: 업/다운그레이드 규칙 아래 참조) |
| POST   | /billing/cancel | 필요 | 구독 해지 (cancelled 상태로 변경, 데이터 영구 보존) |
| GET    | /billing/histories | 필요 | 결제 이력 |

#### 플랜 변경 비즈니스 로직 (v3.2 신규)

```
PATCH /billing/plan { plan: 'starter' | 'pro' }

규칙:
  1. 동일 플랜 요청 → 400 VALIDATION_ERROR ("이미 해당 플랜입니다")

  2. 업그레이드 (starter → pro):
     → 즉시 반영: subscription_plan = 'pro'
     → 일할 계산 없음 (다음 결제일에 pro 금액 청구)
     → pending_plan = null (예약 취소)
     → selected_categories 제한을 4개로 확장 (기존 선택 유지)

  3. 다운그레이드 (pro → starter):
     → 즉시 반영하지 않음: pending_plan = 'starter'
     → 현재 결제 주기 끝까지 pro 유지
     → 다음 결제 성공 시 chargeAgent()에서 pending_plan 적용
     → 다운그레이드 적용 시 selected_categories가 2개 초과면:
       먼저 선택한 2개만 유지, 나머지 제거
       (선택 순서 = category_changed_at 기준, 동일하면 배열 앞 2개)

  4. trial 중 플랜 변경:
     → 결제 전이므로 즉시 반영 (업/다운 구분 없음)
     → PATCH /agents/me { subscription_plan } 호출
     → pending_plan 사용하지 않음

  5. expired/cancelled 상태:
     → 403 SUBSCRIPTION_EXPIRED ("구독 활성화 후 변경 가능합니다")
```

```typescript
// src/modules/billing/billing.service.ts — changePlan 메서드
async changePlan(agent: Agent, newPlan: 'starter' | 'pro'): Promise<void> {
  if (agent.subscription_plan === newPlan && !agent.pending_plan) {
    throw new BadRequestException({ code: 'VALIDATION_ERROR', message: '이미 해당 플랜입니다' });
  }

  if (!['trial', 'active'].includes(agent.subscription_status)) {
    throw new ForbiddenException({ code: 'SUBSCRIPTION_EXPIRED', message: '구독 활성화 후 변경 가능합니다' });
  }

  // trial 중: 즉시 반영
  if (agent.subscription_status === 'trial') {
    await this.supabase.from('agents').update({
      subscription_plan: newPlan,
      pending_plan: null,
    }).eq('id', agent.id);
    return;
  }

  // active 상태
  if (newPlan === 'pro' && agent.subscription_plan === 'starter') {
    // 업그레이드: 즉시 반영
    await this.supabase.from('agents').update({
      subscription_plan: 'pro',
      pending_plan: null,
    }).eq('id', agent.id);
  } else {
    // 다운그레이드: 예약
    await this.supabase.from('agents').update({
      pending_plan: newPlan,
    }).eq('id', agent.id);
  }
}
```

### 설정

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| PATCH  | /agents/me | 필요 | 프로필 수정 — subscription_plan 변경 시 'starter' \| 'pro' 만 허용, null 불가 (DTO IsIn 검증) |
| GET    | /agents/me/qr | 필요 | QR코드 URL 목록 |
| PATCH  | /agents/me/categories | 필요 | 카테고리 변경 (스타터 월 1회 제한 적용) |

### DTO 정의 (v3.2 신규)

> 가격 3중 검증의 두 번째 레이어. 프론트(실시간) → **DTO(서버)** → DB CHECK 순서로 검증한다.

#### CreateInquiryDto

```typescript
// src/modules/inquiries/dto/create-inquiry.dto.ts
import {
  IsString, IsOptional, IsArray, IsIn, IsEmail,
  ArrayMinSize, ValidateIf, IsNumber, Min, MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CATEGORY_CODE, TRANSACTION_TYPE } from '@landnote/shared';

const categoryValues = Object.values(CATEGORY_CODE);
const transactionValues = Object.values(TRANSACTION_TYPE);

export class CreateInquiryDto {
  @IsIn(['looking_for', 'listing'])
  inquiry_type: 'looking_for' | 'listing';

  @IsString()
  @MaxLength(50)
  customer_name: string;

  @IsString()
  customer_phone: string; // 서버에서 encryptPhone() 처리

  @IsOptional()
  @IsEmail()
  customer_email?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsIn(categoryValues, { each: true })
  category_codes: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subcategory_codes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsIn(transactionValues, { each: true })
  transaction_types: string[];

  @IsOptional()
  detailed_conditions?: Record<string, unknown>;
}
```

#### CreateListingDto

```typescript
// src/modules/listings/dto/create-listing.dto.ts
import {
  IsString, IsOptional, IsArray, IsIn, IsNumber, Min,
  ArrayMinSize, ValidateIf, MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CATEGORY_CODE, TRANSACTION_TYPE } from '@landnote/shared';

const categoryValues = Object.values(CATEGORY_CODE);
const transactionValues = Object.values(TRANSACTION_TYPE);

export class CreateListingDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(categoryValues, { each: true })
  category_codes: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subcategory_codes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsIn(transactionValues, { each: true })
  transaction_types: string[];

  @IsOptional() @IsString() address_full?: string;
  @IsOptional() @IsString() address_road?: string;
  @IsOptional() @IsString() address_jibun?: string;
  @IsOptional() @IsString() @MaxLength(50) dong_name?: string;
  @IsOptional() @IsNumber() @Type(() => Number) latitude?: number;
  @IsOptional() @IsNumber() @Type(() => Number) longitude?: number;

  // ── 가격 3중 검증 (2/3 레이어: DTO) ──────────────────────────
  // 거래 유형에 따라 조건부 필수. DB CHECK(3/3)과 동일 로직을 DTO에서 먼저 검증한다.
  @ValidateIf(o => o.transaction_types?.includes('sale'))
  @IsNumber() @Min(1) @Type(() => Number)
  price_sale?: number;

  @ValidateIf(o => ['jeonse','monthly_rent','premium_transfer'].some(t => o.transaction_types?.includes(t)))
  @IsNumber() @Min(0) @Type(() => Number)
  deposit?: number;

  @ValidateIf(o => ['monthly_rent','premium_transfer'].some(t => o.transaction_types?.includes(t)))
  @IsNumber() @Min(1) @Type(() => Number)
  monthly_rent?: number;

  @ValidateIf(o => ['jeonse','monthly_rent','premium_transfer'].some(t => o.transaction_types?.includes(t)))
  @IsNumber() @Min(0) @Type(() => Number)
  maintenance_fee?: number;

  @ValidateIf(o => o.transaction_types?.includes('premium_transfer'))
  @IsNumber() @Min(0) @Type(() => Number)
  premium_price?: number;

  @ValidateIf(o => o.transaction_types?.includes('premium_transfer'))
  @IsNumber() @Min(1) @Type(() => Number)
  contract_remaining_months?: number;

  // ── 나머지 선택 필드 ────────────────────────────────────────
  @IsOptional() @IsNumber() @Type(() => Number) premium_floor?: number;
  @IsOptional() @IsNumber() @Type(() => Number) premium_facility?: number;
  @IsOptional() @IsNumber() @Type(() => Number) premium_business?: number;
  @IsOptional() @IsNumber() @Type(() => Number) area_supply?: number;
  @IsOptional() @IsNumber() @Type(() => Number) area_exclusive?: number;
  @IsOptional() @IsNumber() @Type(() => Number) floor_current?: number;
  @IsOptional() @IsNumber() @Type(() => Number) floor_total?: number;
  @IsOptional() @IsNumber() @Type(() => Number) built_year?: number;
  @IsOptional() @IsIn(['남향','남동향','남서향','동향','서향','북향','북동향','북서향']) direction?: string;
  @IsOptional() detail_info?: Record<string, unknown>;
  @IsOptional() @IsString() agent_memo?: string;
  @IsOptional() @IsString() source_inquiry_id?: string;
}
```

> **검증 순서**: `CreateListingDto`의 `@ValidateIf`가 `REQUIRED_PRICE_FIELDS`와 동일한 로직을 구현한다.
> 프론트에서는 `REQUIRED_PRICE_FIELDS`를 import해서 실시간 UI 검증에 사용하고,
> DTO에서는 class-validator로 서버 검증, DB CHECK로 최종 방어한다.

### 관리자 API 엔드포인트 (v3.5 신규)

> **인증 전략**: 모든 admin 컨트롤러는 `@Public()` (글로벌 JwtAuthGuard 우회) + `@UseGuards(AdminAuthGuard)` (관리자 인증) 조합을 사용한다.
> 단, 관리자 인증 컨트롤러의 로그인 엔드포인트는 가드 없이 `@Public()`만 적용한다.

#### 관리자 인증

| Method | Path | Guard | 설명 |
|--------|------|-------|------|
| `POST` | `/admin/auth/login` | 없음 (Public only) | 관리자 로그인 → Supabase signIn + admin_users 검증 |
| `GET` | `/admin/auth/me` | AdminAuthGuard | 현재 관리자 정보 |
| `POST` | `/admin/auth/logout` | AdminAuthGuard | 로그아웃 |

#### 중개사 관리

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/admin/agents` | 전체 중개사 목록 (검색/필터/페이지네이션) |
| `GET` | `/admin/agents/:id` | 중개사 상세 (billing_key 제외, phone 복호화) |
| `PATCH` | `/admin/agents/:id/status` | 구독 상태 수동 변경 + 감사 로그 |
| `PATCH` | `/admin/agents/:id/plan` | 플랜 수동 변경 + 감사 로그 |
| `GET` | `/admin/agents/:id/inquiries` | 특정 중개사의 문의 목록 |
| `GET` | `/admin/agents/:id/listings` | 특정 중개사의 매물 목록 |
| `GET` | `/admin/agents/:id/activity` | 특정 중개사의 최근 활동 로그 |

**쿼리 파라미터 (목록):** `?search=&status=&plan=&page=1&limit=20&sort=created_at&order=desc`

#### 수익 관리

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/admin/revenue/summary` | MRR, ARR, ARPU, 총매출, 이번달 매출 |
| `GET` | `/admin/revenue/history` | 전체 결제 이력 (query: status, page, limit) |
| `GET` | `/admin/revenue/trend` | 월별 매출 추이 (query: months=12) |
| `GET` | `/admin/revenue/failed` | 실패 결제 목록 |
| `GET` | `/admin/revenue/plan-distribution` | 플랜별 가입자 분포 |

#### 플랫폼 통계

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/admin/stats/kpis` | 핵심 KPI (총 중개사, 활성, 신규, MRR) |
| `GET` | `/admin/stats/access` | DAU/WAU/MAU (access_logs 기반) |
| `GET` | `/admin/stats/access/trend` | 일별 접속자 추이 (query: days=30) |
| `GET` | `/admin/stats/agents/growth` | 월별 가입자 증가 추이 |
| `GET` | `/admin/stats/inquiries/total` | 플랫폼 전체 문의 통계 |
| `GET` | `/admin/stats/listings/total` | 플랫폼 전체 매물 통계 |

---

## 9. 인증 및 권한 미들웨어

### @Public() 데코레이터 (v3.2 신규)

```typescript
// src/common/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

### JwtAuthGuard (NestJS)

> **v3.2 변경**: `APP_GUARD`로 글로벌 등록하되, `@Public()` 데코레이터가 있으면 건너뛴다.

```typescript
// src/common/guards/jwt-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createClient } from '@supabase/supabase-js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // @Public() 데코레이터가 있으면 인증 건너뛰기
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('인증 토큰이 없습니다');

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) throw new UnauthorizedException('유효하지 않은 토큰입니다');

    const { data: agent } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!agent) throw new UnauthorizedException('등록된 중개사 정보가 없습니다');

    req.agent = agent;
    return true;
  }
}
```

### SubscriptionGuard (NestJS)

```typescript
// src/common/guards/subscription.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const agent = context.switchToHttp().getRequest().agent;
    if (!agent) throw new ForbiddenException('인증이 필요합니다');

    if (!['trial', 'active'].includes(agent.subscription_status)) {
      throw new ForbiddenException({
        code: 'SUBSCRIPTION_EXPIRED',
        message: '구독이 만료되었습니다.',
      });
    }
    return true;
  }
}
```

### CurrentAgent 데코레이터

```typescript
// src/common/decorators/current-agent.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export const CurrentAgent = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().agent,
);
```

### AdminAuthGuard (v3.5 신규)

> **JwtAuthGuard와의 관계**: 관리자 컨트롤러는 `@Public()`로 글로벌 JwtAuthGuard를 우회하고,
> `@UseGuards(AdminAuthGuard)`로 관리자 전용 인증을 수행한다.
> 관리자 인증 컨트롤러의 로그인 엔드포인트에는 AdminAuthGuard를 적용하지 않는다 (데드락 방지).

```typescript
// src/common/guards/admin-auth.guard.ts
@Injectable()
export class AdminAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('인증 토큰이 없습니다');

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) throw new UnauthorizedException('유효하지 않은 토큰입니다');

    const { data: admin } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!admin) throw new ForbiddenException('관리자 권한이 필요합니다');
    if (!admin.is_active) throw new ForbiddenException('비활성화된 관리자 계정입니다');

    req.admin = admin;
    return true;
  }
}
```

### CurrentAdmin 데코레이터 (v3.5 신규)

```typescript
// src/common/decorators/current-admin.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export const CurrentAdmin = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().admin,
);
```

### AccessLogInterceptor (v3.5 신규)

> **왜 Middleware가 아닌 Interceptor인가**: NestJS 요청 생명주기는 Middleware → Guard → Interceptor 순이다.
> `req.agent`는 JwtAuthGuard(Guard)에서 설정되므로, Middleware에서는 접근할 수 없다.
> Interceptor는 Guard 이후에 실행되어 `req.agent`에 안전하게 접근 가능하다.

```typescript
// src/common/interceptors/access-log.interceptor.ts
@Injectable()
export class AccessLogInterceptor implements NestInterceptor {
  private supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();
    return next.handle().pipe(
      tap(() => {
        if (req.agent?.id) {
          this.supabase.from('access_logs').insert({
            agent_id: req.agent.id,
            action: req.method,
            path: req.route?.path || req.path,
            ip_address: req.ip,
            user_agent: req.headers['user-agent']?.substring(0, 500),
          }).then();  // fire-and-forget — 응답 지연 없음
        }
      })
    );
  }
}
```

> admin 요청은 `req.agent`가 없으므로 자동으로 스킵된다.

### Next.js 미들웨어 (라우트 보호)

> **주의**: Next.js App Router의 route group `(dashboard)`는 실제 URL에 포함되지 않는다.
> `pathname.startsWith('/(dashboard)')` 는 **절대 동작하지 않는다**.
> 대신 보호할 실제 경로 패턴을 matcher에 직접 열거한다.

```typescript
// apps/web/middleware.ts
// @supabase/auth-helpers-nextjs는 deprecated. @supabase/ssr을 사용한다.
// pnpm add @supabase/ssr
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // getUser()는 만료된 토큰을 자동 갱신한다 (getSession은 갱신 안 함)
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = req.nextUrl;

  // ── 관리자 대시보드 보호 (v3.5 신규) ──
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
    const isAdmin = user.app_metadata?.is_admin === true;
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  // ── 중개사 대시보드 보호 ──
  if (pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if ((pathname === '/login' || pathname.startsWith('/register')) && user) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register/:path*', '/admin/:path*'],
};
```

---

## 10. NestJS 모듈 구조 및 등록 (v3.2 신규)

> **왜 필요한가**: Guard, Filter, Interceptor 코드가 있어도 모듈에 등록하지 않으면 동작하지 않는다.
> 모듈 간 의존 관계(imports/exports)가 잘못되면 순환 의존성 에러가 발생한다.
> 이 절은 모든 모듈의 조립 구조를 확정한다.

### AppModule (루트)

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ValidationPipe } from '@nestjs/common';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AccessLogInterceptor } from './common/interceptors/access-log.interceptor'; // v3.5

import { AuthModule } from './modules/auth/auth.module';
import { AgentsModule } from './modules/agents/agents.module';
import { InquiriesModule } from './modules/inquiries/inquiries.module';
import { ListingsModule } from './modules/listings/listings.module';
import { MatchingModule } from './modules/matching/matching.module';
import { BillingModule } from './modules/billing/billing.module';
import { StatsModule } from './modules/stats/stats.module';
import { StorageModule } from './modules/storage/storage.module';
import { EmailModule } from './modules/email/email.module';
import { AdminModule } from './modules/admin/admin.module'; // v3.5

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    AgentsModule,
    InquiriesModule,
    ListingsModule,
    MatchingModule,
    BillingModule,
    StatsModule,
    StorageModule,
    EmailModule,
    AdminModule,    // v3.5 신규
  ],
  providers: [
    // ── 글로벌 가드: @Public() 없으면 인증 필수 ──
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // ── 글로벌 예외 필터: 모든 에러를 { ok: false, error } 형태로 변환 ──
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    // ── 글로벌 인터셉터: 성공 응답을 { ok: true, data } 로 래핑 ──
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    // ── 글로벌 인터셉터: 중개사 API 호출 로깅 (v3.5) ──
    { provide: APP_INTERCEPTOR, useClass: AccessLogInterceptor },
    // ── 글로벌 ValidationPipe: DTO class-validator 자동 적용 ──
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,           // DTO에 정의되지 않은 필드 제거
        forbidNonWhitelisted: true, // 정의되지 않은 필드가 있으면 400
        transform: true,           // @Type() 데코레이터 자동 변환
      }),
    },
  ],
})
export class AppModule {}
```

### main.ts

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.APP_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  // ValidationPipe은 AppModule에서 APP_PIPE로 등록했으므로 여기서 중복 등록하지 않는다.

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`API running on :${port}`);
}
bootstrap();
```

### 개별 모듈 정의

> **핵심 규칙**: 모듈 간 순환 의존성을 방지하기 위해 `EmailModule`은 가장 하위 레이어로 유지한다.
> `BillingModule`이 `EmailModule`을 import하고, 그 반대는 없다.

```typescript
// src/modules/email/email.module.ts
import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

@Module({
  providers: [EmailService],
  exports: [EmailService],   // 다른 모듈에서 import 가능
})
export class EmailModule {}
```

```typescript
// src/modules/storage/storage.module.ts
import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';

@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
```

```typescript
// src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],         // 가입 시 환영 이메일 발송
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
```

```typescript
// src/modules/agents/agents.module.ts
import { Module } from '@nestjs/common';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';

@Module({
  controllers: [AgentsController],
  providers: [AgentsService],
  exports: [AgentsService],       // 다른 모듈에서 agent 조회 필요 시
})
export class AgentsModule {}
```

```typescript
// src/modules/inquiries/inquiries.module.ts
import { Module } from '@nestjs/common';
import { InquiriesController } from './inquiries.controller';
import { InquiriesService } from './inquiries.service';
import { StorageModule } from '../storage/storage.module';
import { EmailModule } from '../email/email.module';
import { MatchingModule } from '../matching/matching.module';

@Module({
  imports: [StorageModule, EmailModule, MatchingModule],
  controllers: [InquiriesController],
  providers: [InquiriesService],
})
export class InquiriesModule {}
```

```typescript
// src/modules/listings/listings.module.ts
import { Module } from '@nestjs/common';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [ListingsController],
  providers: [ListingsService],
})
export class ListingsModule {}
```

```typescript
// src/modules/matching/matching.module.ts
import { Module } from '@nestjs/common';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';

@Module({
  controllers: [MatchingController],
  providers: [MatchingService],
  exports: [MatchingService],     // InquiriesModule에서 매칭 재실행 시 사용
})
export class MatchingModule {}
```

```typescript
// src/modules/billing/billing.module.ts
import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { BillingScheduler } from './billing.scheduler';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],         // 결제 성공/실패 이메일
  controllers: [BillingController],
  providers: [BillingService, BillingScheduler],
  exports: [BillingService],
})
export class BillingModule {}
```

```typescript
// src/modules/stats/stats.module.ts
import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
```

### 모듈 의존성 다이어그램

```
AppModule
  ├── AuthModule         → EmailModule
  ├── AgentsModule
  ├── InquiriesModule    → StorageModule, EmailModule, MatchingModule
  ├── ListingsModule     → StorageModule
  ├── MatchingModule
  ├── BillingModule      → EmailModule
  ├── StatsModule
  ├── StorageModule
  ├── EmailModule        (의존성 없음 — 최하위 레이어)
  └── AdminModule        (의존성 없음 — SERVICE_ROLE_KEY로 직접 DB 접근) ← v3.5
```

> **순환 방지 규칙**:
> - `EmailModule`은 다른 모듈을 import하지 않는다.
> - `StorageModule`은 다른 모듈을 import하지 않는다.
> - `MatchingModule`은 `InquiriesModule`을 import하지 않는다 (역방향 의존 금지).

---

## 11. 메인 랜딩 및 가입 온보딩

### 랜딩 페이지 섹션 구성

```
[헤더]
  로고 + 네비게이션(기능/요금제/FAQ) + "무료로 시작하기" CTA

[Hero]
  헤드라인: "공인중개사만을 위한 나만의 부동산 CRM"
  서브: "고객은 QR 하나로 조건 접수, 중개사는 앱 하나로 매물·고객 통합 관리"
  CTA: [7일 무료 체험 시작] → /register
  우측: 대시보드 목업 이미지

[Pain Point] — "이런 경험 있으신가요?"
  • 엑셀·수첩에 흩어진 매물·고객 정보
  • 고객이 조건을 설명할 때마다 전화로 다시 물어보는 상황
  • 어떤 고객에게 어떤 매물이 맞는지 기억이 안 남
  • 타 플랫폼에 올린 내 매물이 경쟁 중개사에게도 노출

[Solution — 3열 카드]
  1. 나만의 QR/링크 → 고객이 조건 직접 입력
  2. 자동 매칭 → 내 매물과 고객 조건 자동 연결
  3. 완전 격리 → 내 데이터는 나만

[기능 소개] — 탭 또는 스크롤 애니메이션
  • 4단계 고객 접수 폼 목업
  • 스마트 매칭 대시보드
  • 통계 차트
  • QR코드 발급

[요금제] — 데코이 효과 적용
  스타터 10,000원/월    vs    PRO 15,000원/월 ← [추천] 배지
  카테고리 2개          vs    4개 전체
  매물 월 50건          vs    무제한
  QR 1개               vs    4개(카테고리별)
  이미지 5장/매물       vs    20장/매물
  * 7일 무료 체험 후 자동 결제 / 언제든 해지 가능

[FAQ]
  Q. 고객이 앱을 설치해야 하나요?
  A. 아닙니다. 링크나 QR로 접속해 조건만 입력합니다.

  Q. 내 매물이 다른 중개사에게 보이나요?
  A. 절대 보이지 않습니다. 데이터는 중개사별로 완전히 격리됩니다.

  Q. 카테고리를 나중에 바꿀 수 있나요?
  A. 스타터는 월 1회, 프로는 무제한 변경 가능합니다.

  Q. 무료 체험 중 결제가 되나요?
  A. 카드를 등록해도 7일간 결제되지 않습니다. 체험 종료 후 자동 결제됩니다.

  Q. 구독을 해지하면 데이터는 어떻게 되나요?
  A. 해지하더라도 회원님의 매물과 데이터는 영구적으로 안전하게 보존됩니다. 언제든 다시 구독하시면 모든 데이터를 그대로 이어서 사용하실 수 있습니다.

[하단 CTA]
  "지금 바로 시작해보세요"  [7일 무료 체험 시작]

[푸터]
  이용약관 / 개인정보처리방침 / 문의: help@landnote.app
```

### 가입 4단계 온보딩 플로우

```
Step 1 /register — 기본 정보
  필수: 이름, 이메일, 비밀번호, 전화번호, 공인중개사 자격증 번호
  선택: 사무소명
  → 서버: POST /auth/register (@Public)
    → AuthService가 Supabase Auth signUp() 실행
    → 성공 시 SERVICE_ROLE_KEY로 agents INSERT (trial 상태, trial_ends_at = now() + 7d)
    → EmailService.sendWelcome() 호출
  → 이 단계에서 agents 레코드는 subscription_plan = 'starter' 기본값으로 생성됨
  → 클라이언트: 응답의 session으로 자동 로그인 처리

Step 2 /register/plan — 플랜 선택
  스타터 / 프로 카드 UI
  → 선택 후 PATCH /agents/me { subscription_plan: 'starter' | 'pro' } 호출
  → 플랜 반영 완료 후 다음 단계로 이동
  → 이 시점은 아직 trial, 결제 전이므로 플랜 변경 허용
  → **유효성 검사**: selected_plan이 null이면 "다음" 버튼 비활성화. null인 채로 API 호출 금지.

Step 3 /register/billing — 카드 등록
  안내 문구: "7일 무료 체험 후 자동 결제됩니다"
  [Toss 카드 등록] → Toss SDK requestBillingAuth()
  successUrl: {APP_URL}/register/billing/success
  failUrl:    {APP_URL}/register/billing/fail

  /register/billing/success
  → searchParams에서 authKey 추출
  → POST /billing/register 호출
  → 빌링키 발급 + agents 업데이트 (billing_key 저장, subscription_status는 여전히 'trial')
  → /register/done으로 이동

Step 4 /register/done — 완료
  "환영합니다, {이름} 중개사님"
  "7일 무료 체험이 시작되었습니다"
  [대시보드로 이동]
```

> **카드 변경(기존 중개사)**: `/dashboard/settings/billing` 에서 Toss 카드 등록.
> successUrl: `{APP_URL}/dashboard/settings/billing/success`
> 가입 온보딩과 콜백 URL이 다르므로 같은 `/billing/register` 엔드포인트를 재사용한다.

### 온보딩 Zustand 상태

```typescript
// apps/web/lib/stores/register-store.ts
import { create } from 'zustand';

interface RegisterStore {
  email: string;
  password: string;
  agent_name: string;
  phone: string;
  license_number: string;
  office_name: string;
  selected_plan: 'starter' | 'pro' | null;
  setField: <K extends keyof Omit<RegisterStore, 'setField' | 'reset'>>(
    key: K, value: RegisterStore[K]
  ) => void;
  reset: () => void;
}

export const useRegisterStore = create<RegisterStore>((set) => ({
  email: '', password: '', agent_name: '', phone: '',
  license_number: '', office_name: '', selected_plan: null,
  setField: (key, value) => set({ [key]: value }),
  reset: () => set({
    email: '', password: '', agent_name: '', phone: '',
    license_number: '', office_name: '', selected_plan: null,
  }),
}));
```

---

## 12. 4단계 고객 접수 UX

### 라우팅

```
/form/[agentCode]              → 1단계: 거래 방향 선택
/form/[agentCode]/category     → 2단계: 메인 카테고리
/form/[agentCode]/detail       → 3단계: 세부 태그
/form/[agentCode]/input        → 4단계: 가격·조건 입력
/form/[agentCode]/done         → 접수 완료
```

### 고객 접수 — 제출 순서 (이미지가 있는 경우)

```
4단계 [제출] 버튼 클릭 시:

1. POST /public/inquiries/:agentCode
   → inquiry 레코드 생성 → 응답: { inquiryId }
   → 서버: SERVICE_ROLE_KEY로 customer_inquiries INSERT
   → customer_phone은 encryptPhone() 처리 후 저장

2. images가 있으면:
   → Zustand images 배열 순회
   → 각 { dataUrl, mimeType, fileName } → Blob 변환
   → POST /public/inquiries/:agentCode/images/:inquiryId (multipart/form-data)
   → 서버가 Storage에 업로드 후 customer_inquiries.images JSONB 필드에 path 추가

3. /form/[agentCode]/done 이동

주의: inquiry 생성 이전에 이미지를 업로드하면 inquiry_id가 없으므로
      Storage 경로 구성 불가. 반드시 1번 완료 후 2번 실행.
```

> **서버 Storage 경로**: `agents/{agent_id}/inquiries/{inquiry_id}/{timestamp}.{ext}`
> agent_id는 서버가 agentCode로 조회해서 채운다. 클라이언트는 agentCode만 알면 됨.

### 고객 접수 Public API 경로 보완

```typescript
// /form/[agentCode]/page.tsx (서버 컴포넌트)
// agentCode로 agents 조회 → 없으면 notFound()
// 반환: { agent_name, office_name, phone, selected_categories, subscription_plan }
// 매물 정보, 고객 정보 등 민감 데이터는 절대 포함하지 않음
```

### 2단계 카테고리 노출 규칙

```
표시 카테고리 = agent.selected_categories (중개사가 설정한 것만)
스타터: selected_categories에서 최대 2개 → 고객에게 그대로 표시
프로:   selected_categories에서 최대 4개 → 고객에게 그대로 표시
복수 선택 허용
```

### 4단계 필수 필드 규칙

```
inquiry_type = 'looking_for':
  필수: customer_name, customer_phone, transaction_types (최소 1개)
  선택: price_max, deposit_max, monthly_rent_max, area_min, area_max, preferred_dong, memo

inquiry_type = 'listing':
  필수: customer_name, customer_phone, transaction_types + REQUIRED_PRICE_FIELDS 참조
  추가: address_full, area_exclusive, floor_current (선택)
```

### 폼 Zustand 상태

```typescript
// apps/web/lib/stores/form-store.ts
import { create } from 'zustand';

interface FormStore {
  step: 1 | 2 | 3 | 4;
  agentCode: string;
  inquiry_type: 'looking_for' | 'listing' | null;
  category_codes: CategoryCode[];
  subcategory_codes: string[];
  tags: string[];
  transaction_types: TransactionType[];
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  detailed_conditions: Record<string, unknown>;
  // File 객체는 Next.js 페이지 이동 시 소멸됨.
  // base64 DataURL 문자열로 저장하고 제출 시 Blob으로 변환해서 전송한다.
  images: { dataUrl: string; mimeType: string; fileName: string }[];

  setInquiryType: (t: FormStore['inquiry_type']) => void;
  toggleCategory: (code: CategoryCode, max: number) => void;
  toggleSubcategory: (code: string) => void;
  toggleTag: (tag: string) => void;
  setCondition: (key: string, value: unknown) => void;
  addImage: (dataUrl: string, mimeType: string, fileName: string) => void;
  removeImage: (index: number) => void;
  reset: () => void;
}

export const useFormStore = create<FormStore>((set, get) => ({
  step: 1, agentCode: '', inquiry_type: null,
  category_codes: [], subcategory_codes: [], tags: [],
  transaction_types: [], customer_name: '', customer_phone: '',
  customer_email: '', detailed_conditions: {}, images: [],

  setInquiryType: (t) => set({ inquiry_type: t }),

  toggleCategory: (code, max) => {
    const prev = get().category_codes;
    if (prev.includes(code)) {
      set({ category_codes: prev.filter(c => c !== code) });
    } else if (prev.length < max) {
      set({ category_codes: [...prev, code] });
    }
    // max 초과 시 무시 — 업그레이드 안내 모달은 UI 레이어에서 처리
  },

  toggleSubcategory: (code) => {
    const prev = get().subcategory_codes;
    set({ subcategory_codes: prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code] });
  },

  toggleTag: (tag) => {
    const prev = get().tags;
    set({ tags: prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag] });
  },

  setCondition: (key, value) =>
    set(s => ({ detailed_conditions: { ...s.detailed_conditions, [key]: value } })),

  addImage: (dataUrl, mimeType, fileName) =>
    set(s => ({ images: [...s.images, { dataUrl, mimeType, fileName }] })),

  removeImage: (index) =>
    set(s => ({ images: s.images.filter((_, i) => i !== index) })),

  reset: () => set({
    step: 1, inquiry_type: null, category_codes: [], subcategory_codes: [],
    tags: [], transaction_types: [], customer_name: '', customer_phone: '',
    customer_email: '', detailed_conditions: {}, images: [],
  }),
}));
```

---

## 13. 중개사 대시보드 — 화면 목록 및 기능

### 화면 목록

| 경로 | 화면명 | 주요 기능 |
|------|--------|---------|
| /dashboard | 메인 현황 | 요약 카드 4개, 최근 문의 5건, 매칭 대기 알림 |
| /dashboard/inquiries | 문의 목록 | 필터(상태/유형/카테고리), 정렬, 상태 변경 |
| /dashboard/inquiries/[id] | 문의 상세 | 고객 정보, 조건, 메모, 매칭 결과 |
| /dashboard/listings | 매물 목록 | 필터, 정렬, 빠른 상태 변경 |
| /dashboard/listings/new | 매물 등록 | 단계형 입력폼 (4단계와 구조 동일) |
| /dashboard/listings/[id] | 매물 상세/수정 | 정보 수정, 이미지 관리 |
| /dashboard/matching | 매칭 센터 | 미검토 우선 정렬, 점수·상세 확인 |
| /dashboard/stats | 통계 | 요약 카드 + 차트 5종 + 기간 필터 |
| /dashboard/links | 링크/QR | 접수 링크 복사, QR 이미지 다운로드 |
| /dashboard/settings | 설정 | 프로필, 카테고리, 구독 정보 |
| /dashboard/settings/billing | 결제 | 카드 변경, 플랜 변경, 결제 이력 |

### 요약 카드 API 응답 구조

```typescript
// GET /stats/summary
interface SummaryStats {
  new_inquiries: {
    count: number;
    diff_from_last_period: number;  // 양수=증가, 음수=감소
  };
  active_listings: {
    count: number;
    diff_from_last_month: number;
  };
  contracts_this_month: {
    count: number;
  };
  pending_matches: {
    count: number;  // score >= 0.6 AND is_shown = false
  };
}
```

### 카테고리 변경 월 1회 제한 로직

```typescript
// PATCH /agents/me/categories
async changeCategories(agent: Agent, newCategories: CategoryCode[]): Promise<void> {
  const limits = PLAN_LIMITS[agent.subscription_plan];

  // 개수 제한
  if (newCategories.length > limits.max_categories) {
    throw new BadRequestException(`최대 ${limits.max_categories}개까지 선택 가능합니다`);
  }

  // 스타터 월 1회 제한
  if (limits.category_changes_per_month > 0 && agent.category_changed_at) {
    const lastChanged = new Date(agent.category_changed_at);
    const now = new Date();
    const sameMonth =
      lastChanged.getFullYear() === now.getFullYear() &&
      lastChanged.getMonth() === now.getMonth();
    if (sameMonth) {
      throw new ForbiddenException('스타터 플랜은 카테고리를 월 1회만 변경할 수 있습니다');
    }
  }

  await this.supabase.from('agents').update({
    selected_categories: newCategories,
    category_changed_at: new Date().toISOString(),
  }).eq('id', agent.id);
}
```

---

## 14. 스마트 매칭 알고리즘

### 핵심 원칙

- 매칭은 중개사 대시보드에서만 확인 가능. 고객은 결과를 볼 수 없다.
- 해당 중개사의 활성 매물(`status = 'active'`)과 문의만 대상.
- 점수 0.6 이상만 저장.

### 가중치

```typescript
// src/modules/matching/matching.constants.ts
export const MATCH_WEIGHTS = {
  category: 0.30,
  price:    0.35,
  area:     0.20,
  location: 0.15,
} as const;
```

### 매칭 서비스

```typescript
// src/modules/matching/matching.service.ts
import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { MATCH_WEIGHTS } from './matching.constants';

@Injectable()
export class MatchingService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  async runMatching(agentId: string, inquiryId: string) {
    const { data: inquiry, error: iErr } = await this.supabase
      .from('customer_inquiries')
      .select('*')
      .eq('id', inquiryId)
      .eq('agent_id', agentId)
      .single();
    if (iErr || !inquiry) throw new NotFoundException('문의를 찾을 수 없습니다');

    // v3.1: category_codes가 category_code_t[] 이므로 .overlaps() 사용 가능
    // JSONB 시절의 복잡한 OR 필터 불필요
    const { data: listings, error: lErr } = await this.supabase
      .from('property_listings')
      .select('*')
      .eq('agent_id', agentId)
      .eq('status', 'active')
      .overlaps('category_codes', inquiry.category_codes);

    if (lErr) throw new InternalServerErrorException('매물 조회 실패');

    const scored = (listings ?? [])
      .map(listing => {
        const breakdown = this.score(inquiry, listing);
        const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
        return { listing, score: total, breakdown };
      })
      .filter(m => m.score >= 0.6)
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      await this.supabase.from('matches').upsert(
        scored.map(m => ({
          agent_id: agentId,
          inquiry_id: inquiryId,
          property_id: m.listing.id,
          score: Math.round(m.score * 1000) / 1000,
          score_breakdown: m.breakdown,
          is_shown: false,
          is_liked: false,
        })),
        { onConflict: 'inquiry_id,property_id' }
      );
    }

    return scored;
  }

  private score(inquiry: any, listing: any) {
    const cond = inquiry.detailed_conditions;
    const bd = { category: 0, price: 0, area: 0, location: 0 };

    // 카테고리
    if (inquiry.category_codes.some((c: string) => listing.category_codes.includes(c))) {
      bd.category = MATCH_WEIGHTS.category;
    }

    // 가격
    bd.price = this.priceScore(cond, listing) * MATCH_WEIGHTS.price;

    // 면적
    if (cond?.area_min && listing.area_exclusive) {
      if (listing.area_exclusive >= cond.area_min) {
        const withinMax = !cond.area_max || listing.area_exclusive <= cond.area_max;
        bd.area = withinMax ? MATCH_WEIGHTS.area : MATCH_WEIGHTS.area * 0.5;
      }
    }

    // 위치 (dong_name 기반, Phase 5에서 PostGIS로 고도화)
    if (cond?.preferred_dong && listing.dong_name) {
      const preferred: string[] = Array.isArray(cond.preferred_dong)
        ? cond.preferred_dong : [cond.preferred_dong];
      if (preferred.includes(listing.dong_name)) bd.location = MATCH_WEIGHTS.location;
    }

    return bd;
  }

  private priceScore(cond: any, listing: any): number {
    if (listing.price_sale && cond?.price_max) {
      if (listing.price_sale > cond.price_max) return 0;
      const ratio = listing.price_sale / cond.price_max;
      return ratio <= 0.9 ? 1.0 : 1.0 - (ratio - 0.9) * 2;
    }
    if (listing.monthly_rent && cond?.monthly_rent_max) {
      return listing.monthly_rent <= cond.monthly_rent_max ? 1.0 : 0;
    }
    if (listing.deposit && cond?.deposit_max) {
      return listing.deposit <= cond.deposit_max ? 1.0 : 0;
    }
    return 0.3; // 가격 조건 없을 때 기본 부분 점수
  }
}
```

### 매칭 대시보드 화면 구조

```
/dashboard/matching

[매칭 센터]  미검토 7건

문의 목록 (미검토 매칭 있는 건 상단 우선)
  김철수 | 주거용/매매 | 4억 이하   [매칭 3건] [검토]
  이영희 | 상업용/월세 | 보증금 1천 [매칭 1건] [검토]
  박민준 | 산업용/매매 | 20억 이하  [매칭 0건]

[검토 패널 — 우측 또는 드로어]
고객 조건
  아파트/매매 | 4억 이하 | 85㎡ 이상 | 강남·서초구

매칭 결과 3건

1위  91점
  서초구 반포동 래미안 101동 1202호
  매매 3억 8천 / 전용 84㎡ / 남향
  카테고리 ✓  가격 ✓  면적 ✓  위치 ✓
  [안내 완료] [관심] [매물 상세]

2위  74점
  강남구 대치동 은마 203동 504호
  매매 3억 5천 / 전용 76㎡ / 동향
  카테고리 ✓  가격 ✓  면적 △  위치 ✓
  [안내 완료] [관심] [매물 상세]
```

---

## 15. 통계 대시보드

### 차트 5종 — API 매핑

| 차트명 | 차트 타입 | API 엔드포인트 | 기간 필터 |
|--------|---------|--------------|---------|
| 문의 유입 추이 | LineChart | GET /stats/inquiries | 주간/월간/연간 |
| 매물 상태 분포 | PieChart(도넛) | GET /stats/listings/status | 없음 |
| 문의 전환 퍼널 | 커스텀 Bar | GET /stats/funnel | 주간/월간/연간 |
| 카테고리별 등록 | BarChart | GET /stats/listings/categories | 월간/연간 |
| 계약 소요 기간 | BarChart(수평) | GET /stats/contracts/duration | 없음 |

### 문의 유입 차트 컴포넌트

```typescript
// components/charts/InquiryTrendChart.tsx
'use client';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  data: { month: string; looking_for: number; listing: number }[];
}

export function InquiryTrendChart({ data }: Props) {
  return (
    <Card>
      <CardHeader><CardTitle>문의 유입 추이</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="looking_for" name="찾는 분"
              stroke="#6366f1" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="listing" name="내놓는 분"
              stroke="#f59e0b" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

---

## 16. 이미지 업로드 시스템

### Storage 버킷

```
버킷명: landnote-media (private)
  → 인증 없이 URL 직접 접근 불가
  → getPublicUrl() 사용 금지 (private 버킷에서 의미 없는 URL 반환)
  → DB에는 path만 저장. 조회 시 서버가 createSignedUrl()로 1시간짜리 URL 발급

경로 규칙:
  agents/{agent_id}/listings/{listing_id}/{timestamp}.{ext}
  agents/{agent_id}/inquiries/{inquiry_id}/{timestamp}.{ext}
```

### 제한 값

| 항목 | 값 |
|------|---|
| 단일 파일 최대 | 10MB |
| 허용 MIME | image/jpeg, image/png, image/webp, image/heic |
| 클라이언트 리사이징 | 1920px(긴 변), JPEG 85% |
| 스타터 매물당 최대 | 5장 |
| 프로 매물당 최대 | 20장 |

### 업로드 플로우

```
1. 클라이언트: 파일 선택 → MIME·크기 검증 → canvas API로 리사이징
   → base64 DataURL로 변환해 Zustand 저장 (File 객체는 Next.js 페이지 이동 시 소멸)
2. 제출 시 DataURL → Blob → POST /listings/:id/images (multipart/form-data)
3. 서버: 2차 검증 → SERVICE_ROLE_KEY로 Storage 업로드
4. 서버: property_listings.images JSONB에 { path, is_representative, label, uploaded_at } 추가
   (signed_url은 DB 저장 금지 — 조회 시 매번 발급)
5. 응답: { path: string }
```

### StorageService (v3.1)

```typescript
// src/modules/storage/storage.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_SIZE = 10 * 1024 * 1024;
const SIGNED_URL_EXPIRES = 60 * 60; // 1시간

@Injectable()
export class StorageService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  async uploadListingImage(
    agentId: string,
    listingId: string,
    file: Express.Multer.File,
    currentImages: { path: string; is_representative: boolean }[],
    maxImages: number,
  ): Promise<{ path: string }> {
    if (!ALLOWED.includes(file.mimetype))
      throw new BadRequestException('허용되지 않는 파일 형식입니다');
    if (file.size > MAX_SIZE)
      throw new BadRequestException('파일 크기는 10MB를 초과할 수 없습니다');
    if (currentImages.length >= maxImages)
      throw new BadRequestException(`이미지는 최대 ${maxImages}장까지 등록 가능합니다`);

    const ext = file.originalname.split('.').pop() ?? 'jpg';
    const storagePath = `agents/${agentId}/listings/${listingId}/${Date.now()}.${ext}`;

    const { error } = await this.supabase.storage
      .from('landnote-media')
      .upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: false });

    if (error) throw new BadRequestException(`업로드 실패: ${error.message}`);

    const newImage = {
      path: storagePath,
      is_representative: currentImages.length === 0, // 첫 이미지가 자동으로 대표
      label: null,
      uploaded_at: new Date().toISOString(),
    };

    await this.supabase
      .from('property_listings')
      .update({ images: [...currentImages, newImage] })
      .eq('id', listingId)
      .eq('agent_id', agentId);

    return { path: storagePath };
  }

  // v3.2: 고객 접수 이미지 업로드 (inquiry용)
  async uploadInquiryImage(
    agentId: string,
    inquiryId: string,
    file: Express.Multer.File,
  ): Promise<{ path: string }> {
    if (!ALLOWED.includes(file.mimetype))
      throw new BadRequestException('허용되지 않는 파일 형식입니다');
    if (file.size > MAX_SIZE)
      throw new BadRequestException('파일 크기는 10MB를 초과할 수 없습니다');

    const ext = file.originalname.split('.').pop() ?? 'jpg';
    const storagePath = `agents/${agentId}/inquiries/${inquiryId}/${Date.now()}.${ext}`;

    const { error } = await this.supabase.storage
      .from('landnote-media')
      .upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: false });

    if (error) throw new BadRequestException(`업로드 실패: ${error.message}`);

    // customer_inquiries.images에 추가
    const { data: inquiry } = await this.supabase
      .from('customer_inquiries')
      .select('images')
      .eq('id', inquiryId)
      .eq('agent_id', agentId)
      .single();

    const existingImages = (inquiry?.images ?? []) as { path: string; uploaded_at: string }[];
    await this.supabase
      .from('customer_inquiries')
      .update({ images: [...existingImages, { path: storagePath, uploaded_at: new Date().toISOString() }] })
      .eq('id', inquiryId)
      .eq('agent_id', agentId);

    return { path: storagePath };
  }

  async deleteListingImage(
    agentId: string,
    listingId: string,
    targetPath: string,
  ): Promise<void> {
    const { data: listing } = await this.supabase
      .from('property_listings')
      .select('images')
      .eq('id', listingId)
      .eq('agent_id', agentId)
      .single();

    if (!listing) throw new BadRequestException('매물을 찾을 수 없습니다');

    const images: { path: string; is_representative: boolean }[] = listing.images ?? [];
    const filtered = images.filter(img => img.path !== targetPath);

    // 대표 이미지 삭제 시 다음 이미지를 대표로 지정
    const wasRepresentative = images.find(img => img.path === targetPath)?.is_representative;
    if (wasRepresentative && filtered.length > 0) {
      filtered[0].is_representative = true;
    }

    await this.supabase.storage.from('landnote-media').remove([targetPath]);
    await this.supabase
      .from('property_listings')
      .update({ images: filtered })
      .eq('id', listingId)
      .eq('agent_id', agentId);
  }

  // 매물 상세 조회 응답 조립 시 호출 — path → signed_url 변환
  // createSignedUrls(복수)를 사용해 한 번의 API 호출로 처리 (N+1 방지)
  // (getPublicUrl() 사용 금지: private 버킷에서 무효한 URL 반환)
  async attachSignedUrls(
    images: { path: string; is_representative?: boolean; label?: string | null; uploaded_at: string }[]
  ) {
    if (images.length === 0) return [];

    const { data, error } = await this.supabase.storage
      .from('landnote-media')
      .createSignedUrls(
        images.map(img => img.path),
        SIGNED_URL_EXPIRES,
      );

    if (error || !data) {
      // 서명 URL 발급 실패 시 signed_url을 null로 채워서 반환 (전체 조회 실패는 막음)
      return images.map(img => ({ ...img, signed_url: null }));
    }

    return images.map((img, i) => ({
      ...img,
      signed_url: data[i]?.signedUrl ?? null,
    }));
  }
}
```

---

## 17. Toss Payments 정기결제

### 결제 플로우

```
가입 시:
  1. /register → Supabase Auth + agents INSERT (trial)
  2. /register/plan → PATCH /agents/me { subscription_plan } 호출 후 다음 단계
  3. /register/billing → Toss SDK requestBillingAuth('카드', { customerKey: agentId, successUrl, failUrl })
     successUrl = {APP_URL}/register/billing/success
  4. Toss가 successUrl로 redirect → 쿼리파라미터에 authKey, customerKey 포함
     예: /register/billing/success?authKey=AUTH_KEY&customerKey=AGENT_ID
  5. 클라이언트가 searchParams에서 authKey 추출 → POST /billing/register { authKey }
  6. 서버: POST /v1/billing/authorizations/issue → billingKey 발급 → agents.billing_key 저장
     (subscription_status는 여전히 'trial')
  7. trial_ends_at 도달 시 스케줄러가 첫 결제 자동 청구 → 성공 시 active 전환

카드 변경 시:
  1. /dashboard/settings/billing → Toss SDK requestBillingAuth()
     successUrl = {APP_URL}/dashboard/settings/billing/success
  2. 동일하게 authKey 수신 → POST /billing/register { authKey }
  3. 기존 billing_key 덮어쓰기

자동 청구 (스케줄러 상태 기계):
  - 매일 자정 Asia/Seoul 실행
  - trial: trial_ends_at < now
      billing_key IS NULL  → expired
      billing_key IS NOT NULL → 첫 청구 → 성공: active, 실패: failure 카운트
  - active: next_billing_date <= now (다운타임 보정, 하루 범위로 묶지 않음)
      청구 → 성공: next_billing_date 갱신, 실패: 3일 후 재시도(최대 3회)
      3회 실패 시 expired 처리 + 이메일 알림
  - billing_day: 등록일 29~31이면 28로 clamp (1~28 외 값 저장 불가)
  - Toss 청구 API 타임아웃 최소 65초 (공식 문서 권장 60초보다 여유 확보)
```

### 프론트엔드 카드 등록

```typescript
// components/dashboard/BillingRegisterButton.tsx
'use client';
import { loadTossPayments } from '@tosspayments/payment-sdk';

interface Props {
  agentId: string;
  returnPath: 'register' | 'settings'; // 어디서 호출했는지 구분
}

export function BillingRegisterButton({ agentId, returnPath }: Props) {
  const successUrl = returnPath === 'register'
    ? `${process.env.NEXT_PUBLIC_APP_URL}/register/billing/success`
    : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing/success`;

  const failUrl = returnPath === 'register'
    ? `${process.env.NEXT_PUBLIC_APP_URL}/register/billing/fail`
    : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing/fail`;

  const handleRegister = async () => {
    const toss = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!);
    // 성공 시 successUrl?authKey=XXX&customerKey=YYY 형태로 redirect됨
    await toss.requestBillingAuth('카드', { customerKey: agentId, successUrl, failUrl });
  };

  return <button onClick={handleRegister}>카드 등록하기</button>;
}
```

### BillingService 핵심 메서드

```typescript
// src/modules/billing/billing.service.ts
import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EmailService } from '../email/email.service';
import { clampBillingDay, PLAN_LIMITS } from '@landnote/shared';

@Injectable()
export class BillingService {
  private readonly TOSS_BASE = 'https://api.tosspayments.com/v1';
  private supabase: SupabaseClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  constructor(private readonly emailService: EmailService) {}

  private tossHeader() {
    return {
      Authorization: `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64')}`,
      'Content-Type': 'application/json',
    };
  }

  async registerBillingKey(agent: any, authKey: string): Promise<void> {
    // Toss Core API: POST /v1/billing/authorizations/issue
    // (successUrl redirect로 받은 authKey, customerKey를 body에 담아 요청)
    const res = await fetch(`${this.TOSS_BASE}/billing/authorizations/issue`, {
      method: 'POST',
      headers: this.tossHeader(),
      body: JSON.stringify({ authKey, customerKey: agent.id }),
      signal: AbortSignal.timeout(65_000), // Toss 응답 최대 60초 → 여유 65초
    });
    if (!res.ok) {
      const err = await res.json();
      throw new BadRequestException(`빌링키 발급 실패: ${err.message}`);
    }
    const { billingKey, card } = await res.json();
    // 등록일 29~31이면 28로 clamp (billing_day BETWEEN 1 AND 28 제약 준수)
    const billingDay = clampBillingDay(new Date().getDate());

    await this.supabase.from('agents').update({
      billing_key: billingKey,
      billing_card_info: { company: card.company, number: card.number, card_type: card.cardType },
      billing_day: billingDay,
      next_billing_date: this.nextBillingDate(billingDay).toISOString(),
    }).eq('id', agent.id);
  }

  // v3.2: 플랜 변경 (8장에서 정의한 비즈니스 로직 구현)
  async changePlan(agent: any, newPlan: 'starter' | 'pro'): Promise<void> {
    if (agent.subscription_plan === newPlan && !agent.pending_plan) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: '이미 해당 플랜입니다' });
    }
    if (!['trial', 'active'].includes(agent.subscription_status)) {
      throw new ForbiddenException({ code: 'SUBSCRIPTION_EXPIRED', message: '구독 활성화 후 변경 가능합니다' });
    }

    // trial 중: 즉시 반영
    if (agent.subscription_status === 'trial') {
      await this.supabase.from('agents').update({
        subscription_plan: newPlan, pending_plan: null,
      }).eq('id', agent.id);
      return;
    }

    // active: 업그레이드 즉시, 다운그레이드 예약
    if (newPlan === 'pro' && agent.subscription_plan === 'starter') {
      await this.supabase.from('agents').update({
        subscription_plan: 'pro', pending_plan: null,
      }).eq('id', agent.id);
    } else {
      await this.supabase.from('agents').update({
        pending_plan: newPlan,
      }).eq('id', agent.id);
    }
  }

  // 스케줄러에서 호출하는 메서드
  async chargeAgent(agent: any): Promise<void> {
    if (!agent.billing_key) {
      // billing_key 없으면 결제 불가 → expired 처리
      await this.supabase.from('agents')
        .update({ subscription_status: 'expired' }).eq('id', agent.id);
      await this.emailService.sendSubscriptionExpired(agent);
      return;
    }
    const amount = agent.subscription_plan === 'pro' ? 15000 : 10000;
    const orderId = `landnote-${agent.id}-${Date.now()}`;

    const res = await fetch(`${this.TOSS_BASE}/billing/${agent.billing_key}`, {
      method: 'POST',
      headers: this.tossHeader(),
      body: JSON.stringify({
        customerKey: agent.id, amount, orderId,
        orderName: `랜드노트 ${agent.subscription_plan === 'pro' ? '프로' : '스타터'} 플랜`,
      }),
      signal: AbortSignal.timeout(65_000), // Toss 청구 응답 최대 60초 → 여유 65초
    });

    // Toss가 4xx/5xx 반환 시 result.status가 없으므로 res.ok 먼저 확인
    let result: Record<string, unknown>;
    try {
      result = await res.json();
    } catch {
      await this.handleFailure(agent, orderId, `HTTP ${res.status} — 응답 파싱 실패`);
      return;
    }
    if (!res.ok) {
      const errMsg = (result.message as string) ?? `HTTP ${res.status}`;
      await this.handleFailure(agent, orderId, errMsg);
      return;
    }

    if (result['status'] === 'DONE') {
      // 결제 성공: 이력 저장 + next_billing_date 갱신
      await this.supabase.from('billing_histories').insert({
        agent_id: agent.id, order_id: orderId,
        payment_key: result['paymentKey'], plan: agent.subscription_plan,
        amount, status: 'success',
      });

      // pending_plan이 있으면 이번 결제 완료 시점에 플랜 교체 (다운그레이드 처리)
      const planUpdate: Record<string, unknown> = {
        subscription_status: 'active',
        subscription_start: agent.subscription_status === 'trial'
          ? new Date().toISOString() : agent.subscription_start, // trial → active 첫 전환 시만 기록
        next_billing_date: this.nextBillingDate(agent.billing_day).toISOString(),
      };
      if (agent.pending_plan) {
        planUpdate.subscription_plan = agent.pending_plan;
        planUpdate.pending_plan = null;

        // v3.2: 다운그레이드 시 카테고리 제한 적용
        if (agent.pending_plan === 'starter') {
          const maxCat = PLAN_LIMITS.starter.max_categories;
          const currentCats: string[] = agent.selected_categories ?? [];
          if (currentCats.length > maxCat) {
            planUpdate.selected_categories = currentCats.slice(0, maxCat);
          }
        }
      }

      await this.supabase.from('agents').update(planUpdate).eq('id', agent.id);
      await this.emailService.sendBillingSuccess(agent, amount);
    } else {
      await this.handleFailure(agent, orderId,
        (result['failure'] as Record<string, unknown>)?.['message'] as string ?? '알 수 없는 오류');
    }
  }

  async cancelSubscription(agent: any): Promise<void> {
    await this.supabase.from('agents').update({
      subscription_status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    }).eq('id', agent.id);
    // billing_key는 유지 — 언제든 재구독 시 재사용 가능
  }

  // 스케줄러에서 호출 (EmailService 직접 참조 없이 BillingService 경유)
  async sendTrialReminder(agent: any): Promise<void> {
    await this.emailService.sendTrialReminder(agent);
  }

  private async handleFailure(agent: any, orderId: string, reason: string): Promise<void> {
    await this.supabase.from('billing_histories').insert({
      agent_id: agent.id, order_id: orderId,
      plan: agent.subscription_plan,
      amount: agent.subscription_plan === 'pro' ? 15000 : 10000,
      status: 'failed', failure_reason: reason,
    });

    const failCount = await this.recentFailCount(agent.id);

    if (failCount >= 3) {
      await this.supabase.from('agents')
        .update({ subscription_status: 'expired' }).eq('id', agent.id);
      await this.emailService.sendSubscriptionExpired(agent);
    } else {
      const retry = new Date();
      retry.setDate(retry.getDate() + 3);
      await this.supabase.from('agents')
        .update({ next_billing_date: retry.toISOString() }).eq('id', agent.id);
      await this.emailService.sendBillingFailure(agent, failCount);
    }
  }

  private nextBillingDate(billingDay: number): Date {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, billingDay);
    const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(billingDay, lastDay));
    return next;
  }

  private async recentFailCount(agentId: string): Promise<number> {
    const { data } = await this.supabase
      .from('billing_histories')
      .select('status')
      .eq('agent_id', agentId)
      .order('billed_at', { ascending: false })
      .limit(5);
    let count = 0;
    for (const row of data ?? []) {
      if (row.status === 'failed') count++;
      else break;
    }
    return count;
  }
}
```

### BillingScheduler

```typescript
// src/modules/billing/billing.scheduler.ts
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { createClient } from '@supabase/supabase-js';
import { BillingService } from './billing.service';

@Injectable()
export class BillingScheduler {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  constructor(private readonly billingService: BillingService) {}

  // ── active 정기 청구 (매일 자정, 한국 시간) ──────────────────────────
  // next_billing_date <= now 조건으로 조회하여 다운타임으로 놓친 결제도 처리한다.
  // (하루 범위로 묶으면 서버 재기동 시 해당 날짜 결제를 놓칠 수 있음)
  @Cron('0 0 * * *', { timeZone: 'Asia/Seoul' })
  async processMonthlyBilling() {
    const now = new Date().toISOString();

    const { data: agents } = await this.supabase
      .from('agents')
      .select('*')
      .eq('subscription_status', 'active')
      .lte('next_billing_date', now); // <= now (다운타임 보정)

    for (const agent of agents ?? []) {
      await this.billingService.chargeAgent(agent).catch(err =>
        console.error(`결제 실패 [${agent.id}]`, err)
      );
    }
  }

  // ── trial 종료 처리 (매일 자정 + 5초) ───────────────────────────────
  // 상태 기계:
  //   trial + billing_key IS NULL  → expired
  //   trial + billing_key IS NOT NULL → 첫 청구 시도
  //     성공 → chargeAgent 내부에서 active 전환
  //     실패 → failure 카운트 반영, 3회 초과 시 expired
  @Cron('5 0 * * *', { timeZone: 'Asia/Seoul' })
  async processTrialExpiry() {
    const now = new Date().toISOString();

    // 카드 미등록자: trial 만료 → expired
    await this.supabase
      .from('agents')
      .update({ subscription_status: 'expired' })
      .eq('subscription_status', 'trial')
      .lt('trial_ends_at', now)
      .is('billing_key', null);

    // 카드 등록자: trial 만료 → 첫 결제 시도 → 성공 시 active 전환
    const { data: trialAgents } = await this.supabase
      .from('agents')
      .select('*')
      .eq('subscription_status', 'trial')
      .lt('trial_ends_at', now)
      .not('billing_key', 'is', null);

    for (const agent of trialAgents ?? []) {
      await this.billingService.chargeAgent(agent).catch(err =>
        console.error(`trial 첫 결제 실패 [${agent.id}]`, err)
      );
    }
  }

  // ── trial 3일 전 리마인더 ─────────────────────────────────────────
  @Cron('0 10 * * *', { timeZone: 'Asia/Seoul' }) // 매일 오전 10시
  async processTrialReminder() {
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    const start = new Date(threeDaysLater.getFullYear(), threeDaysLater.getMonth(), threeDaysLater.getDate());
    const end   = new Date(start.getTime() + 24 * 60 * 60 * 1000);

    const { data: agents } = await this.supabase
      .from('agents')
      .select('*')
      .eq('subscription_status', 'trial')
      .gte('trial_ends_at', start.toISOString())
      .lt('trial_ends_at', end.toISOString());

    for (const agent of agents ?? []) {
      await this.billingService.sendTrialReminder(agent).catch(err =>
        console.error(`trial 리마인더 실패 [${agent.id}]`, err)
      );
    }
  }


}
```

---

## 18. 이메일 알림

### 발송 시점

| 이벤트 | 수신자 | 제목 |
|--------|--------|------|
| 가입 완료 | 중개사 | 랜드노트 가입을 환영합니다 |
| 무료 체험 3일 전 | 중개사 | 무료 체험이 3일 후 종료됩니다 |
| 결제 성공 | 중개사 | 결제가 완료되었습니다 |
| 결제 실패 (1~2회) | 중개사 | 결제에 실패했습니다. 카드를 확인해주세요 |
| 구독 만료 | 중개사 | 구독이 만료되었습니다 |
| 구독 해지 완료 | 중개사 | 해지가 완료되었습니다 (데이터는 안전하게 영구 보존됩니다) |
| 신규 문의 접수 | 중개사 | 새로운 문의가 접수되었습니다 |

### EmailService

```typescript
// src/modules/email/email.service.ts
import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend = new Resend(process.env.RESEND_API_KEY!);
  private from = process.env.RESEND_FROM_EMAIL!;

  // agent.email은 agents 테이블의 email 컬럼 사용
  async sendNewInquiry(agent: { email: string; agent_name: string }, inquiryId: string) {
    await this.resend.emails.send({
      from: this.from,
      to: agent.email,
      subject: '[랜드노트] 새로운 문의가 접수되었습니다',
      html: `<p>${agent.agent_name} 중개사님, 새 문의가 접수되었습니다.</p>
             <a href="${process.env.APP_URL}/dashboard/inquiries/${inquiryId}">확인하기</a>`,
    });
  }

  async sendBillingFailure(agent: { email: string; agent_name: string }, failCount: number) {
    await this.resend.emails.send({
      from: this.from,
      to: agent.email,
      subject: '[랜드노트] 결제에 실패했습니다',
      html: `<p>${agent.agent_name} 중개사님, 정기 결제가 실패했습니다. (${failCount}회째)<br>
             3회 실패 시 구독이 만료됩니다.</p>
             <a href="${process.env.APP_URL}/dashboard/settings/billing">카드 변경하기</a>`,
    });
  }

  async sendSubscriptionExpired(agent: { email: string; agent_name: string }) {
    await this.resend.emails.send({
      from: this.from,
      to: agent.email,
      subject: '[랜드노트] 구독이 만료되었습니다',
      html: `<p>${agent.agent_name} 중개사님, 구독이 만료되었습니다.</p>
             <a href="${process.env.APP_URL}/dashboard/settings/billing">재구독하기</a>`,
    });
  }

  async sendTrialReminder(agent: { email: string; agent_name: string }) {
    await this.resend.emails.send({
      from: this.from,
      to: agent.email,
      subject: '[랜드노트] 무료 체험이 3일 후 종료됩니다',
      html: `<p>${agent.agent_name} 중개사님, 무료 체험이 3일 후 종료됩니다.</p>
             <a href="${process.env.APP_URL}/dashboard/settings/billing">카드 등록하기</a>`,
    });
  }

  async sendCancellationConfirm(agent: { email: string; agent_name: string }) {
    const deleteDate = new Date();
    deleteDate.setDate(deleteDate.getDate() + 30);
    await this.resend.emails.send({
      from: this.from,
      to: agent.email,
      subject: '[랜드노트] 구독 해지가 완료되었습니다',
      html: `<p>${agent.agent_name} 중개사님, 해지가 완료되었습니다.<br>
             데이터는 ${deleteDate.toLocaleDateString('ko-KR')}까지 보존됩니다.</p>`,
    });
  }

  async sendWelcome(agent: { email: string; agent_name: string }) {
    await this.resend.emails.send({
      from: this.from,
      to: agent.email,
      subject: '[랜드노트] 가입을 환영합니다',
      html: `<p>${agent.agent_name} 중개사님, 랜드노트 가입을 환영합니다.<br>
             7일 무료 체험이 시작되었습니다.</p>
             <a href="${process.env.APP_URL}/dashboard">대시보드 바로가기</a>`,
    });
  }

  async sendBillingSuccess(agent: { email: string; agent_name: string }, amount: number) {
    await this.resend.emails.send({
      from: this.from,
      to: agent.email,
      subject: '[랜드노트] 결제가 완료되었습니다',
      html: `<p>${agent.agent_name} 중개사님, ${amount.toLocaleString('ko-KR')}원 결제가 완료되었습니다.</p>
             <a href="${process.env.APP_URL}/dashboard/settings/billing">결제 내역 확인</a>`,
    });
  }
}
```

---

## 19. 개발 로드맵 및 Phase별 검증 기준

### Phase 1 — 기반 구축 (1~2주)
**목표**: 가입→플랜 선택→카드 등록까지 완주 가능

- [ ] 모노레포 셋업 (`pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`)
- [ ] `packages/shared` 생성 (constants.ts, types.ts, index.ts)
- [ ] Supabase 프로젝트 생성 + 마이그레이션 001~009 실행
- [ ] NestJS 초기화 (`app.module.ts` 글로벌 등록: Guard/Filter/Interceptor/Pipe)
- [ ] Next.js 초기화 (shadcn/ui, middleware.ts, `next.config.mjs` transpilePackages)
- [ ] 랜딩 페이지 + 가입 4단계 온보딩 UI
- [ ] `@Public()` 데코레이터 + AuthController (`/auth/register`, `/auth/login`)
- [ ] Supabase Auth 연동 (회원가입, 로그인)
- [ ] Toss Payments 빌링키 발급 + BillingScheduler 기본 셋업
- [ ] Resend 이메일 서비스 (가입 환영, trial 만료 알림)

#### Phase 1 검증 체크리스트

```
1. 모노레포 확인
   - [ ] `pnpm install` 에러 없이 완료
   - [ ] `pnpm dev:web` → Next.js localhost:3000 정상 기동
   - [ ] `pnpm dev:api` → NestJS localhost:3001 정상 기동
   - [ ] apps/web에서 `import { PLAN_LIMITS } from '@landnote/shared'` 정상 resolve

2. DB 확인
   - [ ] Supabase SQL Editor에서 001~009 순서대로 실행 → 에러 없음
   - [ ] `SELECT * FROM pg_type WHERE typname LIKE '%_t';` → 6개 ENUM 타입 존재
   - [ ] agents 테이블에 테스트 INSERT → agent_code 자동 생성 확인
   - [ ] billing_day에 29 입력 시도 → CHECK 제약 위반 확인

3. 인증 플로우
   - [ ] POST /auth/register → 200 + agents 레코드 생성 (trial, trial_ends_at = +7일)
   - [ ] POST /auth/login → 200 + session 토큰 반환
   - [ ] Authorization 없이 GET /inquiries → 401 (JwtAuthGuard)
   - [ ] @Public() 적용된 GET /public/agent/:code → 200 (인증 없이)

4. 에러 응답 형식
   - [ ] 잘못된 요청 → { ok: false, error: { code: "VALIDATION_ERROR", message: "..." } }
   - [ ] 인증 실패 → { ok: false, error: { code: "UNAUTHORIZED", message: "..." } }

5. Toss 연동 (테스트 키)
   - [ ] requestBillingAuth → 테스트 카드로 successUrl 리다이렉트 확인
   - [ ] POST /billing/register → billingKey 발급 + agents.billing_key 저장 확인
```

### Phase 2 — 고객 접수 시스템 (3~4주)
**목표**: 고객이 QR/링크로 접속해서 조건을 접수 가능

- [ ] /form/[agentCode] 4단계 UX 구현
- [ ] 동적 입력폼 (카테고리 조합별 필드)
- [ ] CreateInquiryDto 적용 + 가격 3중 검증 (프론트 실시간 + NestJS DTO + DB CHECK)
- [ ] 고객 이미지 업로드 (서버 경유, customer_inquiries.images 저장)
- [ ] QR코드 생성 (/dashboard/links)
- [ ] 신규 문의 이메일 알림

#### Phase 2 검증 체크리스트

```
1. 고객 접수 E2E
   - [ ] /form/{테스트코드} 접속 → 중개사 이름/사무소명 정상 표시
   - [ ] 4단계 완료 → customer_inquiries에 레코드 생성 확인
   - [ ] customer_phone 암호화 저장 확인 (DB에 hex:hex 형태)
   - [ ] 이미지 첨부 → Storage에 파일 존재 + customer_inquiries.images에 path 저장 확인

2. 가격 검증 3중 확인
   - [ ] transaction_types=['sale'] + price_sale 누락 → 프론트 필드 빨간색 표시
   - [ ] 같은 조건으로 API 직접 호출 → 400 VALIDATION_ERROR (DTO)
   - [ ] DTO 우회 후 DB 직접 INSERT → CHECK 제약 위반

3. QR/링크
   - [ ] /dashboard/links → QR 이미지 다운로드 가능
   - [ ] QR 스캔 → /form/{agentCode} 정상 연결
```

### Phase 3 — 중개사 대시보드 핵심 (5~6주)
**목표**: 문의·매물 관리 가능

- [ ] 메인 대시보드 (요약 카드)
- [ ] 문의 목록/상세 (상태 변경, 메모)
- [ ] 매물 등록/목록/상세 (CreateListingDto 적용)
- [ ] 이미지 업로드 (드래그앤드롭, 순서 변경)
- [ ] 기본 매칭 (카테고리 + 가격 스코어링)

#### Phase 3 검증 체크리스트

```
1. RLS 격리 확인
   - [ ] 중개사A로 로그인 → 매물 3건 등록
   - [ ] 중개사B로 로그인 → GET /listings → 0건 (A의 데이터 안 보임)
   - [ ] 중개사B가 A의 listing ID로 GET /listings/:id → 404

2. 매물 등록
   - [ ] CreateListingDto 검증: sale 매물에 price_sale 누락 → 400
   - [ ] 스타터 50건 한도: 51번째 등록 시도 → 403 PLAN_LIMIT_EXCEEDED
   - [ ] 이미지 업로드 5장 → 6번째 → 400

3. 매칭 기본
   - [ ] 문의(residential, sale, 4억 이하) + 매물(residential, sale, 3.8억) → score >= 0.6
   - [ ] 카테고리 불일치(residential vs commercial) → 매칭 0건
```

### Phase 4 — 매칭 및 통계 (7~9주)
**목표**: 매칭 센터 + 통계 대시보드 완성

- [ ] 매칭 센터 화면 (미검토 우선, is_shown/is_liked)
- [ ] 매칭 알고리즘 고도화 (면적 + 위치)
- [ ] 통계 차트 5종
- [ ] 기간 필터 (주간/월간/연간)

#### Phase 4 검증 체크리스트

```
1. 매칭 센터
   - [ ] 미검토 매칭 상단 정렬 확인
   - [ ] [안내 완료] 클릭 → is_shown=true → 미검토 카운트 감소
   - [ ] score_breakdown 4개 항목 정상 표시

2. 통계
   - [ ] seed 데이터 20건 INSERT 후 차트 5종 모두 렌더링
   - [ ] 기간 필터 변경 시 차트 데이터 갱신
   - [ ] 빈 데이터 상태에서 차트 깨지지 않음 (빈 상태 메시지)
```

### Phase 5 — 고도화 및 런칭 (10~12주)
**목표**: 프로덕션 배포

- [ ] PostGIS ST_DWithin 기반 위치 스코어링
- [ ] Web Push 알림 (신규 문의)
- [ ] PWA 설정 (manifest.json, service worker)
- [ ] TanStack Query 캐싱 최적화
- [ ] API rate limiting (NestJS Throttler)
- [ ] RLS 정책 전수 확인
- [ ] 플랜 변경 로직 전수 확인 (업그레이드/다운그레이드/trial 중 변경)
- [ ] Vercel + Railway 배포 설정
- [ ] 베타 테스트 (중개사 5~10명)

#### Phase 5 검증 체크리스트

```
1. 배포 전 전수 확인
   - [ ] 모든 @Public() 라우트: 인증 없이 접근 가능
   - [ ] 모든 인증 라우트: Bearer 없이 → 401
   - [ ] 모든 구독 보호 라우트: expired 중개사 → 403
   - [ ] RLS: 타 중개사 데이터 SELECT/UPDATE/DELETE 시도 → 0건 또는 에러
   - [ ] Storage: 타 중개사 경로에 업로드 시도 → 정책 위반

2. 결제 시나리오 전수
   - [ ] trial → 카드 등록 → 7일 후 첫 결제 → active 전환
   - [ ] trial → 카드 미등록 → 7일 후 → expired
   - [ ] active → 결제 실패 1회 → 3일 후 재시도
   - [ ] active → 결제 실패 3회 → expired + 이메일
   - [ ] active → 해지 → cancelled → 데이터 영구 보존
   - [ ] starter → pro 업그레이드 → 즉시 반영 확인
   - [ ] pro → starter 다운그레이드 → pending_plan 설정 → 다음 결제 시 적용 확인
   - [ ] 다운그레이드 적용 시 카테고리 3~4개 → 2개로 자동 축소 확인

3. 부하 테스트
   - [ ] 동시 5명 고객 접수 → 모두 정상 저장
   - [ ] rate limiter: 100req/min 초과 → 429
```

### Phase 6 — 보안 강화 및 기능 정합성 복구 (v3.2 이후)
**목표**: 코드 리뷰에서 발견된 보안 취약점 차단 + PRD-코드 불일치 해소 + 테스트 인프라 구축

#### Phase 6A — 보안 차단 (최우선) ✅

- [x] P0: `/agents/me` 대량 할당(Mass Assignment) 취약점 차단
  - `UpdateAgentProfileDto` 생성 — 허용 필드만 선언 (`agent_name`, `phone`, `office_name`, `profile_image_url`, `subscription_plan`)
  - 컨트롤러 `@Body()` 타입을 `Record<string, unknown>` → DTO로 변경
  - 서비스 레이어 `allowedFields` 배열 기반 이중 방어
  - `subscription_plan` 변경은 trial 상태에서만 허용 (active 에이전트는 403)
  - 프론트엔드 settings에서 `license_number` PATCH body 제거 + readOnly 전환
- [x] P2: 고아 스토리지 객체 방지
  - `uploadInquiryImage()` 순서 변경: inquiry 존재 확인 → 업로드 → DB 업데이트
  - DB 업데이트 실패 시 스토리지 파일 삭제(롤백)
  - `uploadListingImage()`에도 동일 롤백 패턴 적용

#### Phase 6B — 상품-기능 정합성 복구 ✅

- [x] P1: 카테고리별 QR 코드 구현
  - Starter: 1개 범용 QR (`/form/{agentCode}`)
  - Pro: `selected_categories` 배열 순회, 카테고리별 URL 생성 (`/form/{agentCode}?cat={code}`)
  - `CATEGORY_LABELS` 상수를 `@landnote/shared`에 SSoT로 추가
  - `/dashboard/links` 페이지 리팩토링 — `apiFetch('/agents/me/qr')`로 전환 + 다중 QR 카드 렌더링
  - `/form/[agentCode]/category` 페이지에서 `?cat=` 쿼리 파라미터 자동 선택
- [x] P2: 카테고리 최소 1개 검증
  - `ChangeCategoriesDto` 생성 — `@ArrayMinSize(1)` + `@IsIn(categoryValues)` 검증
  - 서비스 레이어에도 최소 1개 방어 추가

#### Phase 6C — UX 퍼널 개선 ✅

- [x] 잠금 카테고리 카드 + 업그레이드 모달
  - `UpgradeModal.tsx` 컴포넌트 생성 (shadcn Dialog 기반)
  - Starter에서 선택 불가 카테고리 → `opacity-50`, Lock 아이콘, 클릭 시 모달 열기
- [x] 대시보드 퀵 액션 카드 추가
  - 매물 등록, 매칭 확인, QR/링크 관리 3개 카드

#### Phase 6D — 테스트 인프라 ✅

- [x] Jest + ts-jest 테스트 프레임워크 구성 (`jest.config.js`, `@landnote/shared` 모듈 매핑)
- [x] 보안 회귀 테스트 (`agents.service.spec.ts` — 10 tests)
  - 프로필 업데이트 허용/차단 필드 검증
  - trial/active 플랜 변경 검증
  - 카테고리 최소/최대 검증
  - Starter/Pro QR 코드 차별 생성 검증
- [x] 스토리지 고아 방지 테스트 (`storage.service.spec.ts` — 3 tests)

#### Phase 6 검증 체크리스트

```
1. 보안 (6A)
   - [x] PATCH /agents/me { subscription_status: "active" } → 400
   - [x] PATCH /agents/me { billing_key: "fake" } → 400
   - [x] PATCH /agents/me { agent_name: "테스트" } → 200
   - [x] trial 에이전트: { subscription_plan: "pro" } → 200
   - [x] active 에이전트: { subscription_plan: "pro" } → 403
   - [x] POST .../images/INVALID_INQUIRY_ID → 400 (고아 파일 없음)

2. 기능 정합 (6B)
   - [x] Starter: GET /agents/me/qr → 1개, cat 파라미터 없음
   - [x] Pro: GET /agents/me/qr → 카테고리 수만큼 QR, 각각 ?cat={code}
   - [x] PATCH /agents/me/categories { categories: [] } → 400
   - [x] PATCH /agents/me/categories { categories: ["invalid"] } → 400

3. UX (6C)
   - [x] Starter 설정: 잠금 카테고리에 자물쇠 아이콘 표시
   - [x] 잠금 카테고리 클릭 → 업그레이드 모달 열림
   - [x] 대시보드 퀵 액션 카드 렌더링 + 링크 동작

4. 테스트 (6D)
   - [x] pnpm test:api → 13 tests passed, 0 failures
```

#### Phase 6 수정 파일 목록

| 파일 | Phase | 변경 |
|------|-------|------|
| `apps/api/src/modules/agents/dto/update-agent-profile.dto.ts` | 6A | **신규** — 프로필 업데이트 DTO |
| `apps/api/src/modules/agents/dto/change-categories.dto.ts` | 6B | **신규** — 카테고리 변경 DTO |
| `apps/web/components/dashboard/UpgradeModal.tsx` | 6C | **신규** — 업그레이드 모달 |
| `apps/api/jest.config.js` | 6D | **신규** — Jest 설정 |
| `apps/api/src/modules/agents/agents.service.spec.ts` | 6D | **신규** — 에이전트 서비스 테스트 (10건) |
| `apps/api/src/modules/storage/storage.service.spec.ts` | 6D | **신규** — 스토리지 서비스 테스트 (3건) |
| `apps/api/src/modules/agents/agents.controller.ts` | 6A, 6B | DTO 타입 적용 |
| `apps/api/src/modules/agents/agents.service.ts` | 6A, 6B | allowlist 필터 + 최소 카테고리 검증 + 카테고리별 QR |
| `apps/api/src/modules/storage/storage.service.ts` | 6A | 순서 변경 + 롤백 |
| `apps/web/app/(dashboard)/dashboard/settings/page.tsx` | 6A, 6C | license readOnly + 잠금 카테고리 UI |
| `apps/web/app/(dashboard)/dashboard/links/page.tsx` | 6B | apiFetch 전환 + 다중 QR 카드 |
| `apps/web/app/(form)/form/[agentCode]/category/page.tsx` | 6B | cat 파라미터 자동 선택 |
| `apps/web/app/(dashboard)/dashboard/page.tsx` | 6C | 퀵 액션 카드 추가 |
| `packages/shared/constants.ts` | 6B | CATEGORY_LABELS 상수 추가 |
| `apps/api/package.json` | 6D | test 스크립트 + jest devDependencies |

---

### Phase 7 — 상업형 UI/UX 개선 (프론트엔드 전용)

**목표**: 카피, 정보 위계, 잠금 표현, CTA, 숫자 강조를 개선하여 전환율 향상. 백엔드/DB/결제 변경 없음.

**가격 표시 규칙** (공통):
- 일 환산: `Math.round(PLAN_PRICE[plan] / 30)` → Starter 333원, Pro 500원
- 차이: `PLAN_PRICE.pro - PLAN_PRICE.starter` = 5,000원
- 차이 일 환산: `Math.round(5000 / 30)` = 167원

#### 7A — 가격/업셀 리프레이밍

- [x] `UpgradeModal.tsx`: 제목 → "지금 이 기능은 잠겨 있습니다", CTA → "월 5,000원 더 내고 해제"
- [x] 가격 페이지: 서브라벨 단축("가볍게 시작"/"실사용 권장"), 일 환산, 비교표 "제한" 표현, 차이 강조 문구
- [x] 마케팅 랜딩: 신뢰배지 3개, 헤드라인/서브카피 리라이팅, 페인카드 4→3, 일 환산 가격
- [x] 가입 플랜: 가격 차이 보조 문구, 카드별 추천("한두 분야"/"함께 다루는"), 동적 버튼 텍스트

#### 7B — 잠금/해제 표현

- [x] 공개 카테고리(`category/page.tsx`): 4개 고정 렌더링 + Starter 잠금 카드(`bg-muted/50 opacity-60` + "현재 비활성" Badge)
- [x] `Step1Client.tsx`: 전화번호 regex 검증(암호문 숨김), 개인정보 안내 위치 조정, CTA 문구 개선
- [x] 서버 페이지: `subscriptionPlan` prop 전달 + sessionStorage 확장

#### 7C — 대시보드 상품성

- [x] 대시보드: 카테고리 "전문 분야로 운영 중" Badge, 잠금 → "프로로 해제 가능", 접수 링크 설명 추가
- [x] QR/링크: 설명 문구 교체(범용/카테고리별), QrCard 부제 추가
- [x] 설정: 카테고리 슬롯 표시(선택/남은), 구독 요약 플랜별 분기, 버튼 라벨 단축

#### 7 — 잠금 표현 규칙 (SSoT)

| 위치 | 잠금 표현 | 액션 |
|------|----------|------|
| 대시보드 카테고리 | Lock 아이콘 + "프로로 해제 가능" | UpgradeModal |
| 설정 카테고리 | `opacity-50` + Lock 아이콘 | UpgradeModal |
| 공개 폼 카테고리 | `bg-muted/50 opacity-60` + "현재 비활성" Badge | 클릭 없음 |

#### Phase 7 수정 파일 목록

| 파일 (apps/web 기준) | Phase | 변경 |
|------|-------|------|
| `components/dashboard/UpgradeModal.tsx` | 7A | 제목·설명·혜택·CTA 리프레이밍 |
| `app/(marketing)/pricing/page.tsx` | 7A | 서브라벨, 일 환산, 비교표, 버튼, 차이 강조 |
| `app/(marketing)/page.tsx` | 7A | 신뢰배지, 헤드라인, 서브카피, 페인카드 축소, 가격 |
| `app/(auth)/register/plan/page.tsx` | 7A | 가격 차이 문구, 추천, 동적 버튼 |
| `app/(form)/form/[agentCode]/category/page.tsx` | 7B | 4개 고정 렌더 + 잠금 카드 |
| `app/(form)/form/[agentCode]/Step1Client.tsx` | 7B | 전화번호 검증, CTA 문구 |
| `app/(form)/form/[agentCode]/page.tsx` | 7B | subscriptionPlan prop |
| `app/(dashboard)/dashboard/page.tsx` | 7C | 배지, 잠금 문구, 링크 설명 |
| `app/(dashboard)/dashboard/links/page.tsx` | 7C | QR 설명, 카드 부제 |
| `app/(dashboard)/dashboard/settings/page.tsx` | 7C | 슬롯 표시, 구독 요약, 버튼 |

---

### Phase 8 — 총관리자(Super Admin) 대시보드

**목표**: 플랫폼 운영자용 관리 도구 구축 — 중개사 관리, 수익 현황, 접속 통계, KPI 대시보드

#### Phase 8 검증 체크리스트

```
1. DB 마이그레이션 (Phase A)
   - [ ] admin_users, access_logs, admin_audit_logs 테이블 생성
   - [ ] 인덱스 생성 (agent_id+created_at, created_at)
   - [ ] RLS 활성화 (정책 없음 → SERVICE_ROLE_KEY만 접근)
   - [ ] cleanup_old_access_logs() 함수 동작

2. 인프라 (Phase A)
   - [ ] AdminAuthGuard: admin_users 테이블 조회 → req.admin 설정
   - [ ] @CurrentAdmin() 데코레이터 동작
   - [ ] AccessLogInterceptor: 중개사 API 호출 시 access_logs에 기록
   - [ ] admin 요청은 access_logs에 기록되지 않음 (req.agent 없음)
   - [ ] access_logs 정리 크론 (매일 01:30, 90일 보관)

3. 관리자 인증 (Phase B)
   - [ ] POST /admin/auth/login → 관리자 JWT + admin 정보 반환
   - [ ] GET /admin/auth/me → 현재 관리자 정보 (AdminAuthGuard 적용)
   - [ ] 일반 중개사 JWT로 /admin/* 접근 → 403

4. 중개사 관리 API (Phase B)
   - [ ] GET /admin/agents → 전체 중개사 목록 (검색/필터/페이지네이션)
   - [ ] GET /admin/agents/:id → 상세 (billing_key 제외, phone 복호화)
   - [ ] PATCH /admin/agents/:id/status → 상태 변경 + admin_audit_logs 기록
   - [ ] PATCH /admin/agents/:id/plan → 플랜 변경 + admin_audit_logs 기록

5. 수익 관리 API (Phase B)
   - [ ] GET /admin/revenue/summary → MRR, 총매출, ARPU
   - [ ] GET /admin/revenue/history → 전체 결제 이력 (페이지네이션)
   - [ ] GET /admin/revenue/trend → 월별 매출 추이
   - [ ] GET /admin/revenue/failed → 실패 결제 목록

6. 통계 API (Phase B)
   - [ ] GET /admin/stats/kpis → 총 중개사, 활성, 신규, MRR
   - [ ] GET /admin/stats/access → DAU/WAU/MAU
   - [ ] GET /admin/stats/access/trend → 일별 접속자 추이
   - [ ] GET /admin/stats/agents/growth → 월별 가입자 증가

7. 프론트엔드 (Phase C)
   - [ ] /admin/login → 관리자 로그인 동작
   - [ ] middleware.ts: admin 경로 보호 + app_metadata.is_admin 검증
   - [ ] 관리자 레이아웃: 다크 사이드바 (중개사 대시보드와 시각적 구분)
   - [ ] /admin → KPI 카드 4개 + 가입자 추이 차트
   - [ ] /admin/agents → 중개사 테이블 + 검색/필터 + 페이지네이션
   - [ ] /admin/agents/[id] → 탭 구성 (기본정보/문의/매물/결제/활동)
   - [ ] /admin/revenue → 수익 카드 + 매출 추이 + 플랜 분포
   - [ ] /admin/stats → DAU/WAU/MAU + 접속 추이 + 가입자 증가

8. 빌드 검증
   - [ ] pnpm build 통과 (web + api)
```

#### Phase 8 수정 파일 목록

| 파일 | Phase | 변경 |
|------|-------|------|
| `supabase/migrations/012_admin.sql` | A | **신규** — admin_users + access_logs + admin_audit_logs |
| `packages/shared/constants.ts` | A | ADMIN_ROLE, ACCESS_LOG_RETENTION_DAYS 추가 |
| `packages/shared/types.ts` | A | AdminUser, PlatformKpis 타입 추가 |
| `packages/shared/index.ts` | A | 새 export 추가 |
| `apps/api/src/common/guards/admin-auth.guard.ts` | A | **신규** — 관리자 인증 가드 |
| `apps/api/src/common/decorators/current-admin.decorator.ts` | A | **신규** — @CurrentAdmin() |
| `apps/api/src/common/interceptors/access-log.interceptor.ts` | A | **신규** — 접속 로그 인터셉터 |
| `apps/api/src/modules/billing/billing.scheduler.ts` | A | access_logs 정리 크론 추가 |
| `apps/api/src/modules/admin/admin.module.ts` | B | **신규** — 관리자 모듈 |
| `apps/api/src/modules/admin/admin-auth.controller.ts` | B | **신규** — 관리자 인증 API |
| `apps/api/src/modules/admin/admin-agents.controller.ts` | B | **신규** — 중개사 관리 API |
| `apps/api/src/modules/admin/admin-revenue.controller.ts` | B | **신규** — 수익 관리 API |
| `apps/api/src/modules/admin/admin-stats.controller.ts` | B | **신규** — 통계 API |
| `apps/api/src/modules/admin/admin.service.ts` | B | **신규** — 비즈니스 로직 |
| `apps/api/src/app.module.ts` | B | AdminModule + AccessLogInterceptor 등록 |
| `apps/web/middleware.ts` | C | /admin 경로 보호 + is_admin 검증 |
| `apps/web/app/(admin)/layout.tsx` | C | **신규** — 관리자 레이아웃 |
| `apps/web/app/(admin)/admin/page.tsx` | C | **신규** — 대시보드 홈 |
| `apps/web/app/(admin)/admin/login/page.tsx` | C | **신규** — 관리자 로그인 |
| `apps/web/app/(admin)/admin/agents/page.tsx` | C | **신규** — 중개사 목록 |
| `apps/web/app/(admin)/admin/agents/[id]/page.tsx` | C | **신규** — 중개사 상세 |
| `apps/web/app/(admin)/admin/revenue/page.tsx` | C | **신규** — 수익 관리 |
| `apps/web/app/(admin)/admin/stats/page.tsx` | C | **신규** — 접속 통계 |
| `apps/web/lib/hooks/use-admin.ts` | C | **신규** — 관리자 정보 훅 |
| `apps/web/lib/hooks/use-admin-agents.ts` | C | **신규** — 중개사 목록 훅 |
| `apps/web/lib/hooks/use-admin-revenue.ts` | C | **신규** — 수익 데이터 훅 |
| `apps/web/lib/hooks/use-admin-stats.ts` | C | **신규** — 통계 데이터 훅 |

---

### Seed 데이터 (Phase 3~4 검증용)

```sql
-- 테스트 중개사 (Supabase Auth에 먼저 사용자 생성 후 user_id 입력)
INSERT INTO agents (user_id, email, agent_name, license_number, office_name, phone,
  subscription_plan, subscription_status, selected_categories, trial_ends_at, billing_day)
VALUES
  ('USER_ID_1', 'test1@landnote.app', '김테스트', '20230001', '테스트공인중개사', '010-1234-5678',
   'pro', 'active', '{residential,commercial}', NULL, 15),
  ('USER_ID_2', 'test2@landnote.app', '이테스트', '20230002', '투테스트공인중개사', '010-8765-4321',
   'starter', 'trial', '{residential}', now() + interval '7 days', 1);

-- 테스트 문의 (agent_id는 위에서 생성된 첫 번째 중개사)
INSERT INTO customer_inquiries (agent_id, inquiry_type, customer_name, customer_phone,
  category_codes, transaction_types, detailed_conditions, status)
VALUES
  ((SELECT id FROM agents WHERE license_number='20230001'),
   'looking_for', '박고객', 'encrypted_phone_1',
   '{residential}', '{sale}',
   '{"price_max": 400000000, "area_min": 84, "preferred_dong": ["서초동","반포동"]}',
   'new');

-- 테스트 매물
INSERT INTO property_listings (agent_id, category_codes, transaction_types,
  address_full, dong_name, latitude, longitude,
  price_sale, area_exclusive, floor_current, floor_total, direction, status)
VALUES
  ((SELECT id FROM agents WHERE license_number='20230001'),
   '{residential}', '{sale}',
   '서울시 서초구 반포동 래미안 101동 1202호', '반포동',
   37.5085, 127.0145,
   380000000, 84.5, 12, 25, '남향', 'active');
```

> 위 seed를 INSERT 후 매칭을 실행하면 score >= 0.6인 결과가 생성되어야 한다.
> 카테고리(residential) 일치 + 가격(3.8억 < 4억) 조건 충족 + 위치(반포동) 일치.

---

## 20. 총관리자 대시보드 (관리자 시스템)

### 20-1. 개요

LandNote 플랫폼 운영자가 중개사 관리, 수익 현황, 접속 통계, KPI를 한눈에 파악하고 운영 조치를 취할 수 있는 관리자 전용 대시보드.

**설계 원칙**:
- 관리자(admin)와 중개사(agent)는 완전히 분리된 역할 → 별도 `admin_users` 테이블
- 관리자 데이터 접근은 SERVICE_ROLE_KEY로 RLS 우회 (기존 StatsService 패턴)
- 민감 필드 보호: `billing_key` 응답 제외, `phone` 복호화 반환
- 모든 관리자 쓰기 작업은 `admin_audit_logs`에 기록

### 20-2. 관리자 인증 흐름

```
[관리자 계정 생성 — 수동]
1. Supabase Dashboard → auth.users 생성 (이메일/비밀번호)
2. SQL Editor → UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"is_admin": true}'
3. SQL Editor → INSERT INTO admin_users (user_id, email, name, role) VALUES (...)

[로그인 흐름]
1. POST /admin/auth/login { email, password }
2. 서버: supabase.auth.signInWithPassword() → session 발급
3. 서버: admin_users 테이블에서 user_id로 조회 → 없으면 403
4. 응답: { admin, session }
5. 클라이언트: supabase.auth.setSession() → 쿠키 설정 → /admin 리다이렉트

[인증 검증 — 이중 보호]
- 프론트 middleware.ts: session 존재 + app_metadata.is_admin === true
- 백엔드 AdminAuthGuard: Bearer 토큰 → getUser() → admin_users 조회
```

### 20-3. 관리자 라우트 인증 전략

```
NestJS 요청 생명주기: Middleware → Guard → Interceptor → Controller

글로벌 JwtAuthGuard (APP_GUARD):
  → @Public() 데코레이터가 있으면 스킵
  → 없으면 JWT 검증 + agents 테이블 조회 → req.agent 설정

Admin 컨트롤러:
  → @Public()로 글로벌 JwtAuthGuard 우회
  → @UseGuards(AdminAuthGuard)로 관리자 인증 (클래스 또는 메서드 단위)
  → AdminAuthGuard: JWT 검증 + admin_users 테이블 조회 → req.admin 설정

Admin 인증 컨트롤러 (특수):
  → @Public()로 글로벌 JwtAuthGuard 우회
  → POST /login: 가드 없음 (누구나 접근)
  → GET /me, POST /logout: @UseGuards(AdminAuthGuard) 메서드 단위 적용
```

### 20-4. 접속 로그 수집 (AccessLogInterceptor)

```
왜 Interceptor인가?
- req.agent는 JwtAuthGuard(Guard 단계)에서 설정됨
- Middleware는 Guard보다 먼저 실행 → req.agent 접근 불가
- Interceptor는 Guard 이후 실행 → req.agent 안전하게 접근

동작 방식:
1. 요청 처리 후 tap() 연산자로 fire-and-forget INSERT
2. req.agent?.id가 있을 때만 기록 (관리자 요청은 자동 스킵)
3. 기록 항목: agent_id, HTTP method, route path, IP, User-Agent

보관 정책:
- 90일 보관, 매일 01:30 크론으로 cleanup_old_access_logs() 실행
- BillingScheduler에 크론 메서드 추가
```

### 20-5. 화면 구성

#### 관리자 로그인 (`/admin/login`)
- 이메일 + 비밀번호 폼 (간결한 디자인)
- 로그인 성공 → `/admin` 리다이렉트
- 에러 메시지: "이메일 또는 비밀번호가 올바르지 않습니다"

#### 관리자 레이아웃
- **다크 사이드바** (bg-gray-900 text-white) — 중개사 대시보드(흰색)와 시각적 구분
- 네비게이션: 대시보드 / 중개사 관리 / 수익 관리 / 접속 통계
- 상단 헤더: 관리자 이름 표시 + 로그아웃 버튼
- `useAdmin()` 훅으로 관리자 정보 로드

#### 대시보드 홈 (`/admin`)
- KPI 카드 4개: 총 중개사 / 활성 중개사 / 이번달 신규 / MRR
- 가입자 증가 추이 라인차트 (recharts, 12개월)
- 최근 가입 중개사 5명 미니 테이블
- 실패 결제 경고 배지 (실패 건수 > 0이면 표시)

#### 중개사 관리 (`/admin/agents`)
- 데이터 테이블: 이름 / 이메일 / 사무소 / 플랜 / 상태 / 가입일 / 최근접속
- 검색바 (이름, 이메일, 사무소명)
- 필터 드롭다운: 구독상태 (trial/active/expired/cancelled), 플랜 (starter/pro)
- 페이지네이션 (20건/페이지)

#### 중개사 상세 (`/admin/agents/[id]`)
- 탭 구성:
  - 기본정보: 프로필 + 구독 정보 + 선택 카테고리
  - 문의 목록: 최근 20건
  - 매물 목록: 최근 20건
  - 결제 이력: 성공/실패 전체
  - 활동 로그: 최근 API 호출 (access_logs)
- 운영 도구:
  - 구독 상태 변경 버튼 (확인 다이얼로그 → PATCH /admin/agents/:id/status)
  - 플랜 변경 버튼 (확인 다이얼로그 → PATCH /admin/agents/:id/plan)
  - 변경 시 admin_audit_logs에 자동 기록

#### 수익 관리 (`/admin/revenue`)
- 요약 카드: MRR / 총매출 / ARPU
- 월별 매출 추이 라인차트 (recharts, 12개월)
- 플랜별 가입자 분포 도넛차트
- 최근 결제 이력 테이블 (성공/실패 필터, 페이지네이션)
- 실패 결제 별도 섹션

#### 접속 통계 (`/admin/stats`)
- DAU / WAU / MAU 카드
- 일별 접속자 추이 라인차트 (30일)
- 가입자 증가 추이 바차트 (12개월)
- 플랫폼 전체 문의/매물 현황 카드

### 20-6. 보안 원칙

| 항목 | 구현 |
|------|------|
| 프론트 경로 보호 | middleware.ts에서 session + app_metadata.is_admin 이중 검증 |
| 백엔드 API 보호 | AdminAuthGuard로 admin_users 테이블 확인 |
| 데이터 접근 | SERVICE_ROLE_KEY로 RLS 우회 (기존 패턴) |
| 민감 필드 | billing_key 응답 제외, phone 복호화 |
| 감사 추적 | 관리자 쓰기 작업 → admin_audit_logs 기록 |
| 접속 로그 보관 | 90일 보관, 일일 크론 정리 |
| 관리자 비활성화 | is_active = false → AdminAuthGuard에서 403 |

### 20-7. 관리자 전용 Hooks

| Hook | API 엔드포인트 | 용도 |
|------|--------------|------|
| `useAdmin()` | `GET /admin/auth/me` | 관리자 정보 + 인증 상태 |
| `useAdminAgents()` | `GET /admin/agents` | 중개사 목록 (검색/필터/페이지네이션) |
| `useAdminAgentDetail(id)` | `GET /admin/agents/:id` | 중개사 상세 + 하위 데이터 |
| `useAdminRevenue()` | `GET /admin/revenue/*` | 수익 요약/이력/추이 |
| `useAdminStats()` | `GET /admin/stats/*` | KPI/접속/가입자 통계 |

모든 hook은 `@tanstack/react-query` 기반, `apiFetch()` 유틸 사용 (기존 패턴 동일).

---

*랜드노트 — 중개사의 업무를 가볍게, 고객과의 연결을 정확하게.*
