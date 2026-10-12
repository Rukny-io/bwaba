# Rukny Mail — تدقيق الحالة ونسبة الإكمال

> **آخر تحديث:** 2026-09-17  
> **المنتج:** Rukny Mail (كان يُخطَّط له باسم Workspace)  
> **التطبيق:** `apps/mail` → `mail.rukny.io` (منفذ dev: `3003`)  
> **API:** `apps/api/src/domain/mail/`  
> **HQ:** `apps/hq` — قسم `/app/mail`  
> **مرتبط بـ:** [WORKSPACE_INDEX.md](./WORKSPACE_INDEX.md) · [WORKSPACE_ROADMAP_PHASES.md](./WORKSPACE_ROADMAP_PHASES.md) · [WORKSPACE_MVP_SCOPE.md](./WORKSPACE_MVP_SCOPE.md)

---

## 1) الملخص التنفيذي

| المقياس | التقدير | ملاحظة |
|---------|---------|--------|
| **منتج Mail الأساسي (MVP+)** | **~85–90%** | إرسال/استقبال، صناديق، نطاق، فريق، قواعد بريد، فوترة، HQ |
| **الرؤية الكاملة (مراحل 0–10)** | **~70–75%** | AI، Workflows، قنوات، IMAP منشور، دفع بطاقة |
| **جاهزية الإطلاق التشغيلي** | **~80%** | Docker + nginx جاهزان؛ بعض الأعلام والتشغيل اليدوي لـ SES |

**الخلاصة:** المنتج تجاوز نطاق MVP القديم بكثير في الكود. الوثائق القديمة في هذا المجلد ما زالت تتحدث عن `apps/workspace` و«Backend لم يبدأ» — هذا المستند هو **مرجع الحالة الحالي**.

### ما ليس Rukny Mail

| المنتج | المسار | الغرض |
|--------|--------|-------|
| **Email API** (Developer) | `apps/api/src/domain/email-api/` + `apps/developer` + `packages/email` | إرسال transactional عبر `X-API-Key` |
| **EmailService** الداخلي | `apps/api/src/integrations/email/` | بريد المنصة (OTP، نماذج…) |
| **Mail** (هذا المنتج) | `apps/mail` + `domain/mail` | صندوق بريد أعمال كامل للمستخدم |

---

## 2) نسبة الإكمال حسب الطبقة

| الطبقة | النسبة | الحالة |
|--------|--------|--------|
| Prisma / نماذج البيانات | ~95% | `MailApp`, `MailMailbox`, `MailMessage`, aliases, forwarders, catch-all, auto-reply, members, subscriptions, BIMI brands, domain trust |
| Backend API | ~90% | 13 controllers + ~16 services؛ SES send/inbound/webhooks |
| Frontend منتج (`apps/mail`) | ~85% | Inbox حقيقي + إدارة كاملة؛ صفحات Coming Soon للتوسعات |
| تسويق / وثائق منتج | ~90% | Landing، Pricing، FAQs، Getting started، Documents، Tutorials |
| HQ Admin | ~85% | قائمة تطبيقات، نطاق، صناديق، اشتراك، تحليلات، تنبيهات |
| تشغيل (Docker / nginx) | ~90% | خدمة `mail` في compose؛ `mail.rukny.io` في nginx |
| دفع العميل ذاتياً | ~40% | اشتراكات موجودة؛ دفع البطاقة «coming soon» — تفعيل عبر HQ |
| IMAP/SMTP للأجهزة | ~60% | صفحة Devices مبنية لكن **مخفية** من الـ sidebar |
| AI / Workflows / قنوات | ~5% | Coming Soon فقط |

---

## 3) مقارنة المراحل القديمة ← الواقع

خارطة [WORKSPACE_ROADMAP_PHASES.md](./WORKSPACE_ROADMAP_PHASES.md) كُتبت يونيو 2026. التقييم أدناه يعكس الكود بتاريخ هذا المستند.

