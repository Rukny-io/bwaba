#!/bin/bash
# ============================================
# Rukny.io - Production Deployment Script
# Run on DigitalOcean VPS
# ============================================

set -e

echo "🚀 Rukny.io Production Deployment"
echo "=================================="

# ─── Check if .env.production exists ───
if [ ! -f .env.production ]; then
    echo "❌ .env.production file not found!"
    echo "   Copy .env.production.example and fill in your values:"
    echo "   cp .env.production.example .env.production"
    exit 1
fi

# Guard against deploying the development stack or a production file with
# host-only/insecure cookies. Keep values out of logs; only validate them.
env_value() {
    awk -F= -v key="$1" '$1 == key {sub(/^[^=]*=/, ""); gsub(/^"|"$/, ""); print; exit}' .env.production
}
if [ "$(env_value NODE_ENV)" != "production" ]; then
    echo "❌ .env.production must contain NODE_ENV=production"
    exit 1
fi
if [ -z "$(env_value COOKIE_DOMAIN)" ]; then
    echo "❌ COOKIE_DOMAIN is required (for example .rukny.io)"
    exit 1
fi
if [ "$(env_value COOKIE_SECURE)" != "true" ]; then
    echo "❌ COOKIE_SECURE=true is required for HTTPS production"
    exit 1
fi

# ─── Build and start containers ───
# Note: do NOT `export $(... xargs)` — values like "Name <email@x>" break bash.
# docker compose --env-file handles quoting correctly.
echo "📦 Building Docker images..."
docker compose --env-file .env.production -f docker-compose.yml build

echo "🔄 Starting services..."
docker compose --env-file .env.production -f docker-compose.yml up -d --build

echo "⏳ Waiting for services to be ready..."
sleep 10

# ─── Check status ───
echo ""
echo "📊 Service Status:"
docker compose --env-file .env.production -f docker-compose.yml ps

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔗 Services:"
echo "   Web:        https://rukny.io"
echo "   Auth:       https://accounts.rukny.io"
echo "   App:        https://app.rukny.io"
echo "   API:        https://api.rukny.io"
echo "   Admin:      https://admin.rukny.io"
echo "   Business:   https://business.rukny.io"
echo "   Developers: https://dev.rukny.io"
