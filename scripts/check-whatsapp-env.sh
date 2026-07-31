#!/usr/bin/env bash
# Diagnose WhatsApp env for OTP (Technoplus + Meta). Usage:
#   ./scripts/check-whatsapp-env.sh .env.production
set -euo pipefail

ENV_FILE="${1:-.env.production}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ File not found: $ENV_FILE"
  exit 1
fi

load_env() {
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
      key="${BASH_REMATCH[1]}"
      val="${BASH_REMATCH[2]}"
      val="${val%\"}"
      val="${val#\"}"
      val="${val%\'}"
      val="${val#\'}"
      export "$key=$val"
    fi
  done < "$ENV_FILE"
}

load_env

echo "=== WhatsApp env check ($ENV_FILE) ==="
echo ""

# --- Technoplus ---
echo "1) Technoplus Personal API"
if [[ -z "${WHATSAPP_SESSION_ID:-}" || -z "${WHATSAPP_ACCESS_TOKEN:-}" ]]; then
  echo "   ❌ WHATSAPP_SESSION_ID or WHATSAPP_ACCESS_TOKEN missing"
else
  BASE="${WHATSAPP_API_URL:-https://message.dashboard.technoplus.tech}"
  rm -f /tmp/wa_tp.json
  HTTP_CODE=$(curl -sS -o /tmp/wa_tp.json -w "%{http_code}" \
    -H "Authorization: Bearer ${WHATSAPP_ACCESS_TOKEN}" \
    -H "Accept: application/json" \
    "${BASE}/whatsapp/api/v1/session/${WHATSAPP_SESSION_ID}/check" 2>/dev/null || echo "000")
  echo "   Session check HTTP: $HTTP_CODE"
  if [[ "$HTTP_CODE" == "200" ]]; then
    echo "   ✅ Technoplus session OK — $(cat /tmp/wa_tp.json)"
  elif [[ "$HTTP_CODE" == "401" ]]; then
    echo "   ❌ 401 Unauthenticated — regenerate WHATSAPP_ACCESS_TOKEN in Technoplus dashboard"
  elif [[ "$HTTP_CODE" == "000" ]]; then
    echo "   ⚠️  Network/DNS error — could not reach Technoplus (check internet/DNS on this machine)"
  else
    echo "   ❌ Response: $(cat /tmp/wa_tp.json 2>/dev/null || echo n/a)"
  fi
fi
echo ""

# --- Meta ---
echo "2) Meta WhatsApp Business"
if [[ -z "${WHATSAPP_BUSINESS_TOKEN:-}" || -z "${WHATSAPP_PHONE_NUMBER_ID:-}" ]]; then
  echo "   ❌ WHATSAPP_BUSINESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID missing"
else
  rm -f /tmp/wa_meta.json
  HTTP_CODE=$(curl -sS -o /tmp/wa_meta.json -w "%{http_code}" \
    -H "Authorization: Bearer ${WHATSAPP_BUSINESS_TOKEN}" \
    "https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}?fields=verified_name,display_phone_number" 2>/dev/null || echo "000")
  echo "   Phone ID lookup HTTP: $HTTP_CODE"
  if [[ "$HTTP_CODE" == "200" ]]; then
    echo "   ✅ Meta phone number OK — $(cat /tmp/wa_meta.json)"
  elif [[ "$HTTP_CODE" == "000" ]]; then
    echo "   ⚠️  Network/DNS error — could not reach graph.facebook.com"
  else
    echo "   ❌ $(cat /tmp/wa_meta.json 2>/dev/null || echo n/a)"
    echo "   → Regenerate token in Meta Business Suite with whatsapp_business_messaging"
    echo "   → Confirm WHATSAPP_PHONE_NUMBER_ID matches WABA (${WHATSAPP_BUSINESS_ACCOUNT_ID:-${WHATSAPP_WABA_ID:-?}})"
  fi
fi
echo ""
echo "After fixing .env, run: docker compose --env-file $ENV_FILE up -d api"
