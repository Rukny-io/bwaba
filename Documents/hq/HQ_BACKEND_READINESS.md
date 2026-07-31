# HQ — جاهزية Backend الإداري

> **المصدر:** `apps/api/src/domain/admin` + endpoints إدارية متفرقة  
> **Base URL:** `/api/v1/admin/*`  
> **الحماية المطلوبة:** JWT + `Role.ADMIN`  
> **آخر تدقيق:** 2026-06-22

---

## التقييم العام

| المعيار | التقييم | التفاصيل |
|---------|---------|----------|
| التغطية الوظيفية | 🟢 75% | 8 وحدات رئيسية جاهزة للربط |
| الأمان | 🟡 70% | معظم endpoints محمية — استثناءات حرجة |
| اكتمال العمليات | 🟡 65% | export stubs، إدارة جزئية للاشتراكات |
| جاهزية للإنتاج | 🟡 | يحتاج إصلاحات أمنية قبل فتح HQ |

**الحكم:** الـ Backend **جاهز لبدء بناء واجهة HQ** للوحدات الأساسية (Dashboard, Users, Verification, Commerce). يُنصح بإصلاح الفجوات الأمنية في المرحلة 0 بالتوازي مع بناء الـ Frontend.

---

## Endpoints جاهزة بالكامل ✅

### 1. Dashboard — `DashboardController`

| Method | Path | الوصف |
|--------|------|-------|
| GET | `/admin/stats` | إحصائيات: users, stores, forms, events, orders |
| GET | `/admin/recent-activity?limit=10` | نشاط حديث مدمج (حتى 50) |
| GET | `/admin/health` | صحة DB, Redis, memory, uptime |

**ملاحظات UI:**
- `stats` مُخزّن مؤقتاً 120 ثانية (`admin:platform-stats`)
- `health` مفيد لبطاقة "حالة النظام" في Dashboard

---

### 2. Users — `UsersController`

| Method | Path | الوصف |
|--------|------|-------|
| GET | `/admin/users/stats` | إحصائيات تفصيلية (أدوار، تحقق، 2FA) |
| GET | `/admin/users` | قائمة + `page`, `limit`, `search`, `role`, `emailVerified`, dates |
| GET | `/admin/users/:id` | تفاصيل مستخدم |
| GET | `/admin/users/export` | تصدير مع فلاتر |
| PATCH | `/admin/users/:id/role` | `{ role: "ADMIN" \| "PREMIUM" \| ... }` |
| DELETE | `/admin/users/:id/sessions` | إنهاء جلسات المستخدم |
| DELETE | `/admin/users/:id` | حذف مستخدم |

**جاهزية UI:** 🟢 كاملة — جدول + فلاتر + drawer تفاصيل + تأكيد حذف

---

### 3. Stores — `StoresController`

| Method | Path | الوصف |
|--------|------|-------|
| GET | `/admin/stores/stats` | إحصائيات المتاجر |
| GET | `/admin/stores` | قائمة + فلاتر (status, categoryId, city) |
| GET | `/admin/stores/:id` | تفاصيل |
| PATCH | `/admin/stores/:id/status` | تغيير الحالة |
| DELETE | `/admin/stores/:id` | حذف |
| GET/POST | `/admin/store-categories` | CRUD تصنيفات |
| PUT/DELETE | `/admin/store-categories/:id` | تعديل/حذف |

**جاهزية UI:** 🟢 كاملة

---

### 4. Products — `ProductsController`

| Method | Path | الوصف |
|--------|------|-------|
| GET | `/admin/products/stats` | إحصائيات |
| GET | `/admin/products` | قائمة + فلاتر |
| GET | `/admin/products/:id` | تفاصيل |
| GET | `/admin/products/export` | تصدير |
| PATCH | `/admin/products/:id/status` | تغيير الحالة |
| PATCH | `/admin/products/:id/featured` | `{ isFeatured: boolean }` |
| DELETE | `/admin/products/:id` | حذف |

**جاهزية UI:** 🟢 كاملة

---

### 5. Orders — `OrdersController`

| Method | Path | الوصف |
|--------|------|-------|
| GET | `/admin/orders/stats` | إحصائيات |
| GET | `/admin/orders` | قائمة + فلاتر |
| GET | `/admin/orders/:id` | تفاصيل |
| GET | `/admin/orders/export` | تصدير |
| PUT | `/admin/orders/:id/status` | تحديث الحالة |
| DELETE | `/admin/orders/:id` | حذف |

**جاهزية UI:** 🟢 كاملة

---

### 6. Verification — `VerificationController`

| Method | Path | الوصف |
|--------|------|-------|
| GET | `/admin/verification/stats` | إحصائيات التحقق |
| GET | `/admin/verification` | قائمة طلبات الهوية |
| GET | `/admin/verification/:id` | تفاصيل + flags للمستندات |
| GET | `/admin/verification/:id/document?slot=` | URL مؤقت لعرض المستند |
| PATCH | `/admin/verification/:id/approve` | موافقة |
| PATCH | `/admin/verification/:id/reject` | `{ reason }` |
| GET | `/admin/verification/rukny-verified/list` | قائمة Rukny Verified |
| PATCH | `/admin/verification/rukny-verified/:id/approve` | موافقة |
| PATCH | `/admin/verification/rukny-verified/:id/reject` | رفض |

**جاهزية UI:** 🟢 كاملة — يحتاج UI لعرض المستندات بشكل آمن (iframe/presigned URL)

**فجوة:** `GET /admin/verification/export` يُرجع `{ data: [], total: 0 }` — stub فقط

