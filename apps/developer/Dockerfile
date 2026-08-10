# syntax=docker/dockerfile:1
# ============================================
# Production Dockerfile — Rukny Developers (Next.js)
# Build context: repository root (see docker-compose.yml)
# ============================================

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat

FROM base AS deps
WORKDIR /app

# file: dependencies need shared packages present before npm install
COPY packages/auth ./packages/auth
COPY packages/Thmanyah-Font-Family ./packages/Thmanyah-Font-Family
COPY apps/developer/package.json apps/developer/package-lock.json* ./apps/developer/
# postinstall runs scripts/materialize-workspace-deps.mjs
COPY apps/developer/scripts ./apps/developer/scripts

WORKDIR /app/apps/developer
RUN --mount=type=cache,id=npm-developer,target=/root/.npm \
  npm config set fetch-retries 10 \
  && npm config set fetch-retry-mintimeout 30000 \
  && npm config set fetch-retry-maxtimeout 300000 \
  && npm config set fetch-timeout 600000 \
  && npm install --no-audit --no-fund

FROM base AS builder
WORKDIR /app/apps/developer

# Source first (.dockerignore excludes **/node_modules).
# Must land before deps node_modules so file: symlinks cannot collide with COPY.
COPY apps/developer .
RUN rm -rf node_modules .next
COPY --from=deps /app/apps/developer/node_modules ./node_modules
COPY --from=deps /app/packages/auth /app/packages/auth
COPY --from=deps /app/packages/Thmanyah-Font-Family /app/packages/Thmanyah-Font-Family

# Materialize file: dependencies (symlinks can confuse Turbopack package exports)
RUN rm -rf node_modules/@rukny/auth \
  && cp -a /app/packages/auth node_modules/@rukny/auth \
  && rm -rf node_modules/@rukny/thmanyah-font \
  && cp -a /app/packages/Thmanyah-Font-Family node_modules/@rukny/thmanyah-font

ENV NEXT_TELEMETRY_DISABLED=1

ARG API_BACKEND_URL=http://api:3001
ARG NEXT_PUBLIC_API_URL=https://api.rukny.io/api/v1
ARG NEXT_PUBLIC_APP_URL=https://app.rukny.io
ARG NEXT_PUBLIC_ACCOUNTS_URL=https://accounts.rukny.io
ARG NEXT_PUBLIC_BUSINESS_URL=https://business.rukny.io
ARG NEXT_PUBLIC_DEVELOPERS_URL=https://developers.rukny.io
ARG NEXT_PUBLIC_FORMS_URL=https://forms.rukny.io
ARG NEXT_PUBLIC_PUBLIC_SITE_URL=https://rukny.io
ARG NEXT_PUBLIC_ROOT_DOMAIN=rukny.io

ENV API_BACKEND_URL=${API_BACKEND_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_ACCOUNTS_URL=${NEXT_PUBLIC_ACCOUNTS_URL}
ENV NEXT_PUBLIC_BUSINESS_URL=${NEXT_PUBLIC_BUSINESS_URL}
ENV NEXT_PUBLIC_DEVELOPERS_URL=${NEXT_PUBLIC_DEVELOPERS_URL}
ENV NEXT_PUBLIC_FORMS_URL=${NEXT_PUBLIC_FORMS_URL}
ENV NEXT_PUBLIC_PUBLIC_SITE_URL=${NEXT_PUBLIC_PUBLIC_SITE_URL}
ENV NEXT_PUBLIC_ROOT_DOMAIN=${NEXT_PUBLIC_ROOT_DOMAIN}

RUN test -f node_modules/@rukny/auth/src/server/index.ts \
  && test -f node_modules/@rukny/thmanyah-font/src/next.ts \
  && test -f /app/packages/Thmanyah-Font-Family/fonts/thmanyahsans/thmanyahsans-Regular.woff2

RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/developer/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/developer/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/developer/.next/static ./.next/static

USER nextjs

EXPOSE 3004

ENV PORT=3004
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
