# 🗄️ مخطط قاعدة البيانات — Rukny Workspace

> **آخر تحديث:** 2026-06-21  
> **الحالة:** تصميم — **لم تُطبَّق migration بعد**  
> **الملف المستهدف:** `apps/api/prisma/schema.prisma`  
> **مرتبط بـ:** [WORKSPACE_MVP_SCOPE.md](./WORKSPACE_MVP_SCOPE.md)

---

## 1) نظرة عامة

```
User (موجود)
  └── WorkspaceDomain (1..n — MVP: 1)
        └── WorkspaceMailbox (1..3 في MVP)
              └── WorkspaceEmail (threads + messages)
                    └── WorkspaceAttachment
```

---

## 2) Enums

```prisma
enum WorkspaceDomainStatus {
  PENDING_DNS    // أُضيف، بانتظار سجلات DNS
  VERIFYING      // فحص جارٍ
  ACTIVE         // جاهز للإرسال والاستقبال
  SUSPENDED      // تعطيل (إساءة استخدام)
  FAILED         // فشل تحقق متكرر
}

enum WorkspaceMailboxStatus {
  ACTIVE
  SUSPENDED
}

enum WorkspaceEmailFolder {
  INBOX
  SENT
  DRAFTS
  TRASH
}

enum WorkspaceEmailDirection {
  INBOUND
  OUTBOUND
}

enum WorkspaceEmailStatus {
  RECEIVED       // واردة مكتملة
  QUEUED         // في طابور الإرسال
  SENT           // أُرسلت بنجاح
  DELIVERED      // تأكيد تسليم (اختياري)
  BOUNCED        // ارتداد
  COMPLAINED     // شكوى spam
  FAILED         // فشل إرسال
  DRAFT          // مسودة
}
```

---

## 3) النماذج (Models)

```prisma
// ─── Domain ───────────────────────────────────────────────

model WorkspaceDomain {
  id                String                @id @default(uuid())
  userId            String
  domain            String                // example.com (unique per platform)
  status            WorkspaceDomainStatus @default(PENDING_DNS)

  // SES identity
  sesIdentityArn    String?
  sesVerifiedAt     DateTime?

  // DNS verification flags
  mxVerified        Boolean               @default(false)
  spfVerified       Boolean               @default(false)
  dkimVerified      Boolean               @default(false)
  dmarcVerified     Boolean               @default(false)
  lastDnsCheckAt    DateTime?

  // Expected DNS records (JSON for UI display)
  dnsRecords        Json?                 // [{ type, name, value, priority }]

  createdAt         DateTime              @default(now())
  updatedAt         DateTime              @updatedAt

  user              User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  mailboxes         WorkspaceMailbox[]

  @@unique([domain])
  @@index([userId])
  @@index([status])
  @@map("workspace_domains")
}

// ─── Mailbox ──────────────────────────────────────────────

model WorkspaceMailbox {
  id                String                 @id @default(uuid())
  domainId          String
  userId            String                 // مالك الدومين
  localPart         String                 // support (→ support@domain.com)
  displayName       String?
  signatureHtml     String?                @db.Text
  signatureText     String?                @db.Text
  storageUsedBytes  BigInt                 @default(0)
  storageQuotaBytes BigInt                 @default(5368709120) // 5 GB MVP
  status            WorkspaceMailboxStatus @default(ACTIVE)

  createdAt         DateTime               @default(now())
  updatedAt         DateTime               @updatedAt

  domain            WorkspaceDomain        @relation(fields: [domainId], references: [id], onDelete: Cascade)
  user              User                   @relation(fields: [userId], references: [id], onDelete: Cascade)
  emails            WorkspaceEmail[]

  @@unique([domainId, localPart])
  @@index([userId])
  @@index([domainId])
  @@map("workspace_mailboxes")
}

// ─── Email (message + thread metadata) ────────────────────

model WorkspaceEmail {
  id                String                  @id @default(uuid())
  mailboxId         String
  userId            String
  threadId          String                  // UUID — يربط المحادثة
  messageId         String?                 @unique // RFC Message-ID header
  inReplyTo         String?
  references        String[]                @default([])

  direction         WorkspaceEmailDirection
  folder            WorkspaceEmailFolder    @default(INBOX)
  status            WorkspaceEmailStatus    @default(RECEIVED)

  fromAddress       String
  fromName          String?
  toAddresses       String[]                @default([])
  ccAddresses       String[]                @default([])
  bccAddresses      String[]                @default([])
  replyTo           String?

  subject           String                  @default("")
  bodyText          String?                 @db.Text
  bodyHtml          String?                 @db.Text
  snippet           String?                 // أول ~200 حرف للقائمة

  isRead            Boolean                 @default(false)
  isStarred         Boolean                 @default(false)

  // SES metadata
  sesMessageId      String?
  rawS3Key          String?                 // رسالة خام من SES inbound

  sentAt            DateTime?
  receivedAt        DateTime?
  createdAt         DateTime                @default(now())
  updatedAt         DateTime                @updatedAt

  mailbox           WorkspaceMailbox        @relation(fields: [mailboxId], references: [id], onDelete: Cascade)
  user              User                    @relation(fields: [userId], references: [id], onDelete: Cascade)
  attachments       WorkspaceAttachment[]

  @@index([mailboxId, folder, receivedAt])
  @@index([threadId])
  @@index([userId])
  @@index([messageId])
  @@index([mailboxId, folder, isRead])
  @@map("workspace_emails")
}

// ─── Attachment ───────────────────────────────────────────

model WorkspaceAttachment {
  id                String           @id @default(uuid())
  emailId           String
  fileName          String
  contentType       String
  sizeBytes         BigInt
  s3Key             String
  s3Bucket          String

  createdAt         DateTime         @default(now())

  email             WorkspaceEmail   @relation(fields: [emailId], references: [id], onDelete: Cascade)

  @@index([emailId])
  @@map("workspace_attachments")
}

// ─── Suppression (bounce/complaint) ───────────────────────

model WorkspaceSuppression {
  id                String           @id @default(uuid())
  userId            String?          // null = عام للمنصة
  emailAddress      String
  reason            String           // BOUNCE | COMPLAINT | MANUAL
  sesFeedbackId     String?
  createdAt         DateTime         @default(now())

  @@unique([emailAddress])
  @@index([userId])
  @@map("workspace_suppressions")
}
```

