# Rukny Checkout

تطبيق Next.js لإتمام الشراء في **صفحة واحدةحدة**: تحقق الهاتف (واتساب OTP) + عنوان التوصيل + مراجعة الطلب + دفع Al-Qaseh.

## التطوير المحلي

```bash
cd apps/checkout
npm install
npm run dev
```

يفتح على: [http://localhost:3010](http://localhost:3010)

يتوقع API على: `http://localhost:3001/api/v1`

## المسارات

| المسار | الوظيفة |
|--------|---------|
| `/` | صفحة الدفع الكاملة (هاتف + OTP + عنوان + مراجعة + دفع) |
| `/success` `/failed` `/pending` | نتيجة الدفع بعد العودة من Al-Qaseh |
| `/phone` `/address` `/review` | تحويلات قديمة → `/` |

## دخول من المتجر

```text
http://localhost:3010/?store=my-store&items=[{"productId":"...","quantity":1,"name":"منتج"}]
```

## المكوّنات

نفس طبقة UI في المنصة: `@heroui/react` عبر wrappers في `components/ui` (Button, Input, Label, Badge, InputOTP) وخط Thmanyah.

التدفق الرئيسي: `components/checkout/checkout-flow.tsx`

التوثيق الكامل: `Documents/checkout/`
