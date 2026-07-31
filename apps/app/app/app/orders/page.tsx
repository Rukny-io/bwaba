import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function OrdersPage() {
  return (
    <div className="dashboard-page dashboard-section-stack">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
          الطلبات
        </h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          متابعة ومعالجة طلبات عملائك — قريباً في المرحلة التالية.
        </p>
      </div>

      <div className="dashboard-panel border-dashed py-12 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
          <ShoppingBag className="size-5" />
        </div>
        <p className="text-sm text-[var(--muted-foreground)]">
          ستتمكن قريباً من عرض وتحديث حالة الطلبات من هنا.
        </p>
        <Link
          href="/app"
          className="mt-4 inline-flex text-sm font-medium text-[var(--primary)] hover:underline"
        >
          العودة للوحة التحكم
        </Link>
      </div>
    </div>
  );
}
