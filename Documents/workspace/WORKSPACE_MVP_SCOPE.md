# 🎯 نطاق MVP — Rukny Workspace

> **آخر تحديث:** 2026-06-21  
> **الهدف:** إطلاق أصغر نسخة قابلة للاستخدام — **ربط دومين + 3 صناديق + Inbox/Compose**  
> **المدة المستهدفة:** 8–10 أسابيع  
> **مرتبط بـ:** [WORKSPACE_PRICING.md](./WORKSPACE_PRICING.md) · [WORKSPACE_DATABASE_SCHEMA.md](./WORKSPACE_DATABASE_SCHEMA.md) · [WORKSPACE_SES_SETUP.md](./WORKSPACE_SES_SETUP.md)

---

## 1) ملخص MVP في جملة واحدة

المستخدم يربط **دومينه الموجود**، ينشئ حتى **3 صناديق بريد**، يستقبل ويرسل رسائل من **واجهة Inbox/Compose** داخل `workspace.rukny.io`.

---

## 2) داخل النطاق (In Scope) ✅

### 2.1 الدومينات

| الميزة | التفاصيل |
|--------|----------|
| ربط دومين موجود | المستخدم يضيف `example.com` ويحصل على سجلات DNS المطلوبة |
| التحقق من DNS | MX, SPF, DKIM, DMARC — مؤشر حالة (⏳ / ✅ / ❌) |
| دومين واحد لكل مستخدم (MVP) | توسيع لاحقاً حسب الباقة |
| **شراء دومين جديد** | ❌ خارج MVP |

### 2.2 صناديق البريد

| الميزة | التفاصيل |
|--------|----------|
| إنشاء صندوق | `info@`, `support@`, `sales@` — أي اسم محلي |
| الحد الأقصى | **3 صناديق** (باقة الاحترافية — انظر التسعير) |
| توقيع HTML بسيط | نص + HTML أساسي لكل صندوق |
| Aliases / Catch-all | ❌ خارج MVP |

### 2.3 عميل البريد

| الميزة | التفاصيل |
|--------|----------|
| **Inbox** | قائمة رسائل واردة مع عرض المحادثات (threaded) |
| **Compose** | إنشاء رسالة جديدة |
| **Reply** | رد على رسالة |
| **Forward** | ❌ خارج MVP (مرحلة 2) |
| **Reply All** | ❌ خارج MVP |
| مجلدات | Inbox, Sent, Drafts, Trash فقط |
| Spam folder | ❌ — تصفية SES فقط، بدون واجهة Spam |
| Archive | ❌ خارج MVP |
| مرفقات | رفع/تحميل عبر S3 (حد 10 MB/مرفق في MVP) |
| بحث | بحث بسيط في العنوان والمرسل (PostgreSQL `ILIKE`) |
| Labels | ❌ خارج MVP |

### 2.4 البنية التحتية

| المكون | التفاصيل |
|--------|----------|
| إرسال | Amazon SES API v2 |
| استقبال | SES Receiving → S3 → Lambda → API/DB |
| تخزين مرفقات | S3 bucket `workspace-emails` |
| DNS | إرشادات يدوية + تحقق تلقائي (بدون Route53 API في MVP) |
| إشعار وصول بريد | WebSocket (Socket.IO) — إن وُجد الوقت؛ وإلا polling |

### 2.5 الواجهة (Frontend)

| الصفحة | المسار |
|--------|--------|
| لوحة التحكم | `/app` |
| الدومينات | `/app/domains` |
| صناديق البريد | `/app/mailboxes` |
| البريد (Inbox) | `/app/mail` |
| كتابة رسالة | `/app/mail/compose` |
| محادثة | `/app/mail/[threadId]` |
| الإعدادات | `/app/settings` |
| Shell | `WorkspaceDashboardShell` (مبني على نمط Forms) |
| SSO | تسجيل دخول عبر `accounts.rukny.io` |

### 2.6 API (Backend)

```
POST   /workspace/domains              → إضافة دومين
GET    /workspace/domains              → قائمة الدومينات
GET    /workspace/domains/:id          → تفاصيل + حالة DNS
POST   /workspace/domains/:id/verify   → إعادة فحص DNS

POST   /workspace/mailboxes            → إنشاء صندوق
GET    /workspace/mailboxes            → قائمة الصناديق
PATCH  /workspace/mailboxes/:id        → توقيع / إعدادات
DELETE /workspace/mailboxes/:id        → حذف

GET    /workspace/mail                 → قائمة رسائل (فلتر: folder, mailbox)
GET    /workspace/mail/:threadId     → محادثة
POST   /workspace/mail/send            → إرسال / رد
POST   /workspace/mail/draft           → حفظ مسودة
DELETE /workspace/mail/:id             → نقل لـ Trash

POST   /workspace/webhooks/ses         → SNS bounce/complaint/inbound
```

---

## 3) خارج النطاق (Out of Scope) ❌

