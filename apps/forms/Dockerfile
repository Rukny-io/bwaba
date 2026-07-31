# ============================================
# Production Dockerfile — Rukny Forms (Next.js)
# Build context: repository root (see docker-compose.yml)
# ============================================

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat

FROM base AS deps
WORKDIR /app

# file: dependencies need shared packages present before npm install
COPY packages/forms-shared ./packages/forms-shared
COPY packages/auth ./packages/auth
COPY packages/Thmanyah-Font-Family ./packages/Thmanyah-Font-Family
COPY apps/forms/package.json apps/forms/package-lock.json* ./apps/forms/
COPY apps/forms/scripts ./apps/forms/scripts/

WORKDIR /app/apps/forms
RUN --mount=type=cache,id=npm-forms,target=/root/.npm \
  npm config set fetch-retries 10 \
  && npm config set fetch-timeout 600000 \
  && npm install --no-audit --no-fund

FROM base AS builder
WORKDIR /app/apps/forms
COPY --from=deps /app/apps/forms/node_modules ./node_modules
COPY --from=deps /app/packages/forms-shared /app/packages/forms-shared
COPY --from=deps /app/packages/auth /app/packages/auth
COPY --from=deps /app/packages/Thmanyah-Font-Family /app/packages/Thmanyah-Font-Family
COPY apps/forms .

# Materialize file: dependencies (symlinks can confuse Turbopack package exports)
RUN rm -rf node_modules/@rukny/forms-shared \
  && cp -a /app/packages/forms-shared node_modules/@rukny/forms-shared \
  && rm -rf node_modules/@rukny/auth \
  && cp -a /app/packages/auth node_modules/@rukny/auth \
  && rm -rf node_modules/@rukny/thmanyah-font \
  && cp -a /app/packages/Thmanyah-Font-Family node_modules/@rukny/thmanyah-font

ENV NEXT_TELEMETRY_DISABLED=1

ARG API_BACKEND_URL=http://api:3001
ARG NEXT_PUBLIC_API_URL=https://api.rukny.io/api/v1
ARG NEXT_PUBLIC_ACCOUNTS_URL=https://accounts.rukny.io
ARG NEXT_PUBLIC_FORMS_URL=https://forms.rukny.io
ARG NEXT_PUBLIC_APP_URL=https://app.rukny.io
ARG NEXT_PUBLIC_PUBLIC_SITE_URL=https://rukny.io
ARG JWT_SECRET=build-placeholder-min-32-chars-long

ENV API_BACKEND_URL=${API_BACKEND_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_ACCOUNTS_URL=${NEXT_PUBLIC_ACCOUNTS_URL}
ENV NEXT_PUBLIC_FORMS_URL=${NEXT_PUBLIC_FORMS_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_PUBLIC_SITE_URL=${NEXT_PUBLIC_PUBLIC_SITE_URL}
ENV JWT_SECRET=${JWT_SECRET}

RUN test -f node_modules/@rukny/forms-shared/src/apply-security-headers.ts \
  && test -f node_modules/@rukny/auth/src/server/index.ts \
  && test -f /app/packages/Thmanyah-Font-Family/fonts/thmanyahsans/thmanyahsans-Regular.woff2

RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/forms/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/forms/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/forms/.next/static ./.next/static

USER nextjs

EXPOSE 3007

ENV PORT=3007
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
