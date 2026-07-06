# 🔒 مراجعة وتحسينات نظام الأمان — Rukny.io

> **التقييم الحالي:** 9.5/10 — نظام ممتاز مع فرص تحسين مهمة
> **التقييم المستهدف:** 9.8+/10

---

## 📋 ملخص المراجعة

نظامك الحالي **قوي جداً** ويتضمن أنماط أمان متقدمة (Token Rotation, Theft Detection, Session Fingerprinting, Progressive Lockout). لكن هناك **ثغرات معمارية** و**طبقات حماية مفقودة** يمكن إضافتها.

---

## 1. 🚨 تحسينات أمنية حرجة (يجب تنفيذها أولاً)

### 1.1 AnomalyDetectionService غير مُفعّل في تدفق المصادقة

**المشكلة:** لديك `AnomalyDetectionService` جاهز بالكامل (كشف الموقع، IP المتعدد، الأجهزة، الوقت غير المعتاد) لكنه **غير مُستدعى** في `oauthLogin()` أو `exchangeOAuthCode()`.

**الحل:**
```typescript
// في auth.service.ts → oauthLogin()
const anomaly = await this.anomalyDetectionService.analyzeLogin(user.id, {
  ipAddress,
  userAgent,
  deviceFingerprint: /* from session fingerprint */,
});

if (anomaly.action === 'block') {
  throw new ForbiddenException('تم حظر تسجيل الدخول لنشاط مشبوه');
}
if (anomaly.action === 'challenge') {
  // يتطلب تحقق إضافي (2FA أو بريد إلكتروني)
  return { ...result, requiresChallenge: true, challengeReason: anomaly.reasons };
}
```

### 1.2 BruteForceService غير مُدمج مع OAuth

**المشكلة:** `BruteForceService` (Redis-based sliding window) موجود لكن تدفق OAuth يستخدم فقط `AccountLockoutService` (DB-based). هناك ازدواجية.

**الحل:** دمج `BruteForceService` في QuickSign و OAuth exchange endpoints.

### 1.3 ThreatAlertService غير مُفعّل

**المشكلة:** لديك نظام تنبيهات جاهز (Telegram, Slack, Discord) لكنه **غير مُستدعى** عند اكتشاف سرقة Token أو حظر حساب.

**الحل:** ربطه بأحداث:
- `TOKEN_THEFT_DETECTED` → `alertSuspiciousLogin()`
- `ACCOUNT_LOCKED` → `alertBruteForce()`
- `anomaly.riskScore >= 60` → `alertSuspiciousLogin()`

### 1.4 `console.log` في الإنتاج (QuickSign)

