# Instagram Business Hub Plan (apps/business)

هذه الوثيقة تشرح خطة **ذكية وآمنة** لبناء لوحة تحكم Instagram داخل `apps/business` لدعم:

- ربط حسابات Instagram Professional متعددة (Business/Creator)
- التبديل بين الحسابات (Account Switcher)
- عرض التفاصيل (Profile + Media) كبداية عبر `instagram_business_basic`
- التوسع لاحقاً لدعم الرسائل/التعليقات/النشر/الإحصائيات عبر App Review تدريجياً

مرجع Meta: `https://business.facebook.com/`

---

## 1) ملخص سريع (Executive Summary)

سننشئ **Instagram Hub** في `apps/business` كمنتج إداري منفصل عن تجربة link-in-bio الموجودة في `apps/app`.

### مبادئ أساسية

- **فصل المنتجات**: Business Hub ≠ Link-in-bio blocks.
- **صلاحيات تدريجية**: نبدأ بـ `instagram_business_basic` فقط، ثم نطلب صلاحيات إضافية عند وجود ميزة فعلية وفيديو مراجعة.
- **OAuth state آمن**: state موقّع ومخزّن Redis بمهلة قصيرة (بدلاً من `base64(userId)`).
- **تشفير التوكن**: تخزين توكن Instagram في DB بشكل **مشفّر** (AES-256-GCM) وليس نصاً صافياً.
- **Multi-account by design**: حسابات Instagram متعددة لكل مستخدم Rukny مع سياسات واضحة وحدود حسب الباقات.

---

## 2) الوضع الحالي في الكود (As-Is)

### `apps/business`

- تطبيق Next.js (App Router) فيه Auth + Dashboard placeholder فقط.
- لا يوجد تكامل Instagram حالياً.

### `apps/api` (Instagram integration الحالي)

- جدول `instagram_connections` يسمح بـ **حساب واحد** لكل مستخدم (`userId` unique).
- OAuth scopes الحالية تطلب أكثر من الحاجة (تتضمن messages/comments/publish).
- callback يعيد التوجيه إلى `APP_FRONTEND_URL/links` (مناسب لـ `apps/app` وليس Business Hub).
- state غير موقّع (مخاطرة أمنية).

**النتيجة**: هذا التكامل جيد لـ link-in-bio لكنه **غير مناسب** كقاعدة لـ Business Hub متعدد الحسابات.

---

## 3) الهدف (To-Be)

### واجهة المستخدم (UX)

- صفحة Hub: `/app/instagram`
  - قائمة الحسابات المربوطة (cards)
  - زر “ربط حساب جديد”
  - زر “تعيين افتراضي”
- صفحة حساب محدد: `/app/instagram/[accountId]`
  - Overview (بروفايل + حالة توكن)
  - Content (Preview media)
  - Settings (Rename label / Disconnect)
- **Account Switcher** في الهيدر:
  - اختيار الحساب النشط
  - حفظ الاختيار كسِجل (server-side) لتجربة متسقة عبر الأجهزة

---

## 4) التصميم المقترح (UI Information Architecture)

### Routes (مُنفَّذ — Milestone A UI)

داخل `apps/business`:

- `app/(dashboard)/layout.tsx` — Sidebar + `BusinessDashboardShell` (نفس نمط `apps/app`)
- `app/(dashboard)/app/page.tsx` — `/app` (و `/app?asset_id=...`)
- `app/(dashboard)/app/instagram/page.tsx` — `/app/instagram` أو `/app/instagram?asset_id=942859062251890`
- `lib/instagram/routes.ts` — دوال بناء الروابط (نمط Meta Business Suite)
- `/dashboard/*` — يُعاد توجيهه تلقائياً إلى `/app/*`

مكونات:

- `components/instagram/account-switcher.tsx`
- `components/instagram/account-card.tsx`
- `components/instagram/connect-instagram-card.tsx`
- `components/instagram/media-preview-grid.tsx`

---

## 5) نموذج البيانات (Data Model) — Multi-account

نضيف جداول جديدة مخصصة للـ Business Hub (ولا نكسر الجداول القديمة):

### Prisma (مقترح)

> ملاحظة: التفاصيل النهائية ستُضبط أثناء التنفيذ بما يتوافق مع schema الحالي.

- `InstagramBusinessAccount`
  - `userId`
  - `igUserId`
  - `username`, `name`, `profilePicUrl`, `followersCount`
  - `accessTokenEncrypted`
  - `tokenExpiry`
  - `scopes[]`
  - `label` (اسم ودي)
  - `status` (ACTIVE / EXPIRED / REVOKED)
  - قيود:
    - `@@unique([userId, igUserId])` لمنع تكرار نفس الحساب لنفس المستخدم

- `InstagramBusinessSession` (اختياري)
  - `userId` unique
  - `activeAccountId`

