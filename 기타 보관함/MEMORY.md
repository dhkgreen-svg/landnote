# LandNote 개발 & Vercel 배포 문제해결 모음 (MEMORY.md)

이 문서는 프로젝트 개발 및 Vercel/Railway 배포 과정에서 발생했던 주요 이슈와 원인, 해결책을 기록하여 향후 동일한 문제가 재발하지 않고 인수인계가 원활하게 이루어지도록 돕습니다.

---

## 1. Vercel 모노레포(Monorepo) 배포 문제 및 해결 가이드

### 이슈 1: `No Next.js version detected` 에러
- **증상**: Vercel 배포 시 8~10초 만에 `Error: No Next.js version detected. Make sure your package.json has "next" in either "dependencies" or "devDependencies".` 에러와 함께 빌드 실패.
- **원인**: Vercel은 프로젝트 Root Directory의 최상위 `package.json`에서 `"next"` 패키지의 존재 여부를 감지하여 Next.js 대시보드 옵션을 적용합니다. 루트 `package.json`에서 `"next"`가 삭제되면 감지 실패로 배포가 중단됩니다.
- **해결책**:
  - 루트 `package.json`의 `devDependencies`에 `"next": "^14.2.0"`을 반드시 유지합니다.
  - `apps/web/package.json`뿐만 아니라 루트에도 선언되어 있어야 Vercel 감지가 정상 동작합니다.

### 이슈 2: `pnpm-lock.yaml` 동기화 해제 (`--frozen-lockfile` 에러)
- **증상**: Vercel 설치 단계(`pnpm install`)에서 배포 즉시 실패.
- **원인**: 루트 또는 하위 패키지(`apps/web`, `apps/api` 등)의 `package.json` 수정 후 `pnpm install`을 실행하지 않아 `pnpm-lock.yaml`과 버전 정보가 불일치함. Vercel은 `pnpm install --frozen-lockfile`로 수행되므로 불일치 시 설치가 거부됨.
- **해결책**:
  - `package.json`을 수정한 후에는 반드시 로컬에서 `pnpm.cmd install`을 실행하여 `pnpm-lock.yaml`을 갱신한 뒤 함께 Git에 커밋/푸시합니다.

### 이슈 3: Vercel에서 백엔드(`apps/api`)와 프론트엔드(`apps/web`) 설정 충돌
- **증상**:
  - `The Next.js output directory "apps/web/.next" was not found at "/vercel/path0/apps/api/apps/web/.next"`
  - `No entrypoint found in output directory: "apps/web/.next"`
- **원인**: Vercel 계정에 `apps/api` 프로젝트와 `apps/web` 프로젝트가 각각 연결되어 있을 때, 최상위 `vercel.json` 설정을 공통으로 공유하면 백엔드 프로젝트에서도 `apps/web/.next` 결과물을 찾으려 하거나 framework 감지 오류가 발생합니다.
- **해결책**:
  - **루트 `vercel.json`**:
    ```json
    {
      "$schema": "https://openapi.vercel.sh/vercel.json",
      "buildCommand": "pnpm turbo build --filter=@landnote/web...",
      "outputDirectory": "apps/web/.next",
      "installCommand": "pnpm install",
      "framework": "nextjs",
      "ignoreCommand": "npx turbo-ignore"
    }
    ```
  - **`apps/web/vercel.json`**:
    ```json
    {
      "$schema": "https://openapi.vercel.sh/vercel.json",
      "framework": "nextjs"
    }
    ```
  - **`apps/api/vercel.json`**:
    ```json
    {
      "$schema": "https://openapi.vercel.sh/vercel.json",
      "buildCommand": "pnpm --filter @landnote/shared build && pnpm --filter @landnote/api build",
      "outputDirectory": "dist",
      "framework": null
    }
    ```
  - **`turbo.json`**: `build.outputs` 배열에 `"apps/web/.next/**"` 및 `"apps/api/dist/**"`를 명시적으로 등록합니다.

---

## 2. NestJS API (`apps/api`) TypeScript 빌드 문제

### 이슈: TS6059 (`rootDir` 범위 초과 에러)
- **증상**: API 빌드 실행 시 `error TS6059: File '/vercel/path0/packages/shared/index.ts' is not under 'rootDir' '/vercel/path0/apps/api/src'. 'rootDir' is expected to contain all source files.` 발생.
- **원인**: `apps/api/tsconfig.json`에서 `@landnote/shared` 매핑이 컴파일 안 된 TS 원본 소스(`../../packages/shared`)로 되어 있어서 `tsc`가 `apps/api/src` 외부 파일 포함으로 판단함.
- **해결책**:
  - `apps/api/tsconfig.json`의 `paths`를 빌드된 결과물인 `dist`로 지정:
    ```json
    "paths": {
      "@landnote/shared": ["../../packages/shared/dist"]
    }
    ```
  - `apps/api` 빌드 전 항상 `@landnote/shared`를 먼저 빌드하도록 빌드 커맨드 설정:
    `pnpm --filter @landnote/shared build && pnpm --filter @landnote/api build`

---

## 3. 사용자 브라우저 상태 오염 및 Hydration 에러 방지

### 이슈: `Application error: a client-side exception has occurred`
- **증상**: 고객 접수 폼 등 특정 페이지 진입 시 복구 불가한 렌더링 예외 발생.
- **원인**: 개발/테스트 과정 중 브라우저 `localStorage` 또는 `sessionStorage`에 저장된 이전 버전의 Zustand 상태가 변경된 UI 스키마/타입과 충돌하여 React Hydration이 실패함.
- **해결책**:
  - `apps/web/app/(form)/error.tsx` 및 `app/global-error.tsx`에 ErrorBoundary 구성.
  - 에러 발생 시 사용자에게 **"초기화하고 처음으로 가기"** 버튼을 제공하여 `localStorage.clear()` 및 Zustand `reset()`을 실행함으로써 복구 경로 제공.

---

## 4. 인수인계 체크리스트 요약
1. **Next.js 15 업그레이드 금지**: 모노레포 의존성과 Vercel 설정상 Next.js 14.2.x 유지.
2. **패키지 변경 후 `pnpm install` 필수**: `package.json` 수정 후에는 항상 lockfile 동기화 커밋.
3. **API 배포는 Railway, Web 배포는 Vercel**: Vercel에 API 프로젝트 연결 시 `apps/api/vercel.json`의 독립 설정 확인.
