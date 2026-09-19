# Phase 1 — AWS KMS & IAM Design Sketch

**Change ID:** `CRD-MAIL-ENC-001`  
**Owner:** DevOps / Platform Lead  
**Reviewers:** Security, Engineering Lead  
**Region:** `eu-north-1` (Stockholm)  
**Status:** Draft for Phase 1 approval  

Aligned with Document 2 §4–§5.

---

## 1. CMK

| Setting | Value |
|---------|--------|
| Key type | Symmetric Customer Managed Key (CMK) |
| Region | `eu-north-1` |
| Alias (prod) | `alias/rukny-mail-body-encryption` |
| Alias (staging) | `alias/rukny-mail-body-encryption-staging` |
| Key usage | `ENCRYPT_DECRYPT` |
| Automatic rotation | **Enabled** (annual) |
| Deletion window | **30 days** (multi-person approval to schedule delete) |
| Tags | `service=rukny-mail`, `purpose=body-encryption`, `change=CRD-MAIL-ENC-001` |

**Env config (API):**

```bash
MAIL_KMS_KEY_ID=alias/rukny-mail-body-encryption   # or full ARN
MAIL_BODY_ENCRYPTION_ENABLED=false                 # global kill switch; default false until Doc 3 P6
```

---

## 2. Allowed KMS API Actions

API task role (ECS/EC2/whatever hosts `apps/api`) only:

| Action | Purpose |
|--------|---------|
| `kms:GenerateDataKey` | Envelope encrypt on write / backfill |
| `kms:Decrypt` | Unwrap DEK on read |
| `kms:DescribeKey` | Health / startup checks |
| `kms:Encrypt` | Optional DEK rewrap during rotation jobs |

**Resource:** specific CMK ARN only (not `*`).

---

## 3. IAM Sketch (Task Role)

```json
{
  "Effect": "Allow",
  "Action": [
    "kms:GenerateDataKey",
    "kms:Decrypt",
    "kms:DescribeKey",
    "kms:Encrypt"
  ],
  "Resource": "arn:aws:kms:eu-north-1:[ACCOUNT_ID]:key/[KEY_ID]"
}
```

**Deny / separate:** analytics, bastion, and generic DBA roles must **not** have decrypt on this CMK.

---

## 4. Key Policy Sketch

- Trust AWS account root.  
- Allow Mail API task role for actions in §2.  
- Allow break-glass admin role only with MFA + change ticket (dual control).  
- Enable CloudTrail for KMS data events on this key (account trail).

---

## 5. S3 Alignment (Related)

| Bucket | Action |
|--------|--------|
| `MAIL_S3_BUCKET_RAW` | Enable **SSE-KMS** (same CMK or dedicated S3 CMK) for new objects |
| Historical objects | Deferred re-encrypt (Document 4 RES-04) unless Security elevates |

---

## 6. Provisioning Order

1. Staging CMK + alias + staging API role (before Phase 2 coding needs live KMS).  
2. CloudTrail + metric alarms (throttle, decrypt errors).  
3. Production CMK + alias + prod API role (before Document 3 production P2).  
4. Document ARNs in secrets/config manager — **never** commit key material.

---

## 7. Phase 1 Sign-Off

| Role | Approve sketch | Date |
|------|----------------|------|
| DevOps | ____________ | ________ |
| Security | ____________ | ________ |
| Eng Lead | ____________ | ________ |
