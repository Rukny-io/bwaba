# HQ — خطة التنفيذ الكاملة

> **النطاق:** `apps/hq` — لوحة المسؤول  
> **UI:** [HQ_PACKAGES_OVERVIEW.md](./HQ_PACKAGES_OVERVIEW.md)  
> **API:** [HQ_BACKEND_READINESS.md](./HQ_BACKEND_READINESS.md)  
> **آخر تحديث:** 2026-06-22

---

## كيف تستخدم هذا المستند

| العمود | المعنى |
|--------|--------|
| **ID** | معرّف ثابت — **HQ**-**XX** |
| **P** | P0 = حاجز، P1 = MVP، P2 = تحسينات |
| **Effort** | S ≈ نصف يوم، M ≈ 1–2 يوم، L ≈ 3+ أيام |
| **Depends** | مهام سابقة |
| **DoD** | معايير القبول |

**حالات المهمة:** `TODO` → `IN_PROGRESS` → `REVIEW` → `DONE`

---

## ملخص المراحل

| المرحلة | المهام | الهدف | التقدير |
|---------|--------|--------|---------|
| 0 — البنية | 6 | Packages + Auth + Proxy + Shell فارغ | 1–2 يوم |
| 1 — Dashboard | 4 | إحصائيات + صحة + نشاط | 2–3 أيام |
| 2 — Users | 5 | جدول + تفاصيل + أدوار | 2–3 أيام |
| 3 — Verification | 5 | هوية + Rukny Verified | 2–3 أيام |
| 4 — Commerce | 8 | متاجر + منتجات + طلبات | 4–5 أيام |
| 5 — Forms + Wallpapers | 4 | قراءة نماذج + رفع خلفيات | 2 يوم |
| 6 — Security Ops | 4 | Lockout + Rate limit + Export | 2 يوم |
| 7 — Polish | 5 | QA + RTL + responsive + deploy | 2–3 أيام |
| **المجموع** | **41** | | **~17–21 يوم** |

---

## الوضع الحالي (قبل التنفيذ)

| المسار | الحالة |
|--------|--------|
| `/` | صفحة create-next-app الافتراضية |
| `/login` | غير موجود |
| `/app` | غير موجود |
| `middleware.ts` | غير موجود |
| `lib/api-client.ts` | غير موجود |
| HeroUI | غير مربوط |

---

## قرارات معمارية

| القرار | الاختيار |
|--------|----------|
| مسار Dashboard | `/app` |
| مجموعة المسارات | `app/(dashboard)/` |
| API client | `lib/hq-api.ts` + `lib/api-client.ts` |
| Auth | SSO → `accounts.rukny.io` → callback → cookies |
| حماية المسارات | `middleware` يتحقق من session + role ADMIN |
| الجداول | `DataTable` wrapper فوق HeroUI `Table` |
| التصدير | زر يستدعي `/export` ويُنزّل CSV |
| الثيم | داكن افتراضي |

---

## المرحلة 0 — البنية التحتية (P0)

### HQ-00 | ربط HeroUI packages

| | |
|---|---|
| **P** | P0 |
| **Effort** | S |
| **Files** | `package.json`, `globals.css`, `next.config.ts`, `app/providers.tsx`, `app/layout.tsx` |
| **DoD** | `import { Button } from "@heroui/react"` يعمل بدون أخطاء build |

**الخطوات:**
1. إضافة `@heroui/react` و `@heroui/styles` كـ `file:./packages/*`
2. استيراد `@heroui/styles/css` في `globals.css`
3. `@source` لمسار `packages/react/src`
4. `transpilePackages` في next.config
5. ThemeProvider + tokens داكنة لـ HQ

---

### HQ-01 | API Proxy + Environment

| | |
|---|---|
| **P** | P0 |
| **Effort** | S |
| **Depends** | — |
| **Files** | `next.config.ts`, `.env.example` |
| **DoD** | `fetch('/api/v1/admin/health')` يصل للـ backend |

```env
API_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_ACCOUNTS_URL=http://localhost:3005
NEXT_PUBLIC_HQ_URL=http://localhost:3002
NEXT_PUBLIC_ROOT_DOMAIN=localhost
```

