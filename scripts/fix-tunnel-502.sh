#!/bin/bash
# Fix Cloudflare Tunnel 502 on home VPS.
# Root cause: host systemd cloudflared cannot resolve Docker hostname "nginx".
# Keep ONE tunnel only: Docker cloudflared (recommended for docker-compose).

set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run with sudo:"
  echo "  sudo bash scripts/fix-tunnel-502.sh"
  exit 1
fi

echo "Stopping host cloudflared (systemd)..."
systemctl stop cloudflared || true
systemctl disable cloudflared || true

echo "Done. Host tunnel disabled."
echo ""
echo "Now restart Docker tunnel from repo root (as your user):"
echo "  cd ~/Documents/rukny-v1"
echo "  docker compose --env-file .env.production -f docker-compose.yml up -d cloudflared"
echo ""
echo "Test: curl -I https://mail.rukny.io/"
