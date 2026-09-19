#!/usr/bin/env bash
# Provision AWS KMS CMK for Rukny Mail body encryption (staging or production).
# Requires: aws CLI, credentials with kms:CreateKey / kms:CreateAlias.
# See docs/mail/body-encryption/phase-1-kms-iam-sketch.md

set -euo pipefail

REGION="${MAIL_AWS_REGION:-eu-north-1}"
ENV_NAME="${1:-staging}"
if [[ "$ENV_NAME" == "production" ]]; then
  ALIAS="alias/rukny-mail-body-encryption"
else
  ALIAS="alias/rukny-mail-body-encryption-${ENV_NAME}"
fi

echo "Creating CMK in ${REGION} (alias: ${ALIAS})..."

KEY_ID=$(aws kms create-key \
  --region "$REGION" \
  --description "Rukny Mail message body encryption (${ENV_NAME})" \
  --key-usage ENCRYPT_DECRYPT \
  --origin AWS_KMS \
  --query 'KeyMetadata.KeyId' \
  --output text)

aws kms enable-key-rotation --region "$REGION" --key-id "$KEY_ID"

aws kms create-alias \
  --region "$REGION" \
  --alias-name "$ALIAS" \
  --target-key-id "$KEY_ID" 2>/dev/null || \
  aws kms update-alias --region "$REGION" --alias-name "$ALIAS" --target-key-id "$KEY_ID"

aws kms tag-resource \
  --region "$REGION" \
  --key-id "$KEY_ID" \
  --tags TagKey=service,TagValue=rukny-mail TagKey=purpose,TagValue=body-encryption

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
KEY_ARN="arn:aws:kms:${REGION}:${ACCOUNT_ID}:key/${KEY_ID}"

ENV_SNIPPET="apps/api/scripts/staging.mail-encryption.env.example"
if [[ "$ENV_NAME" == "production" ]]; then
  ENV_SNIPPET="apps/api/scripts/production.mail-encryption.env.example"
fi

echo ""
echo "=== Staging/production env (also see ${ENV_SNIPPET}) ==="
echo "  MAIL_AWS_REGION=${REGION}"
echo "  MAIL_KMS_KEY_ID=${ALIAS}"
echo "  MAIL_BODY_ENCRYPTION_ENABLED=false"
echo ""
echo "Key ARN: ${KEY_ARN}"
echo ""
echo "Attach IAM to API task role:"
echo "  ./apps/api/scripts/kms/attach-api-iam-policy.sh ${ENV_NAME} ${KEY_ID} <API_TASK_ROLE_NAME>"
echo ""
echo "Verify after deploy:"
echo "  cd apps/api && npm run mail:body-encryption:kms-verify"
