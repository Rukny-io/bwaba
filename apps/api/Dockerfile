# ============================================
# PRODUCTION Dockerfile for NestJS API
# ============================================
FROM node:20-alpine AS base

# --- Dependencies ---
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN --mount=type=cache,id=npm-api,target=/root/.npm \
  --mount=type=cache,id=prisma-api,target=/root/.cache/prisma \
  npm config set fetch-retries 10 \
  && npm config set fetch-timeout 600000 \
  && npm install --ignore-scripts --no-audit --no-fund \
  && for attempt in 1 2 3 4 5; do \
       npx prisma generate --config prisma/prisma.config.ts && break; \
       if [ "$attempt" -eq 5 ]; then exit 1; fi; \
       echo "prisma generate failed (attempt $attempt), retrying..."; \
       sleep $((attempt * 5)); \
     done \
  && npm cache clean --force

# --- Builder ---
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN NODE_OPTIONS="--max-old-space-size=4096" npx nest build

# --- Runner ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache openssl ffmpeg \
 && addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nestjs

COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Regenerate prisma client + clean all caches
RUN --mount=type=cache,id=prisma-api-runner,target=/root/.cache/prisma \
  for attempt in 1 2 3 4 5; do \
    npx prisma generate --config prisma/prisma.config.ts && break; \
    if [ "$attempt" -eq 5 ]; then exit 1; fi; \
    echo "prisma generate failed (attempt $attempt), retrying..."; \
    sleep $((attempt * 5)); \
  done \
 && npm cache clean --force \
 && rm -rf /tmp/*

# Writable directories for the non-root user
RUN mkdir -p /app/temp/videos /app/uploads/avatars /app/uploads/events \
    /app/uploads/thumbnails /app/uploads/covers /app/uploads/banners \
    /app/uploads/digital-temp /app/uploads/forms \
 && chown -R nestjs:nodejs /app/temp /app/uploads

USER nestjs

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy --config prisma/prisma.config.ts && node dist/main"]
