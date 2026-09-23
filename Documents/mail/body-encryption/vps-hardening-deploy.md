# VPS Hardening Deploy — RUKNY Mail Encryption

Run after merging dual-write + prod CMK code changes.

## 1. AWS (from machine with AWS CLI)

```bash
cd apps/api
export MAIL_AWS_REGION=eu-north-1
# Use credentials that can kms:CreateKey (rukny-platform)

./scripts/provision-mail-body-kms.sh production
# Note KEY_ID from output → PROD_KEY_ID below

./scripts/kms/attach-api-iam-dual-keys.sh rukny-platform \
  d2e60106-a3ce-4fcb-bf91-92574246e7b2 \
  <PROD_KEY_ID>
```

## 2. VPS `~/bwaba/.env`

```env
MAIL_KMS_KEY_ID=alias/rukny-mail-body-encryption
MAIL_BODY_ENCRYPTION_ENABLED=true
MAIL_BODY_ENCRYPTION_DUAL_WRITE=false
MAIL_BODY_ENCRYPTION_DEV_FALLBACK=false
```

## 3. Deploy API

```bash
cd ~/bwaba
git pull
docker compose build api
docker compose up -d api
```

## 4. Verify

```bash
./apps/api/scripts/run-mail-encryption-vps-hardening.sh
```

Send/receive one new message. Latest row should be `ENCRYPTED` with `bodies_nulled=true` and prod KMS ARN.

Open an old message — must decrypt via staging key ARN on row.

## 5. Cron (if not already installed)

```bash
sudo ./apps/api/scripts/install-mail-encryption-cron.sh /root/bwaba
crontab -l
```

## Rollback

```env
MAIL_BODY_ENCRYPTION_DUAL_WRITE=true
MAIL_KMS_KEY_ID=alias/rukny-mail-body-encryption-staging
```

Restart API.
