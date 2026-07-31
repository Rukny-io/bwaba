# ============================================
# PRODUCTION Dockerfile for Next.js App (rukny.work)
# Build context: repository root (see docker-compose.app.yml)
# ============================================
FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# file: dependencies need shared packages present before npm install
COPY packages/auth ./packages/auth
COPY packages/forms-shared ./packages/forms-shared
COPY packages/Thmanyah-Font-Family ./packages/Thmanyah-Font-Family
COPY apps/app/package.json apps/app/package-lock.json* ./apps/app/
# postinstall runs scripts/materialize-workspace-deps.mjs
COPY apps/app/scripts ./apps/app/scripts/

WORKDIR /app/apps/app
RUN --mount=type=cache,id=npm-app,target=/root/.npm \
  npm config set fetch-retries 10 \
  && npm config set fetch-timeout 600000 \
  && npm install --no-audit --no-fund

FROM base AS builder
WORKDIR /app/apps/app

COPY --from=deps /app/apps/app/node_modules ./node_modules
COPY --from=deps /app/packages/auth /app/packages/auth
COPY --from=deps /app/packages/forms-shared /app/packages/forms-shared
COPY --from=deps /app/packages/Thmanyah-Font-Family /app/packages/Thmanyah-Font-Family
COPY apps/app .

# Materialize file: dependencies (symlinks can confuse Turbopack package exports)
RUN rm -rf node_modules/@rukny/auth \
  && cp -a /app/packages/auth node_modules/@rukny/auth \
  && rm -rf node_modules/@rukny/forms-shared \
  && cp -a /app/packages/forms-shared node_modules/@rukny/forms-shared \
  && rm -rf node_modules/@rukny/thmanyah-font \
  && cp -a /app/packages/Thmanyah-Font-Family node_modules/@rukny/thmanyah-font

ENV NEXT_TELEMETRY_DISABLED=1
ARG API_BACKEND_URL=http://localhost:3001
ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_PUBLIC_SITE_URL=http://localhost:3006
ARG NEXT_PUBLIC_ACCOUNTS_URL=http://localhost:3005
ARG NEXT_PUBLIC_BUSINESS_URL=http://localhost:3003
ARG NEXT_PUBLIC_DEVELOPERS_URL=http://localhost:3004
ARG NEXT_PUBLIC_FORMS_URL=http://localhost:3007
ARG NEXT_PUBLIC_ROOT_DOMAIN=localhost
ARG NEXT_PUBLIC_FORM_PUBLIC_ORIGIN=https://rukny.io
ARG NEXT_PUBLIC_EMBED_FORM_SLUG=57fb02
ENV API_BACKEND_URL=${API_BACKEND_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_PUBLIC_SITE_URL=${NEXT_PUBLIC_PUBLIC_SITE_URL}
ENV NEXT_PUBLIC_ACCOUNTS_URL=${NEXT_PUBLIC_ACCOUNTS_URL}
ENV NEXT_PUBLIC_BUSINESS_URL=${NEXT_PUBLIC_BUSINESS_URL}
ENV NEXT_PUBLIC_DEVELOPERS_URL=${NEXT_PUBLIC_DEVELOPERS_URL}
ENV NEXT_PUBLIC_FORMS_URL=${NEXT_PUBLIC_FORMS_URL}
ENV NEXT_PUBLIC_ROOT_DOMAIN=${NEXT_PUBLIC_ROOT_DOMAIN}
ENV NEXT_PUBLIC_FORM_PUBLIC_ORIGIN=${NEXT_PUBLIC_FORM_PUBLIC_ORIGIN}
ENV NEXT_PUBLIC_EMBED_FORM_SLUG=${NEXT_PUBLIC_EMBED_FORM_SLUG}

RUN test -f node_modules/@rukny/auth/src/server/index.ts \
  && test -f node_modules/@rukny/forms-shared/src/apply-security-headers.ts \
  && test -f node_modules/@rukny/thmanyah-font/src/next.ts \
  && test -f /app/packages/Thmanyah-Font-Family/fonts/thmanyahsans/thmanyahsans-Regular.woff2

RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
