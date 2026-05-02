"use client";

/**
 * 🏆 Top Products Component
 * أفضل المنتجات مبيعاً مع bar نسبي
 */

import { motion } from "framer-motion";
import { Package, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatIQD } from "@/lib/currency";

export interface TopProduct {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  image?: string;
}

interface TopProductsProps {
  products: TopProduct[];
}

export function TopProducts({ products }: TopProductsProps) {
  const maxSales = Math.max(...products.map((p) => p.sales), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="min-w-0 rounded-4xl bg-card border border-border/60 p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground">أفضل المنتجات</h3>
        <TrendingUp className="w-4 h-4 text-brand-purple-300 dark:text-brand-purple-200" />
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
          <Package className="w-8 h-8 opacity-30" />
          <p className="text-xs">لا توجد بيانات بعد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product, i) => {
            const barWidth = Math.max((product.sales / maxSales) * 100, 4);
            return (
              <div key={product.id} className="flex items-center gap-3">
                {/* Rank */}
                <span className={cn(
                  "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                  i === 0 ? "bg-brand-purple-300/20 text-brand-purple-300 dark:bg-brand-purple-200/20 dark:text-brand-purple-200"
                    : "bg-muted/50 text-muted-foreground"
                )}>
                  {i + 1}
                </span>

                {/* Image */}
                <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-brand-purple-100 dark:bg-brand-black-200 overflow-hidden">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-3.5 h-3.5 text-brand-purple-300/50 dark:text-brand-purple-200/50" />
                    </div>
                  )}
                </div>

                {/* Name + Bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground truncate max-w-[130px]">
                      {product.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground tabular-nums flex-shrink-0 ms-2">
                      {product.sales.toLocaleString("en")} مبيعة
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-brand-purple-100/60 dark:bg-brand-black-200 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
                      className={cn(
                        "h-full rounded-full",
                        i === 0
                          ? "bg-brand-purple-300 dark:bg-brand-purple-200"
                          : "bg-brand-grey-200/60 dark:bg-brand-grey-300/60"
                      )}
                    />
                  </div>
                </div>

                {/* Revenue */}
                <span className="flex-shrink-0 text-[10px] font-semibold text-brand-purple-300 dark:text-brand-purple-200 tabular-nums">
                  {formatIQD(product.revenue)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export function TopProductsSkeleton() {
  return (
    <div className="rounded-2xl bg-card border border-border/60 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-28 rounded-lg bg-muted animate-pulse" />
        <div className="h-4 w-4 rounded bg-muted animate-pulse" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-muted animate-pulse flex-shrink-0" />
            <div className="w-7 h-7 rounded-lg bg-muted animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 rounded bg-muted animate-pulse" style={{ width: `${70 - i * 8}%` }} />
              <div className="h-1.5 rounded-full bg-muted animate-pulse" style={{ width: `${80 - i * 12}%` }} />
            </div>
            <div className="h-3 w-14 rounded bg-muted animate-pulse flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
