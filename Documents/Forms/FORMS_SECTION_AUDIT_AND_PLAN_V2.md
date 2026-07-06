# قسم النماذج — تدقيق كامل + خطة v2

> **آخر تحديث:** 2026-06-16  
> **المرحلة 1 (إنتاج أولاً):** الأسبوع 1 ✅ · الأسبوع 2 ✅ (E2E specs + CI validate) · الأسبوع 3 ✅ (`.env.example` + هذا التحديث)

> **تاريخ التدقيق:** 2026-06-03  
> **النطاق:** `apps/forms` — مسارات `/app/forms/*` وملحقاتها  
> **يحل محل:** [FORMS_SECTION_IMPLEMENTATION_PLAN.md](./FORMS_SECTION_IMPLEMENTATION_PLAN.md) كمرجع تنفيذ نشط (القديم يبقى أرشيفاً)  
> **مرتبط بـ:** [FORMS_DASHBOARD_UI_IMPLEMENTATION_TODO.md](./FORMS_DASHBOARD_UI_IMPLEMENTATION_TODO.md) (FD-03)

---

## 1) ملخص التدقيق

| البند | الحالة |
|--------|--------|
| الصفحات الخمس | **موجودة** ومرتبطة بمكوّنات client + API |
| `lib/forms-api.ts` | **موجود** — CRUD + submissions + analytics |
| `components/forms/*` | **9 ملفات** — تنفيذ عملي (ليس 1:1 مع أسماء الخطة القديمة) |
| `hooks/use-forms-*` | **غير موجود** — المنطق داخل الـ views |
| HeroUI `Table` | **غير مستخدم** — قائمة مخصّصة `forms-list-view` |
| `[id]/layout.tsx` | **موجود** |
| Mobile Dock فرعي لـ `[id]` | **موجود** — `form-workspace-mobile-dock.tsx` |
| Toast موحّد | **موجود** — `lib/app-toast.ts` |
| E2E Playwright | **موجود** — `e2e/golden-path.spec.ts`, `e2e/public-form.spec.ts` |
| `.env.example` | **موجود** في `apps/forms` |
| مسار عام `/f/[slug]` | **غير موجود** في `apps/forms` — رابط المعاينة قد لا يعمل |
| `npm run build` | ✅ **ينجح** (بعد إصلاح `form-analytics-view` + `forms-api` params) |

**نسبة إنجاز MVP تقريبية:** ~85% — المرحلة 1 مكتملة؛ التكاملات n8n وLanding في المرحلة 2.

---

## 2) جرد الملفات (ملف بملف)

### 2.1 الصفحات — `app/app/forms/`

| الملف | النوع | المكوّن | API | الحالة | ملاحظات |
|-------|--------|---------|-----|--------|---------|
| `page.tsx` | Server | `FormsListView` | `GET /forms` | ✅ DONE | — |
| `new/page.tsx` | Server | `CreateFormForm` | `POST /forms` | ✅ DONE | — |
| `[id]/layout.tsx` | Server | `FormWorkspaceNav` + `fetchFormServer` | `GET /forms/:id` | ✅ DONE | عنوان التبويب من SSR |
| `[id]/page.tsx` | Server → Client | `FormDetailView` | GET/PUT/status/delete/duplicate | ✅ DONE | — |
| `[id]/submissions/page.tsx` | Server → Client | `SubmissionsView` | GET/DELETE submissions | ✅ DONE | — |
| `[id]/analytics/page.tsx` | Server → Client | `FormAnalyticsView` | `GET .../analytics` | ✅ DONE | — |

### 2.2 المكوّنات — `components/forms/`

