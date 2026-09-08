# خطة عمل Email API — بوابة المطورين (Rukny Developer)

> **الإصدار:** 1.0  
> **التاريخ:** 5 سبتمبر 2026  
> **النطاق:** `apps/developer` + `apps/api` (domain developer + email)  
> **الحالة الحالية:** MVP منفّذ على فرع `cursor/developer-email-api`، والبناء والاختبارات ناجحة، وmigration مطبّقة. الإطلاق الفعلي ينتظر نطاقاً مملوكاً وإعداد SES production access وconfiguration set وSNS topic.

---

## 1. الملخص التنفيذي

**Email API** هو منتج مطوّرين لإرسال **بريد transactional** عبر HTTP REST باستخدام `X-API-Key` — مشابه لـ WhatsApp API في نفس البوابة. الهدف: تمكين المطورين من إرسال رسائل (تأكيد حساب، إشعارات، فواتير…) من backend تطبيقاتهم دون الاعتماد على JWT أو واجهة Mail.

### الوضع الحالي

| الطبقة | الحالة |
|--------|--------|
| Frontend catalog | `emailApi` متاح وله route داخل التطبيق |
| Backend catalog | `emailApi: { status: 'available' }` وقابل للتثبيت |
| Routes | صفحات `/apps/{appId}/email-api/*` منفّذة |
| Components | واجهات docs، domains، الاشتراك وTry it منفّذة |
| Scopes | صلاحيات `email:*` مضافة في frontend وbackend |
| Public API | `POST /api/v1/email/messages` وقراءة الحالة منفّذان |
| Try it | `/developer/email/api-try` منفّذ لمفاتيح test |

### ما يُستخدم كمرجع (Template)

**WhatsApp API** هو النموذج المعتمد بالكامل:

```
apps/developer/
├── lib/whatsapp-api-catalog.ts      ← كatalog endpoints
├── lib/whatsapp-api-copy.ts         ← i18n bridge
├── lib/whatsapp-api-routes.ts       ← route helpers
├── lib/whatsapp-api-code-samples.ts ← curl / Node samples
├── components/whatsapp-api/         ← UI components
└── app/.../whatsapp-api/            ← App Router pages

apps/api/
└── domain/whatsapp-provider/messaging/
    ├── messaging.controller.ts      ← ApiKeyAuthGuard + RequireScopes
    └── whatsapp-api-try.*           ← Try it BFF
```

### ما هو **ليس** Email API

| المنتج | المسار | المصادقة | الغرض |
|--------|--------|----------|-------|
| **Rukny Mail** | `apps/mail` | JWT + mailbox session | صندوق بريد كامل (inbox, forwarders…) |
| **Mail API** | `/api/v1/mail/apps/:appId/messages` | JwtAuthGuard | إرسال من mailbox محدد |
| **EmailService** | `integrations/email/` | داخلي | بريد المنصة (auth, forms…) |

Email API منتج **مستقل** يشارك البنية التحتية (SES) لكن له auth model وproduct lifecycle وdocs خاصة.

---

## 2. الأهداف ومعايير النجاح

### أهداف المنتج

1. إرسال بريد transactional عبر REST API بمفتاح `rk_live_` / `rk_test_`
2. توثيق كامل داخل بوابة المطورين (Overview, Auth, Send, Domains, Webhooks, Errors, Try it, SDKs)
3. تثبيت المنتج من صفحة Products مع ظهوره في sidebar rail
4. حصة مجانية وحصة شهرية واضحة، مع منع الإرسال عند نفاد الحصة (live)
5. بيئة test بدون خصم فعلي (أو sandbox domain)

### معايير القبول (Definition of Done)

- [x] `emailApi` = `available` في frontend + backend catalog
- [x] تثبيت/إلغاء تثبيت المنتج مدعوم عبر API العام للمنتجات
- [x] `POST /api/v1/email/messages` يستخدم `X-API-Key` + scope `email:send`
- [x] عزل الرسائل والمرسلين والنطاقات بحسب المالك والتطبيق
- [x] قائمة suppression تعالج hard bounce وcomplaint
- [x] منع تكرار الرسالة باستخدام `Idempotency-Key`
- [x] صفحات `/apps/{appId}/email-api/*` تعرض docs
- [x] Try it يرسل server-side بمفتاح `rk_test_` فقط
- [x] Scopes تظهر في إنشاء/تعديل API keys
- [ ] Analytics تعرض إحصائيات email (اختياري — مرحلة لاحقة)
- [ ] i18n: وصف المنتج بالعربية؛ docs API بالإنجليزية (LTR) مثل WhatsApp API

