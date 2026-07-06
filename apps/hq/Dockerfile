# ============================================
# PRODUCTION Dockerfile for Next.js App (HQ)
# Build context: repository root (see docker-compose.yml)
# ============================================
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat

FROM base AS deps
WORKDIR /app

# file: dependencies need shared packages present before npm install
COPY packages/auth ./packages/auth
COPY packages/Thmanyah-Font-Family ./packages/Thmanyah-Font-Family
COPY apps/hq/package.json apps/hq/package-lock.json* ./apps/hq/

WORKDIR /app/apps/hq
RUN --mount=type=cache,target=/root/.npm \
  npm config set fetch-retries 10 \
  && npm config set fetch-timeout 600000 \
  && npm install --no-audit --no-fund

FROM base AS builder
WORKDIR /app/apps/hq

COPY --from=deps /app/apps/hq/node_modules ./node_modules
COPY --from=deps /app/packages/auth /app/packages/auth
COPY --from=deps /app/packages/Thmanyah-Font-Family /app/packages/Thmanyah-Font-Family
COPY apps/hq .

# Materialize file: dependencies (symlinks can confuse Turbopack package exports)
RUN rm -rf node_modules/@rukny/auth \
  && cp -a /app/packages/auth node_modules/@rukny/auth \
  && rm -rf node_modules/@rukny/thmanyah-font \
  && cp -a /app/packages/Thmanyah-Font-Family node_modules/@rukny/thmanyah-font

ENV NEXT_TELEMETRY_DISABLED=1
ARG API_BACKEND_URL=http://localhost:3001
ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_ACCOUNTS_URL=http://localhost:3005
ARG NEXT_PUBLIC_BUSINESS_URL=http://localhost:3003
ARG NEXT_PUBLIC_DEVELOPERS_URL=http://localhost:3004
ARG NEXT_PUBLIC_FORMS_URL=http://localhost:3006
ARG NEXT_PUBLIC_ROOT_DOMAIN=localhost
ENV API_BACKEND_URL=${API_BACKEND_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_ACCOUNTS_URL=${NEXT_PUBLIC_ACCOUNTS_URL}
ENV NEXT_PUBLIC_BUSINESS_URL=${NEXT_PUBLIC_BUSINESS_URL}
ENV NEXT_PUBLIC_DEVELOPERS_URL=${NEXT_PUBLIC_DEVELOPERS_URL}
ENV NEXT_PUBLIC_FORMS_URL=${NEXT_PUBLIC_FORMS_URL}
ENV NEXT_PUBLIC_ROOT_DOMAIN=${NEXT_PUBLIC_ROOT_DOMAIN}

RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/hq/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/hq/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/hq/.next/static ./.next/static

USER nextjs

EXPOSE 3002

ENV PORT=3002
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
