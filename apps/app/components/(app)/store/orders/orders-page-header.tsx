"use client";

/**
 * 📋 Orders Page Header
 * رأس صفحة الطلبات مع عنوان وأزرار الإجراءات
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Download,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { StoreOrder } from "@/lib/api/orders";
import { exportOrdersCSV } from "./order-export";

interface OrdersPageHeaderProps {
  totalOrders: number;
  orders: StoreOrder[];
}

export function OrdersPageHeader({ totalOrders, orders }: OrdersPageHeaderProps) {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleExportCSV = () => {
    if (orders.length === 0) return;
    setIsExporting(true);
    try {
      exportOrdersCSV(orders);
    } finally {
      setTimeout(() => setIsExporting(false), 1200);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex items-center justify-between gap-3"
    >
      {/* Title + Count */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-black dark:text-white" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-[var(--foreground)] leading-none">
            الطلبات
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            {totalOrders > 0 ? `${totalOrders} طلب إجمالي` : "لا توجد طلبات بعد"}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Refresh */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={cn(
            "w-9 h-9 rounded-4xl flex items-center justify-center transition-all duration-200",
            "bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-secondary)]",
            isRefreshing && "opacity-60 pointer-events-none"
          )}
          title="تحديث"
        >
          <RefreshCw className={cn("w-4 h-4 text-[var(--muted)]", isRefreshing && "animate-spin")} />
        </button>

        {/* Export CSV */}
        <button
          onClick={handleExportCSV}
          disabled={isExporting || orders.length === 0}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-2 rounded-4xl text-xs font-medium transition-all duration-200",
            "bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-secondary)]",
            (isExporting || orders.length === 0) && "opacity-50 pointer-events-none"
          )}
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isExporting ? "جاري التصدير..." : "تصدير CSV"}</span>
        </button>
      </div>
    </motion.div>
  );
}
