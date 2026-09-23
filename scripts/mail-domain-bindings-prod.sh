#!/usr/bin/env bash
# Production helper: inspect Mail domain Redis bindings / AWS env on rukny_mail.
#
#   ./scripts/mail-domain-bindings-prod.sh show
#   ./scripts/mail-domain-bindings-prod.sh clear-domain rukny.tech

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.production}"
COMPOSE="${COMPOSE:-docker-compose.yml}"
ACTION="${1:-show}"
DOMAIN="${2:-}"
KEY="mail:domain-bindings"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi

REDIS_PASSWORD="$(grep -E '^REDIS_PASSWORD=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
if [[ -z "$REDIS_PASSWORD" ]]; then
  echo "REDIS_PASSWORD not set in $ENV_FILE" >&2
  exit 1
fi

redis_cli() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE" exec -T redis \
    redis-cli -a "$REDIS_PASSWORD" --no-auth-warning "$@"
}

show() {
  echo "== Redis key: $KEY =="
  redis_cli GET "$KEY" || true
  echo
  echo "== Mail AWS / JWT env lengths =="
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE" exec -T mail \
    sh -c 'echo AWS_KEY_LEN=${#AWS_ACCESS_KEY_ID}; echo AWS_SECRET_LEN=${#AWS_SECRET_ACCESS_KEY}; echo REGION=${MAIL_AWS_REGION:-unset}; echo JWT_LEN=${#JWT_SECRET}' \
    || true
  echo
  echo "== Recent mail domain / SES log lines =="
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE" logs --tail 120 mail 2>/dev/null \
    | grep -E '\[mail/domains|SES|AWS|AccessDenied|error' \
    || echo "(no matching log lines)"
}

clear_domain() {
  local target="${1:-}"
  target="$(printf '%s' "$target" | tr '[:upper:]' '[:lower:]')"
  if [[ -z "$target" ]]; then
    echo "Usage: $0 clear-domain example.com" >&2
    exit 1
  fi

  local raw
  raw="$(redis_cli GET "$KEY" || true)"
  if [[ -z "$raw" || "$raw" == "(nil)" ]]; then
    echo "No bindings key present."
    exit 0
  fi

  python3 -c '
import json, sys
target = sys.argv[1].strip().lower()
raw = sys.argv[2]
data = json.loads(raw) if raw and raw != "(nil)" else {}
removed = [app for app, row in list(data.items()) if str(row.get("domain", "")).lower() == target]
for app in removed:
    del data[app]
print(json.dumps({"removedAppIds": removed, "remaining": len(data)}))
open("/tmp/mail-bindings-next.json", "w").write(json.dumps(data))
' "$target" "$raw"

  docker compose --env-file "$ENV_FILE" -f "$COMPOSE" exec -T redis \
    redis-cli -a "$REDIS_PASSWORD" --no-auth-warning -x SET "$KEY" < /tmp/mail-bindings-next.json >/dev/null
  echo "Cleared Redis domain binding for: $target"
  redis_cli GET "$KEY" || true
}

case "$ACTION" in
  show) show ;;
  clear-domain) clear_domain "$DOMAIN" ;;
  *)
    echo "Usage: $0 {show|clear-domain <domain>}" >&2
    exit 1
    ;;
esac
