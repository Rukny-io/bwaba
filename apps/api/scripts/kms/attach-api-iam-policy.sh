#!/usr/bin/env bash
# Attach inline IAM policy for Mail body encryption KMS access to the API task role.
# Usage: ./attach-api-iam-policy.sh <staging|production> <KEY_ID> <ROLE_NAME>
# Example: ./attach-api-iam-policy.sh staging abc12345-6789 rukny-api-staging-task

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_NAME="${1:?env required: staging|production}"
KEY_ID="${2:?KMS key id required}"
ROLE_NAME="${3:?IAM role name required}"

REGION="${MAIL_AWS_REGION:-eu-north-1}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
KEY_ARN="arn:aws:kms:${REGION}:${ACCOUNT_ID}:key/${KEY_ID}"
POLICY_NAME="rukny-mail-body-encryption-${ENV_NAME}"

POLICY_DOC=$(sed -e "s/ACCOUNT_ID/${ACCOUNT_ID}/g" -e "s/KEY_ID/${KEY_ID}/g" \
  "${SCRIPT_DIR}/api-task-role-policy.json")

aws iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name "$POLICY_NAME" \
  --policy-document "$POLICY_DOC"

echo "Attached inline policy ${POLICY_NAME} on role ${ROLE_NAME}"
echo "  Resource: ${KEY_ARN}"
