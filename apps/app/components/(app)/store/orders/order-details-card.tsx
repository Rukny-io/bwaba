"use client";

/**
 * 📄 Order Details Card
 * بطاقة تفاصيل الطلب الكاملة مع معلومات العميل والمنتجات وأزرار الإجراءات
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  MapPin,
  Package,
  Receipt,
  FileText,
  ArrowRight,
  Mail,
  Truck,
  BadgePercent,
  Calendar,
  Clock,
  Download,
  Printer,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatIQD } from "@/lib/currency";
import type { StoreOrder } from "@/lib/api/orders";
import { OrderStatusChip } from "./order-status-chip";
import { getInitials, getAvatarColor } from "./order-helpers";
import { generateInvoicePDF, printOrder, shareOrderWhatsApp } from "./order-export";

/* ── Props ── */

interface OrderDetailsCardProps {
  order: StoreOrder;
}

/* ── Component ── */

export function OrderDetailsCard({ order }: OrderDetailsCardProps) {
  const [isExporting, setIsExporting] = useState(false);
  const hasAddress = order.shippingAddress &&
    (order.shippingAddress.city || order.shippingAddress.area || order.shippingAddress.address);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      generateInvoicePDF(order);
    } finally {
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

  const handlePrint = () => {
    printOrder(order);
  };

  const handleWhatsApp = () => {
    shareOrderWhatsApp(order);
  };

  return (
    <div className="space-y-4">
      {/* ── Header Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="rounded-4xl bg-[var(--surface)] border border-[var(--border)] p-4 sm:p-5"
      >
        {/* Back + Title */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/app/orders"
              className="w-8 h-8 rounded-xl bg-[var(--surface-secondary)] flex items-center justify-center hover:bg-[var(--border)] transition-colors"
            >
              <ArrowRight className="w-4 h-4 text-[var(--muted)]" />
            </Link>
            <div>
              <h2 className="text-sm font-bold text-[var(--foreground)] leading-none tabular-nums">
                طلب #{order.orderNumber.slice(0, 12)}
              </h2>
              <div className="flex items-center gap-1.5 mt-1">
                <Calendar className="w-3 h-3 text-[var(--muted)]" />
                <p className="text-xs text-[var(--muted)]">
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
          <OrderStatusChip status={order.status} size="md" />
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200",
              "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-300 dark:hover:bg-indigo-950/50",
              isExporting && "opacity-60 pointer-events-none"
            )}
          >
            <Download className="w-3.5 h-3.5" />
            {isExporting ? "جاري التصدير..." : "تصدير فاتورة"}
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[var(--surface-secondary)] text-[var(--foreground)] hover:bg-[var(--border)] transition-all duration-200"
          >
            <Printer className="w-3.5 h-3.5" />
            طباعة
          </button>
        </div>

        {/* ── Customer Info ── */}
        <div className="rounded-4xl bg-[var(--surface-secondary)] p-3.5 space-y-2.5">
          {/* Customer name & avatar */}
          <div className="flex items-center gap-2.5">
            {order.customerAvatar ? (
              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-[var(--border)]">
                <img
                  src={order.customerAvatar}
                  alt={order.customerName}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div
                className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0",
                  getAvatarColor(order.customerName)
                )}
              >
                <span className="text-xs font-bold">{getInitials(order.customerName)}</span>
              </div>
            )}
            <div>
              <p className="text-[13px] font-semibold text-[var(--foreground)] leading-tight">
                {order.customerName}
              </p>
              <p className="text-[11px] text-[var(--muted)] mt-0.5">العميل</p>
            </div>
          </div>

          {/* Phone */}
          {order.customerPhone && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--surface)] flex items-center justify-center">
                <Phone className="w-4 h-4 text-[var(--muted)]" />
              </div>
              <a
                href={`tel:${order.customerPhone}`}
                className="text-[13px] text-[var(--foreground)] tabular-nums hover:text-[var(--primary)] transition-colors"
                dir="ltr"
              >
                {order.customerPhone}
              </a>
            </div>
          )}

          {/* Email */}
          {order.customerEmail && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--surface)] flex items-center justify-center">
                <Mail className="w-4 h-4 text-[var(--muted)]" />
              </div>
              <a
                href={`mailto:${order.customerEmail}`}
                className="text-[13px] text-[var(--foreground)] hover:text-[var(--primary)] transition-colors truncate"
                dir="ltr"
              >
                {order.customerEmail}
              </a>
            </div>
          )}

          {/* Address */}
          {hasAddress && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--surface)] flex items-center justify-center">
                <MapPin className="w-4 h-4 text-[var(--muted)]" />
              </div>
              <p className="text-[13px] text-[var(--foreground)]">
                {[order.shippingAddress!.city, order.shippingAddress!.area, order.shippingAddress!.address]
                  .filter(Boolean)
                  .join("، ")}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Products Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="rounded-4xl bg-[var(--surface)] border border-[var(--border)] p-4 sm:p-5"
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-[var(--surface-secondary)] flex items-center justify-center">
            <Package className="w-4 h-4 text-[var(--muted)]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)] leading-none">المنتجات</h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              {order.items.length} {order.items.length === 1 ? "منتج" : "منتجات"}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {order.items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.15 + i * 0.05 }}
              className="flex items-center gap-3 rounded-3xl bg-[var(--surface-secondary)] p-2.5"
            >
              {/* Product Image */}
              <div className="w-11 h-11 rounded-2xl bg-[var(--surface)] overflow-hidden flex-shrink-0 ring-1 ring-[var(--border)]">
                {item.productImage ? (
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-4 h-4 text-[var(--muted)]/50" />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[var(--foreground)] truncate leading-tight">
                  {item.productName}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[11px] text-[var(--muted)] tabular-nums">
                    {formatIQD(item.price)}
                  </span>
                  <span className="text-[var(--muted)] text-[10px]">×</span>
                  <span className="text-[11px] font-medium text-[var(--foreground)] tabular-nums">
                    {item.quantity}
                  </span>
                </div>
              </div>

              {/* Item Total */}
              <span className="text-[13px] font-bold text-[var(--foreground)] tabular-nums flex-shrink-0">
                {formatIQD(item.total)}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Summary Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="rounded-4xl bg-[var(--surface)] border border-[var(--border)] p-4 sm:p-5"
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-[var(--surface-secondary)] flex items-center justify-center">
            <Receipt className="w-4 h-4 text-[var(--muted)]" />
          </div>
          <h3 className="text-sm font-bold text-[var(--foreground)] leading-none">ملخص الطلب</h3>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--muted)]">المجموع الفرعي</span>
            <span className="text-[13px] text-[var(--foreground)] tabular-nums">
              {formatIQD(order.subtotal)}
            </span>
          </div>

          {order.shippingCost > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Truck className="w-3 h-3 text-[var(--muted)]" />
                <span className="text-xs text-[var(--muted)]">التوصيل</span>
              </div>
              <span className="text-[13px] text-[var(--foreground)] tabular-nums">
                {formatIQD(order.shippingCost)}
              </span>
            </div>
          )}

          {order.shippingCost === 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Truck className="w-3 h-3 text-[var(--muted)]" />
                <span className="text-xs text-[var(--muted)]">التوصيل</span>
              </div>
              <span className="text-[13px] text-emerald-600 dark:text-emerald-400 font-medium">
                مجاني
              </span>
            </div>
          )}

          {order.discount > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <BadgePercent className="w-3 h-3 text-emerald-500" />
                <span className="text-xs text-emerald-600 dark:text-emerald-400">الخصم</span>
              </div>
              <span className="text-[13px] text-emerald-600 dark:text-emerald-400 tabular-nums font-medium">
                -{formatIQD(order.discount)}
              </span>
            </div>
          )}

          <div className="h-px bg-[var(--border)]" />

          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[var(--foreground)]">الإجمالي</span>
            <span className="text-base font-bold text-[var(--foreground)] tabular-nums">
              {formatIQD(order.total)}
            </span>
          </div>
        </div>

        {/* Customer Notes */}
        {order.notes && (
          <div className="mt-4 rounded-xl bg-[var(--surface-secondary)] p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-[var(--muted)]" />
              <span className="text-[11px] font-semibold text-[var(--muted)]">ملاحظات العميل</span>
            </div>
            <p className="text-xs text-[var(--foreground)] leading-relaxed">{order.notes}</p>
          </div>
        )}

        {/* Store Notes */}
        {order.storeNote && (
          <div className="mt-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">ملاحظات المتجر</span>
            </div>
            <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">{order.storeNote}</p>
          </div>
        )}

        {/* Estimated Delivery */}
        {order.estimatedDelivery && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30 p-3">
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-blue-700 dark:text-blue-300">
              التسليم المتوقع: {new Date(order.estimatedDelivery).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ── Skeleton ── */

export function OrderDetailsCardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-4xl bg-[var(--surface)] border border-[var(--border)] p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[var(--surface-secondary)] animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-4 w-32 rounded bg-[var(--surface-secondary)] animate-pulse" />
              <div className="h-3 w-40 rounded bg-[var(--surface-secondary)] animate-pulse" />
            </div>
          </div>
          <div className="h-6 w-20 rounded-full bg-[var(--surface-secondary)] animate-pulse" />
        </div>
        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-24 rounded-xl bg-[var(--surface-secondary)] animate-pulse" />
          ))}
        </div>
        <div className="rounded-2xl bg-[var(--surface-secondary)] p-3.5 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--border)] animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-28 rounded bg-[var(--border)] animate-pulse" />
              <div className="h-2.5 w-14 rounded bg-[var(--border)] animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-4xl bg-[var(--surface)] border border-[var(--border)] p-4 sm:p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-[var(--surface-secondary)] animate-pulse" />
          <div className="h-4 w-20 rounded bg-[var(--surface-secondary)] animate-pulse" />
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl bg-[var(--surface-secondary)] p-2.5 mb-2">
            <div className="w-11 h-11 rounded-lg bg-[var(--border)] animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-24 rounded bg-[var(--border)] animate-pulse" />
              <div className="h-2.5 w-16 rounded bg-[var(--border)] animate-pulse" />
            </div>
            <div className="h-4 w-20 rounded bg-[var(--border)] animate-pulse" />
          </div>
        ))}
      </div>

      <div className="rounded-4xl bg-[var(--surface)] border border-[var(--border)] p-4 sm:p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-[var(--surface-secondary)] animate-pulse" />
          <div className="h-4 w-24 rounded bg-[var(--surface-secondary)] animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between">
              <div className="h-3 w-20 rounded bg-[var(--surface-secondary)] animate-pulse" />
              <div className="h-3 w-24 rounded bg-[var(--surface-secondary)] animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