---

### HQ-02 | Auth Proxy + SSO

| | |
|---|---|
| **P** | P0 |
| **Effort** | M |
| **Depends** | HQ-01 |
| **Files** | `app/api/auth/[...path]/route.ts`, `middleware.ts`, `app/login/page.tsx`, `app/callback/page.tsx` |
| **DoD** | تسجيل دخول عبر accounts → عودة لـ HQ مع cookies |

**النمط:** نسخ/adapt من `apps/forms/app/api/auth/[...path]/route.ts`

**ALLOWED_AUTH_PREFIXES:**
```typescript
['me', 'refresh', 'logout', 'logout-all', 'oauth', 'google', 'linkedin', '2fa']
```

---

### HQ-03 | Middleware — حماية ADMIN

| | |
|---|---|
| **P** | P0 |
| **Effort** | M |
| **Depends** | HQ-02 |
| **Files** | `middleware.ts`, `lib/auth.ts` |
| **DoD** | مستخدم بدون ADMIN → redirect لـ accounts أو صفحة 403 |

**المنطق:**
1. `/app/*` يتطلب session cookies
2. `GET /api/v1/auth/me` → تحقق من `role === 'ADMIN'`
3. `/login`, `/callback`, `/_next`, `/api/auth` مستثناة

---

### HQ-04 | API Client

| | |
|---|---|
| **P** | P0 |
| **Effort** | S |
| **Depends** | HQ-01 |
| **Files** | `lib/api-client.ts`, `lib/hq-api.ts`, `lib/types/admin.ts` |
| **DoD** | `hqApi.getStats()`, `hqApi.getUsers({ page: 1 })` typed |

**الدوال الأساسية:**
```typescript
// lib/api-client.ts
export async function apiGet<T>(path: string): Promise<T>
export async function apiPatch<T>(path: string, body: unknown): Promise<T>
export async function apiDelete<T>(path: string): Promise<T>
export async function apiPost<T>(path: string, body?: unknown): Promise<T>
export async function apiUpload(path: string, formData: FormData): Promise<unknown>
```

---

### HQ-05 | Dashboard Shell (Layout)

| | |
|---|---|
| **P** | P0 |
| **Effort** | M |
| **Depends** | HQ-00, HQ-03 |
| **Files** | `app/(dashboard)/layout.tsx`, `components/layout/hq-shell.tsx`, `hq-sidebar.tsx`, `hq-header.tsx` |
| **DoD** | Shell مع sidebar + header + منطقة محتوى + تنقل بين أقسام فارغة |

**عناصر Sidebar:**
```
🏠 الرئيسية        → /app
👥 المستخدمون      → /app/users
✅ التحقق          → /app/verification
🏪 المتاجر         → /app/stores
📦 المنتجات        → /app/products
🛒 الطلبات         → /app/orders
📋 النماذج         → /app/forms
🖼️ الخلفيات        → /app/wallpapers
```

---

### HQ-06 | صفحة 403 + Login

| | |
|---|---|
| **P** | P0 |
| **Effort** | S |
| **Depends** | HQ-03 |
| **Files** | `app/forbidden/page.tsx`, `app/login/page.tsx` |
| **DoD** | مستخدم مسجّل بدون ADMIN يرى رسالة واضحة |

---

## المرحلة 1 — Dashboard (P1)

### HQ-10 | بطاقات الإحصائيات

| | |
|---|---|
| **P** | P1 |
| **Effort** | M |
| **Depends** | HQ-04, HQ-05 |
| **Files** | `app/(dashboard)/page.tsx`, `components/shared/stat-card.tsx` |
| **API** | `GET /admin/stats` |
| **DoD** | 5 بطاقات: users, stores, forms, events, orders مع أرقام حية |

---

### HQ-11 | صحة النظام

| | |
|---|---|
| **P** | P1 |
| **Effort** | S |
| **Depends** | HQ-10 |
| **Files** | `components/dashboard/system-health.tsx` |
| **API** | `GET /admin/health` |
| **DoD** | حالة DB/Redis + uptime + memory + badge (healthy/degraded/unhealthy) |

---

