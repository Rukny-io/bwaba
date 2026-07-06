# 🔗 خطة تنفيذ Account Linking + إثبات الهوية

---

## الوضع الحالي في قاعدة البيانات

حالياً OAuth مُخزّن كحقول مباشرة في جدول `User`:
```prisma
model User {
  googleId    String? @unique   // ← حقل مباشر
  linkedinId  String? @unique   // ← حقل مباشر
}
```

**هذا التصميم يعمل** — لا حاجة لجدول `OAuthProvider` منفصل لأن عدد الـ providers ثابت (Google + LinkedIn فقط). الجدول المنفصل يكون ضروري فقط إذا كان عدد الـ providers ديناميكي.

---

## المرحلة 1: Account Linking (الأولوية العالية)

### 1.1 Backend — Endpoints جديدة

| Endpoint | Method | Guard | الوظيفة |
|----------|--------|-------|---------|
| `/auth/linked-providers` | GET | JWT | عرض الـ providers المربوطة |
| `/auth/link/google` | GET | JWT | بدء ربط Google (OAuth redirect) |
| `/auth/link/linkedin` | GET | JWT | بدء ربط LinkedIn (OAuth redirect) |
| `/auth/link/callback/google` | GET | — | Callback بعد OAuth |
| `/auth/link/callback/linkedin` | GET | — | Callback بعد OAuth |
| `/auth/unlink/:provider` | DELETE | JWT | إلغاء ربط provider |

### 1.2 الملفات المطلوب تعديلها/إنشاؤها

```
apps/api/src/domain/auth/
├── account-linking.service.ts      ← 🆕 خدمة ربط/إلغاء الحسابات
├── account-linking.controller.ts   ← 🆕 Endpoints
├── auth.module.ts                  ← ✏️ تسجيل الخدمات الجديدة
└── auth.service.ts                 ← ✏️ تعديل oauthLogin لدعم mode=link
```

### 1.3 تدفق الربط (Linking Flow)

```
المستخدم مسجل دخول بـ Google
    │
    ▼
يفتح الإعدادات → الأمان → طرق تسجيل الدخول
    │
    ▼
يضغط "ربط LinkedIn"
    │
    ▼
GET /auth/link/linkedin
    ├── يتحقق من JWT (المستخدم مسجل دخول)
    ├── يُخزّن userId في Redis مع state token
    └── يوجّه لـ LinkedIn OAuth مع state=linkingToken
    │
    ▼
LinkedIn يُعيد التوجيه لـ /auth/link/callback/linkedin?code=xxx&state=yyy
    │
    ▼
account-linking.service.ts:
    ├── يسترجع userId من Redis عبر state
    ├── يحصل على linkedinId من LinkedIn API
    ├── يتحقق: هل linkedinId مستخدم بحساب آخر؟
    │   ├── نعم → خطأ: "هذا الحساب مربوط بمستخدم آخر"
    │   └── لا → يُحدّث User.linkedinId = linkedinId
    ├── يُسجّل SecurityLog
    └── يُعيد التوجيه للـ frontend /settings/security?linked=linkedin
```

### 1.4 تدفق إلغاء الربط (Unlinking Flow)

```
DELETE /auth/unlink/google
    │
    ▼
account-linking.service.ts:
    ├── يتحقق: هل عنده طريقة دخول أخرى؟
    │   (googleId OR linkedinId OR QuickSign email verified)
    │   ├── لا → خطأ: "لا يمكن إلغاء آخر طريقة تسجيل دخول"
    │   └── نعم → يُحدّث User.googleId = null
    ├── يُسجّل SecurityLog
    └── يُرجع { success: true }
```

### 1.5 account-linking.service.ts — الهيكل

```typescript
@Injectable()
export class AccountLinkingService {
  // عرض الـ providers المربوطة
  async getLinkedProviders(userId: string): Promise<LinkedProvidersResult>

  // بدء ربط provider (إنشاء state token في Redis)
  async initiateLinking(userId: string, provider: 'google' | 'linkedin'): Promise<string>

  // إتمام الربط بعد OAuth callback
  async completeLinking(state: string, providerData: OAuthProviderData): Promise<void>

  // إلغاء ربط provider
  async unlinkProvider(userId: string, provider: 'google' | 'linkedin'): Promise<void>

  // التحقق من إمكانية إلغاء الربط
  private async canUnlink(userId: string, provider: string): Promise<boolean>
}
```

---

## المرحلة 2: إثبات الهوية بالمستندات (أولوية متوسطة)

