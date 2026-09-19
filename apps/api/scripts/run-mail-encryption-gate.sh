#!/usr/bin/env bash
# Staging/production gate: KMS verify → staging-validate → plaintext scan.
# Requires DATABASE_URL and MAIL_KMS_KEY_ID (or dev fallback for local only).
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> KMS verify"
npm run mail:body-encryption:kms-verify

echo "==> Staging validate"
npm run mail:body-encryption:staging-validate

echo "==> Plaintext scan"
npm run mail:body-encryption:scan

echo "Gate passed."
