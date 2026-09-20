#!/usr/bin/env bash
# Post-deploy verification for mail body encryption hardening on VPS.
# Run from repo root (e.g. ~/bwaba) after API rebuild/restart.
#
# Usage: ./apps/api/scripts/run-mail-encryption-vps-hardening.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

echo "=== KMS verify ==="
docker compose exec api node dist/scripts/mail-body-encryption-kms-verify.js

echo ""
echo "=== Env flags ==="
docker compose exec api node -e "
console.log(JSON.stringify({
  MAIL_BODY_ENCRYPTION_ENABLED: process.env.MAIL_BODY_ENCRYPTION_ENABLED,
  MAIL_BODY_ENCRYPTION_DUAL_WRITE: process.env.MAIL_BODY_ENCRYPTION_DUAL_WRITE,
  MAIL_KMS_KEY_ID: process.env.MAIL_KMS_KEY_ID,
}, null, 2));
"

echo ""
echo "=== Scan ==="
docker compose exec api node dist/scripts/mail-body-encryption-scan.js

echo ""
echo "=== Latest message crypto status ==="
docker compose exec postgres psql -U "${DB_USER:-rukny_admin}" -d "${DB_NAME:-rukny_io}" -c "
SELECT \"bodyCryptoStatus\",
       \"bodyText\" IS NULL AND \"bodyHtml\" IS NULL AS bodies_nulled,
       \"bodyKmsKeyId\",
       \"createdAt\"
FROM mail_messages
ORDER BY \"createdAt\" DESC
LIMIT 3;
"

echo ""
echo "Done. Send/receive a new message and confirm ENCRYPTED + bodies_nulled=true."