| Phase | الاسم | حالة الوثيقة القديمة | الواقع (2026-09) |
|-------|--------|----------------------|------------------|
| 0 | SES Production | ⏳ Not started | 🟡 يعتمد على بيئة AWS الفعلية؛ الكود جاهز لـ SES (`MailSesService`) |
| 1 | AWS plumbing | ⏳ | ✅ inbound + SES webhooks + raw MIME utilities |
| 2 | DB + domain/mailbox API | ⏳ Schema only | ✅ نماذج `Mail*` + APIs كاملة |
| 3 | Outbound send | ⏳ | ✅ إرسال + reply + cc/bcc عبر SES |
| 4 | Inbound receive | ⏳ | ✅ `mail-inbound.service` + classifier + realtime |
| 5 | Frontend MVP Inbox | 🟡 Shell only | ✅ Inbox/Compose/Reply حقيقي مرتبط بالـ API |
| 6 | Team & shared | ⏳ | ✅ Team members + أدوار + تعيين صناديق |
| 7 | Cross-product | ⏳ | 🟡 جزئي (SSO Accounts، HQ؛ تكاملات Forms/Store لاحقاً) |
| 8 | Automation | ⏳ | 🟡 Auto-reply / forwarders / catch-all / aliases ✅ — Workflows UI ❌ |
| 9 | Growth | ⏳ | 🟡 Pricing + estimate + docs ✅ — freemium / extras لاحقاً |
| 10 | Enterprise | ⏳ | ⏳ Planned |

**MVP launch (Phases 0–5):** منجز على مستوى المنتج في الكود ≈ **~90%**.  
المتبقي التشغيلي: تأكيد SES Production، deliverability، ودفع البطاقة.

---

## 4) جرد Backend — `apps/api/src/domain/mail/`

### 4.1 Controllers (مسارات عامة)

| Controller | Path (v1) | الحالة |
|------------|-----------|--------|
| `mail-apps` | `mail/apps` | ✅ |
| `mail-mailboxes` | `mail/apps/:appId/mailboxes` | ✅ |
| `mail-messages` | `mail/apps/:appId/messages` | ✅ |
| `mail-alias` | `mail/apps/:appId/aliases` | ✅ |
| `mail-forwarder` | `mail/apps/:appId/forwarders` | ✅ |
| `mail-catch-all` | `mail/apps/:appId/catch-all` | ✅ |
| `mail-auto-reply` | `mail/apps/:appId/auto-replies` | ✅ |
| `mail-logs` | `mail/apps/:appId/logs` | ✅ |
| `mail-domain-verification` | `mail/apps/:appId/domain-verification` | ✅ |
| `mail-members` | `mail` (أعضاء التطبيق) | ✅ |
| `mail-subscriptions` | `mail` (خطط/اشتراك) | ✅ |
| `mail-public` | `mail/public` | ✅ |
| `mail-ses-webhook` | `mail/webhooks/ses` | ✅ |

### 4.2 خدمات أساسية

| Service | الدور | الحالة |
|---------|-------|--------|
| `mail-ses.service` | إرسال / هويات SES | ✅ |
| `mail-inbound.service` | استقبال ومعالجة وارد | ✅ |
| `mail-messages.service` | قائمة، إرسال، رد، مجلدات | ✅ |
| `mail-mailboxes.service` | CRUD صناديق + 2FA + كلمة مرور | ✅ |
| `mail-mailbox-session.service` | جلسة صندوق البريد | ✅ |
| `mail-domain-verification.service` | DNS / تحقق النطاق | ✅ |
| `mail-members.service` | دعوات الفريق | ✅ |
| `mail-subscriptions.service` | خطط STARTER/STANDARD/PREMIUM | ✅ (دفع بطاقة مؤجل) |
| `mail-alias` / `forwarder` / `catch-all` / `auto-reply` | قواعد البريد | ✅ |
| `mail-bimi.service` | BIMI للمرسلين الواردين | ✅ (خلف feature flags) |
| `mail-realtime.service` | تحديث حي للصندوق | ✅ |
| `mail-message-classifier` | تصنيف (promotions/social/…) | ✅ |
| `mail-feature-flags` | أعلام BIMI / verification | ✅ |

### 4.3 Feature flags

