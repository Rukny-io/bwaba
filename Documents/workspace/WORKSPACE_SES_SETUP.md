# 📧 إعداد Amazon SES — Rukny Workspace

> **آخر تحديث:** 2026-06-21  
> **الأولوية:** 🔴 **ابدأ اليوم** — المراجعة قد تستغرق أياماً إلى أسابيع  
> **مرتبط بـ:** [WORKSPACE_MVP_SCOPE.md](./WORKSPACE_MVP_SCOPE.md) · [aws_workspace_strategy.md](./aws_workspace_strategy.md)

> **Chosen AWS Region:** `eu-north-1` (Stockholm) — **all Mail SES, S3 inbound, Lambda, and SNS resources must live in this Region.**

---

حساب SES الجديد يبدأ في **Sandbox**:

| القيد | التأثير على Workspace |
|-------|----------------------|
| 200 رسالة/يوم فقط | لا يكفي حتى للاختبار الجاد |
| إرسال لمستلمين **موثّقين فقط** | لا تقدر ترسل لعملاء حقيقيين |
| 1 رسالة/ثانية | بطيء جداً |

**بدون Production Access، MVP لا يُطلق.**

---

## 2) checklist قبل الطلب

- [ ] حساب AWS نشط مع billing مفعّل
- [x] اختيار Region ثابت → **`eu-north-1`** (Stockholm — مُثبت)
- [x] Production access في Stockholm (50,000/يوم، 14/ثانية — راجع SES Get set up)
- [ ] موقع rukny.io يعمل ويعرض سياسة خصوصية
- [ ] صفحة «عدم طلب بريد غير مرغوب» / unsubscribe policy (حتى لو بسيطة)

---

## 3) خطوات Console

### 3.1 تفعيل SES

```
AWS Console → Amazon SES → Get started
Region: eu-north-1 (Stockholm) ← ثابت للبريد
```

### 3.2 توثيق هوية إرسال (للاختبار)

```
SES → Configuration → Verified identities → Create identity
→ Domain: rukny.io (أو subdomain mail.rukny.io)
→ Easy DKIM: Enabled
→ أضف سجلات DNS التي يعرضها SES
```

### 3.3 طلب Production Access

```
SES → Account dashboard → Request production access
```

أو: **SES v2** → **Get set up** → **Request production access**

---

## 4) نص الطلب (جاهز للنسخ)

### Mail type
**Transactional** (مع إمكانية transactional فقط في MVP — لا marketing في المرحلة الأولى)

### Website URL
```
https://rukny.io
```

### Use case description

```
Rukny.io is an integrated business platform for the Middle East (Iraq and 
Arab region) combining online stores, forms, events, and link-in-bio pages.

We are launching Rukny Workspace: custom-domain business email for our 
existing customers (e.g. support@customer-store.com, orders@customer-store.com).

Email types (all opt-in / user-initiated):
1. Transactional: order confirmations, form submission notifications, 
   password resets, account security alerts
2. User-composed: business owners replying to customer inquiries from 
   our web-based inbox (similar to webmail)

Recipients receive email only when:
- They registered on our platform or submitted a form / placed an order
- They emailed the customer's business address first (inbound reply)

We do NOT purchase email lists or send unsolicited marketing in MVP.

Infrastructure:
- Amazon SES for send/receive
- SPF, DKIM, DMARC configured per customer domain
- SNS for bounce and complaint notifications
- Suppression list for bounced/complained addresses
- Per-mailbox sending limits to prevent abuse

Expected volume:
- Initial: 500–2,000 emails/day platform-wide
- Growth: 10,000–50,000 emails/day within 12 months

We will monitor bounce rate (<5%) and complaint rate (<0.1%) daily.
```

### Additional details (إن وُجد حقل)

```
Bounce handling: SNS → Lambda → workspace_suppressions table → block future sends
Complaint handling: immediate suppression + account review
Opt-out: all marketing (future) will include List-Unsubscribe header
Contact: [your-email]@rukny.io
```

---

## 5) بعد الموافقة

### 5.1 تحقق الحالة

```bash
aws sesv2 get-account --region eu-north-1
# ProductionAccessEnabled: true
```

### 5.2 إعداد استقبال البريد (Inbound)

```
SES → Email receiving → Rule set → Create rule
→ Recipient: *@verified-domains (لاحقاً per-domain)
→ Action 1: S3 → bucket workspace-emails-raw
→ Action 2: SNS → topic workspace-inbound
→ (Lambda subscribed to SNS)
```

### 5.3 SNS لـ Bounce/Complaint

```
SES → Configuration sets → Create
→ Event destinations: SNS (Bounce, Complaint, Delivery)
→ ربط بـ POST /workspace/webhooks/ses في API
```

### 5.4 متغيرات البيئة

```env
# apps/api/.env
# Mail SES only — do not reuse a global API region if other AWS services stay elsewhere
MAIL_AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
WORKSPACE_SES_CONFIGURATION_SET=rukny-workspace
WORKSPACE_S3_BUCKET_RAW=rukny-workspace-emails-raw
WORKSPACE_S3_BUCKET_ATTACHMENTS=rukny-workspace-attachments
WORKSPACE_SNS_TOPIC_INBOUND=arn:aws:sns:...
WORKSPACE_SNS_TOPIC_BOUNCE=arn:aws:sns:...
```

---

## 6) اختبار في Sandbox (أثناء الانتظار)

1. وثّق بريدك الشخصي في SES
2. أرسل 10 رسائل اختبار من SES Console
3. اختبر استقبال عبر SES simulator:
   - `success@simulator.amazonses.com`
   - `bounce@simulator.amazonses.com`
   - `complaint@simulator.amazonses.com`

---

## 7) إن رُفض الطلب

1. اقرأ سبب الرفض في Support case
2. أضف تفاصيل: SPF/DKIM/DMARC، آلية suppression، حجم أقل في البداية
3. اطلب حداً متواضعاً: «500 emails/day initially»
4. أعد التقديم خلال 24–48 ساعة

**Fallback مؤقت:** الإبقاء على Resend للإشعارات الداخلية فقط — **ليس** بديلاً لبريد العميل المخصص.

---

## 8) Dedicated IP (لاحقاً — ليس MVP)

- **متى:** > 50,000 رسالة/يوم أو مشاكل سمعة مشتركة
- **التكلفة:** $24.95/شهر/IP
- **IP Warming:** 2–4 أسابيع تدرج في الحجم

---

## 9) مراقبة يومية (بعد الإطلاق)

| المؤشر | الحد الأقصى | إجراء |
|--------|------------|-------|
| Bounce rate | 5% | إيقاف إرسال للعناوين المرتدة |
| Complaint rate | 0.1% | تعليق حساب المرسل |
| Sending quota | 80% استخدام | طلب زيادة |

```
CloudWatch Alarm → SNS → فريق الدعم
```

---

## 10) حالة المشروع

| البند | الحالة | التاريخ |
|-------|--------|---------|
| طلب Production Access | ⏳ لم يُقدَّم | — |
| SES Domain rukny.io | ⏳ | — |
| Inbound rule set | 🔧 API webhook ready — create SES rule + S3/SNS in AWS | 2026-08-21 |
| SNS webhooks | ✅ `POST /api/v1/mail/webhooks/ses` | 2026-08-21 |

> **حدّث هذا الجدول يدوياً عند كل خطوة.**

---

*بعد الموافقة، ارجع إلى [WORKSPACE_MVP_SCOPE.md](./WORKSPACE_MVP_SCOPE.md) §4 معايير القبول.*
