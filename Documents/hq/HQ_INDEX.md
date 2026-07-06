# لوحة المسؤول HQ — الفهرس الرئيسي

> **التطبيق:** `apps/hq` — `hq.rukny.io` / `admin.rukny.io`  
> **المنفذ المحلي:** `3002`  
> **UI:** `@heroui/react` / `@heroui/styles` — [HQ_PACKAGES_OVERVIEW.md](./HQ_PACKAGES_OVERVIEW.md)  
> **Backend:** `apps/api/src/domain/admin` — [HQ_BACKEND_READINESS.md](./HQ_BACKEND_READINESS.md)  
> **خطة التنفيذ:** [HQ_IMPLEMENTATION_PLAN.md](./HQ_IMPLEMENTATION_PLAN.md)  
> **آخر تحديث:** 2026-06-22

---

## ملخص تنفيذي

| المحور | الحالة | الملاحظة |
|--------|--------|----------|
| تطبيق HQ (`apps/hq`) | 🟡 هيكل أولي | Next.js 16 boilerplate — لا يوجد UI إداري بعد |
| حزم UI (`apps/hq/packages`) | 🟢 جاهزة | HeroUI 3.1.0 — react, styles, storybook, standard, vitest |
| Backend Admin API | 🟢 ~75% جاهز | 8 وحدات محمية بـ `Role.ADMIN` — فجوات أمنية وتغطية جزئية |
| Auth / Proxy | 🔴 غير مُعدّ | لا يوجد `middleware` ولا `api/v1` rewrite ولا auth proxy |
| النشر | 🟡 مُعطّل مؤقتاً | خدمة `hq` في `docker-compose.yml` معلّقة؛ nginx `admin.rukny.io` معلّق |

**التوصية:** البدء بالمرحلة 0 (ربط الحزم + Auth + Shell) ثم Dashboard والمستخدمين — لأن الـ Backend جاهز لمعظم هذه الشاشات.

---

## هيكل المستندات

| المستند | المحتوى |
|---------|---------|
| [HQ_INDEX.md](./HQ_INDEX.md) | هذا الملف — نظرة عامة وفهرس |
| [HQ_BACKEND_READINESS.md](./HQ_BACKEND_READINESS.md) | تدقيق API الإداري، الفجوات، الأولويات |
| [HQ_PACKAGES_OVERVIEW.md](./HQ_PACKAGES_OVERVIEW.md) | حزم HeroUI وطريقة ربطها بـ HQ |
| [HQ_IMPLEMENTATION_PLAN.md](./HQ_IMPLEMENTATION_PLAN.md) | مراحل العمل، المهام، الملفات، معايير القبول |

---

## الوضع الحالي

### Frontend (`apps/hq`)

```
apps/hq/
├── app/
│   ├── layout.tsx      → layout افتراضي
│   ├── page.tsx        → صفحة create-next-app الافتراضية
│   └── globals.css     → Tailwind 4 بدون HeroUI tokens
├── packages/           → HeroUI monorepo (جاهز، غير مربوط)
│   ├── react/          → @heroui/react 3.1.0
│   ├── styles/         → @heroui/styles 3.1.0
│   ├── storybook/      → playground بصري
│   ├── standard/       → ESLint/Prettier/TS configs
│   └── vitest/         → إعدادات اختبار
├── Dockerfile          → standalone، PORT 3002
└── package.json        → لا يعتمد على @heroui/* بعد
```

### Backend (`apps/api/src/domain/admin`)

| الوحدة | المسار | العمليات الرئيسية |
|--------|--------|-------------------|
| Dashboard | `GET /admin/stats` | إحصائيات المنصة |
| | `GET /admin/recent-activity` | نشاط حديث (مستخدمين، متاجر، نماذج، فعاليات) |
| | `GET /admin/health` | صحة DB + Redis + الذاكرة |
| Users | `GET /admin/users` | قائمة + فلاتر + pagination |
| | `PATCH /admin/users/:id/role` | تغيير الدور |
| | `DELETE /admin/users/:id` | حذف مستخدم |
| Stores | `GET /admin/stores` | قائمة المتاجر |
| | `PATCH /admin/stores/:id/status` | تغيير الحالة |
| | `*/admin/store-categories` | CRUD تصنيفات |
| Products | `GET /admin/products` | قائمة + featured |
| Orders | `GET /admin/orders` | قائمة + تحديث حالة |
| Verification | `GET /admin/verification` | طلبات الهوية |
| | `PATCH .../approve\|reject` | موافقة / رفض |
| | `*/rukny-verified/*` | توثيق Rukny Verified |
| Forms | `GET /admin/forms` | قائمة قراءة فقط |
| Wallpapers | `*/admin/wallpapers` | رفع وإدارة خلفيات |

**الحماية:** جميع controllers أعلاه تستخدم `JwtAuthGuard` + `RolesGuard` + `@Roles(Role.ADMIN)`.

---

## قرارات معمارية (مُقترحة للاعتماد)

