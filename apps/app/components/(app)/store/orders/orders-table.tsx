"use client";

/**
 * 📋 Orders Table
 * جدول الطلبات الرئيسي — تصميم محسّن مع صور العملاء
 */

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatIQD } from "@/lib/currency";
import type { StoreOrder } from "@/lib/api/orders";
import { OrderStatusChip } from "./order-status-chip";
import {
  getInitials,
  getAvatarColor,
  formatTimeAgo,
  formatDate,
} from "./order-helpers";

/* ── Customer Avatar Component ── */

function CustomerAvatar({
  name,
  avatar,
  size = "md",
}: {
  name: string;
  avatar?: string;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "sm" ? "w-8 h-8" : "w-9 h-9";
  const textClass = size === "sm" ? "text-[10px]" : "text-[11px]";

  if (avatar) {
    return (
      <div
        className={cn(
          sizeClass,
          "rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-[var(--border)]"
        )}
      >
        <img
          src={avatar}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = "none";
            target.parentElement!.classList.add(
              "flex",
              "items-center",
              "justify-center",
              ...getAvatarColor(name).split(" ")
            );
            target.parentElement!.innerHTML = `<span class="${textClass} font-bold">${getInitials(name)}</span>`;
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        sizeClass,
        "rounded-xl flex items-center justify-center flex-shrink-0",
        getAvatarColor(name)
      )}
    >
      <span className={cn(textClass, "font-bold")}>{getInitials(name)}</span>
    </div>
  );
}

/* ── Props ── */

interface OrdersTableProps {
  orders: StoreOrder[];
  total: number;
  page: number;
  limit: number;
}

/* ── Component ── */