### 2.1 تعديل قاعدة البيانات

```prisma
// ← إضافة لجدول User
model User {
  // ... الحقول الموجودة
  verificationLevel      Int       @default(0)  // 0=none, 1=email, 2=phone, 3=id
  identityVerifications  IdentityVerification[]
}

// ← جدول جديد
model IdentityVerification {
  id              String    @id @default(uuid())
  userId          String
  documentType    String    // "national_id" | "passport" | "driving_license"
  documentFrontUrl String   // S3 key (مشفر، ليس عام)
  documentBackUrl  String?  // S3 key
  selfieUrl       String?   // صورة سيلفي للمقارنة
  status          String    @default("pending") // pending | approved | rejected | expired
  rejectionReason String?
  reviewedBy      String?   // admin userId
  reviewedAt      DateTime?
  submittedAt     DateTime  @default(now())
  expiresAt       DateTime? // مدة صلاحية التحقق
  metadata        Json?     // OCR data, confidence score
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
  @@map("identity_verifications")
}
```

### 2.2 الملفات المطلوبة

```
apps/api/src/domain/auth/
├── identity-verification.service.ts     ← 🆕 خدمة رفع ومراجعة المستندات
├── identity-verification.controller.ts  ← 🆕 Endpoints للمستخدم
└── admin/
    └── identity-admin.controller.ts     ← 🆕 لوحة المشرف للمراجعة
```

### 2.3 Endpoints

| Endpoint | Method | Guard | الوظيفة |
|----------|--------|-------|---------|
| `/auth/identity/status` | GET | JWT | حالة التحقق الحالية |
| `/auth/identity/submit` | POST | JWT | رفع المستندات |
| `/admin/identity/pending` | GET | Admin | قائمة الطلبات المعلقة |
| `/admin/identity/:id/approve` | POST | Admin | قبول طلب |
| `/admin/identity/:id/reject` | POST | Admin | رفض طلب مع سبب |

### 2.4 تدفق إثبات الهوية

```
المستخدم يفتح الإعدادات → التحقق من الهوية
    │
    ▼
يختار نوع المستند (بطاقة وطنية / جواز سفر)
    │
    ▼
يرفع صورة أمامية + خلفية (+ سيلفي اختياري)
    │
    ▼
POST /auth/identity/submit
    ├── التحقق من حجم ونوع الملفات
    ├── رفع مشفر لـ S3 (private bucket)
    ├── إنشاء سجل IdentityVerification (status: pending)
    ├── إرسال إشعار للمشرفين
    └── إرجاع { submissionId, status: 'pending' }
    │
    ▼
المشرف يفتح لوحة الإدارة → طلبات التحقق
    │
    ▼
يراجع المستندات:
    ├── POST /admin/identity/:id/approve
    │   ├── User.verificationLevel = 3
    │   ├── إرسال إشعار للمستخدم
    │   └── إضافة شارة ✅
    │
    └── POST /admin/identity/:id/reject
        ├── إرسال سبب الرفض
        └── المستخدم يقدر يعيد التقديم
```

---

## ترتيب التنفيذ المقترح

| المرحلة | المهمة | الجهد | الاعتمادية |
|---------|--------|------|-----------|
| **1A** | `AccountLinkingService` + الـ endpoints | ~3 ساعات | مستقل |
| **1B** | تعديل OAuth strategies لدعم `mode=link` | ~1 ساعة | بعد 1A |
| **1C** | صفحة Frontend لإدارة Providers | ~2 ساعة | بعد 1B |
| **2A** | Migration + `IdentityVerificationService` | ~3 ساعات | مستقل عن 1 |
| **2B** | صفحة رفع المستندات (Frontend) | ~2 ساعة | بعد 2A |
| **2C** | لوحة المشرف للمراجعة | ~2 ساعة | بعد 2A |

> [!IMPORTANT]
> **المرحلة 1 (Account Linking)** تحل مشكلة موجودة فعلياً في النظام — `requiresLinking: true` بدون آلية ربط.
> **المرحلة 2 (إثبات الهوية)** ميزة جديدة — يمكن تأجيلها حسب أولويات المنتج.

---

## متطلبات إضافية

### لا حاجة لـ Migration في المرحلة 1
حقول `googleId` و `linkedinId` موجودة بالفعل — نحتاج فقط أكواد backend جديدة.

### المرحلة 2 تحتاج Migration
```bash
npx prisma migrate dev --name add_identity_verification
```