**المشكلة:** في [quicksign.service.ts](file:///c:/Users/lenovo/Documents/RuknyGroup/Rukny.io/apps/api/src/domain/auth/quicksign.service.ts) يوجد `console.log` بدون شرط `!isProduction` في عدة أماكن (سطر 238, 284, 332).

---

## 2. 🔐 طبقات حماية إضافية مقترحة

### 2.1 🌍 GeoIP Verification (التحقق الجغرافي)

```
المستخدم يسجل دخول من السعودية دائماً
← فجأة تسجيل دخول من بلد آخر خلال دقائق
← يتطلب تحقق إضافي (بريد إلكتروني أو 2FA إجباري)
```

**التنفيذ:**
- استخدام مكتبة `geoip-lite` أو خدمة MaxMind
- تخزين `lastKnownCountry` في Redis لكل مستخدم
- كشف "السفر المستحيل" (Impossible Travel) — موجود في `AnomalyDetectionService` لكن بدون GeoIP فعلي

### 2.2 🔑 Passkey / WebAuthn Support

```
المستخدم ← يسجل مفتاح أمان (بصمة / Face ID / USB Key)
← تسجيل دخول بدون كلمة مرور ولا OTP
← أقوى طريقة مصادقة متاحة
```

**التنفيذ:**
- مكتبة `@simplewebauthn/server` في NestJS
- جدول `UserPasskey` في Prisma (credentialId, publicKey, counter, transports)
- كمصادقة ثنائية بديلة عن TOTP أو كطريقة تسجيل دخول أساسية

### 2.3 🛡️ Trusted Devices (الأجهزة الموثوقة)

```
أول تسجيل دخول من جهاز ← إرسال رمز تحقق للبريد
المستخدم يختار "الوثوق بهذا الجهاز"
← يُخزّن device fingerprint مشفر في cookie طويل المدة
← تسجيلات الدخول المستقبلية من نفس الجهاز لا تتطلب تحقق إضافي
```

**التنفيذ:**
```typescript
// جدول جديد
model TrustedDevice {
  id            String   @id @default(uuid())
  userId        String
  fingerprintHash String  @unique
  deviceName    String
  browser       String
  os            String
  trustedAt     DateTime @default(now())
  lastUsedAt    DateTime
  expiresAt     DateTime // 90 يوم
}
```

### 2.4 📧 Login Notification بالبريد الإلكتروني

**المشكلة الحالية:** الإشعارات تُرسل عبر WebSocket فقط (`notificationsGateway`). إذا المستخدم غير متصل، لا يعلم بتسجيل الدخول.

**الحل:** إرسال بريد إلكتروني عند:
- تسجيل دخول من جهاز جديد
- تسجيل دخول من IP/بلد جديد
- محاولة ربط OAuth بحساب موجود
- مع زر "هذا لم أكن أنا" → يُبطل كل الجلسات

### 2.5 🕐 Session Idle Timeout فعلي

**المشكلة:** المستند يذكر idle timeout = 24 ساعة، لكن في الكود الفعلي [jwt.strategy.ts] التحقق يتم فقط عبر `updateSessionActivityThrottled` بدون **رفض** الجلسات الخاملة.

**الحل:**
```typescript
// في jwt.strategy.ts → validate()
const idleThreshold = 24 * 60 * 60 * 1000; // 24 hours
if (session.lastActivity && Date.now() - session.lastActivity.getTime() > idleThreshold) {
  await this.tokenService.revokeSession(session.id, 'Idle timeout exceeded');
  throw new UnauthorizedException('Session expired due to inactivity');
}
```

---

## 3. 🔄 تدفق التسجيل وإنشاء الملف الشخصي

### التدفق الحالي (جيد لكن يحتاج تحسين):

```
┌──────────────────────────────────────────────────────────────────┐
│                    التدفق الحالي                                  │
│                                                                  │
│  1. المستخدم يضغط "تسجيل الدخول بـ Google/LinkedIn"              │
│  2. OAuth Provider يُعيد التوجيه مع بيانات المستخدم               │
│  3. oauthLogin() → يبحث بـ providerId ثم بالبريد                  │
│     ├─ موجود بـ providerId → تسجيل دخول مباشر                    │
│     ├─ موجود بالبريد فقط → requiresLinking: true (⚠️ لا جلسة)    │
│     └─ غير موجود → إنشاء حساب جديد + username عشوائي             │
│  4. OAuth Code → Redis (60 ثانية)                                │
│  5. /oauth/exchange → إنشاء جلسة + cookies                       │
│  6. إذا needsProfileCompletion → /complete-profile                │
│  7. /auth/update-profile → تحديث الاسم + username + إنشاء متجر    │
└──────────────────────────────────────────────────────────────────┘
```

### التحسينات المقترحة:

#### 3.1 إضافة QuickSign كطريقة تسجيل أساسية

```
┌──────────────────────────────────────────────────────────────────┐
│                 التدفق المُحسّن للتسجيل                           │
│                                                                  │
│  الطريقة 1: OAuth (Google/LinkedIn) — الحالية ✅                   │
│  الطريقة 2: QuickSign (Magic Link) — الحالية ✅                    │
│  الطريقة 3: Passkey (WebAuthn) — مقترح جديد 🆕                    │
│  الطريقة 4: رقم الهاتف + OTP — مقترح جديد 🆕                     │
│                                                                  │
│  بعد أي طريقة:                                                   │
│  ┌─────────────────────────────────────────────────┐              │
│  │ Challenge Layer (الموحّدة)                       │              │
│  │ ├─ PENDING_PROFILE_COMPLETION (إذا مستخدم جديد) │              │
│  │ ├─ PENDING_2FA (إذا مُفعّل)                     │              │
│  │ ├─ PENDING_DEVICE_TRUST (إذا جهاز جديد)         │              │
│  │ └─ AUTHENTICATED (اكتمل)                        │              │
│  └─────────────────────────────────────────────────┘              │
└──────────────────────────────────────────────────────────────────┘
```

#### 3.2 تسجيل الدخول عبر رقم الهاتف + OTP

```typescript
// تدفق مقترح
POST /auth/phone/request  { phoneNumber: "+966xxxxxxxxx" }
→ إرسال OTP عبر SMS (Twilio/MessageBird)
→ تخزين OTP مشفر في Redis (5 دقائق)

POST /auth/phone/verify   { phoneNumber, otp }
→ التحقق من OTP
→ البحث عن مستخدم بنفس الرقم
→ إنشاء جلسة أو طلب إكمال الملف الشخصي
```

#### 3.3 تحسين إكمال الملف الشخصي

**المشكلة الحالية:** `update-profile` يقبل `phone` كحقل اختياري بدون تحقق.

**الحل:**
- إضافة تحقق OTP لرقم الهاتف عند إضافته
- التحقق من تفرد الرقم (موجود جزئياً — P2002 catch)
- إضافة حقل `phoneVerified: boolean` في User model

---

## 4. 🔑 تسجيل الدخول المتعدد (Multi-Provider Login)

### الحالة الحالية:

| السيناريو | السلوك الحالي | التحسين المقترح |
|-----------|---------------|----------------|
| مستخدم جديد بـ Google | ✅ إنشاء حساب | ✅ جيد |
| نفس المستخدم بـ LinkedIn (نفس البريد) | ⚠️ `requiresLinking: true` بدون آلية ربط | 🔧 تحتاج آلية ربط |
| مستخدم يريد إضافة Google لحساب LinkedIn | ❌ غير موجود | 🆕 مطلوب |
| تسجيل دخول بـ QuickSign + OAuth | ✅ مستقلان | ✅ جيد |

### التحسينات المقترحة:

#### 4.1 آلية ربط الحسابات (Account Linking)

```typescript
// Endpoint جديد: POST /auth/link-provider
@Post('link-provider')
@UseGuards(JwtAuthGuard) // يتطلب تسجيل دخول أولاً
async linkProvider(@CurrentUser() user, @Body() body: { provider: 'google' | 'linkedin' }) {
  // 1. توجيه المستخدم لـ OAuth flow خاص بالربط
  // 2. بعد العودة، ربط providerId بالحساب الحالي
  // 3. تسجيل SecurityLog
}
```

#### 4.2 صفحة إدارة طرق تسجيل الدخول

```
إعدادات الحساب → الأمان → طرق تسجيل الدخول
┌─────────────────────────────────────────────┐
│  ✅ Google    connected as user@gmail.com   │  [إلغاء الربط]
│  ⬜ LinkedIn  غير مُربط                     │  [ربط الحساب]
│  ✅ QuickSign متاح عبر user@gmail.com       │
│  ⬜ Passkey   غير مُعدّ                     │  [إضافة مفتاح]
│  ⬜ هاتف      غير مُعدّ                     │  [إضافة رقم]
└─────────────────────────────────────────────┘
```

#### 4.3 حماية إلغاء الربط

- لا يمكن إلغاء ربط آخر طريقة تسجيل دخول
- يتطلب تأكيد 2FA أو كلمة مرور
- تسجيل SecurityLog عند كل عملية ربط/إلغاء

---

## 5. 🛡️ إثبات الهوية (Identity Verification)

### 5.1 المستويات المقترحة

```
┌──────────────────────────────────────────────────┐
│              مستويات إثبات الهوية                  │
│                                                  │
│  المستوى 0: غير مُتحقق                           │
│  ├─ حساب جديد بـ OAuth أو QuickSign               │
│  ├─ يمكنه استخدام الميزات الأساسية                │
│                                                  │
│  المستوى 1: بريد إلكتروني مُتحقق ✅               │
│  ├─ تلقائي عبر OAuth (emailVerified: true)        │
│  ├─ عبر QuickSign (تحقق ضمني)                    │
│  ├─ يفتح ميزات إضافية                            │
│                                                  │
│  المستوى 2: هاتف مُتحقق 🆕                       │
│  ├─ OTP عبر SMS                                   │
│  ├─ مطلوب للمعاملات المالية                        │
│                                                  │
│  المستوى 3: هوية حكومية 🆕 (اختياري مستقبلاً)     │
│  ├─ رفع صورة بطاقة الهوية                         │
│  ├─ مراجعة يدوية أو تلقائية (OCR)                 │
│  └─ للتجار والمتاجر الموثوقة                      │
└──────────────────────────────────────────────────┘
```

### 5.2 جدول Prisma المقترح

```prisma
model IdentityVerification {
  id              String   @id @default(uuid())
  userId          String
  level           Int      // 0, 1, 2, 3
  emailVerified   Boolean  @default(false)
  phoneVerified   Boolean  @default(false)
  phoneNumber     String?
  idDocumentType  String?  // "national_id", "passport"
  idDocumentUrl   String?  // S3 key (مشفر)
  idVerifiedAt    DateTime?
  idVerifiedBy    String?  // admin userId
  status          String   @default("pending") // pending, approved, rejected
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  user            User     @relation(fields: [userId], references: [id])
}
```

---

## 6. 🔐 التحقق الثنائي (2FA) — تحسينات

### الحالة الحالية (جيدة):
- ✅ TOTP عبر تطبيقات المصادقة
- ✅ أكواد احتياطية (10 أكواد، SHA-256 مُشفرة)
- ✅ تشفير المفتاح السري بـ AES-256-GCM
- ✅ PendingTwoFactorSession في Redis

### التحسينات المقترحة:

#### 6.1 إضافة SMS OTP كبديل للتحقق الثنائي

```
إعدادات 2FA:
├─ ✅ تطبيق المصادقة (TOTP) — الطريقة الأساسية
├─ 🆕 SMS OTP — طريقة بديلة (أقل أماناً لكن أسهل)
├─ 🆕 Passkey/WebAuthn — الأقوى
└─ ✅ أكواد احتياطية — للطوارئ
```

#### 6.2 إضافة حد Rate Limit لمحاولات 2FA

**المشكلة:** `BruteForceService` يدعم OTP rate limiting لكنه **غير مُدمج** مع `two-factor.controller.ts`.

```typescript
// في two-factor.controller.ts → verify endpoint
const bruteCheck = await this.bruteForceService.recordOtpAttempt(user.id, ip);
if (bruteCheck.blocked) {
  throw new ForbiddenException('تم حظر المحاولات مؤقتاً');
}
```

#### 6.3 تحسين Backup Codes

**المشكلة:** `getBackupCodes()` يُرجع `'********'` دائماً — الأكواد الأصلية تُعرض مرة واحدة فقط عند الإنشاء.

**الحل:** إضافة تحذير واضح في الـ frontend مع خيار تحميل كملف نصي.

#### 6.4 2FA إجباري للحسابات الحساسة

```typescript
// سياسة مقترحة
const REQUIRE_2FA_FOR = [
  'ADMIN',           // المشرفون
  'STORE_OWNER',     // أصحاب المتاجر
  'VERIFIED_SELLER', // البائعون الموثوقون
];

// في jwt.strategy.ts
if (REQUIRE_2FA_FOR.includes(user.role) && !user.twoFactorEnabled) {
  // توجيه لصفحة إعداد 2FA إجباري
}
```

---

## 📊 ملخص الأولويات

| الأولوية | التحسين | الجهد | الأثر الأمني |
|----------|---------|------|-------------|
| 🔴 عالية | تفعيل AnomalyDetectionService في تدفق المصادقة | منخفض | عالي جداً |
| 🔴 عالية | تفعيل ThreatAlertService عند سرقة Token | منخفض | عالي |
| 🔴 عالية | إزالة console.log من QuickSign في الإنتاج | منخفض | متوسط |
| 🔴 عالية | دمج BruteForce rate limiting مع 2FA | منخفض | عالي |
| 🟡 متوسطة | آلية ربط الحسابات (Account Linking) | متوسط | متوسط |
| 🟡 متوسطة | Trusted Devices | متوسط | عالي |
| 🟡 متوسطة | إشعارات البريد عند تسجيل دخول جديد | متوسط | عالي |
| 🟡 متوسطة | تحقق OTP لرقم الهاتف | متوسط | متوسط |
| 🟡 متوسطة | Idle timeout enforcement فعلي | منخفض | متوسط |
| 🟢 منخفضة | WebAuthn/Passkey support | عالي | عالي |
| 🟢 منخفضة | تسجيل دخول بالهاتف + SMS | عالي | متوسط |
| 🟢 منخفضة | إثبات الهوية بالمستندات | عالي | عالي |
| 🟢 منخفضة | صفحة إدارة طرق تسجيل الدخول | متوسط | متوسط |

---

> [!IMPORTANT]
> **أول 4 تحسينات** (الأولوية العالية) لا تتطلب تغييرات معمارية كبيرة — فقط **تفعيل خدمات موجودة بالفعل** في الكود لكنها غير مُربوطة بتدفق المصادقة الفعلي.