| القرار | الاختيار | السبب |
|--------|----------|-------|
| النطاق | `hq.rukny.io` (أو `admin.rukny.io`) | متوافق مع nginx المُعطّل حالياً |
| نمط API | Rewrite `/api/v1/*` → backend | نفس `apps/forms` — بسيط وموحّد |
| المصادقة | SSO عبر `accounts.rukny.io` + cookies `.rukny.io` | نفس منصة Rukny |
| حارس الوصول | `middleware` يتحقق من `Role.ADMIN` | رفض غير المسؤولين قبل تحميل UI |
| مكتبة UI | `@heroui/react` من `apps/hq/packages` | جاهزة ومتوافقة مع Forms |
| هيكل المسارات | `/app/*` داخل `(dashboard)` group | نمط مألوف من Forms |
| اللغة | عربي افتراضي + RTL | متسق مع بقية المنصة |
| الثيم | داكن افتراضي للوحة HQ | مناسب لعمليات الإدارة الطويلة |

---

## خارطة الشاشات (MVP)

```
/login ──► SSO redirect
    │
    ▼
/app ──────────────── Dashboard (stats + health + activity)
├── /users ────────── إدارة المستخدمين
├── /verification ─── التحقق من الهوية + Rukny Verified
├── /stores ───────── المتاجر + التصنيفات
├── /products ─────── المنتجات
├── /orders ───────── الطلبات
├── /forms ────────── النماذج (قراءة)
├── /wallpapers ───── الخلفيات
└── /settings ─────── إعدادات HQ (لاحقاً)
```

---

## مميزات إضافية مقترحة

### أولوية عالية (P1) — بعد MVP

| الميزة | الفائدة | يتطلب Backend |
|--------|---------|---------------|
| **سجل تدقيق (Audit Log)** | تتبع من غيّر ماذا ومتى | نعم — endpoints جديدة |
| **إدارة الاشتراكات** | عرض/تعديل خطط المستخدمين | جزئي — `POST /subscriptions/admin/:userId/set-plan` موجود |
| **قفل الحسابات** | فتح قفل + إحصائيات | جزئي — `auth/lockout/admin/*` موجود |
| **Rate Limiting** | مراقبة وإعادة تعيين الحدود | موجود لكن **بدون حماية Admin** ⚠️ |
| **تنبيهات فورية** | طلبات تحقق معلّقة، طلبات جديدة | WebSocket أو polling |
| **تصدير CSV/Excel** | users, orders, products | endpoints `export` موجودة جزئياً |

### أولوية متوسطة (P2)

| الميزة | الفائدة |
|--------|---------|
| **صلاحيات متدرجة (RBAC)** | ADMIN / MODERATOR / SUPPORT بصلاحيات مختلفة |
| **Feature Flags** | تفعيل/تعطيل ميزات بدون نشر |
| **إعلانات النظام** | بانر صيانة أو إعلان لكل المستخدمين |
| **مراقبة التكاملات** | WhatsApp, Telegram, Instagram, Google |
| **لوحة المطورين** | مراجعة API keys والاستخدام |
| **إدارة الفعاليات** | لا يوجد admin API للأحداث حالياً |
| **تقارير مجدولة** | إرسال تقرير أسبوعي بالبريد |

### أولوية منخفضة (P3)

| الميزة | الفائدة |
|--------|---------|
| **انتحال هوية (Impersonate)** | دعم المستخدم — بحذر أمني عالٍ |
| **IP Allowlist لـ HQ** | تقييد الوصول لشبكات معينة |
| **2FA إلزامي للمسؤولين** | حماية إضافية |
| **محرر قوالب البريد** | تخصيص رسائل النظام |
| **لوحة BI متقدمة** | رسوم بيانية تفاعلية عبر Recharts |

---

## تقدير زمني إجمالي

| المرحلة | المحتوى | التقدير |
|---------|---------|---------|
| 0 | بنية + Auth + Packages | 1–2 يوم |
| 1 | Shell + Dashboard | 2–3 أيام |
| 2 | Users + Verification | 3–4 أيام |
| 3 | Commerce (stores/products/orders) | 4–5 أيام |
| 4 | Forms + Wallpapers | 2 يوم |
| 5 | Security ops + polish | 2–3 أيام |
| **المجموع MVP** | | **~14–19 يوم عمل** |

---

## المراجع الداخلية

- [FORMS_PACKAGES_OVERVIEW.md](../Forms/FORMS_PACKAGES_OVERVIEW.md) — نفس بنية الحزم
- [FORMS_AUTH_SSO_INTEGRATION.md](../Forms/ui/FORMS_AUTH_SSO_INTEGRATION.md) — نمط Auth
- [SECURITY_AND_AUTHENTICATION.md](../21/SECURITY_AND_AUTHENTICATION.md) — البنية الأمنية
- [PROJECT_DOCUMENTATION.md](../21/PROJECT_DOCUMENTATION.md) — القسم 15 (لوحة الإدارة)

---

## الخطوة التالية

ابدأ من **[المرحلة 0](./HQ_IMPLEMENTATION_PLAN.md#المرحلة-0--البنية-التحتية-p0)** في خطة التنفيذ: ربط HeroUI، إعداد `next.config.ts` rewrites، وmiddleware للتحقق من دور ADMIN.