---

## 3. قرارات معمارية

### 3.1 تصميم الـ API العام

**Base URL:** `https://api.rukny.io/api/v1` (أو `NEXT_PUBLIC_API_URL`)

| Method | Path | Scope | الوصف |
|--------|------|-------|-------|
| `POST` | `/email/messages` | `email:send` | إرسال رسالة |
| `GET` | `/email/messages/:id` | `email:read` | حالة التسليم |
| `GET` | `/email/domains` | `email:domains:read` | قائمة النطاقات |
| `POST` | `/email/domains` | `email:domains:write` | إضافة نطاق للتحقق |
| `GET` | `/email/domains/:domain` | `email:domains:read` | حالة DNS/SPF/DKIM |
| `DELETE` | `/email/domains/:domain` | `email:domains:write` | حذف نطاق |
| `POST` | `/email/webhooks` | `email:webhooks:manage` | تسجيل webhook (مرحلة 2) |

**Headers مطلوبة:**

```
X-API-Key: rk_live_xxxxxxxx
Content-Type: application/json
Idempotency-Key: <required, 8-128 chars>   ← مطلوب للإرسال live
```

**Body — Send Email (مقترح):**

```json
{
  "from": "noreply@yourdomain.com",
  "fromName": "Your App",
  "to": ["user@example.com"],
  "subject": "Welcome",
  "bodyText": "Hello!",
  "bodyHtml": "<p>Hello!</p>",
  "replyTo": ["support@yourdomain.com"],
  "tags": ["welcome", "onboarding"]
}
```

**حدود MVP للطلب:** مستلم واحد فقط، بلا `cc` أو `bcc` أو مرفقات؛ حد أقصى 100KB للنص/HTML. تُرفض الحقول غير المعرّفة في DTO صراحةً لمنع mass assignment.

**Response:**

```json
{
  "id": "em_01HXXXX",
  "status": "queued",
  "createdAt": "2026-09-05T15:00:00.000Z"
}
```

### 3.2 Scopes

إضافة إلى `apps/developer/lib/api/scopes.ts` و backend validation:

| Scope | النوع | الوصف |
|-------|-------|-------|
| `email:send` | write | إرسال رسائل |
| `email:read` | read | قراءة حالة الرسائل |
| `email:domains:read` | read | عرض النطاقات |
| `email:domains:write` | write | إدارة النطاقات |
| `email:webhooks:manage` | write | webhooks |

**Default scopes للمفاتيح الجديدة (مقترح):** `email:send`, `email:read`

**Write scopes (تحذير live):** `email:send`, `email:domains:write`, `email:webhooks:manage`

### 3.3 ملكية النطاق والـ Sender Identity

- النطاق والـ sender identity موردان مملوكان لحساب العميل (`userId`) ويجري التحقق منهما مرة واحدة فقط.
- يربط العميل sender identity بتطبيق واحد أو أكثر؛ لا يستطيع API key لتطبيق ما استخدام sender غير مربوط به حتى لو كان لنفس الحساب.
- لا إرسال live إلا من sender **verified** ومربوط بالتطبيق الحالي.
- إعادة استخدام `MailSesService.getEmailIdentity()` لقراءة حالة DKIM/SPF
- UI لعرض سجلات DNS المطلوبة (مثل Mail app لكن داخل developer portal)
- بيئة **test:** السماح بالإرسال إلى عناوين test فقط أو من `sandbox@mail.rukny.io`

### 3.4 الحصص والاشتراك والفوترة

- يحصل **حساب العميل** على 1,000 رسالة مجانية مرة واحدة عند تفعيل Email API لأول مرة؛ لا تتكرر لكل Developer App.
- اشتراك `Email API Starter` بقيمة **15,000 د.ع شهريًا** ويتضمن 10,000 رسالة في كل دورة شهرية. لا يوجد إرسال غير محدود.
- تحتسب الرسالة لكل مستلم؛ في MVP يوجد مستلم واحد للطلب.
- لا ترحّل الحصة غير المستخدمة إلى الشهر التالي في الإصدار الأول.
- عند انتهاء الاشتراك أو نفاد الحصة: ترفض طلبات live بـ `402 quota_exceeded`، مع بقاء قراءة السجلات وإدارة النطاقات متاحة.
- لا يخصم test environment من الحصة. لا تُعاد الحصة عند bounce أو complaint، لأن محاولة الإرسال استُهلكت لدى المزود.
- التسجيل المالي والحصة يجب أن يكونا atomic في معاملة DB واحدة؛ ينفّذ مزود الإرسال بعد حجز الرسالة ومنع التكرار بـ idempotency.