### HQ-12 | النشاط الحديث

| | |
|---|---|
| **P** | P1 |
| **Effort** | M |
| **Depends** | HQ-10 |
| **Files** | `components/dashboard/recent-activity.tsx` |
| **API** | `GET /admin/recent-activity?limit=15` |
| **DoD** | قائمة بأيقونات حسب النوع + وقت نسبي + avatar |

---

### HQ-13 | تحديث تلقائي + Skeleton

| | |
|---|---|
| **P** | P1 |
| **Effort** | S |
| **Depends** | HQ-10 |
| **DoD** | Skeleton أثناء التحميل + refresh كل 60 ثانية (اختياري) |

---

## المرحلة 2 — Users (P1)

### HQ-20 | جدول المستخدمين

| | |
|---|---|
| **P** | P1 |
| **Effort** | M |
| **Depends** | HQ-04, HQ-05 |
| **Files** | `app/(dashboard)/users/page.tsx`, `components/users/users-table.tsx`, `components/shared/data-table.tsx` |
| **API** | `GET /admin/users` |
| **DoD** | جدول + pagination + بحث + فلتر role + فلتر emailVerified |

---

### HQ-21 | إحصائيات المستخدمين

| | |
|---|---|
| **P** | P1 |
| **Effort** | S |
| **Depends** | HQ-20 |
| **API** | `GET /admin/users/stats` |
| **DoD** | صف علوي بإحصائيات (total, today, byRole, verificationRate) |

---

### HQ-22 | تفاصيل المستخدم (Drawer)

| | |
|---|---|
| **P** | P1 |
| **Effort** | M |
| **Depends** | HQ-20 |
| **Files** | `components/users/user-detail-drawer.tsx` |
| **API** | `GET /admin/users/:id` |
| **DoD** | Drawer بمعلومات كاملة + روابط إجراءات |

---

### HQ-23 | تغيير الدور + إنهاء الجلسات

| | |
|---|---|
| **P** | P1 |
| **Effort** | M |
| **Depends** | HQ-22 |
| **API** | `PATCH /admin/users/:id/role`, `DELETE /admin/users/:id/sessions` |
| **DoD** | Select للدور + ConfirmDialog + Toast |

---

### HQ-24 | حذف مستخدم + تصدير

| | |
|---|---|
| **P** | P1 |
| **Effort** | S |
| **Depends** | HQ-20 |
| **API** | `DELETE /admin/users/:id`, `GET /admin/users/export` |
| **DoD** | حذف مع تأكيد مزدوج + زر تصدير CSV |

---

## المرحلة 3 — Verification (P1)

### HQ-30 | قائمة طلبات الهوية

| | |
|---|---|
| **P** | P1 |
| **Effort** | M |
| **Files** | `app/(dashboard)/verification/page.tsx` |
| **API** | `GET /admin/verification`, `GET /admin/verification/stats` |
| **DoD** | جدول + فلتر status + بحث |

---

### HQ-31 | مراجعة طلب (صفحة/Drawer)

| | |
|---|---|
| **P** | P1 |
| **Effort** | L |
| **Files** | `app/(dashboard)/verification/[id]/page.tsx` |
| **API** | `GET /admin/verification/:id`, `GET .../document?slot=` |
| **DoD** | عرض المستندات (front/back/selfie) + بيانات المستخدم |

---

### HQ-32 | موافقة / رفض

| | |
|---|---|
| **P** | P1 |
| **Effort** | M |
| **Depends** | HQ-31 |
| **API** | `PATCH .../approve`, `PATCH .../reject` |
| **DoD** | رفض يتطلب سبب (Textarea) + Toast |

---

### HQ-33 | تبويب Rukny Verified

| | |
|---|---|
| **P** | P1 |
| **Effort** | M |
| **Files** | Tabs في صفحة verification |
| **API** | `GET /admin/verification/rukny-verified/list` |
| **DoD** | قائمة منفصلة + approve/reject |

---

### HQ-34 | إشعار طلبات معلّقة

| | |
|---|---|
| **P** | P2 |
| **Effort** | S |
| **DoD** | Badge في Sidebar بعدد pending |

---