| الميزة | المرحلة |
|--------|---------|
| شراء/تجديد دومين | 2 |
| Shared Mailbox / فريق | 2 |
| Labels وقواعد تلقائية | 2 |
| Auto-responder وقوالب | 2 |
| Email Marketing | 3 |
| تكامل المتجر/النماذج/الأحداث | 2 |
| AI (Bedrock) | 3 |
| اجتماعات فيديو (Chime) | 4 |
| Website Hosting (CloudFront) | 3 |
| OpenSearch | 2+ (ابدأ بـ PostgreSQL FTS) |
| IMAP/POP3 للعملاء الخارجيين | لاحقاً |
| تطبيق موبايل | لاحقاً |
| Freemium `@workspace.rukny.io` | 2 |

---

## 4) معايير القبول (Definition of Done)

### دومين

- [ ] المستخدم يضيف دوميناً ويرى سجلات MX/SPF/DKIM/DMARC
- [ ] النظام يتحقق تلقائياً ويعرض ✅ عند الاكتمال
- [ ] SES identity للدومين مُفعّل

### صناديق

- [ ] إنشاء حتى 3 صناديق على دومين موثّق
- [ ] رفض إنشاء صندوق رابع مع رسالة ترقية الباقة

### بريد

- [ ] استقبال رسالة خارجية → تظهر في Inbox خلال ≤ 60 ثانية
- [ ] إرسال رسالة من صندوق مخصص → تصل لـ Gmail/Outlook (ليست Spam)
- [ ] Reply يحافظ على `In-Reply-To` / `References`
- [ ] مرفق ≤ 10 MB يُرفع ويُحمّل
- [ ] Bounce/complaint يُسجّل عبر SNS webhook

### واجهة

- [ ] RTL عربي كامل
- [ ] Shell متجاوب (desktop sidebar + mobile dock)
- [ ] SSO يعمل مع accounts.rukny.io

### تشغيل

- [ ] SES **Production Access** مُفعّل (ليس Sandbox)
- [ ] Bounce rate < 5% · Complaint rate < 0.1%
- [ ] `docker-compose` يشغّل workspace على `:3003`

---

## 5) User Stories

### US-1 — ربط الدومين

> **بصفتي** تاجراً، **أريد** ربط `mystore.com` **لكي** أرسل من `orders@mystore.com`.

**قبول:** أرى سجلات DNS، أضيفها عند مسجّل الدومين، المنصة تؤكد التحقق.

### US-2 — إنشاء صناديق

> **بصفتي** صاحب عمل، **أريد** إنشاء `support@` و `info@` **لكي** أفصل التواصل.

**قبول:** صندوقان يعملان؛ الثالث يُنشأ؛ الرابع مرفوض.

### US-3 — استقبال بريد

> **بصفتي** مستخدماً، **أريد** رؤية رسائل العملاء في Inbox **لكي** أرد عليهم.

**قبول:** رسالة من Gmail تظهر في القائمة مع المرسل والموضوع والوقت.

### US-4 — إرسال ورد

> **بصفتي** مستخدماً، **أريد** الرد من الواجهة **لكي** يرى العميل الرد من `@mystore.com`.

**قبول:** الرد يصل من العنوان الصحيح ضمن نفس المحادثة.

---

## 6) ترتيب التنفيذ

```
الأسبوع 1–2   WORKSPACE_SES_SETUP + Prisma migration + API domains
الأسبوع 3–4   API mailboxes + SES send
الأسبوع 5–6   SES receive + Lambda + webhooks
الأسبوع 7–8   Frontend shell + domains + mailboxes UI
الأسبوع 9–10  Inbox + Compose + Reply + اختبار deliverability
```

---

## 7) مخاطر MVP

| المخاطرة | التخفيف |
|---------|---------|
| SES Sandbox | [WORKSPACE_SES_SETUP.md](./WORKSPACE_SES_SETUP.md) — اطلب Production فوراً |
| رسائل في Spam | DKIM+SPF+DMARC إلزامي قبل الإطلاق |
| تأخر Lambda | اختبار محلي بـ `sam local` أو إرسال يدوي لـ S3 |
| لا SSO جاهز | نسخ نمط Forms `lib/dal.ts` + `/api/auth` BFF |

---

## 8) ما تم إنجازه (2026-06-21)

| البند | الحالة |
|-------|--------|
| وثائق MVP / DB / Pricing / SES | ✅ |
| `WorkspaceDashboardShell` + مسارات placeholder | ✅ |
| Backend API | ⏳ لم يبدأ |
| Prisma migration | ⏳ موثّق فقط |
| SES Production | ⏳ يدوي — انظر WORKSPACE_SES_SETUP |

---

*عند اكتمال كل بند في §8، حدّث هذا المستند وافتح `WORKSPACE_AUDIT_AND_PLAN.md` (لاحقاً) بنمط Forms.*
