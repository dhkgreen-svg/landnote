# ── Stage 1: deps ──────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

# ── Stage 2: builder ──────────────────────────────────────────
FROM deps AS builder
COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY apps/api/ ./apps/api/
# COPY 이후 pnpm workspace package 링크를 다시 구성한다.
# 그렇지 않으면 shared/api의 package-local node_modules 링크가 없어 Docker 빌드가 실패한다.
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @landnote/shared build
RUN pnpm --filter @landnote/api build

# ── Stage 3: runner ────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist
ENV NODE_ENV=production
EXPOSE 3001
WORKDIR /app/apps/api
CMD ["node", "dist/main"]