### سياسات

- حد أقصى للحسابات حسب الباقة (مثلاً 2 في Basic، 5 في Pro).
- قرار منتج: هل نسمح بربط نفس `igUserId` لأكثر من مستخدم؟ (غالباً نعم، إلا إذا تعارض مع سياسة المنتج).

---

## 6) API Design (apps/api)

ننشئ namespace جديد:

`/api/v1/business/instagram/*`

### Phase 1 (basic فقط)

- `GET /accounts` — قائمة الحسابات
- `GET /accounts/:id` — تفاصيل
- `POST /accounts/:id/disconnect` (أو `DELETE`) — فك الربط
- `POST /active` — تعيين حساب نشط
- `GET /auth/connect` — بدء OAuth (redirect)
- `GET /auth/callback` — callback (يحفظ التوكن + الحساب)
- `GET /accounts/:id/media` — جلب media preview

### Phase 2+ (لاحقاً)

- `GET /accounts/:id/insights` — يحتاج `instagram_business_manage_insights`
- `.../messages` — يحتاج `instagram_business_manage_messages`
- `.../comments` — يحتاج `instagram_business_manage_comments`
- `.../publish` — يحتاج `instagram_business_content_publish`

---

## 7) OAuth & Security (أهم جزء)

### 7.1 state آمن

بدلاً من وضع `userId` داخل state بشكل مكشوف:

- عند `GET /auth/connect`:
  - ننشئ `stateToken` عشوائي
  - نخزن payload في Redis لمدة 10 دقائق:
    - `userId`
    - `nonce`
    - `product: 'business'`
    - `redirectOrigin` (اختياري)
    - `createdAt`
- في callback:
  - نسترجع payload من Redis
  - نحذفه فوراً (single-use)
  - نكمل exchange ونحفظ الحساب

### 7.2 تشفير التوكن

نخزن `access_token` في DB كـ:

- `accessTokenEncrypted`: Base64(JSON) أو string مشفّر AES-256-GCM
- مفتاح التشفير: متغير بيئة جديد مثل `INTEGRATIONS_ENCRYPTION_KEY`

### 7.3 Authorization صارم

- كل endpoint يتحقق أن `account.userId === currentUser.id`
- لا نعتمد `accountId` من client بدون تحقق ملكية
- Rate limit على connect/refresh/publish

### 7.4 Compliance

- `deauthorize` و `data-deletion` يجب أن يحذفوا البيانات فعلياً (ليس response فقط).

---

## 8) استراتيجية App Review (Meta)

نقدم طلبات الصلاحيات تدريجياً:

### Phase 1

- Permission: `instagram_business_basic`
- فيديو: يوضح connect + عرض profile + عرض media preview

### Phase 2

- Permission: `instagram_business_manage_insights`
- فيديو: يوضح شاشة analytics في Business Hub

### Phase 3

- Permission: `instagram_business_manage_messages` + `instagram_business_manage_comments`
- فيديو: inbox/comments moderation
- Human Agent فقط إذا كان لدينا inbox + تدخل بشري واضح

### Phase 4

- Permission: `instagram_business_content_publish`
- فيديو: نشر/جدولة

---

## 9) خطة التنفيذ (Milestones)

### Milestone A — Design (UI فقط، بدون API)

- بناء `BusinessShell` (sidebar + header + switcher placeholder)
- إنشاء `/app/instagram` + `/app/instagram/[accountId]` مع بيانات وهمية
- توحيد تصميم RTL باستخدام shadcn components الموجودة

**مخرجات**: UI نهائي للمرحلة الأولى مع navigations.

### Milestone B — Backend Phase 1 (basic)

- إضافة models + migration
- إنشاء endpoints business namespace
- OAuth state via Redis + callback
- تشفير التوكن

**مخرجات**: ربط حسابين + تبديل + media preview.

### Milestone C — Hardening

- Deauthorize/data-deletion الحقيقي
- plan limits enforcement
- observability (logs + request id)

---

## 10) قرارات مطلوبة قبل التنفيذ

1. **حد الحسابات** لكل باقة (2/5/غير محدود؟)
2. هل نمنع ربط نفس `igUserId` عبر أكثر من مستخدم؟ (غالباً لا)
3. فصل كامل بين Business Hub و link-in-bio؟ (مُوصى به: نعم)
4. هل نبدأ بـ UI mock أولاً أم مباشرة API؟ (مُوصى به: UI mock أولاً)

---

## 11) مخرجات Phase 1 (Definition of Done)

- المستخدم يربط **حسابين Instagram** على Business Hub
- يبدّل بين الحسابات من switcher
- يرى: username, profile pic, followers, media preview
- لا توجد توكنات مكشوفة في responses
- state آمن + tokens مشفّرة
- فيديو جاهز لـ App Review على `instagram_business_basic`