| الملف | الغرض | الحالة | مقابل الخطة القديمة |
|-------|--------|--------|---------------------|
| `forms-list-view.tsx` | قائمة + pagination + فلتر + حذف/نسخ | ✅ DONE | بديل `forms-list-table` |
| `forms-list-toolbar.tsx` | فلتر `status` | ✅ DONE | FF-01-02 |
| `form-status-chip.tsx` | Chip حالة | ✅ DONE | — |
| `create-form-form.tsx` | إنشاء نموذج + slug تلقائي | ✅ DONE | FF-02 |
| `form-workspace-nav.tsx` | breadcrumb + 3 تبويبات | ✅ DONE | FF-03-02 |
| `form-detail-view.tsx` | إعدادات + نشر + حقول + حذف/نسخ | ✅ DONE | يدمج header + settings |
| `form-fields-list.tsx` | عرض حقول readonly | ✅ DONE | FF-04-04 |
| `submissions-view.tsx` | قائمة + حذف + expand JSON | ✅ DONE | ليس Drawer |
| `form-analytics-view.tsx` | 4 بطاقات + submissionsByDay | ✅ DONE | — |

**غير موجود (كانت في الخطة القديمة):**

- `forms-list-table.tsx`
- `form-detail-header.tsx`, `form-settings-panel.tsx` (مدمجة في `form-detail-view`)
- `submissions-table.tsx`, `submission-detail-drawer.tsx`
- `form-analytics-summary.tsx` (الاسم الفعلي `form-analytics-view`)
- `hooks/use-forms-list.ts`, `use-form-detail.ts`, `use-form-submissions.ts`

### 2.3 المكتبة — `lib/`

| الملف | الغرض | الحالة | ملاحظات |
|-------|--------|--------|---------|
| `api-client.ts` | HTTP + CSRF + refresh | ✅ DONE | أُضيف `post`, `put` |
| `forms-api.ts` | Types + كل استدعاءات النماذج | ✅ DONE | — |
| `forms-format.ts` | تسميات، تواريخ، slug، رابط عام | ✅ DONE | `getPublicFormUrl` → `rukny.io/f/{slug}` |
| `forms-api-server.ts` | `GET` للـ layout (cookies) | ✅ DONE | غير مذكور في v1 |
| `forms-dashboard-data.ts` | إحصائيات `/app` | ✅ DONE | خارج قسم النماذج |

### 2.4 تكامل Shell (خارج `/forms` لكن يؤثر)

| الملف | علاقة بقسم النماذج | الحالة |
|-------|-------------------|--------|
| `components/app/sidebar.tsx` | رابط «نماذجي» | ✅ |
| `app/app/page.tsx` | CTA → `/app/forms`, `/new` | ✅ |
| `components/app/mobile-dock.tsx` | لا روابط فرعية `[id]` | ❌ FF-03-04 |
| `components/app/nav-config.ts` | `forms` في PAGE_LABELS | ✅ |

---

## 3) تغطية API (من الواجهة)

| Endpoint | مستخدم في | الحالة |
|----------|-----------|--------|
| `GET /forms` | `forms-list-view` | ✅ |
| `POST /forms` | `create-form-form` | ✅ |
| `GET /forms/:id` | layout SSR + `form-detail-view` | ✅ |
| `PUT /forms/:id` | `form-detail-view` (title, description) | ✅ جزئي — **لا slug** |
| `PUT /forms/:id/status` | `form-detail-view` | ✅ |
| `DELETE /forms/:id` | list + detail | ✅ |
| `POST /forms/:id/duplicate` | list + detail | ✅ |
| `GET /forms/:id/submissions` | `submissions-view` | ✅ page/limit |
| `DELETE .../submissions/:id` | `submissions-view` | ✅ |
| `GET /forms/:id/analytics` | `form-analytics-view` | ✅ |
| `GET .../export` | — | ❌ خارج MVP |
| `PUT /forms/:id` مع `fields[]` | — | ❌ محرّر حقول |

---

## 4) فجوات ومعطّلات (Blockers)