export function OrdersTable({ orders, total, page, limit }: OrdersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.ceil(total / limit);

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const goToOrder = (orderId: string) => {
    router.push(`/app/orders/${orderId}`);
  };

  /* ── Empty State ── */
  if (orders.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-8 sm:p-12"
      >
        <div className="flex flex-col items-center justify-center gap-4 py-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--surface-secondary)] to-[var(--border)]/50 flex items-center justify-center">
            <ShoppingBag className="w-7 h-7 text-[var(--muted)]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-[var(--foreground)]">لا توجد طلبات</p>
            <p className="text-xs text-[var(--muted)] mt-1.5 max-w-[240px] mx-auto leading-relaxed">
              لم يتم العثور على طلبات تطابق معايير البحث الحالية
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "rounded-3xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden",
        isPending && "opacity-60 pointer-events-none"
      )}
    >
      {/* ── Desktop Table ── */}
      <div className="hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-right text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider px-4 py-3">
                  العميل
                </th>
                <th className="text-right text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider px-4 py-3">
                  رقم الطلب
                </th>
                <th className="text-right text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider px-4 py-3">
                  المنتجات
                </th>
                <th className="text-right text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider px-4 py-3">
                  المجموع
                </th>
                <th className="text-right text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider px-4 py-3">
                  الحالة
                </th>
                <th className="text-right text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider px-4 py-3">
                  التاريخ
                </th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]/50">
              {orders.map((order, i) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                  onClick={() => goToOrder(order.id)}
                  className="group cursor-pointer hover:bg-[var(--surface-secondary)]/50 transition-colors duration-150"
                >
                  {/* Customer with Avatar */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CustomerAvatar
                        name={order.customerName}
                        avatar={order.customerAvatar}
                        size="md"
                      />
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[var(--foreground)] truncate max-w-[160px] leading-tight">
                          {order.customerName}
                        </p>
                        {order.customerPhone && (
                          <p className="text-[11px] text-[var(--muted)] mt-0.5 tabular-nums" dir="ltr">
                            {order.customerPhone}
                          </p>
                        )}
                        {!order.customerPhone && order.customerEmail && (
                          <p className="text-[11px] text-[var(--muted)] mt-0.5 truncate max-w-[140px]" dir="ltr">
                            {order.customerEmail}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Order Number */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Hash className="w-3 h-3 text-[var(--muted)]" />
                      <span className="text-[13px] font-bold text-[var(--foreground)] tabular-nums">
                        {order.orderNumber.slice(0, 12)}
                      </span>
                    </div>
                  </td>

                  {/* Items count */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-[var(--muted)] tabular-nums">
                        {order.items.length} {order.items.length === 1 ? "منتج" : "منتجات"}
                      </span>
                    </div>
                  </td>

                  {/* Total */}
                  <td className="px-4 py-3">
                    <span className="text-[13px] font-bold text-[var(--foreground)] tabular-nums">
                      {formatIQD(order.total)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <OrderStatusChip status={order.status} size="sm" />
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-xs text-[var(--foreground)]">{formatTimeAgo(order.createdAt)}</p>
                      <p className="text-[10px] text-[var(--muted)] mt-0.5">{formatDate(order.createdAt)}</p>
                    </div>
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:bg-[var(--surface-secondary)]">
                      <Eye className="w-3.5 h-3.5 text-[var(--muted)]" />
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile Cards ── */}
      <div className="sm:hidden divide-y divide-[var(--border)]/50">
        {orders.map((order, i) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            onClick={() => goToOrder(order.id)}
            className="flex items-center justify-between gap-3 px-4 py-3.5 cursor-pointer active:bg-[var(--surface-secondary)]/50 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <CustomerAvatar
                name={order.customerName}
                avatar={order.customerAvatar}
                size="md"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-[var(--foreground)] truncate max-w-[120px]">
                    {order.customerName}
                  </span>
                  <OrderStatusChip status={order.status} showIcon={false} size="sm" />
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Hash className="w-2.5 h-2.5 text-[var(--muted)]" />
                  <span className="text-[11px] text-[var(--muted)] tabular-nums">
                    {order.orderNumber.slice(0, 10)}
                  </span>
                  <span className="text-[var(--muted)] text-[10px]">·</span>
                  <span className="text-[11px] text-[var(--muted)]">
                    {order.items.length} {order.items.length === 1 ? "منتج" : "منتجات"}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-left flex-shrink-0">
              <p className="text-[13px] font-bold text-[var(--foreground)] tabular-nums leading-none">
                {formatIQD(order.total)}
              </p>
              <p className="text-[11px] text-[var(--muted)] mt-1 text-left">
                {formatTimeAgo(order.createdAt)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Pagination Footer ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--muted)]">
            عرض {((page - 1) * limit) + 1}-{Math.min(page * limit, total)} من {total}
          </p>

          <div className="flex items-center gap-1">
            {/* Previous */}
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                page <= 1
                  ? "text-[var(--muted)]/40 cursor-not-allowed"
                  : "text-[var(--muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Page Numbers */}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={cn(
                    "w-8 h-8 rounded-lg text-xs font-medium transition-colors tabular-nums",
                    page === pageNum
                      ? "bg-brand-black-300 dark:bg-brand-purple-200 text-brand-white dark:text-brand-black-300"
                      : "text-[var(--muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Next */}
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                page >= totalPages
                  ? "text-[var(--muted)]/40 cursor-not-allowed"
                  : "text-[var(--muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ── Skeleton ── */

export function OrdersTableSkeleton() {
  return (
    <div className="rounded-3xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
      {/* Desktop skeleton */}
      <div className="hidden sm:block">
        <div className="border-b border-[var(--border)] px-4 py-3 flex gap-4">
          {[100, 80, 60, 80, 70, 60].map((w, i) => (
            <div key={i} className="h-3 rounded bg-[var(--surface-secondary)] animate-pulse" style={{ width: w }} />
          ))}
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-[var(--border)]/50">
            <div className="w-9 h-9 rounded-xl bg-[var(--surface-secondary)] animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-24 rounded bg-[var(--surface-secondary)] animate-pulse" />
              <div className="h-2.5 w-16 rounded bg-[var(--surface-secondary)] animate-pulse" />
            </div>
            <div className="h-3 w-20 rounded bg-[var(--surface-secondary)] animate-pulse" />
            <div className="h-3 w-12 rounded bg-[var(--surface-secondary)] animate-pulse" />
            <div className="h-4 w-20 rounded bg-[var(--surface-secondary)] animate-pulse" />
            <div className="h-5 w-16 rounded-full bg-[var(--surface-secondary)] animate-pulse" />
            <div className="h-3 w-14 rounded bg-[var(--surface-secondary)] animate-pulse" />
          </div>
        ))}
      </div>

      {/* Mobile skeleton */}
      <div className="sm:hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-[var(--border)]/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--surface-secondary)] animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-28 rounded bg-[var(--surface-secondary)] animate-pulse" />
                <div className="h-3 w-20 rounded bg-[var(--surface-secondary)] animate-pulse" />
              </div>
            </div>
            <div className="space-y-1.5 text-right">
              <div className="h-3.5 w-20 rounded bg-[var(--surface-secondary)] animate-pulse" />
              <div className="h-3 w-12 rounded bg-[var(--surface-secondary)] animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
