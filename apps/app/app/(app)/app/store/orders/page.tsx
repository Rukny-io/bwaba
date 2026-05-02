import { Suspense } from "react";
import {
  ShoppingCart,
  Clock,
  CheckCircle2,
  DollarSign,
} from "lucide-react";
import { getStoreOrders, getOrdersStats } from "@/lib/api/orders";
import { StatsCard } from "@/components/(app)/dashboard/stats-card";
import { OrderFilters } from "@/components/(app)/store/orders/order-filters";
import { OrdersTable, OrdersTableSkeleton } from "@/components/(app)/store/orders/orders-table";
import { OrdersPageHeader } from "@/components/(app)/store/orders/orders-page-header";
import { formatIQD } from "@/lib/currency";

export const metadata = {
  title: "الطلبات | متجري | ركني",
};

interface OrdersPageProps {
  searchParams: Promise<{
    status?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams;
  const status = params.status || "ALL";
  const search = params.search || "";
  const page = parseInt(params.page || "1", 10);
  const limit = 10;

  const [ordersRes, stats] = await Promise.all([
    getStoreOrders({ page, limit, status, search }),
    getOrdersStats(),
  ]);

  /* ── Stats Cards Row ── */
  const statsRow = [
    {
      title: "إجمالي الطلبات",
      value: (stats.total ?? 0).toLocaleString("en"),
      change: `${stats.total ?? 0}`,
      trend: "up" as const,
      highlight: true,
      icon: ShoppingCart,
      subtitle: "جميع الطلبات",
    },
    {
      title: "طلبات معلقة",
      value: (stats.pending ?? 0).toLocaleString("en"),
      change: (stats.pending ?? 0) > 0 ? `${stats.pending}` : "+0",
      trend: (stats.pending ?? 0) > 0 ? ("down" as const) : ("up" as const),
      icon: Clock,
      subtitle: "بانتظار الإجراء",
    },
    {
      title: "طلبات مكتملة",
      value: ((stats.completed ?? 0) + (stats.delivered ?? 0)).toLocaleString("en"),
      change: `${(stats.completed ?? 0) + (stats.delivered ?? 0)}`,
      trend: "up" as const,
      icon: CheckCircle2,
      subtitle: "تم تسليمها بنجاح",
    },
    {
      title: "إيرادات الطلبات",
      value: formatIQD(stats.totalRevenue ?? 0),
      change: stats.total > 0 ? `${stats.total} طلب` : "+0",
      trend: "up" as const,
      icon: DollarSign,
      subtitle: "إجمالي الإيرادات",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-3 sm:space-y-4 mt-2 sm:mt-6">
      {/* ── Page Header with actions ── */}
      <OrdersPageHeader
        totalOrders={stats.total}
        orders={ordersRes.orders}
      />

      {/* ── بطاقات الإحصائيات السريعة ── */}
      <div className="grid gap-2 sm:gap-3 grid-cols-2 lg:grid-cols-4">
        {statsRow.map((s) => (
          <StatsCard key={s.title} {...s} />
        ))}
      </div>

      {/* ── الفلاتر والبحث ── */}
      <Suspense>
        <OrderFilters
          stats={stats}
          activeStatus={status}
          searchQuery={search}
        />
      </Suspense>

      {/* ── جدول الطلبات ── */}
      <Suspense fallback={<OrdersTableSkeleton />}>
        <OrdersTable
          orders={ordersRes.orders}
          total={ordersRes.total}
          page={page}
          limit={limit}
        />
      </Suspense>
    </div>
  );
}
