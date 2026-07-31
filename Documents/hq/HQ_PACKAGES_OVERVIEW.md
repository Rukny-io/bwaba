# HQ Packages Overview

> **المسار:** `apps/hq/packages`  
> **الإصدار:** HeroUI 3.1.0  
> **مرجع مماثل:** [FORMS_PACKAGES_OVERVIEW.md](../Forms/FORMS_PACKAGES_OVERVIEW.md)

---

## 1) ما هي `apps/hq/packages`؟

مساحة عمل monorepo-style تحتوي على نظام UI المستخدم لبناء لوحة HQ.

| الحزمة | الاسم | الدور |
|--------|-------|-------|
| `react` | `@heroui/react` | مكونات React |
| `styles` | `@heroui/styles` | CSS / themes / tokens |
| `storybook` | `@heroui/storybook` | playground بصري |
| `standard` | `@heroui/standard` | ESLint / Prettier / TS configs |
| `vitest` | `@heroui/vitest` | إعدادات اختبار مشتركة |

### الطبقات

```
styles  →  react  →  apps/hq (Next.js)
              ↓
          storybook (توثيق بصري)
```

---

## 2) الحالة الحالية

| العنصر | الحالة |
|--------|--------|
| ملفات الحزم | 🟢 موجودة ومكتملة |
| `apps/hq/package.json` | 🔴 لا يعتمد على `@heroui/*` |
| `globals.css` | 🔴 لا يستورد `@heroui/styles/css` |
| workspace root | 🔴 لا يوجد `package.json` في `packages/` |
| Storybook | 🟡 جاهز — يحتاج `npm install` داخل الحزم |

**الخلاصة:** المكونات **جاهزة للاستخدام** لكن **غير مربوطة** بتطبيق HQ بعد.

---

## 3) المكونات المتاحة (~70+)

### أساسية للوحة الإدارة

| المكون | الاستخدام في HQ |
|--------|-----------------|
| `Table` | جداول Users, Orders, Products |
| `Card` | بطاقات Dashboard stats |
| `Button` / `ButtonGroup` | إجراءات |
| `Modal` / `AlertDialog` | تأكيد حذف / رفض |
| `Drawer` | تفاصيل مستخدم / طلب |
| `Tabs` | تبويبات Verification |
| `Badge` / `Chip` | حالات (pending, active) |
| `Avatar` | صور المستخدمين |
| `Pagination` | قوائم paginated |
| `SearchField` | بحث |
| `Select` / `ComboBox` | فلاتر |
| `DatePicker` / `DateRangePicker` | فلاتر تاريخ |
| `Toast` | إشعارات نجاح/خطأ |
| `Spinner` / `Skeleton` | حالات تحميل |
| `EmptyState` | قوائم فارغة |
| `Breadcrumbs` | مسار التنقل |
| `Header` | عناوين الأقسام |
| `Dropdown` / `Menu` | إجراءات صف |
| `Switch` | تفعيل/تعطيل |
| `ProgressBar` / `Meter` | صحة النظام |
| `Tooltip` | تلميحات |

### للتحقق والرفع

| المكون | الاستخدام |
|--------|-----------|
| `Textarea` | سبب الرفض |
| `Input` / `TextField` | نماذج |
| `Form` | نماذج CRUD |
| `File upload UI` | Wallpapers (custom على Input) |

---

## 4) ربط الحزم بـ HQ — خطوات التنفيذ

### 4.1 تحديث `apps/hq/package.json`

```json
{
  "dependencies": {
    "@heroui/react": "file:./packages/react",
    "@heroui/styles": "file:./packages/styles",
    "clsx": "^2.1.1",
    "lucide-react": "^1.17.0",
    "next-themes": "^0.4.6",
    "react-aria-components": "^1.5.0",
    "tailwind-merge": "^3.6.0"
  }
}
```

> **بديل:** npm workspaces إذا أُضيف `package.json` في `packages/` مع `"workspaces": ["react", "styles", ...]`

### 4.2 تحديث `globals.css`

```css
@import "tailwindcss";
@import "@heroui/styles/css";
@custom-variant dark (&:is(.dark *));
@source "./**/*.{js,ts,jsx,tsx}";
@source "../packages/react/src/**/*.{js,ts,jsx,tsx}";

/* HQ admin theme tokens */
:root, .light { ... }
.dark { ... }
```

### 4.3 تحديث `next.config.ts`

```typescript
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@heroui/react", "@heroui/styles"],
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${API_BACKEND_URL}/api/v1/:path*`,
      },
    ];
  },
};
```

### 4.4 Providers

```tsx
// app/providers.tsx
"use client";
import { ThemeProvider } from "next-themes";

export function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
    </ThemeProvider>
  );
}
```

---

## 5) Storybook — للتطوير البصري

```bash
cd apps/hq/packages/storybook
npm install
npm run dev
```

**الفائدة:** معاينة المكونات قبل دمجها في شاشات HQ — خاصة Table, Modal, Toast.

---

## 6) مكونات HQ المخصصة (للبناء)

يُنصح بإنشاء `apps/hq/components/` (خارج packages):

```
components/
├── layout/
│   ├── hq-shell.tsx          # Sidebar + Header + main
│   ├── hq-sidebar.tsx        # قائمة الأقسام
│   └── hq-header.tsx         # بحث + مستخدم + ثيم
├── shared/
│   ├── data-table.tsx        # Table + pagination + filters
│   ├── stat-card.tsx         # بطاقة إحصائية
│   ├── status-badge.tsx      # شارات الحالة
│   ├── confirm-dialog.tsx    # AlertDialog wrapper
│   ├── page-header.tsx       # عنوان + breadcrumbs + actions
│   └── empty-list.tsx        # EmptyState wrapper
├── users/
├── verification/
├── stores/
└── ...
```

**لماذا خارج packages؟**
- `packages/` = مكتبة UI عامة (HeroUI)
- `components/` = مكونات خاصة بـ HQ business logic

---

## 7) مقارنة مع Forms

| العنصر | Forms | HQ |
|--------|-------|-----|
| HeroUI version | 3.0.x | 3.1.0 |
| موقع packages | `apps/forms/packages` + نسخة في `app/components` | `apps/hq/packages` فقط |
| shared package | `@rukny/forms-shared` | لا يوجد بعد — يُقترح `@rukny/hq-shared` أو `@rukny/admin-shared` |
| المنفذ | 3007 | 3002 |
| الثيم | فاتح (brand blue) | داكن افتراضي (مقترح) |

---

## 8) أوامر مفيدة

```bash
# بناء مكتبة React
cd apps/hq/packages/react && npm run build

# بناء الأنماط
cd apps/hq/packages/styles && npm run build

# تشغيل HQ
cd apps/hq && npm run dev -p 3002

# Storybook
cd apps/hq/packages/storybook && npm run dev
```

---

## 9) Checklist الجاهزية

- [ ] إضافة dependencies في `apps/hq/package.json`
- [ ] `npm install` في `apps/hq`
- [ ] تحديث `globals.css` بـ HeroUI imports
- [ ] `transpilePackages` في `next.config.ts`
- [ ] `providers.tsx` + ThemeProvider
- [ ] اختبار استيراد: `import { Button, Card, Table } from "@heroui/react"`
- [ ] تشغيل Storybook للتحقق البصري
