import Link from 'next/link';
import { FileText, ReceiptText, ShoppingBag } from 'lucide-react';

export default function InvoicesPage() {
  return (
    <div className="dashboard-page dashboard-section-stack">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">الفواتير</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">أنشئ فواتير طلباتك وحمّلها أو شاركها مع العملاء.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="dashboard-panel"><ReceiptText className="size-5 text-[var(--foreground)]" /><p className="mt-4 text-lg font-semibold">فواتير الطلبات</p><p className="mt-1 text-sm text-[var(--muted-foreground)]">تُنشأ الفاتورة تلقائياً مع كل طلب مكتمل.</p></div>
        <div className="dashboard-panel"><FileText className="size-5 text-[var(--foreground)]" /><p className="mt-4 text-lg font-semibold">تنسيق عربي</p><p className="mt-1 text-sm text-[var(--muted-foreground)]">بيانات العميل والمبلغ والضريبة باتجاه RTL.</p></div>
        <div className="dashboard-panel"><ShoppingBag className="size-5 text-[var(--foreground)]" /><p className="mt-4 text-lg font-semibold">ابدأ من الطلبات</p><p className="mt-1 text-sm text-[var(--muted-foreground)]">افتح طلباً لإصدار فاتورته أو تنزيلها.</p><Link href="/app/orders" className="mt-4 inline-flex text-sm font-medium underline underline-offset-4">عرض الطلبات</Link></div>
      </div>
    </div>
  );
}
