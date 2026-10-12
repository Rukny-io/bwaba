# 📁 فهرس توثيق Rukny Mail (Workspace سابقاً)

> **آخر تحديث:** 2026-09-17  
> **التطبيق:** `apps/mail` → `mail.rukny.io` (منفذ dev: `3003`)  
> **API:** `apps/api/src/domain/mail/`  
> **الحالة:** منتج أساسي ~85–90% — انظر [MAIL_AUDIT_AND_STATUS.md](./MAIL_AUDIT_AND_STATUS.md)

---

## ابدأ من هنا (حالة حالية)

| المستند | الغرض | الحالة |
|---------|--------|--------|
| **[MAIL_AUDIT_AND_STATUS.md](./MAIL_AUDIT_AND_STATUS.md)** | **تدقيق الكود + نسبة الإكمال + المتبقي** | ✅ مرجع الحالة الحالي |
| [WORKSPACE_ROADMAP_PHASES.md](./WORKSPACE_ROADMAP_PHASES.md) | خارطة المراحل 0–10 (تاريخية + محدّثة جزئياً) | 🟡 خطة؛ الحالة في AUDIT |
| [WORKSPACE_MVP_SCOPE.md](./WORKSPACE_MVP_SCOPE.md) | نطاق MVP الأصلي | 🟡 أُنجز وتجاوزه المنتج |

---

## المستندات النشطة (تخطيط / تسعير / بنية)

| المستند | الغرض | الحالة |
|---------|--------|--------|
| [WORKSPACE_DATABASE_SCHEMA.md](./WORKSPACE_DATABASE_SCHEMA.md) | تصميم Prisma الأولي | 🟡 قديم الاسم — النماذج الفعلية `Mail*` في schema |
| [WORKSPACE_PRICING.md](./WORKSPACE_PRICING.md) | تسعير تخطيطي | 🟡 راجع أيضاً `mail-plan-limits.config.ts` (مصدر الكود) |
| [RUKNY_PROFIT_MODEL.md](./RUKNY_PROFIT_MODEL.md) | نموذج الأرباح | ✅ مرجع مالي |
| [WORKSPACE_SES_SETUP.md](./WORKSPACE_SES_SETUP.md) | AWS SES — المزوّد المستخدم في الكود | ✅ مرجع تشغيلي |
| [WORKSPACE_SENDGRID_SETUP.md](./WORKSPACE_SENDGRID_SETUP.md) | SendGrid (مسار تخطيطي بديل) | 🗄️ أرشيف تخطيط — التنفيذ الحالي SES |
| [WORKSPACE_SENDGRID_WORK_PLAN.md](./WORKSPACE_SENDGRID_WORK_PLAN.md) | خطة عمل SendGrid | 🗄️ أرشيف تخطيط |

---

## مستندات استراتيجية (أرشيف تخطيط)

| المستند | الغرض |
|---------|--------|
| [workspace_analysis.md](./workspace_analysis.md) | تحليل المنتج والمنافسة |
| [aws_workspace_strategy.md](./aws_workspace_strategy.md) | بنية AWS والتوسع |
| [financial_analysis.md](./financial_analysis.md) | توقعات مالية قديمة — راجع `RUKNY_PROFIT_MODEL.md` |

> **ملاحظة:** عند التعارض بين وثيقة تخطيط والكود، **الكود + MAIL_AUDIT_AND_STATUS** لهما الأولوية للحالة. للتسعير المنفَّذ راجع `MAIL_PLAN_DEFINITIONS` في API.

---

## ربط بمنصة Rukny

| المستند / المسار | العلاقة |
|------------------|---------|
| [../21/SUBSCRIPTION_PLANS.md](../21/SUBSCRIPTION_PLANS.md) | باقات المنصة |
| `apps/developer` + `packages/email` | **Email API** منفصل (transactional للمطوّرين) |
| `apps/hq/.../mail` | إدارة تشغيل Mail |
| [../Forms/FORMS_SECTION_AUDIT_AND_PLAN_V2.md](../Forms/FORMS_SECTION_AUDIT_AND_PLAN_V2.md) | نموذج تدقيق يُحاكى هنا |

---

## ترتيب القراءة

```
1. MAIL_AUDIT_AND_STATUS.md     → أين نحن الآن؟ (ابدأ هنا)
2. WORKSPACE_ROADMAP_PHASES.md  → المراحل 0–10 (سياق)
3. WORKSPACE_MVP_SCOPE.md       → ماذا كان هدف الإطلاق الأول؟
4. WORKSPACE_SES_SETUP.md       → إعداد SES للإنتاج
5. WORKSPACE_PRICING.md         → تسعير تخطيطي (+ طابق مع الكود)
6. RUKNY_PROFIT_MODEL.md        → الأرباح والهامش
7. aws_workspace_strategy.md    → التوسع لاحقاً
```

---

## هيكل التطبيق الحالي

```
apps/mail/
├── app/
│   ├── page.tsx                 → Landing
│   ├── pricing/, documents/, tutorials/, faqs/
│   ├── apps/                    → قائمة/إنشاء مساحات Mail
│   ├── inbox/                   → Webmail
│   ├── billing/
│   └── (mail-chrome)/           → domain, team, aliases, …
├── components/
│   ├── inbox/, app/, marketing/, layout/, billing/
└── lib/

apps/api/src/domain/mail/        → Backend Mail module
apps/api/prisma/schema.prisma    → نماذج MailApp, MailMailbox, …
```

---

## Backend

```
apps/api/src/domain/mail/     → منفَّذ (انظر AUDIT §4)
apps/api/src/domain/email-api/ → منتج مطوّرين منفصل — ليس Mail webmail
```

---

*يُحدَّث هذا الفهرس عند تغيّر الحالة أو إضافة مستندات تنفيذية جديدة.*