| # | المشكلة | الخطورة | الإجراء في v2 |
|---|---------|---------|----------------|
| B1 | ~~`build` يفشل~~ | — | ✅ مُصلَح |
| B2 | لا يوجد `app/f/[slug]` على **rukny.io** (تطبيق `apps/app`) — الرابط صحيح لكن الصفحة قد 404 | P1 | FF2-04-01 — الرابط: `https://rukny.io/f/{slug}` (**ليس** forms.rukny.io) |
| B3 | لا `hooks/` — صعوبة إعادة الاستخدام والاختبار | P2 | FF2-02-* اختياري |
| B4 | لا HeroUI `Table` — قرار: إبقاء القائمة أو ترحيل | P2 | قرار منتج |
| B5 | لا `.env.example` | P2 | FF2-00-02 |
| B6 | Dock جوال بدون تبويبات نموذج | P1 | FF2-03-01 |
| B7 | لا Toast بعد العمليات | P2 | FF2-07-01 |
| B8 | PlanGuard رسالة مخصّصة عند إنشاء | P2 | FF2-02-02 |
| B9 | تعديل `slug` من الواجهة | P2 | FF2-04-02 |
| B10 | مزامنة عنوان Nav مع اسم النموذج في `[id]` | P2 | FF2-03-02 |

---

## 5) خطة v2 — ما تبقى فقط

**معرّفات جديدة:** `FF2-xx` (Forms Feature v2) لتفادي الخلط مع الخطة القديمة.

### المرحلة FF2-0 — إصلاحات حرجة (P0) — ~2 ساعة

| ID | المهمة | الملفات | DoD | Status |
|----|--------|---------|-----|--------|
| FF2-00-01 | إصلاح `form-analytics-view` + `npm run build` ناجح | `form-analytics-view.tsx`, `forms-api.ts` | build ✅ | DONE |
| FF2-00-02 | إضافة `apps/forms/.env.example` | `.env.example` | API_URL موثّق | TODO |
| FF2-00-03 | تحديث FD-03 في Dashboard TODO + ربط هذا المستند | `FORMS_DASHBOARD_UI_IMPLEMENTATION_TODO.md` | جدول FD-03 يعكس الواقع | TODO |

### المرحلة FF2-1 — اكتمال MVP الوظيفي (P1) — ~1–2 يوم

| ID | المهمة | DoD | Status |
|----|--------|-----|--------|
| FF2-01-01 | التحقق اليدوي: قائمة → إنشاء → تفاصيل → نشر → استجابات → تحليلات | QA §6 يمر | TODO |
| FF2-01-02 | معالجة 403/409/404 برسائل عربية موحّدة في كل view | لا `alert()` خام | TODO |
| FF2-01-03 | `PlanGuard` عند `POST /forms` — رسالة «حد النماذج» | `create-form-form` | TODO |
| FF2-03-01 | Dock جوال: عند `/app/forms/[id]/*` إظهار 3 روابط فرعية | `mobile-dock.tsx` | TODO |
| FF2-04-01 | **قرار معاينة:** إنشاء `app/f/[slug]/page.tsx` أو توثيق URL الصحيح | رابط يعمل | TODO |

### المرحلة FF2-2 — هيكلة (P2، اختياري حسب الأولوية) — ~2–3 أيام

| ID | المهمة | ملاحظة | Status |
|----|--------|--------|--------|
| FF2-02-01 | استخراج `hooks/use-forms-list.ts` من `forms-list-view` | لا تغيير UI | TODO |
| FF2-02-02 | `hooks/use-form-detail.ts` | — | TODO |
| FF2-02-03 | `hooks/use-form-submissions.ts` | — | TODO |
| FF2-02-04 | ترحيل القائمة إلى HeroUI `Table` **أو** توثيق الإبقاء على القائمة المخصّصة | قرار في §7 | TODO |
| FF2-02-05 | `submission-detail-drawer.tsx` بدل expand JSON | UX أفضل | TODO |

### المرحلة FF2-3 — تحرير وتجربة (P2) — ~2–4 أيام