---

### 7. Forms (Admin) — `AdminFormsController`

| Method | Path | الوصف |
|--------|------|-------|
| GET | `/admin/forms/stats` | إحصائيات |
| GET | `/admin/forms` | قائمة قراءة فقط |

**جاهزية UI:** 🟡 قراءة فقط — لا يوجد suspend/delete من Admin

---

### 8. Wallpapers — `WallpapersController`

| Method | Path | الوصف |
|--------|------|-------|
| GET | `/admin/wallpapers` | قائمة |
| POST | `/admin/wallpapers/upload` | رفع (multipart, max 50MB) |
| PATCH | `/admin/wallpapers/:id` | تعديل |
| DELETE | `/admin/wallpapers/:id` | حذف |

**ملاحظة nginx:** يوجد `client_max_body_size 55M` مُعدّ مسبقاً لمسار الرفع.

**جاهزية UI:** 🟢 كاملة — يحتاج UI رفع مع progress

---

## Endpoints إدارية خارج AdminModule

### Subscriptions — `SubscriptionsController`

| Method | Path | الحالة |
|--------|------|--------|
| POST | `/subscriptions/admin/:userId/set-plan` | ✅ تعيين خطة لمستخدم |

**الفجوة:** لا يوجد `GET` لقائمة الاشتراكات أو إحصائيات — UI محدود

---

### Account Lockout — `AccountLockoutController`

| Method | Path | الحالة |
|--------|------|--------|
| POST | `/auth/lockout/admin/unlock` | ✅ فتح قفل حساب |
| GET | `/auth/lockout/admin/stats?email=` | 🟡 يتطلب email — لا إحصائيات عامة |
| POST | `/auth/lockout/admin/cleanup` | ✅ تنظيف محاولات قديمة |

---

## فجوات حرجة ⚠️

### 1. Rate Limiting بدون حماية Admin

```typescript
// apps/api/src/infrastructure/rate-limiting/rate-limiting.controller.ts
@Controller('admin/rate-limiting')
// @UseGuards(AdminGuard) // يجب إضافة حارس للمشرفين
```

**المسارات المكشوفة:**
- `GET /admin/rate-limiting/statistics`
- `GET /admin/rate-limiting/status/:identifier`
- `POST /admin/rate-limiting/reset/:identifier`
- وغيرها...

**الإجراء المطلوب:** إضافة `JwtAuthGuard` + `RolesGuard` + `@Roles(Role.ADMIN)` فوراً.

---

### 2. وحدات بدون Admin API

| الوحدة | الحالة | أولوية HQ |
|--------|--------|-----------|
| Events | لا admin controller | P2 |
| Analytics | لا admin overview | P2 |
| Notifications | لا broadcast admin | P2 |
| Developer API Keys | لا admin oversight | P2 |
| WhatsApp Provider | لا admin monitoring | P2 |
| Social / Moderation | لا admin queue | P3 |
| Audit Log | غير موجود | P1 |

---

### 3. Stubs و TODOs

| الموقع | المشكلة |
|--------|---------|
| `verification.controller.ts` → `export` | يُرجع مصفوفة فارغة |
| `account-lockout.controller.ts` → `admin/stats` | TODO: إحصائيات عامة |
| `verification` → `underReview` | دائماً `0` في stats |

---

## نموذج الاستجابة المتوقع

### Pagination (Users, Stores, etc.)

```json
{
  "data": [...],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

### Dashboard Stats

```json
{
  "users": { "total": 1000, "newToday": 5, "newThisWeek": 32, "newThisMonth": 120 },
  "stores": { "total": 50, "active": 42 },
  "forms": { "total": 200, "active": 150 },
  "events": { "total": 30, "active": 8 },
  "orders": { "total": 500 }
}
```

### Health

```json
{
  "status": "healthy",
  "uptime": 86400000,
  "services": {
    "database": { "status": "healthy", "responseTime": 3 },
    "redis": { "status": "healthy", "responseTime": 1 }
  },
  "memory": { "used": 120000000, "total": 200000000, "rss": 250000000 }
}
```

---

## خطة إصلاح Backend (مقترحة)

| ID | المهمة | الأولوية | الجهد |
|----|--------|----------|-------|
| BE-01 | حماية `rate-limiting.controller` | P0 | S |
| BE-02 | إكمال `verification/export` | P1 | M |
| BE-03 | `GET /admin/subscriptions` + stats | P1 | M |
| BE-04 | `GET /auth/lockout/admin/stats` عام | P1 | S |
| BE-05 | `AdminEventsController` (list + suspend) | P2 | M |
| BE-06 | `AdminAuditLog` module | P1 | L |
| BE-07 | `DELETE /admin/forms/:id` | P2 | S |

---

## اختبار الجاهزية

```bash
# يتطلب JWT لمستخدم بدور ADMIN
curl -H "Cookie: access_token=..." http://localhost:3001/api/v1/admin/stats
curl -H "Cookie: access_token=..." http://localhost:3001/api/v1/admin/health
curl -H "Cookie: access_token=..." "http://localhost:3001/api/v1/admin/users?page=1&limit=10"
```

**بدون ADMIN role:** يجب أن يُرجع `403 Forbidden`.

---

## الخلاصة

| للبدء فوراً | يحتاج Backend إضافي |
|-------------|---------------------|
| Dashboard | Audit Log |
| Users | Subscriptions list |
| Verification | Events admin |
| Stores / Products / Orders | Feature flags |
| Forms (read) | Notifications broadcast |
| Wallpapers | Developer keys oversight |
