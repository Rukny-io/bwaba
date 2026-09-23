#!/usr/bin/env bash
# Probe AWS SES from inside rukny_mail (read-only GetEmailIdentity).
set -euo pipefail
cd "$(dirname "$0")/.."
ENV_FILE="${ENV_FILE:-.env.production}"
COMPOSE="${COMPOSE:-docker-compose.yml}"
DOMAIN="${1:-rukny.tech}"

docker compose --env-file "$ENV_FILE" -f "$COMPOSE" exec -T mail \
  env PROBE_DOMAIN="$DOMAIN" node -e '
const { SESv2Client, GetEmailIdentityCommand } = require("@aws-sdk/client-sesv2");
const region = process.env.MAIL_AWS_REGION || "eu-north-1";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "";
const domain = process.env.PROBE_DOMAIN || "rukny.tech";
console.log(JSON.stringify({ region, keyLen: accessKeyId.length, secretLen: secretAccessKey.length, domain }, null, 2));
const client = new SESv2Client({
  region,
  credentials: { accessKeyId, secretAccessKey },
});
client.send(new GetEmailIdentityCommand({ EmailIdentity: domain }))
  .then((got) => {
    console.log("SES GET OK", {
      sending: got.VerifiedForSendingStatus,
      dkim: got.DkimAttributes && got.DkimAttributes.Status,
      tokens: ((got.DkimAttributes && got.DkimAttributes.Tokens) || []).length,
    });
  })
  .catch((e) => {
    console.error("SES GET FAIL", e.name || e.code, e.message);
    process.exitCode = 1;
  });
'

echo
echo "== recent mail logs =="
docker compose --env-file "$ENV_FILE" -f "$COMPOSE" logs --tail 40 mail