| ID | المهمة | Status |
|----|--------|--------|
| FF2-04-02 | تعديل `slug` من `form-detail-view` (مع تحذير) | TODO |
| FF2-04-03 | إضافة/تعديل حقول بسيطة عبر `PUT` (ليس builder كامل) | TODO |
| FF2-07-01 | Toast: إنشاء، حفظ، حذف، نسخ | TODO |
| FF2-07-02 | نسخ رابط النموذج للحافظة | TODO |
| FF2-07-03 | تصدير CSV — زر يستدعي `GET .../export` | TODO |
| FF2-07-04 | `fieldAnalytics` في صفحة التحليلات | TODO |

### خارج نطاق v2 (مستقبل)

- محرّر drag-and-drop كامل
- قوالب `/app/templates`
- تكامل Google Sheets من UI
- i18n ملفات `messages/ar.json` لقسم النماذج

---

## 6) قائمة تحقق QA (بعد FF2-0)

| # | السيناريو | متوقع |
|---|-----------|--------|
| 1 | `/app/forms` مسجل | جدول/قائمة من API أو empty |
| 2 | فلتر «منشور» | نتائج مطابقة |
| 3 | إنشاء نموذج | redirect `[id]` |
| 4 | slug عربي/رموز | رسالة خطأ |
| 5 | نشر → PUBLISHED | Chip يتحدث |
| 6 | معاينة خارجية | **يعمل بعد FF2-04-01** |
| 7 | استجابات + حذف | يختفي من القائمة |
| 8 | تحليلات | 4 بطاقات + أيام |
| 9 | حذف من القائمة | يختفي + dialog |
| 10 | جوال `[id]` | تبويبات في Dock بعد FF2-03-01 |
| 11 | `npm run build` | نجاح |
| 12 | جلسة منتهية | redirect login |

---

## 7) قرارات مطلوبة منك

| # | السؤال | التوصية |
|---|--------|---------|
| 1 | القائمة: نبقى على `forms-list-view` أم نرحّل لـ HeroUI `Table`? | **إبقاء** في v2 (أسرع)، Table في v3 |
| 2 | معاينة عامة: الرابط **`https://rukny.io/f/{slug}`** (تطبيق `apps/app`) — ✅ مُعتمد | بناء الصفحة في `apps/app` وليس `apps/forms` |
| 3 | هل نستخرج `hooks` الآن أم بعد QA? | **بعد** FF2-1 |
| 4 | محرّر حقول في v2: بسيط (إضافة حقل نصي) أم نؤجّل? | **تأجيل** ما لم يكن P0 للمنتج |

---

## 8) ترتيب التنفيذ الموصى به

```
FF2-00 (build + env) → FF2-01 (QA + رسائل + dock) → FF2-04-01 (معاينة)
     → FF2-07 (toast + polish) → FF2-02 (hooks/table) → FF2-04-03 (حقول)
```

**تقدير المتبقي:** ~4–8 أيام عمل (حسب قرار Table و `/f/` والمحرّر).

---

## 9) خريطة: القديم → الواقع

| مهمة قديمة `FF-*` | الحالة الفعلية |
|-------------------|----------------|
| FF-00-01..03 | ✅ منجز (عدا .env) |
| FF-01-* | ✅ منجز (بدون Table/hooks) |
| FF-02-* | ✅ منجز (عدا PlanGuard) |
| FF-03-01,02 | ✅ منجز |
| FF-03-03 header منفصل | ⚠️ مدمج في detail-view |
| FF-03-04 Dock | ❌ |
| FF-04-* | ✅ ~90% (لا slug edit) |
| FF-05-* | ✅ (بدون drawer) |
| FF-06-* | ⚠️ منجز + إصلاح build |
| FF-07-* | ❌ |

---

## 10) سجل التغييرات

| التاريخ | التغيير |
|---------|---------|
| 2026-06-03 | إنشاء v2 بعد تدقيق كامل للملفات + فشل build |
| 2026-06-03 | الخطة القديمة `FORMS_SECTION_IMPLEMENTATION_PLAN.md` → أرشيف؛ التنفيذ من هذا المستند |
