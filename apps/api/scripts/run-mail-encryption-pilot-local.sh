#!/usr/bin/env bash
# Local/staging pilot execution: seed → enable pilot → migrate → null-plaintext → gate.
# Requires DATABASE_URL. Uses dev KMS fallback unless MAIL_KMS_KEY_ID is set.
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -z "${DATABASE_URL:-}" ]]; then
  if [[ -f ../../.env ]]; then
    set -a
    # shellcheck disable=SC1091
    source ../../.env
    set +a
  fi
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required"
  exit 1
fi

export NODE_ENV="${NODE_ENV:-development}"
export MAIL_BODY_ENCRYPTION_ENABLED=true
export MAIL_BODY_ENCRYPTION_DEV_FALLBACK="${MAIL_BODY_ENCRYPTION_DEV_FALLBACK:-true}"
export FIELD_ENCRYPTION_KEY="${FIELD_ENCRYPTION_KEY:-${TWO_FACTOR_ENCRYPTION_KEY:-}}"

if [[ -z "${FIELD_ENCRYPTION_KEY:-}" ]] && [[ -z "${MAIL_KMS_KEY_ID:-}" ]]; then
  echo "Set FIELD_ENCRYPTION_KEY (64 hex) or MAIL_KMS_KEY_ID"
  exit 1
fi

echo "==> Seed pilot data"
SEED_JSON=$(npm run mail:body-encryption:pilot-seed --silent 2>/dev/null | tail -1)
PILOT_ID=$(node -e "const j=JSON.parse(process.argv[1]); if(!j.mailAppId) process.exit(1); process.stdout.write(j.mailAppId)" "$SEED_JSON")

echo "==> Enable pilot: ${PILOT_ID}"
npm run mail:body-encryption:pilot -- --enable "$PILOT_ID"

echo "==> Migrate dry-run"
npm run mail:body-encryption:migrate -- --dry-run

echo "==> Migrate"
npm run mail:body-encryption:migrate -- --batch=50

echo "==> Null plaintext dry-run"
npm run mail:body-encryption:null-plaintext -- --dry-run

echo "==> Null plaintext"
npm run mail:body-encryption:null-plaintext

echo "==> Gate"
npm run mail:body-encryption:gate

echo "Pilot local run complete."