```typescript
export const EMAIL_API_PLAN = {
  activationGrant: 1_000,
  starterMonthlyPriceIqd: 15_000,
  starterMonthlyQuota: 10_000,
  testQuotaCost: 0,
} as const;
```

- تبدأ خدمة الحصة على مستوى `userId`/العميل، ثم تسجل الاستهلاك مع `developerAppId` لأغراض التحليل والمراقبة. لا تستخدم `DeveloperAppWallet` الحالي كمصدر وحيد للحقيقة لأن الحصة مشتركة بين التطبيقات.

### 3.5 قاعدة البيانات (Prisma — مقترح)

```prisma
model DeveloperEmailMessage {
  id              String   @id @default(cuid())
  developerAppId  String
  apiKeyId        String?
  externalId      String   @unique  // em_xxx للـ public API
  from            String
  to              String[] // أو Json
  subject         String
  status          DeveloperEmailStatus  // QUEUED | SENT | DELIVERED | BOUNCED | FAILED
  sesMessageId    String?
  idempotencyKey  String?
  environment     ApiKeyEnvironment     // test | live
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  developerApp DeveloperApp @relation(...)
  apiKey       DeveloperApiKey? @relation(...)

  @@unique([developerAppId, idempotencyKey])
  @@index([developerAppId, createdAt])
}

model DeveloperEmailDomain {
  id             String   @id @default(cuid())
  userId         String   // ملكية العميل؛ النطاق يتحقق مرة واحدة
  domain         String
  status         String   // pending | verified | failed
  dkimTokens     Json?
  verifiedAt     DateTime?
  createdAt      DateTime @default(now())

  user         User       @relation(...)

  @@unique([userId, domain])
}

model DeveloperEmailSenderBinding {
  id             String   @id @default(cuid())
  developerAppId String
  emailDomainId  String
  localPart      String   // مثال: noreply
  status         String   // active | suspended
  createdAt      DateTime @default(now())

  @@unique([developerAppId, emailDomainId, localPart])
}
```

### 3.6 Module structure (Backend)

```
apps/api/src/domain/email-api/
├── email-api.module.ts
├── messaging/
│   ├── email-messages.controller.ts    ← Public API (ApiKeyAuthGuard)
│   ├── email-messages.service.ts
│   └── dto/send-email.dto.ts
├── domains/
│   ├── email-domains.controller.ts
│   └── email-domains.service.ts
├── webhooks/                           ← مرحلة 2
│   └── email-webhooks.service.ts
├── email-api-try.controller.ts         ← JWT, portal only
├── email-api-try.service.ts
└── email-delivery.service.ts           ← SES send + status updates
```

**إعادة الاستخدام:**
- `MailSesService` — الإرسال عبر AWS SES
- `ApiKeyAuthGuard`, `RequireScopes` — من developer/api-keys
- `WalletService` — الخصم
- `DeveloperRateLimitService` — rate limiting

### 3.7 الأمن والحماية — متطلبات إلزامية للإطلاق

**مستوى الحماية المستهدف:** API production-grade للتعامل مع محتوى البريد ومفاتيح العملاء، مع تطبيق طبقات حماية متداخلة. لا يُطلق المنتج إذا أخفقت أي من ضوابط P0 أدناه.

