# syntax=docker/dockerfile:1.7

# ============================================================================
# Moja Buss — apps/web production image (Next.js 16, standalone output)
#
# Build context: repository ROOT (required — workspace packages + lockfile).
#
#   docker build \
#     -f Dockerfile \
#     --build-arg DATABASE_URL=postgresql://... \
#     --build-arg NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=... \
#     --build-arg NEXT_PUBLIC_APP_URL=https://your-domain.com \
#     --build-arg NEXT_PUBLIC_APP_NAME="Moja Ride" \
#     --build-arg NEXT_PUBLIC_PAYSTACK_CHECKOUT_MODE=inline \
#     --build-arg NEXT_PUBLIC_NOVU_APP_ID=... \
#     -t moja-web .
#
# Runtime envs (DATABASE_URL, BETTER_AUTH_SECRET, PAYSTACK_SECRET_KEY,
# NOVU_SECRET_KEY, CRON_SECRET, BANK_ENCRYPTION_KEY, NEXT_PUBLIC_*, ...) are
# supplied at `docker run` / docker-compose time — they are NOT baked here.
# ============================================================================

###############################################################################
# base — shared toolchain
###############################################################################
FROM node:22-alpine AS base
ENV HUSKY=0 \
    CI=1 \
    NEXT_TELEMETRY_DISABLED=1
# corepack reads the `packageManager: pnpm@10.34.4` pin from package.json
RUN corepack enable
WORKDIR /app

###############################################################################
# deps — install the whole workspace (runs @moja/db postinstall: prisma generate)
###############################################################################
FROM base AS deps
COPY .npmrc pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY apps ./apps

# DATABASE_URL is read eagerly by packages/db/prisma.config.ts while
# `prisma generate` runs during postinstall (it never connects at this stage,
# but getRequiredEnv throws if the var is absent). The same value is reused in
# the builder for prerendering DB-backed pages.
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# package-import-method=copy avoids EXDEV hardlink failures on overlayfs
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir /pnpm/store --config.package-import-method=copy

###############################################################################
# builder — compile the Next.js standalone bundle
###############################################################################
FROM base AS builder
COPY --from=deps /app ./

# Build-time envs. NEXT_PUBLIC_* are inlined into client bundles by Next, so
# they MUST be provided here (and again at runtime for server-side reads).
ARG DATABASE_URL
ARG NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_PAYSTACK_CHECKOUT_MODE
ARG NEXT_PUBLIC_NOVU_APP_ID
ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST
ENV DATABASE_URL=$DATABASE_URL \
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=$NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME \
    NEXT_PUBLIC_PAYSTACK_CHECKOUT_MODE=$NEXT_PUBLIC_PAYSTACK_CHECKOUT_MODE \
    NEXT_PUBLIC_NOVU_APP_ID=$NEXT_PUBLIC_NOVU_APP_ID \
    NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY \
    NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST


RUN pnpm --filter web build

# Next traces app code + runtime deps into apps/web/.next/standalone but does
# NOT copy `public` or `.next/static` — assemble them manually.
RUN cp -r apps/web/public apps/web/.next/standalone/apps/web/public \
 && cp -r apps/web/.next/static apps/web/.next/standalone/apps/web/.next/static

###############################################################################
# migrate — one-shot DB migration job (prisma migrate deploy only)
#
# The legacy apps/web/migrations/001_foundation_constraints.sql runner is NOT
# executed here: it targets PascalCase tables ("Company", "Operator", ...) that
# no longer exist in the schema (the models use @@map to snake_case). None of
# its objects (AuditLog, version columns, UTC/timezone functions) are
# referenced by app code, and it was never successfully re-run after the
# @@map refactor. schema.prisma + the versioned 0_init migration are the
# source of truth.
###############################################################################
FROM builder AS migrate
RUN apk add --no-cache postgresql-client
WORKDIR /app
ENTRYPOINT []
CMD ["sh", "-c", "\
  pnpm --dir packages/db exec prisma migrate deploy \
"]

###############################################################################
# runner — minimal production image (non-root)
###############################################################################
FROM node:22-alpine AS runner
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

WORKDIR /app

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null 2>&1 || exit 1

CMD ["node", "apps/web/server.js"]
