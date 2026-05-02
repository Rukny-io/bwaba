"use client";

/**
 * 🏷️ Order Status Chip
 * شريحة حالة الطلب — متناسقة مع ألوان RecentOrders
 */

import type { OrderStatus } from "@/lib/api/orders";

import {
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Loader2,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Status Config ── */

interface StatusInfo {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  dot: string;
}

const statusConfig: Record<OrderStatus, StatusInfo> = {
  PENDING: {
    label: "معلق",
    icon: Clock,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-950/30",
    dot: "bg-yellow-500",
  },
  CONFIRMED: {
    label: "مؤكد",
    icon: CheckCircle2,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    dot: "bg-blue-500",
  },
  PROCESSING: {
    label: "قيد التجهيز",
    icon: Loader2,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/30",
    dot: "bg-purple-500",
  },
  SHIPPED: {
    label: "تم الشحن",
    icon: Truck,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
    dot: "bg-indigo-500",
  },
  DELIVERED: {
    label: "تم التسليم",
    icon: CheckCircle2,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/30",
    dot: "bg-green-500",
  },
  COMPLETED: {
    label: "مكتمل",
    icon: CheckCircle2,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/30",
    dot: "bg-green-500",
  },
  CANCELLED: {
    label: "ملغي",
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30",
    dot: "bg-red-500",
  },
};

export function getStatusInfo(status: string): StatusInfo {
  return statusConfig[(status.toUpperCase() as OrderStatus)] ?? statusConfig.PENDING;
}

/* ── Chip Component ── */

interface OrderStatusChipProps {
  status: string;
  showIcon?: boolean;
  size?: "sm" | "md";
}

export function OrderStatusChip({ status, showIcon = true, size = "sm" }: OrderStatusChipProps) {
  const info = getStatusInfo(status);
  const Icon = info.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap",
        info.bg,
        info.color,
        size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs"
      )}
    >
      {showIcon ? (
        <Icon className={cn("flex-shrink-0", size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5")} />
      ) : (
        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", info.dot)} />
      )}
      {info.label}
    </span>
  );
}