| المجال | الخطر | الضابط الإلزامي |
|---|---|---|
| العزل بين العملاء والتطبيقات | BOLA/IDOR: قراءة رسالة أو استخدام نطاق تطبيق آخر | كل query يقيّد بـ `developerAppId` المستخرج من API key، مع التحقق من ملكية الرابط بين sender/app؛ لا يُستخدم `id` القادم من العميل وحده. |
| مفاتيح API | تسرب أو إعادة استخدام المفتاح | تخزين hash فقط للاستخدام العادي؛ عرض المفتاح مرة واحدة؛ تشفير reveal الموجود بمفتاح منفصل؛ revoke فوري، expiry، IP allowlist، وتدقيق استعمال المفتاح. لا تُسجّل المفاتيح أو body البريد في logs. |
| إساءة استخدام الإرسال والكلفة | spam، bot abuse، استنزاف quota أو SES | rate limit متدرج لكل API key ثم لكل app ثم لكل user/IP؛ quota شهري atomic؛ حد حجم payload، مستلم واحد، وحد أقصى للتزامن؛ circuit breaker عند أخطاء المزود. |
| التحقق من المدخلات | header injection، XSS في البوابة، mass assignment | DTO whitelist مع `forbidNonWhitelisted`؛ تحقق RFC-safe من العناوين ورفض CR/LF في `from`, `subject`, `replyTo`; sanitize HTML للعرض فقط؛ لا تعرض HTML الرسالة داخل البوابة دون sandbox. |
| DNS وsender | spoofing أو إرسال من نطاق غير مصرح | DKIM/SPF وverification مكتملة؛ sender binding نشط؛ From وReply-To من نطاق مسموح؛ إعادة التحقق عند تغيّر status. |
| الويب هوكس | SSRF وتسريب أحداث إلى وجهات داخلية | HTTPS فقط؛ منع localhost وprivate/link-local IP ranges بعد DNS resolution، منع redirects، allowlist اختياري، timeout قصير، توقيع HMAC مع timestamp، وإعادة محاولة محدودة مع backoff. |
| delivery events | تزوير SNS أو إعادة تشغيل event | تحقق من توقيع SNS الرسمي قبل المعالجة؛ event id فريد/idempotent؛ لا تثق بأي payload خارجي قبل validation. |
| الخصوصية والسجلات | كشف PII ومحتوى الرسائل | تشفير at-rest للـbody أو عدم حفظه افتراضيًا؛ احتفظ بالmetadata والحالة فقط في MVP؛ masking للعناوين في UI/logs؛ retention محدد وحذف آمن. |
| البنية والإدارة | misconfiguration أو امتيازات زائدة | Secrets في secret manager؛ IAM least privilege لمنفذ SES/SNS؛ TLS فقط؛ production/test AWS resources منفصلة؛ CORS allowlist؛ تعطيل stack traces وdebug endpoints في production. |

**سياسة السمعة ومنع الإساءة:**

- hard bounce أو complaint يضيف المستلم فورًا إلى suppression list الخاصة بالعميل، ويمنع محاولة live لاحقة إليه.
- يوقف النظام الـsender binding أو التطبيق تلقائيًا عند نمط غير طبيعي (قفزة في complaints/bounces، rate-limit violations، أو مؤشرات spam)، ثم يتطلب مراجعة بشرية لإعادة التفعيل.
- لا تدعم bulk send أو attachments أو open/click tracking في MVP؛ توسع هذه القدرات فقط بعد threat model ومراجعة أمنية منفصلة.
- تسجل audit trail غير قابل للتعديل منطقيًا لعمليات: إنشاء/reveal/revoke المفتاح، تغيير IP allowlist، domain/sender binding، الاشتراك، إيقاف التطبيق، وتغيير webhook.