## المرحلة 4 — Commerce (P1)

### HQ-40 | المتاجر — قائمة + إحصائيات

| | |
|---|---|
| **P** | P1 |
| **Effort** | M |
| **Files** | `app/(dashboard)/stores/page.tsx` |
| **API** | `GET /admin/stores`, `GET /admin/stores/stats` |

---

### HQ-41 | المتاجر — تفاصيل + تغيير حالة

| | |
|---|---|
| **P** | P1 |
| **Effort** | M |
| **API** | `GET /admin/stores/:id`, `PATCH .../status`, `DELETE ...` |

---

### HQ-42 | تصنيفات المتاجر CRUD

| | |
|---|---|
| **P** | P1 |
| **Effort** | M |
| **Files** | `app/(dashboard)/stores/categories/page.tsx` |
| **API** | `*/admin/store-categories` |

---

### HQ-43 | المنتجات — قائمة + featured

| | |
|---|---|
| **P** | P1 |
| **Effort** | M |
| **Files** | `app/(dashboard)/products/page.tsx` |
| **API** | `GET /admin/products`, `PATCH .../featured` |

---

### HQ-44 | المنتجات — تفاصيل + حالة

| | |
|---|---|
| **P** | P1 |
| **Effort** | M |
| **API** | `GET /admin/products/:id`, `PATCH .../status` |

---

### HQ-45 | الطلبات — قائمة + إحصائيات

| | |
|---|---|
| **P** | P1 |
| **Effort** | M |
| **Files** | `app/(dashboard)/orders/page.tsx` |
| **API** | `GET /admin/orders`, `GET /admin/orders/stats` |

---

### HQ-46 | الطلبات — تفاصيل + تحديث حالة

| | |
|---|---|
| **P** | P1 |
| **Effort** | M |
| **API** | `GET /admin/orders/:id`, `PUT .../status` |

---

### HQ-47 | تصدير Commerce

| | |
|---|---|
| **P** | P2 |
| **Effort** | S |
| **API** | export endpoints للمنتجات والطلبات |

---

## المرحلة 5 — Forms + Wallpapers (P1)

### HQ-50 | قائمة النماذج (قراءة)

| | |
|---|---|
| **P** | P1 |
| **Effort** | S |
| **Files** | `app/(dashboard)/forms/page.tsx` |
| **API** | `GET /admin/forms`, `GET /admin/forms/stats` |
| **DoD** | جدول قراءة فقط مع رابط لمالك النموذج |

---

### HQ-51 | إدارة الخلفيات — قائمة

| | |
|---|---|
| **P** | P1 |
| **Effort** | M |
| **Files** | `app/(dashboard)/wallpapers/page.tsx` |
| **API** | `GET /admin/wallpapers` |

---

### HQ-52 | رفع خلفية

| | |
|---|---|
| **P** | P1 |
| **Effort** | M |
| **API** | `POST /admin/wallpapers/upload` |
| **DoD** | رفع drag-drop + preview + progress |

---

### HQ-53 | تعديل/حذف خلفية

| | |
|---|---|
| **P** | P1 |
| **Effort** | S |
| **API** | `PATCH /admin/wallpapers/:id`, `DELETE ...` |

---

## المرحلة 6 — Security Ops (P2)

### HQ-60 | فتح قفل الحسابات

| | |
|---|---|
| **P** | P2 |
| **Effort** | S |
| **Files** | `app/(dashboard)/security/lockout/page.tsx` |
| **API** | `POST /auth/lockout/admin/unlock` |

---

### HQ-61 | Rate Limiting (بعد إصلاح BE-01)

| | |
|---|---|
| **P** | P2 |
| **Effort** | M |
| **Depends** | BE-01 (Backend) |
| **API** | `/admin/rate-limiting/*` |

---

### HQ-62 | تعيين خطة اشتراك

| | |
|---|---|
| **P** | P2 |
| **Effort** | S |
| **API** | `POST /subscriptions/admin/:userId/set-plan` |
| **DoD** | من صفحة تفاصيل المستخدم — modal لاختيار الخطة |

---

### HQ-63 | سجل تدقيق (يتطلب Backend)

