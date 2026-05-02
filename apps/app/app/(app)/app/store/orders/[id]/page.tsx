import { getOrderDetails } from "@/lib/api/orders";
import { OrderDetailsCard } from "@/components/(app)/store/orders/order-details-card";
import { OrderTimeline } from "@/components/(app)/store/orders/order-timeline";
import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";

export const metadata = {
  title: "تفاصيل الطلب | متجري | ركني",
};

interface OrderDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { id } = await params;
  const order = await getOrderDetails(id);

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto mt-8 sm:mt-12 pb-6">
        <div className="rounded-4xl bg-[var(--surface)] border border-[var(--border)] p-8 sm:p-12">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--surface-secondary)] to-[var(--border)]/50 flex items-center justify-center">
              <ShoppingBag className="w-7 h-7 text-[var(--muted)]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">لم يتم العثور على الطلب</p>
              <p className="text-xs text-[var(--muted)] mt-1.5 max-w-[280px] mx-auto leading-relaxed">
                الطلب المطلوب غير موجود أو ليس لديك صلاحية الوصول إليه
              </p>
            </div>
            <Link
              href="/app/store/orders"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--surface-secondary)] text-sm font-medium text-[var(--foreground)] hover:bg-[var(--border)] transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              العودة للطلبات
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 mt-2 sm:mt-6 pb-6">
      {/* ── Layout: Details + Timeline ── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        {/* Main Details */}
        <OrderDetailsCard order={order} />

        {/* Timeline Sidebar */}
        <div className="order-first lg:order-last">
          <OrderTimeline
            currentStatus={order.status}
            createdAt={order.createdAt}
            updatedAt={order.updatedAt}
          />
        </div>
      </div>
    </div>
  );
}
