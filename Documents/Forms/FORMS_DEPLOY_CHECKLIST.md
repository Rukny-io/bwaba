# Forms — checklist نشر (staging / production)

## الخدمات المطلوبة

| الخدمة | المنفذ المحلي | ملاحظات |
|--------|---------------|---------|
| PostgreSQL | 5433 / 5432 | `DATABASE_URL` |
| Redis | 6379 | Webhooks + cache |
| API | 3001 | `apps/api` |
| Public app | **3006** | `/f/{slug}` — **ليس 3000** |
| Forms dashboard | 3007 | `apps/forms` |

## متغيرات البيئة (forms)

- `JWT_SECRET` — **نفس القيمة** في API و forms
- `API_BACKEND_URL` — عنوان API داخلي
- `NEXT_PUBLIC_PUBLIC_SITE_URL` — روابط النماذج العامة
- `NEXT_PUBLIC_FORMS_URL` — لوحة النماذج

## متغيرات البيئة (API)

- `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`
- `GOOGLE_SHEETS_*` — إن وُجد تكامل Sheets
- Turnstile keys — إن فُعّل `requireTurnstileOnSubmit`

## قبل الإطلاق

- [ ] `npm run build` ينجح في `apps/forms` و `apps/api` و `apps/public`
- [ ] نموذج تجريبي: إنشاء → محرّر → نشر → استجابة عامة → submissions
- [ ] `npm run test:e2e` من `apps/forms` (يتطلب DB + الخدمات الثلاث)
- [ ] Webhook test من تبويب التكاملات
- [ ] OAuth Google Sheets (staging)

## E2E محلي

```powershell
# من جذر المشروع — تأكد أن API + public + forms يعملان
cd apps/forms
powershell -File e2e/run-playwright.ps1
```