| Env | الغرض | افتراضي |
|-----|--------|---------|
| `MAIL_BIMI_RESOLUTION_ENABLED` | حل BIMI | on خارج production إن لم يُضبط |
| `MAIL_BIMI_LOGOS_ENABLED` / `NEXT_PUBLIC_MAIL_BIMI_LOGOS_ENABLED` | عرض شعارات | نفس المنطق |
| `MAIL_RUKNY_DOMAIN_VERIFICATION_ENABLED` | تحقق إداري Rukny | نفس المنطق |
| `MAIL_OUTBOUND_BIMI_ENABLED` | إعداد BIMI صادر | نفس المنطق |

---

## 5) جرد Frontend — `apps/mail`

### 5.1 صفحات جاهزة (مرتبطة بمنطق حقيقي)

| المسار | الغرض | الحالة |
|--------|-------|--------|
| `/` | Landing تسويقي | ✅ |
| `/pricing`, `/pricing/estimate` | تسعير وتقدير | ✅ |
| `/getting-started`, `/faqs`, `/documents`, `/tutorials` | دعم ووثائق | ✅ |
| `/login`, `/callback` | SSO | ✅ |
| `/apps`, `/apps/new`, `/apps/creation` | مساحات العمل | ✅ |
| `/billing` | اشتراك الفوترة | ✅ |
| `/inbox` | Webmail (قائمة + قراءة + compose + reply) | ✅ |
| `/app` · `/mailboxes` | نظرة الصناديق | ✅ |
| `/team` | أعضاء الفريق | ✅ |
| `/forwarders` · `/aliases` · `/catch-all` · `/auto-reply` | قواعد | ✅ |
| `/domain` | إعدادات النطاق + DNS | ✅ |
| `/logs` | سجلات البريد | ✅ |
| `/settings` · `/profile` | إعدادات/ملف | ✅ |
| `/devices` | Connect apps & devices | ✅ مبني / **غير منشور** في الـ nav |

### 5.2 Coming Soon / Empty

| المسار | العنوان | ملاحظة |
|--------|---------|--------|
| `/ai` | AI | Smart replies — واجهة فقط |
| `/workflows` | Workflows | أتمتة — واجهة فقط |
| `/instagram` · `/messenger` | قنوات | تكامل لاحق |
| `/import` | Import | غير جاهز |
| `/developers` | Mail API داخل التطبيق | منفصل عن Developer Email API |
| `/dkim` | DKIM | Empty — الإعداد عبر `/domain` |

### 5.3 Navigation المنشور

من `lib/mail-nav.ts`:

- Primary: Inbox, Mailboxes, Team, Forwarders, Alias, Catch-all, Auto-reply  
- Secondary: Domain settings, Email Logs  
- Unpublished: Devices (حتى جاهزية IMAP/SMTP للنشر)

---

## 6) الخطط والتسعير (من الكود)

المصدر: `mail-plan-limits.config.ts` — قد يختلف عن [WORKSPACE_PRICING.md](./WORKSPACE_PRICING.md) القديم.

| الخطة | سعر شهري (د.ع) | صناديق مشمولة | أعضاء console | تخزين/صندوق | Aliases |
|-------|----------------|----------------|---------------|-------------|---------|
| STARTER | 3,000 | 1 | 0 | 5 GB | 10 |
| STANDARD | 6,000 | 3 | 5 | 20 GB | 50 |
| PREMIUM | 10,000 | 5 | 15 | 30 GB | Unlimited |

صندوق إضافي: 3,000 (Starter) أو 2,000 (Standard/Premium) د.ع/شهر.

> **ملاحظة:** ميزات مثل «AI email assistant» مذكورة في benefits الباقة بينما صفحة `/ai` ما زالت Coming Soon — التسويق يتقدم على التنفيذ هنا.

---

## 7) HQ

| المكوّن | الحالة |
|---------|--------|
| `/app/mail` workspace | ✅ قائمة تطبيقات + فلاتر + إحصائيات |
| تفاصيل تطبيق Mail | ✅ overview, domain, mailboxes, subscription |
| analytics / alerts / delivery | ✅ panels موجودة |
| تفعيل اشتراك يدوياً | ✅ (بديل دفع البطاقة) |

---

## 8) معايير قبول MVP القديمة — تحديث الحالة

من [WORKSPACE_MVP_SCOPE.md](./WORKSPACE_MVP_SCOPE.md) §4:

### دومين

- [x] المستخدم يضيف نطاقاً ويرى سجلات DNS
- [x] تحقق تلقائي وحالة في الواجهة
- [ ] تأكيد SES identity مفعّل في **كل** بيئات الإنتاج (تشغيلي)

