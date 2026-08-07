# 📧 إعداد SendGrid — Rukny Workspace (مزوّد الإطلاق الرسمي)

> **آخر تحديث:** 2026-08-06  
> **الباقة المعتمدة:** **Essentials 50K** — **$19.95/شهر** · 50,000 رسالة · overage **$0.00133/رسالة**  
> **ترقية لاحقة:** Essentials 100K — $34.95/شهر عند تجاوز مستدام لـ ~50–70K  
> **خطة العمل الكاملة (English):** [WORKSPACE_SENDGRID_WORK_PLAN.md](./WORKSPACE_SENDGRID_WORK_PLAN.md)  
> **مرتبط بـ:** [RUKNY_PROFIT_MODEL.md](./RUKNY_PROFIT_MODEL.md) · [WORKSPACE_PRICING.md](./WORKSPACE_PRICING.md) · [WORKSPACE_MVP_SCOPE.md](./WORKSPACE_MVP_SCOPE.md)

---

## 0) قرار معماري حرج (من وثائق SendGrid)

إذا كان **Inbound Parse** على نفس hostname المستخدم في Domain Authentication مع **Automatic Security = ON**، قد تحدث حلقة لا نهائية بين CNAME و MX.

**قرار MVP:** لجميع دومينات Workspace التي تستقبل بريداً استخدم:

```json
{ "automatic_security": false, "default": false }
```

عند `POST /v3/whitelabel/domains`، ثم MX → `mx.sendgrid.net`.

التفاصيل الكاملة بالإنجليزية: [WORKSPACE_SENDGRID_WORK_PLAN.md §1.4](./WORKSPACE_SENDGRID_WORK_PLAN.md).

---

## 1) ماذا يغطي Essentials لـ Workspace؟

| القدرة | Essentials |
|--------|------------|
| إرسال عبر API / SMTP | ✅ |
| Webhooks (أحداث التسليم) | ✅ (حد event webhooks حسب الباقة) |
| Domain Authentication (SPF/DKIM) لدومين العميل | ✅ |
| Dynamic templates / analytics | ✅ |
| **Inbound Parse** (استقبال → POST لـ APIكم) | ✅ يُفعَّل يدوياً |
| Subusers | ❌ — عزل tenants منطقياً في DBكم |
| Dedicated IP | ❌ — لاحقاً على باقات أعلى إن لزم |
| سجل النشاط | **3 أيام** فقط |

---

## 2) تدفق المنتج المطلوب

```
تسجيل المستخدم (accounts)
  → إضافة دومين العميل
  → SendGrid: Authenticate Domain → سجلات DNS
  → التحقق → إنشاء mailbox (local@domain)
  → إرسال: SendGrid Mail Send API (from = صندوق العميل)
  → استقبال: MX / Inbound Parse → webhook → Inbox في DB
  → Events webhook: bounce / spamreport / dropped → suppressions
```

---

## 3) خطوات Console (حساب Rukny)

1. إنشاء حساب SendGrid واختيار **Essentials 50K**.  
2. تفعيل **Sender Authentication** لدومين منصة اختباري (مثلاً `mail.rukny.io`) للتطوير.  
3. إنشاء **API Key** بصلاحيات: Mail Send + Domain Auth للقراءة/الكتابة حسب الحاجة + Inbound Parse إن وُجدت صلاحية.  
4. إعداد **Event Webhook** → `POST /workspace/webhooks/sendgrid`  
   أحداث مقترحة: `delivered`, `bounce`, `dropped`, `spamreport`, `unsubscribe`, `open` (اختياري), `click` (اختياري).  
5. إعداد **Inbound Parse** لمضيف الاستقبال (لكل دومين عميل أو نمط موحّد):  
   - Host: الدومين أو subdomain مثل `mx.customer.com` / الدومين الكامل حسب تصميم DNS  
   - Destination URL: webhook الاستقبال في API  
   - تفعيل POST الرسالة الخام / المرفقات حسب الحاجة  
6. التحقق من التوقيع على webhooks قبل الكتابة في DB.

---

## 4) متغيرات البيئة المقترحة

```env
# apps/api/.env
SENDGRID_API_KEY=SG....
SENDGRID_EVENT_WEBHOOK_VERIFICATION_KEY=...
WORKSPACE_MAIL_PROVIDER=sendgrid
WORKSPACE_SENDGRID_FROM_FALLBACK=noreply@mail.rukny.io
WORKSPACE_S3_BUCKET_RAW=rukny-workspace-emails-raw
WORKSPACE_S3_BUCKET_ATTACHMENTS=rukny-workspace-attachments
```

---

## 5) ربط دومين العميل (منتج)

| خطوة | مسؤول |
|------|--------|
| المستخدم يدخل `mystore.com` في UI | Rukny |
| استدعاء SendGrid Authenticate Domain | API |
| عرض سجلات CNAME (DKIM) + أي سجل مطلوب | UI |
| المستخدم يضيفها عند المسجّل | العميل |
| Validate عند SendGrid | API / زر «تحقق» |
| ضبط MX أو توجيه Inbound Parse | Rukny + تعليمات DNS للعميل |
| السماح بإنشاء mailboxes بعد التحقق | API |

---

## 6) حدود الباقة — تذكير تشغيلي

- حصة المنصة: **50,000** رسالة/شهر على Essentials 50K.  
- طبّقوا **hard caps** للعملاء (5K / 25K / 100K) قبل نفاد حصة SendGrid.  
- عند اقتراب الاستهلاك الجماعي من 80%: تنبيه داخلي + دراسة الترقية إلى **100K**.

---

## 7) حالة المشروع

| البند | الحالة | التاريخ |
|--------|--------|---------|
| قرار مزوّد الإطلاق = SendGrid | ✅ | 2026-08-06 |
| باقة Essentials 50K | ✅ معتمدة في الوثائق | 2026-08-06 |
| حساب الإنتاج + API Key | ⏳ | — |
| Domain auth تجريبي | ⏳ | — |
| Event webhook | ⏳ | — |
| Inbound Parse | ⏳ | — |
| تكامل API في `apps/api` | ⏳ | — |

---

*بعد إكمال الجدول، حدّثوا [RUKNY_PROFIT_MODEL.md](./RUKNY_PROFIT_MODEL.md) إن تغيّر السعر أو الحجم.*