| | |
|---|---|
| **P** | P2 |
| **Effort** | L |
| **Depends** | BE-06 |
| **DoD** | جدول: من، ماذا، متى، IP |

---

## المرحلة 7 — Polish (P1)

### HQ-70 | RTL + i18n أساسي

| | |
|---|---|
| **P** | P1 |
| **Effort** | M |
| **DoD** | `dir="rtl"` + جميع النصوص عربية |

---

### HQ-71 | Responsive + Mobile sidebar

| | |
|---|---|
| **P** | P1 |
| **Effort** | M |
| **DoD** | Drawer sidebar على الجوال |

---

### HQ-72 | Error boundaries + empty states

| | |
|---|---|
| **P** | P1 |
| **Effort** | S |
| **Files** | `app/(dashboard)/error.tsx` |

---

### HQ-73 | تفعيل nginx + docker-compose

| | |
|---|---|
| **P** | P1 |
| **Effort** | S |
| **Files** | `nginx/conf.d/default.conf`, `docker-compose.yml` |
| **DoD** | `admin.rukny.io` → hq:3002 |

---

### HQ-74 | QA Checklist

| | |
|---|---|
| **P** | P1 |
| **Effort** | M |
| **DoD** | جميع المسارات تعمل + 403 لغير ADMIN + لا تسريب بيانات |

---

## هيكل الملفات المستهدف

```
apps/hq/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Dashboard
│   │   ├── users/page.tsx
│   │   ├── verification/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── stores/
│   │   │   ├── page.tsx
│   │   │   └── categories/page.tsx
│   │   ├── products/page.tsx
│   │   ├── orders/page.tsx
│   │   ├── forms/page.tsx
│   │   ├── wallpapers/page.tsx
│   │   └── error.tsx
│   ├── api/auth/[...path]/route.ts
│   ├── login/page.tsx
│   ├── callback/page.tsx
│   ├── forbidden/page.tsx
│   ├── layout.tsx
│   ├── providers.tsx
│   └── globals.css
├── components/
│   ├── layout/
│   ├── shared/
│   ├── dashboard/
│   ├── users/
│   ├── verification/
│   ├── stores/
│   ├── products/
│   ├── orders/
│   ├── forms/
│   └── wallpapers/
├── lib/
│   ├── api-client.ts
│   ├── hq-api.ts
│   ├── auth.ts
│   └── types/
│       └── admin.ts
├── middleware.ts
└── packages/                           # HeroUI (جاهز)
```

---

## ترتيب التنفيذ الموصى به

```
الأسبوع 1:  HQ-00 → HQ-06 (بنية كاملة)
الأسبوع 2:  HQ-10 → HQ-13 (Dashboard) + HQ-20 → HQ-24 (Users)
الأسبوع 3:  HQ-30 → HQ-33 (Verification) + HQ-40 → HQ-42 (Stores)
الأسبوع 4:  HQ-43 → HQ-47 (Products/Orders) + HQ-50 → HQ-53 (Forms/Wallpapers)
الأسبوع 5:  HQ-60 → HQ-74 (Security + Polish + Deploy)
```

---

## معايير القبول العامة (Definition of Done)

- [ ] يعمل على `localhost:3002`
- [ ] فقط `Role.ADMIN` يصل لـ `/app/*`
- [ ] جميع الطلبات عبر `/api/v1` (cookies + CSRF إن وُجد)
- [ ] حالات تحميل + خطأ + فارغ لكل قائمة
- [ ] تأكيد قبل كل عملية حذف
- [ ] Toast بعد كل إجراء ناجح/فاشل
- [ ] RTL صحيح
- [ ] `npm run build` ينجح بدون أخطاء

---

## مهام Backend المتوازية

راجع [HQ_BACKEND_READINESS.md](./HQ_BACKEND_READINESS.md) — أهمها:

| ID | المهمة | متى |
|----|--------|-----|
| BE-01 | حماية rate-limiting | قبل HQ-61 |
| BE-02 | verification export | قبل الحاجة للتصدير |
| BE-03 | subscriptions list | قبل توسيع HQ-62 |
| BE-06 | audit log | قبل HQ-63 |
