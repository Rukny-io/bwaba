/**
 * 📦 Recent Orders Component
 * قائمة آخر الطلبات — تصميم متناسق ونظيف
 */

import {
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Loader2,
  ReceiptText,
  ArrowUpLeft,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface OrderItem {
  productName: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

interface RecentOrdersProps {
  orders: Order[];
  formatCurrency: (amount: number) => string;
}

/* ------------------------------------------------------------------ */
/*  Status config                                                      */
/* ------------------------------------------------------------------ */

const statusConfig: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  PENDING: { label: "معلق", icon: Clock, color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-950/30" },
  CONFIRMED: { label: "مؤكد", icon: CheckCircle2, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30" },
  PROCESSING: { label: "قيد التجهيز", icon: Loader2, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/30" },
  SHIPPED: { label: "تم الشحن", icon: Truck, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
  DELIVERED: { label: "تم التسليم", icon: CheckCircle2, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/30" },
  COMPLETED: { label: "مكتمل", icon: CheckCircle2, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/30" },
  CANCELLED: { label: "ملغي", icon: XCircle, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30" },
};

function getStatus(status: string) {
  return statusConfig[status.toUpperCase()] ?? statusConfig.PENDING;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} د`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} س`;
  return `منذ ${Math.floor(hours / 24)} ي`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function RecentOrders({ orders, formatCurrency }: RecentOrdersProps) {
  return (
    <div className="rounded-4xl bg-[var(--surface)] border border-[var(--border)] p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--surface-secondary)] flex items-center justify-center">
            <ReceiptText className="w-4 h-4 text-[var(--muted)]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)] leading-none">آخر الطلبات</h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">{orders.length} طلب</p>
          </div>
        </div>
        <Link
          href="/app/orders"
          className="flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <span>عرض الكل</span>
          <ArrowUpLeft className="w-3 h-3" />
        </Link>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2">
          <div className="w-12 h-12 rounded-4xl bg-[var(--surface-secondary)] flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-[var(--muted)]" />
          </div>
          <p className="text-sm text-[var(--muted)]">لا توجد طلبات حتى الآن</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order, i) => {
            const s = getStatus(order.status);
            const StatusIcon = s.icon;
            const isFirst = i === 0;
            return (
              <div
                key={order.id}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors",
                  isFirst
                    ? "bg-[var(--primary)]/8 border border-[var(--primary)]/15"
                    : "bg-[var(--surface-secondary)]"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Status avatar */}
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", s.bg)}>
                    <StatusIcon className={cn("w-4 h-4", s.color)} />
                  </div>
                  {/* Info */}
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[var(--foreground)] truncate leading-none">
                      #{order.orderNumber.slice(0, 8)}
                    </p>
                    <p className="text-xs text-[var(--muted)] truncate mt-0.5">
                      {order.customerName}
                    </p>
                  </div>
                </div>

                {/* Right */}
                <div className="text-left flex-shrink-0">
                  <p className="text-[13px] font-bold text-[var(--foreground)] tabular-nums leading-none">
                    {formatCurrency(order.total)}
                  </p>
                  <p className="text-[11px] text-[var(--muted)] mt-0.5 text-left">
                    {formatTimeAgo(order.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function RecentOrdersSkeleton() {
  return (
    <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--surface-secondary)] animate-pulse" />
          <div className="space-y-1">
            <div className="h-3.5 w-24 rounded bg-[var(--surface-secondary)] animate-pulse" />
            <div className="h-3 w-12 rounded bg-[var(--surface-secondary)] animate-pulse" />
          </div>
        </div>
        <div className="h-3 w-16 rounded bg-[var(--surface-secondary)] animate-pulse" />
      </div>
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 bg-[var(--surface-secondary)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--border)] animate-pulse flex-shrink-0" />
              <div className="space-y-1">
                <div className="h-3.5 w-20 rounded bg-[var(--border)] animate-pulse" />
                <div className="h-3 w-16 rounded bg-[var(--border)] animate-pulse" />
              </div>
            </div>
            <div className="space-y-1 text-right">
              <div className="h-3.5 w-20 rounded bg-[var(--border)] animate-pulse" />
              <div className="h-3 w-12 rounded bg-[var(--border)] animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
