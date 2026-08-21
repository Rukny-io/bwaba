# ============================================
# PRODUCTION Dockerfile for Next.js Mail App
# Build context: repository root (see docker-compose.yml)
# ============================================
FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# file: dependency needs the shared package present before npm install
COPY packages/auth ./packages/auth
COPY packages/Thmanyah-Font-Family ./packages/Thmanyah-Font-Family
COPY apps/mail/package.json apps/mail/package-lock.json* ./apps/mail/
# Only the file: packages referenced by package.json (skip storybook/vitest)
COPY apps/mail/packages/react ./apps/mail/packages/react/
COPY apps/mail/packages/styles ./apps/mail/packages/styles/
# postinstall runs scripts/materialize-workspace-deps.mjs
COPY apps/mail/scripts ./apps/mail/scripts/

WORKDIR /app/apps/mail
# Strip workspace:* from nested package manifests (npm cannot resolve them outside a workspace).
# Keep devDependencies — Next/Tailwind build needs @tailwindcss/postcss, typescript, etc.
RUN --mount=type=cache,id=npm-mail,target=/root/.npm \
  node -e "const fs=require('fs');const path=require('path');function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.name==='package.json'){const pkg=JSON.parse(fs.readFileSync(p,'utf8'));for(const field of ['dependencies','devDependencies','peerDependencies','optionalDependencies']){if(!pkg[field])continue;for(const [k,v] of Object.entries(pkg[field])){if(String(v).startsWith('workspace:'))delete pkg[field][k];}}fs.writeFileSync(p,JSON.stringify(pkg,null,2)+'\n');}}}walk('packages');" \
  && npm config set fetch-retries 10 \
  && npm config set fetch-timeout 600000 \
  && npm install --no-audit --no-fund

FROM base AS builder
WORKDIR /app/apps/mail

# Source first (root .dockerignore excludes **/node_modules).
# Must land before deps node_modules so file: symlinks cannot collide with COPY.
COPY apps/mail .
RUN rm -rf node_modules .next
COPY --from=deps /app/apps/mail/node_modules ./node_modules
COPY --from=deps /app/packages/auth /app/packages/auth
COPY --from=deps /app/packages/Thmanyah-Font-Family /app/packages/Thmanyah-Font-Family

# Materialize file: packages (Turbopack rejects outbound symlinks)
RUN node scripts/materialize-workspace-deps.mjs \
  && rm -rf node_modules/@rukny/auth \
  && cp -a /app/packages/auth node_modules/@rukny/auth \
  && rm -rf node_modules/@rukny/thmanyah-font \
  && cp -a /app/packages/Thmanyah-Font-Family node_modules/@rukny/thmanyah-font

ENV NEXT_TELEMETRY_DISABLED=1
ARG API_BACKEND_URL=http://api:3001
ARG NEXT_PUBLIC_API_URL=https://api.rukny.io/api/v1
ARG NEXT_PUBLIC_APP_URL=https://app.rukny.io
ARG NEXT_PUBLIC_ACCOUNTS_URL=https://accounts.rukny.io
ARG NEXT_PUBLIC_MAIL_URL=https://mail.rukny.io
ARG NEXT_PUBLIC_ROOT_DOMAIN=rukny.io
ARG JWT_SECRET=build-placeholder-min-32-chars-long

ENV API_BACKEND_URL=${API_BACKEND_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_ACCOUNTS_URL=${NEXT_PUBLIC_ACCOUNTS_URL}
ENV NEXT_PUBLIC_MAIL_URL=${NEXT_PUBLIC_MAIL_URL}
ENV NEXT_PUBLIC_ROOT_DOMAIN=${NEXT_PUBLIC_ROOT_DOMAIN}
ENV JWT_SECRET=${JWT_SECRET}

RUN test -f node_modules/@heroui/react/package.json \
  && test -f node_modules/@rukny/auth/src/edge/check-edge-auth.ts \
  && test -f node_modules/@rukny/thmanyah-font/src/next.ts \
  && test -f /app/packages/Thmanyah-Font-Family/fonts/thmanyahsans/thmanyahsans-Regular.woff2

RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/mail/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/mail/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/mail/.next/static ./.next/static

USER nextjs

EXPOSE 3009

ENV PORT=3009
ENV HOSTNAME="0.0.0.0"

# Monorepo standalone (turbopack root = app dir): server.js at image root.
# Legacy nested layout: apps/mail/server.js — try both.
CMD ["sh", "-c", "if [ -f server.js ]; then exec node server.js; else exec node apps/mail/server.js; fi"]
