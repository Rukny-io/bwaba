#!/usr/bin/env bash
# Attach KMS policies for both staging and production mail body encryption keys.
# Usage: ./attach-api-iam-dual-keys.sh <ROLE_NAME> [STAGING_KEY_ID] [PROD_KEY_ID]
#
# Defaults:
#   STAGING_KEY_ID=d2e60106-a3ce-4fcb-bf91-92574246e7b2
#   PROD_KEY_ID=required unless PROD_KEY_ID env is set from provision output

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROLE_NAME="${1:?IAM role name required (e.g. rukny-platform)}"
STAGING_KEY_ID="${2:-d2e60106-a3ce-4fcb-bf91-92574246e7b2}"
PROD_KEY_ID="${3:-${MAIL_BODY_PROD_KEY_ID:-}}"

if [[ -z "$PROD_KEY_ID" ]]; then
  echo "PROD_KEY_ID required as arg 3 or MAIL_BODY_PROD_KEY_ID env" >&2
  echo "Provision first: ./scripts/provision-mail-body-kms.sh production" >&2
  exit 1
fi

"${SCRIPT_DIR}/attach-api-iam-policy.sh" staging "$STAGING_KEY_ID" "$ROLE_NAME"
"${SCRIPT_DIR}/attach-api-iam-policy.sh" production "$PROD_KEY_ID" "$ROLE_NAME"

echo ""
echo "Dual-key IAM attached on ${ROLE_NAME}:"
echo "  staging: ${STAGING_KEY_ID}"
echo "  production: ${PROD_KEY_ID}"
