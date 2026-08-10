# ============================================
# PRODUCTION Dockerfile for Next.js App (Workspace)
# Build context: repository root (see docker-compose.rukny-dev.yml)
# ============================================
FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# file: dependency needs the shared package present before npm install
COPY packages/Thmanyah-Font-Family ./packages/Thmanyah-Font-Family
COPY apps/workspace/package.json apps/workspace/package-lock.json* ./apps/workspace/
COPY apps/workspace/packages/react ./apps/workspace/packages/react/
COPY apps/workspace/packages/styles ./apps/workspace/packages/styles/
# postinstall runs scripts/materialize-workspace-deps.mjs
COPY apps/workspace/scripts ./apps/workspace/scripts/

WORKDIR /app/apps/workspace
# Strip workspace:* from nested package manifests (npm cannot resolve them outside a workspace).
RUN --mount=type=cache,id=npm-workspace,target=/root/.npm \
  node -e "const fs=require('fs');const path=require('path');function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.name==='package.json'){const pkg=JSON.parse(fs.readFileSync(p,'utf8'));for(const field of ['dependencies','devDependencies','peerDependencies','optionalDependencies']){if(!pkg[field])continue;for(const [k,v] of Object.entries(pkg[field])){if(String(v).startsWith('workspace:'))delete pkg[field][k];}}fs.writeFileSync(p,JSON.stringify(pkg,null,2)+'\n');}}}walk('packages');" \
  && npm config set fetch-retries 10 \
  && npm config set fetch-timeout 600000 \
  && npm install --no-audit --no-fund

FROM base AS builder
WORKDIR /app/apps/workspace

# Source first (.dockerignore excludes **/node_modules).
# Must land before deps node_modules so file: symlinks cannot collide with COPY.
COPY apps/workspace .
RUN rm -rf node_modules .next
COPY --from=deps /app/apps/workspace/node_modules ./node_modules
COPY --from=deps /app/packages/Thmanyah-Font-Family /app/packages/Thmanyah-Font-Family

# Materialize file: packages (Turbopack rejects outbound symlinks)
RUN node scripts/materialize-workspace-deps.mjs \
  && rm -rf node_modules/@rukny/thmanyah-font \
  && cp -a /app/packages/Thmanyah-Font-Family node_modules/@rukny/thmanyah-font

ENV NEXT_TELEMETRY_DISABLED=1
ARG API_BACKEND_URL=http://localhost:3001
ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
ARG NEXT_PUBLIC_API_EXTERNAL_URL=http://localhost:3001/api/v1
ARG NEXT_PUBLIC_APP_URL=http://localhost:3003
ARG NEXT_PUBLIC_ACCOUNTS_URL=http://localhost:3005
ARG NEXT_PUBLIC_BUSINESS_URL=http://localhost:3003
ARG NEXT_PUBLIC_DEVELOPERS_URL=http://localhost:3004
ARG NEXT_PUBLIC_FORMS_URL=http://localhost:3006
ARG NEXT_PUBLIC_ROOT_DOMAIN=localhost
ENV API_BACKEND_URL=${API_BACKEND_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_API_EXTERNAL_URL=${NEXT_PUBLIC_API_EXTERNAL_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_ACCOUNTS_URL=${NEXT_PUBLIC_ACCOUNTS_URL}
ENV NEXT_PUBLIC_BUSINESS_URL=${NEXT_PUBLIC_BUSINESS_URL}
ENV NEXT_PUBLIC_DEVELOPERS_URL=${NEXT_PUBLIC_DEVELOPERS_URL}
ENV NEXT_PUBLIC_FORMS_URL=${NEXT_PUBLIC_FORMS_URL}
ENV NEXT_PUBLIC_ROOT_DOMAIN=${NEXT_PUBLIC_ROOT_DOMAIN}

RUN test -f node_modules/@rukny/thmanyah-font/src/next.ts

RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/workspace/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/workspace/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/workspace/.next/static ./.next/static

USER nextjs

EXPOSE 3003

ENV PORT=3003
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
