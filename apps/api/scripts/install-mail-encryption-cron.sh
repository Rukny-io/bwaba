#!/usr/bin/env bash
# Install recommended cron jobs for mail body encryption on VPS.
# Usage: sudo ./install-mail-encryption-cron.sh [BWABA_DIR]
# Default BWABA_DIR=/root/bwaba

set -euo pipefail

BWABA_DIR="${1:-/root/bwaba}"
NULL_LINE="0 3 * * * cd ${BWABA_DIR} && docker compose exec -T api node dist/scripts/mail-body-encryption-null-plaintext.js >> /var/log/mail-null-plaintext.log 2>&1"
SCAN_LINE="0 4 * * 0 cd ${BWABA_DIR} && docker compose exec -T api node dist/scripts/mail-body-encryption-scan.js >> /var/log/mail-encryption-scan.log 2>&1"

TMP="$(mktemp)"
crontab -l 2>/dev/null | grep -v 'mail-body-encryption-null-plaintext' | grep -v 'mail-body-encryption-scan' > "$TMP" || true
echo "$NULL_LINE" >> "$TMP"
echo "$SCAN_LINE" >> "$TMP"
crontab "$TMP"
rm -f "$TMP"

echo "Installed mail encryption cron:"
crontab -l | grep mail-body-encryption || true
