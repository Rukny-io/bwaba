# syntax=docker/dockerfile:1
# Production Dockerfile — Rukny Checkout (Next.js)
# Build context: repository root

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat

FROM base AS deps
WORKDIR /app

COPY packages/Thmanyah-Font-Family ./packages/Thmanyah-Font-Family
COPY apps/checkout/package.json apps/checkout/package-lock.json* ./apps/checkout/
COPY apps/checkout/scripts ./apps/checkout/scripts/

WORKDIR /app/apps/checkout
RUN --mount=type=cache,id=npm-checkout,target=/root/.npm \
  npm config set fetch-retries 10 \
  && npm config set fetch-timeout 600000 \
  && npm install --no-audit --no-fund

FROM base AS builder
WORKDIR /app/apps/checkout

COPY apps/checkout .
RUN rm -rf node_modules .next
COPY --from=deps /app/apps/checkout/node_modules ./node_modules
COPY --from=deps /app/packages/Thmanyah-Font-Family /app/packages/Thmanyah-Font-Family

RUN rm -rf node_modules/@rukny/thmanyah-font \
  && mkdir -p node_modules/@rukny \
  && cp -a /app/packages/Thmanyah-Font-Family node_modules/@rukny/thmanyah-font

ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_API_URL=https://api.rukny.io/api/v1
ARG NEXT_PUBLIC_CHECKOUT_URL=https://checkout.rukny.io

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_CHECKOUT_URL=${NEXT_PUBLIC_CHECKOUT_URL}

RUN test -f node_modules/@rukny/thmanyah-font/src/next.ts
RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3010
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/checkout/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/checkout/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/checkout/.next/static ./.next/static

USER nextjs
EXPOSE 3010
CMD ["node", "server.js"]