---

## 4) تعديلات على `User`

```prisma
model User {
  // ... الحقول الموجودة ...
  workspaceDomains    WorkspaceDomain[]
  workspaceMailboxes  WorkspaceMailbox[]
  workspaceEmails     WorkspaceEmail[]
}
```

---

## 5) فهارس البحث (MVP)

```sql
-- بحث بسيط في Inbox (بدون OpenSearch)
CREATE INDEX workspace_emails_search_idx ON workspace_emails
  USING gin (to_tsvector('simple', coalesce(subject,'') || ' ' || coalesce(snippet,'')));
```

أو في Prisma migration يدوية بعد `@@map`.

---

## 6) حدود الباقة (تطبيق في Service layer)

| الباقة | دومينات | صناديق | تخزين/صندوق | إرسال/شهر |
|--------|---------|--------|-------------|-----------|
| مجانية | 0 | 0 | — | — |
| احترافية | 1 | 3 | 5 GB | 5,000 |
| حوت | 3 | 10 | 25 GB | 25,000 |
| أعمال | 10 | 30 | 100 GB | 100,000 |

انظر [WORKSPACE_PRICING.md](./WORKSPACE_PRICING.md).

---

## 7) تدفق البيانات

### استقبال (Inbound)

```
SES → S3 (raw) → Lambda
  → parse headers/body
  → resolve mailbox by recipient@domain
  → INSERT workspace_emails (INBOUND, INBOX)
  → INSERT workspace_attachments
  → WebSocket notify userId
```

### إرسال (Outbound)

```
API POST /workspace/mail/send
  → INSERT workspace_emails (OUTBOUND, QUEUED)
  → SES SendEmail
  → UPDATE status SENT + sesMessageId
  → MOVE to SENT folder
```

### Bounce/Complaint

```
SNS → POST /workspace/webhooks/ses
  → INSERT workspace_suppressions
  → UPDATE workspace_emails.status
```

---

## 8) خطوات تطبيق Migration

```bash
# 1. أضف النماذج أعلاه إلى schema.prisma
# 2. أنشئ migration
cd apps/api
npx prisma migrate dev --name workspace_mvp

# 3. توليد العميل
npx prisma generate
```

---

## 9) نماذج مؤجّلة (بعد MVP)

```prisma
// WorkspaceLabel       — تصنيفات
// WorkspaceMailboxMember — Shared mailbox
// WorkspaceEmailRule   — قواعد تلقائية
// WorkspaceTemplate    — قوالب رد
```

---

*عند تطبيق migration، حدّث حالة هذا المستند إلى «مُطبَّق» مع اسم الـ migration.*