**بوابات الأمان قبل الإنتاج:** threat model ومراجعة كود، SAST/dependency scan بلا ثغرات حرجة أو عالية غير معالجة، اختبارات authorization سلبية، fuzzing للـDTO، اختبار rate-limit وidempotency تحت التوازي، واختبار SSRF للـwebhooks. تستند هذه الضوابط إلى مخاطر OWASP API، وبالأخص Broken Object Level Authorization، الاستهلاك غير المقيد للموارد، وSSRF في الويب هوكس. [OWASP API Security Top 10](https://owasp.org/API-Security/editions/2023/en/0x11-t10/)

---

## 4. هيكل Frontend (Developer Portal)

### 4.1 Routes المطلوبة

```
/apps/[appId]/email-api/
├── page.tsx              → Overview + Quickstart
├── auth/page.tsx         → X-API-Key + scopes
├── messages/page.tsx     → POST send, GET status
├── domains/page.tsx      → Domain verification
├── webhooks/page.tsx     → Outbound events (مرحلة 2)
├── errors/page.tsx       → HTTP errors
├── try/page.tsx          → Try it console
└── sdks/page.tsx         → Node/curl examples
```

### 4.2 ملفات lib جديدة

| الملف | الغرض |
|-------|-------|
| `lib/email-api-catalog.ts` | Endpoints, methods, scopes, try config |
| `lib/email-api-copy.ts` | Bridge إلى dictionaries |
| `lib/email-api-routes.ts` | `appEmailApi()`, section hrefs |
| `lib/email-api-code-samples.ts` | curl, Node, fetch samples |
| `lib/api/email-api-try.ts` | Client لـ Try it BFF |

### 4.3 Components

```
components/email-api/
├── email-api-chrome.tsx       ← Header + nav (dir=ltr, lang=en)
├── email-api-nav.tsx          ← Pill navigation
├── email-api-overview.tsx
├── email-api-auth.tsx
├── email-api-messages.tsx
├── email-api-domains.tsx
├── email-api-webhooks.tsx
├── email-api-errors.tsx
├── email-api-try-it.tsx
├── email-api-sdks.tsx
├── email-api-endpoint-card.tsx  ← يمكن reuse/adapt من whatsapp
├── email-api-code-panel.tsx
└── email-api-shared.ts
```

### 4.4 تعديلات على ملفات موجودة

| الملف | التعديل |
|-------|---------|
| `lib/developer-products.ts` | `status: 'available'`, `resolveHref: appEmailApi` |
| `lib/app-routes.ts` | `export function appEmailApi(appId)` |
| `lib/product-route-map.ts` | `'email-api': 'emailApi'` |
| `dictionaries/en.json` | قسم `emailApi` كامل (~100+ keys) |
| `dictionaries/ar.json` | ترجمة وصف المنتج + nav labels |
| `lib/api/scopes.ts` | scopes جديدة |
| Backend `developer-product-catalog.ts` | `emailApi: { status: 'available' }` |

### 4.5 Layout gate

```tsx
// app/(portal)/apps/[appId]/email-api/layout.tsx
await requireProductInstalled(appId, 'emailApi');
return <EmailApiChrome>{children}</EmailApiChrome>;
```

---

## 5. مراحل التنفيذ

### المرحلة 0 — التخطيط والمواصفات (1–2 أيام)

**المخرجات:**
- [ ] هذا المستند معتمد من الفريق
- [ ] اعتماد عرض: 1,000 رسالة مجانية لمرة واحدة + 15,000 د.ع/شهر مقابل 10,000 رسالة
- [ ] تحديد سلوك test environment (عناوين مسموحة، domain sandbox)
- [ ] موافقة على schema Prisma

**مهام:**
1. اعتماد ملكية domains/senders على مستوى حساب العميل مع sender bindings للتطبيقات.
2. اعتماد الحدود: المجاني 10 رسائل/دقيقة؛ المشترك 30 رسالة/دقيقة؛ limits إضافية user/app/IP.
3. كتابة OpenAPI spec أولية في Swagger وthreat model مختصر.

---

### المرحلة 1 — Backend: الأساس + Send (5–7 أيام)

**الهدف:** endpoint إرسال يعمل end-to-end مع API key.

| # | المهمة | الملفات |
|---|--------|---------|
| 1.1 | Prisma models + migration | `schema.prisma` |
| 1.2 | `EmailApiModule` + register in `app.module` | `email-api.module.ts` |
| 1.3 | `SendEmailDto` + validation | `dto/send-email.dto.ts` |
| 1.4 | `EmailMessagesController` — POST + GET | `email-messages.controller.ts` |
| 1.5 | `EmailMessagesService` — idempotency, logging | |
| 1.6 | Integration مع `MailSesService` | |
| 1.7 | Wallet charge (live only) | `wallet.service.ts` |
| 1.8 | Product install check middleware/guard | |
| 1.9 | Scopes في `CreateApiKeyDto` validation (backend) | |
| 1.10 | Atomic quota ledger: grant, subscription cycle, consumption, `402 quota_exceeded` | |
| 1.11 | Rate limiting متدرج + حد الحجم/المستلم والتزامن | |
| 1.12 | Unit tests للـ service واختبارات عزل authorization | `*.spec.ts` |

**Acceptance:**
```bash
curl -X POST https://api.rukny.io/api/v1/email/messages \
  -H "X-API-Key: rk_test_..." \
  -H "Content-Type: application/json" \
  -d '{"from":"...","to":["..."],"subject":"Test","bodyText":"Hi"}'
# → 201 { id, status: "queued" }
```

---

### المرحلة 2 — Domain Verification (3–4 أيام)

**الهدف:** المطور يضيف نطاقاً ويتحقق من DNS قبل الإرسال live.

| # | المهمة |
|---|--------|
| 2.1 | `DeveloperEmailDomain` CRUD |
| 2.2 | `GET /email/domains/:domain` — DKIM/SPF status من SES |
| 2.3 | Guard: رفض send من unverified domain (live) |
| 2.4 | Cron/job لتحديث حالة verification |
| 2.5 | Sender binding بين domain/app؛ لا يُرسل التطبيق من sender غير مربوط به |
| 2.6 | suppression list لكل عميل لـ bounce/complaint (جزء من MVP) |

---

### المرحلة 3 — Frontend: Product + Docs Shell (4–5 أيام)

**الهدف:** المنتج قابل للتثبيت + docs UI كاملة (بدون Try it).

| # | المهمة |
|---|--------|
| 3.1 | تفعيل product في catalogs |
| 3.2 | `appEmailApi` routes + product-route-map |
| 3.3 | `email-api/layout.tsx` + `EmailApiChrome` |
| 3.4 | `email-api-catalog.ts` — جميع endpoints |
| 3.5 | Components: overview, auth, messages, domains, errors, sdks |
| 3.6 | `dictionaries/en.json` — قسم `emailApi` |
| 3.7 | Sidebar rail + mobile dock يظهر Email API بعد التثبيت |
| 3.8 | Scopes في API keys UI |

**Acceptance:** بعد Install → sidebar link → `/email-api` overview يعمل

---

### المرحلة 4 — Try it Console (2–3 أيام)

**الهدف:** تجربة API من البوابة بأمان.

| # | المهمة | مرجع |
|---|--------|------|
| 4.1 | `EmailApiTryController` | `whatsapp-api-try.controller.ts` |
| 4.2 | `EmailApiTryService` — prefix `/email/` | |
| 4.3 | `lib/api/email-api-try.ts` | |
| 4.4 | `email-api-try-it.tsx` | `whatsapp-api-try-it.tsx` |

**قواعد أمان (نفس WhatsApp):**
- JWT مطلوب (portal user)
- `rk_test_` فقط
- المفتاح linked للـ app
- Path allowlist: `/email/*`
- Secret لا يدخل المتصفح

---

### المرحلة 5 — Webhooks & Delivery Events (4–5 أيام)

**الهدف:** إشعار backend المطور بتسليم/ارتداد/شكوى.

| # | المهمة |
|---|--------|
| 5.1 | SES SNS/webhook handler (bounce, complaint, delivery) |
| 5.2 | تحديث `DeveloperEmailMessage.status` |
| 5.3 | Outbound webhook POST إلى URL المطور |
| 5.4 | `X-Rukny-Signature` HMAC (نفس WhatsApp pattern) |
| 5.5 | SSRF guard: HTTPS، فحص DNS/IP، منع العناوين الداخلية والـredirects |
| 5.6 | Docs: `email-api-webhooks.tsx` |
| 5.7 | UI إدارة webhooks (في email-api أو settings) |

**Events مقترحة:**
- `email.sent`
- `email.delivered`
- `email.bounced`
- `email.complained`

---

### المرحلة 6 — Analytics & Observability (2–3 أيام)

| # | المهمة |
|---|--------|
| 6.1 | Dashboard metrics: emails sent, delivery rate |
| 6.2 | `app-analytics.service.ts` — email series |
| 6.3 | Logs page (optional): `/email-api/logs` أو ضمن analytics |
| 6.4 | Developer portal analytics charts |

---

### المرحلة 7 — Polish & Launch (2–3 أيام)

| # | المهمة |
|---|--------|
| 7.1 | Pricing page update |
| 7.2 | Landing page mention (optional) |
| 7.3 | E2E tests (Playwright) |
| 7.4 | Load test rate limits |
| 7.5 | Flip `coming_soon` → `available` في production |
| 7.6 | Internal docs / runbook |

---

### المرحلة 8 — Extensions (ما بعد الإطلاق)

| Feature | الأولوية |
|---------|----------|
| Email templates (HTML + variables) | متوسطة |
| Attachments | متوسطة |
| Batch send | منخفضة |
| `@rukny/email` npm SDK | متوسطة |
| Open/click tracking | منخفضة |

---

## 6. تفاصيل تنفيذ Frontend (Checklist)

### 6.1 Catalog (`email-api-catalog.ts`)

```typescript
export type EmailApiSectionId =
  | 'overview' | 'auth' | 'messages' | 'domains'
  | 'webhooks' | 'errors' | 'try' | 'sdks';

export const EMAIL_API_SECTIONS = [
  { id: 'overview', slug: '', labelKey: 'navOverview' },
  { id: 'auth', slug: 'auth', labelKey: 'navAuth' },
  { id: 'messages', slug: 'messages', labelKey: 'navMessages' },
  { id: 'domains', slug: 'domains', labelKey: 'navDomains' },
  // ...
];

export const MESSAGE_ENDPOINTS: EmailApiEndpoint[] = [
  {
    id: 'sendEmail',
    method: 'POST',
    path: '/email/messages',
    scopes: ['email:send'],
    tryPath: '/email/messages',
    tryMethod: 'POST',
    tryNeedsBody: true,
    // fields, exampleBody, exampleResponse
  },
  {
    id: 'getEmail',
    method: 'GET',
    path: '/email/messages/:id',
    scopes: ['email:read'],
    // ...
  },
];
```

### 6.2 i18n — مفاتيح أساسية (`emailApi` في en.json)

```
title, subtitle, createKey
navOverview, navAuth, navMessages, navDomains, navWebhooks, navErrors, navTry, navSdks
quickstartTitle, quickstartStep1..5
epSendEmail, epGetEmail, epListDomains, epAddDomain, ...
authTitle, scopesTitle, securityTitle, securityBullet1..4
errorsTitle, errorUnauthorized, errorForbidden, errorNoWallet, errorDomain
tryTitle, tryDesc, tryApiKey, ...
domainsTitle, domainsDnsRecords, ...
```

### 6.3 UX conventions (من WhatsApp API)

- `dir="ltr" lang="en"` داخل `EmailApiChrome`
- `DashboardPageHeader` + CTAs: "Create key", "Open wallet"
- Endpoint cards: method badge + monospace path + scope chips
- Code panel: curl + Node tabs + copy button
- Overview quickstart: numbered steps مع links داخلية

---

## 7. تفاصيل تنفيذ Backend (Checklist)

### 7.1 Controller pattern

```typescript
@ApiTags('Email API - Messages')
@ApiHeader({ name: 'X-API-Key', required: true })
@UseGuards(ApiKeyAuthGuard)
@Controller({ path: 'email/messages', version: '1' })
export class EmailMessagesController {
  @Post()
  @RequireScopes('email:send')
  send(@Req() req, @Body() dto: SendEmailDto, @Headers('idempotency-key') key?) {
    return this.service.send(req.userId, req.apiKeyId, dto, key);
  }

  @Get(':id')
  @RequireScopes('email:read')
  get(@Req() req, @Param('id') id: string) {
    return this.service.getStatus(req.userId, id);
  }
}
```

### 7.2 Service flow — Send

```
1. Validate API key → userId, appId, environment, scopes, expiry, IP allowlist ✓
2. requireProductInstalled(appId, 'emailApi') ✓
3. Validate DTO whitelist, single recipient, size limit, and header-injection rules ✓
4. Validate sender binding + verified domain (live) ✓
5. Check tenant suppression list ✓
6. Idempotency check, then atomically reserve monthly quota (live) ✓ (fail → 402)
7. Create DeveloperEmailMessage (QUEUED) with minimal/masked stored content ✓
8. MailSesService.send() through least-privilege credentials ✓
9. Update status → SENT, store sesMessageId ✓
10. Return allowlisted response `{ id, status, createdAt }` only
```

### 7.3 Try it service

```typescript
const allowedPrefix = '/email/';
// Same pattern as WhatsappApiTryService
// POST /api/v1/developer/email/api-try
```

### 7.4 Product activation

```typescript
// developer-product-catalog.ts
emailApi: { status: 'available' },

// dev-products.service.ts — install already generic ✓
// isInstallableProductId('emailApi') → true after change
```

---

## 8. الاختبار

### 8.1 Unit tests

| Area | Tests |
|------|-------|
| SendEmailDto | validation edge cases |
| EmailMessagesService | idempotency، quota exhausted، domain unverified، sender binding |
| EmailApiTryService | path allowlist, test key only |
| ApiKeyAuthGuard | scope `email:send` required |
| Authorization | cross-app message/domain/sender access always denied |
| Input security | extra fields, CR/LF headers, oversized body, multi-recipient payload denied |
| Rate/quota | concurrent requests cannot exceed quota or rate limit |
| Webhooks | SSRF URLs, invalid SNS signature, replayed event denied |

### 8.2 Integration tests

- Send with `rk_test_` → success, no quota consumption
- Send with `rk_live_` + exhausted quota or inactive subscription → 402
- Send from unverified domain → 400
- Duplicate Idempotency-Key → same response
- Send with another app's message ID/domain/sender → 404 or 403 without data disclosure
- Concurrent sends at the final quota boundary → one accepted path only; no negative balance/quota
- hard bounce/complaint event → tenant suppression is written and next send is rejected

### 8.3 E2E (Portal)

1. Install Email API product
2. Create test API key with `email:send`
3. Navigate to Try it → send → see 201 response
4. Docs pages render all sections

---

## 9. المخاطر والتبعيات

| المخاطر | التخفيف |
|---------|---------|
| تداخل مع Mail app (domains) | الدومين ملك العميل؛ sender binding صريح لكل تطبيق؛ مراجعة shared identity مع Mail |
| SES limits / sandbox | مراقبة quotas؛ test environment منفصل |
| Spam / abuse | rate limits متعددة الطبقات، domain verification، tenant suppression، إيقاف تلقائي ومراجعة |
| استنزاف الحصة/التكلفة | idempotency إلزامي، quota atomic، حد حجم ومستلم واحد، alerts |
| تسريب مفتاح API أو PII | hash/masking وعدم تسجيل secrets أو body، revoke وaudit logs |
| SSRF عبر webhooks | HTTPS + DNS/IP validation + منع private ranges وredirects |
| WhatsApp-only wallet UX | تحديث copy في wallet: "Messages & emails" |

**تبعيات خارجية:**
- AWS SES configured (`MailSesService.isConfigured()`)
- DNS records documentation accurate
- SNS for bounce/complaint (مرحلة webhooks)

---

## 10. الجدول الزمني المقترح

| المرحلة | المدة | تراكمي |
|---------|-------|--------|
| 0 — Planning | 1–2 أيام | 2 |
| 1 — Backend Send | 5–7 أيام | 9 |
| 2 — Domains | 3–4 أيام | 13 |
| 3 — Frontend Docs | 4–5 أيام | 18 |
| 4 — Try it | 2–3 أيام | 21 |
| 5 — Webhooks | 4–5 أيام | 26 |
| 6 — Analytics | 2–3 أيام | 29 |
| 7 — Launch | 2–3 أيام | **~32 يوم عمل** |

> **MVP (إطلاق مبكر):** المراحل 0–4 ≈ **3 أسابيع** — send + domains + docs + try it  
> **Full v1:** + webhooks + analytics ≈ **6–7 أسابيع**

---

## 11. ترتيب التنفيذ الموصى به (Sprint breakdown)

### Sprint 1 — "Secure Backend MVP"
- Schema + migration
- POST `/email/messages` + GET status
- Scopes backend
- quota grant/subscription ledger + atomic consumption
- sender binding + rate limits + authorization negative tests
- Product `available` (backend only)

### Sprint 2 — "Portal Docs"
- Frontend routes + chrome + all doc pages
- Catalog + i18n
- Scopes in API keys UI
- Product install flow end-to-end

### Sprint 3 — "Domains + Try it"
- Domain CRUD + verification UI
- Try it BFF + UI
- Wallet integration live

### Sprint 4 — "Events + Secure Launch"
- SES webhooks → status updates
- Outbound webhooks
- Analytics
- Security review, SSRF/SNS-signature tests, dependency scan, QA + production release

---

## 12. ملحق — قائمة الملفات الكاملة

### ملفات جديدة (Frontend)

```
apps/developer/
├── docs/EMAIL-API-WORK-PLAN.md                    ← هذا المستند
├── lib/email-api-catalog.ts
├── lib/email-api-copy.ts
├── lib/email-api-routes.ts
├── lib/email-api-code-samples.ts
├── lib/api/email-api-try.ts
├── components/email-api/*.tsx                     ← ~12 ملف
└── app/(portal)/apps/[appId]/email-api/
    ├── layout.tsx
    ├── page.tsx
    ├── auth/page.tsx
    ├── messages/page.tsx
    ├── domains/page.tsx
    ├── webhooks/page.tsx
    ├── errors/page.tsx
    ├── try/page.tsx
    └── sdks/page.tsx
```

### ملفات جديدة (Backend)

```
apps/api/src/domain/email-api/
├── email-api.module.ts
├── messaging/
│   ├── email-messages.controller.ts
│   ├── email-messages.service.ts
│   ├── email-messages.service.spec.ts
│   └── dto/
├── domains/
│   ├── email-domains.controller.ts
│   └── email-domains.service.ts
├── email-api-try.controller.ts
├── email-api-try.service.ts
└── email-delivery.service.ts
```

### ملفات للتعديل

```
apps/developer/lib/developer-products.ts
apps/developer/lib/app-routes.ts
apps/developer/lib/product-route-map.ts
apps/developer/lib/api/scopes.ts
apps/developer/dictionaries/en.json
apps/developer/dictionaries/ar.json

apps/api/src/domain/developer/products/developer-product-catalog.ts
apps/api/src/domain/developer/wallet/wallet.service.ts
apps/api/src/app.module.ts (register EmailApiModule)
apps/api/prisma/schema.prisma
```

---

## 13. الخطوة التالية

1. **مراجعة الفريق** واعتماد MVP والنطاق الأمني الإلزامي.
2. **تنفيذ Sprint 1:** Prisma schema للحصص وملكية domains/sender bindings، ثم `POST /email/messages` الآمن.
3. **إجراء security review** قبل تمكين `emailApi: available` في production.

---

*آخر تحديث: سبتمبر 2026 — مبني على حالة codebase `apps/developer` و `apps/api`*
