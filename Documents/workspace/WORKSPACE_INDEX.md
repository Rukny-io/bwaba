# 📁 فهرس توثيق Rukny Workspace

> **آخر تحديث:** 2026-06-21  
> **التطبيق:** `apps/workspace` → `workspace.rukny.io` (منفذ dev: `3003`)  
> **الحالة:** مرحلة التأسيس — Shell + وثائق تنفيذية

---

## المستندات النشطة (ابدأ من هنا)

| المستند | الغرض | الحالة |
|---------|--------|--------|
| [WORKSPACE_MVP_SCOPE.md](./WORKSPACE_MVP_SCOPE.md) | نطاق MVP الضيق — ما يُبنى الآن وما يُؤجّل | ✅ مرجع تنفيذ |
| [WORKSPACE_DATABASE_SCHEMA.md](./WORKSPACE_DATABASE_SCHEMA.md) | تصميم Prisma — دومينات، صناديق، رسائل | ✅ جاهز للمراجعة |
| [WORKSPACE_PRICING.md](./WORKSPACE_PRICING.md) | **مصدر الحقيقة** للتسعير — IQD + USD | ✅ موحّد |
| [WORKSPACE_SES_SETUP.md](./WORKSPACE_SES_SETUP.md) | طلب Production Access + إعداد AWS SES | ✅ ابدأ اليوم |
| [WORKSPACE_ROADMAP_PHASES.md](./WORKSPACE_ROADMAP_PHASES.md) | **خارطة المراحل الكاملة (0–10)** — شرح تفصيلي بالإنجليزية | ✅ مرجع تنفيذ |

---

## مستندات استراتيجية (أرشيف تخطيط)

| المستند | الغرض |
|---------|--------|
| [workspace_analysis.md](./workspace_analysis.md) | تحليل المنتج، المنافسة، خارطة الميزات الكاملة |
| [aws_workspace_strategy.md](./aws_workspace_strategy.md) | بنية AWS، SES، Route53، Lambda، مراحل التوسع |
| [financial_analysis.md](./financial_analysis.md) | توقعات مالية، KPIs، نقطة التعادل |

> **ملاحظة:** عند التعارض في التسعير أو النطاق، **`WORKSPACE_PRICING.md`** و **`WORKSPACE_MVP_SCOPE.md`** لهما الأولوية.

---

## ربط بمنصة Rukny

| المستند | العلاقة |
|---------|---------|
| [../21/SUBSCRIPTION_PLANS.md](../21/SUBSCRIPTION_PLANS.md) | باقات المنصة — قسم Workspace (§7.7) |
| [../21/PROJECT_DOCUMENTATION.md](../21/PROJECT_DOCUMENTATION.md) | توثيق المنصة العام (يُحدَّث لاحقاً بقسم Workspace) |
| [../Forms/FORMS_SECTION_AUDIT_AND_PLAN_V2.md](../Forms/FORMS_SECTION_AUDIT_AND_PLAN_V2.md) | نموذج تنفيذي لقسم Forms — يُحاكى في Workspace |

---

## ترتيب القراءة للمطور

```
1. WORKSPACE_ROADMAP_PHASES.md  → المراحل 0–10 (ابدأ هنا للخطة الكاملة)
2. WORKSPACE_MVP_SCOPE.md      → ماذا نبني في الإطلاق الأول؟
3. WORKSPACE_DATABASE_SCHEMA.md → كيف نخزّن؟
4. WORKSPACE_SES_SETUP.md       → كيف نرسل/نستقبل؟ (Phase 0)
5. WORKSPACE_PRICING.md         → حدود الباقات
6. aws_workspace_strategy.md    → التوسع لاحقاً
```

---

## هيكل التطبيق المستهدف

```
apps/workspace/
├── app/
│   ├── page.tsx                    → صفحة هبوط
│   └── app/(dashboard)/            → لوحة التحكم (محمية)
│       ├── layout.tsx              → Sidebar + WorkspaceDashboardShell
│       ├── page.tsx                → نظرة عامة
│       ├── domains/                → ربط الدومينات
│       ├── mailboxes/              → صناديق البريد
│       ├── mail/                   → Inbox + Compose
│       └── settings/
├── components/app/
│   ├── workspace-dashboard-shell.tsx
│   ├── sidebar.tsx
│   ├── dashboard-nav.tsx
│   └── nav-config.ts
└── lib/
    ├── config.ts
    ├── dal.ts
    └── utils.ts
```

---

## Backend (لم يُنفَّذ بعد)

```
apps/api/src/workspace/     → يُضاف في مرحلة API
apps/api/prisma/schema.prisma → نماذج Workspace (انظر WORKSPACE_DATABASE_SCHEMA.md)
```

---

*يُحدَّث هذا الفهرس عند إضافة مستندات تنفيذية جديدة (API، SSO، Deploy، E2E).*
