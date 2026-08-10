#!/usr/bin/env bash
# تثبيت وتشغيل Cloudflare WARP على Ubuntu/Debian
# الاستخدام: bash scripts/install-cloudflare-warp.sh
# أو:       bash scripts/install-cloudflare-warp.sh --connect-only

set -euo pipefail

KEYRING="/usr/share/keyrings/cloudflare-warp-archive-keyring.gpg"
LIST_FILE="/etc/apt/sources.list.d/cloudflare-client.list"
FALLBACK_CODENAME="noble"

need_sudo() {
  if [[ "${EUID}" -ne 0 ]]; then
    sudo "$@"
  else
    "$@"
  fi
}

detect_codename() {
  if command -v lsb_release >/dev/null 2>&1; then
    lsb_release -cs
  else
    echo "${FALLBACK_CODENAME}"
  fi
}

add_repo() {
  local codename="$1"
  echo ">> إضافة مفتاح Cloudflare..."
  curl -fsSL https://pkg.cloudflareclient.com/pubkey.gpg \
    | need_sudo gpg --yes --dearmor --output "${KEYRING}"

  echo ">> إضافة المستودع (${codename})..."
  echo "deb [signed-by=${KEYRING}] https://pkg.cloudflareclient.com/ ${codename} main" \
    | need_sudo tee "${LIST_FILE}" >/dev/null
}

repo_works() {
  need_sudo apt-get update -o Dir::Etc::sourcelist="${LIST_FILE}" \
    -o Dir::Etc::sourceparts="-" \
    -o APT::Get::List-Cleanup="0" >/dev/null 2>&1
}

install_warp() {
  echo ">> تحديث الحزم وتثبيت cloudflare-warp..."
  need_sudo apt-get update
  need_sudo apt-get install -y cloudflare-warp
}

register_and_connect() {
  echo ">> تسجيل الجهاز وقبول الشروط..."
  if ! warp-cli --accept-tos registration show >/dev/null 2>&1; then
    warp-cli --accept-tos registration new
  else
    echo "   الجهاز مسجّل مسبقاً."
  fi

  echo ">> تفعيل وضع WARP والاتصال..."
  warp-cli --accept-tos mode warp || true
  warp-cli --accept-tos connect

  echo
  echo ">> الحالة:"
  warp-cli status || true

  echo
  echo ">> فحص Cloudflare:"
  if curl -fsS https://www.cloudflare.com/cdn-cgi/trace 2>/dev/null | grep -E '^(ip|warp|colo)='; then
    :
  else
    echo "تعذر جلب حالة Cloudflare (قد يحتاج الاتصال ثوانٍ إضافية)."
  fi
}

print_help() {
  cat <<'EOF'
أوامر مفيدة بعد التثبيت:
  warp-cli status
  warp-cli connect
  warp-cli disconnect
  warp-cli enable-always-on
  warp-cli disable-always-on
EOF
}

main() {
  if [[ "${1:-}" == "--connect-only" ]]; then
    register_and_connect
    print_help
    exit 0
  fi

  if ! command -v curl >/dev/null 2>&1; then
    echo "curl غير موجود. ثبّته أولاً: sudo apt-get install -y curl"
    exit 1
  fi
  if ! command -v gpg >/dev/null 2>&1; then
    echo "gpg غير موجود. ثبّته أولاً: sudo apt-get install -y gnupg"
    exit 1
  fi

  local codename
  codename="$(detect_codename)"
  echo "إصدار النظام: ${codename}"

  add_repo "${codename}"

  if ! need_sudo apt-get update; then
    echo
    echo "!! المستودع لـ ${codename} غير متوفر. التحويل إلى ${FALLBACK_CODENAME}..."
    add_repo "${FALLBACK_CODENAME}"
    need_sudo apt-get update
  fi

  install_warp
  register_and_connect

  echo
  echo "تم التثبيت بنجاح."
  print_help
}

main "$@"