### صناديق

- [x] إنشاء صناديق على نطاق موثّق
- [x] حدود حسب الخطة (Starter/Standard/Premium) بدل «3 ثابتة» القديمة

### بريد

- [x] مسار استقبال وارد في الكود
- [x] إرسال من الصندوق عبر SES
- [x] Reply مع `In-Reply-To` / threading
- [ ] تحقق deliverability ميداني مستمر (Gmail/Outlook spam rates)
- [x] Bounce/complaint عبر SES webhook handler

### واجهة

- [x] Shell متجاوب (sidebar + mobile dock)
- [x] SSO مع Accounts
- [x] واجهة عربية/إنجليزية حسب المنتج (تحقق لغوي مستمر)

### تشغيل

- [x] `docker-compose` يشغّل mail (منفذ 3003 داخلياً؛ nginx → mail)
- [ ] SES Production Access موثّق كـ ✅ في كل حساب AWS مستخدم
- [ ] Bounce/complaint rates ضمن الأهداف بعد الإطلاق العام

---

## 9) المتبقي للأولوية (Backlog مقترح)

### P0 — إطلاق عام آمن

| # | المهمة | ملاحظة |
|---|--------|--------|
| M-01 | توثيق/تأكيد SES Production + مراقبة bounce/complaint | تشغيلي |
| M-02 | إكمال مسار دفع العميل أو الإبقاء الرسمي على تفعيل HQ | `mail-subscriptions.service` |
| M-03 | مواءمة copy الباقات مع الميزات الفعلية (AI) | تجنب وعد غير منفّذ |
| M-04 | تحديث وثائق Workspace القديمة أو أرشفتها | هذا المستند + INDEX |

### P1 — إكمال المنتج المنشور

| # | المهمة |
|---|--------|
| M-10 | نشر Devices بعد جاهزية IMAP/SMTP |
| M-11 | تقوية المرفقات/الحدود إن لزم للمنتج العام |
| M-12 | اختبارات E2E لمسار: إنشاء app → DNS → صندوق → إرسال/استقبال |

### P2 — توسعات (كانت Coming Soon)

| # | المهمة |
|---|--------|
| M-20 | AI smart replies (`/ai`) |
| M-21 | Workflows automation (`/workflows`) |
| M-22 | Instagram / Messenger channels |
| M-23 | Import من مزوّد آخر |
| M-24 | وثائق Mail API داخل التطبيق (إن لزم — أو الإحالة لـ Developer Email API) |

---

## 10) هيكل الكود الحالي (مرجع)

```
apps/mail/
├── app/
│   ├── page.tsx, pricing/, getting-started/, documents/, tutorials/
│   ├── apps/, billing/, login/, callback/, inbox/
│   └── (mail-chrome)/   → app, team, domain, aliases, …
├── components/
│   ├── inbox/           → shell, compose, list, reader
│   ├── app/             → mailboxes, domain, team, rules…
│   ├── marketing/       → landing sections
│   └── layout/          → chrome, sidebar, dock
└── lib/                 → API clients, nav, feature flags, plans

apps/api/src/domain/mail/
├── mail.module.ts
├── *.controller.ts / *.service.ts
└── dto/

apps/hq/components/mail/ + app/.../mail/
```

---

## 11) نسبة إكمال سريعة (للعرض)

```
████████████████████░░  Mail core      ~88%
██████████████████░░░░  Full vision    ~72%
████████████████░░░░░░  Self-serve pay ~40%
██░░░░░░░░░░░░░░░░░░░░  AI / channels  ~5%
```

| السؤال | الجواب |
|--------|--------|
| هل Mail جاهز كمنتج بريد أعمال؟ | **نعم تقريباً** — الكود يغطي المسار الأساسي |
| هل الرؤية الكاملة منتهية؟ | **لا** — AI، قنوات، Workflows، أجهزة منشورة |
| أي وثيقة تعتمد؟ | **هذا الملف** للحالة؛ الخطط القديمة للسياق التاريخي |

---

*أُنشئ 2026-09-17 بعد تدقيق codebase `apps/mail` و `apps/api/src/domain/mail` و `apps/hq`.*
