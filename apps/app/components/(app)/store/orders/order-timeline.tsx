"use client";

/**
 * ⏱️ Order Timeline
 * خط زمني لمراحل الطلب
 */

import { motion } from "framer-motion";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Loader2,
  Package,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/api/orders";

/* ── Timeline Step ── */

interface TimelineStep {
  status: OrderStatus;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

const ALL_STEPS: TimelineStep[] = [
  {
    status: "PENDING",
    label: "تم استلام الطلب",
    icon: ShoppingBag,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-950/30",
  },
  {
    status: "CONFIRMED",
    label: "تم التأكيد",
    icon: CheckCircle2,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    status: "PROCESSING",
    label: "قيد التجهيز",
    icon: Loader2,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/30",
  },
  {
    status: "SHIPPED",
    label: "تم الشحن",
    icon: Truck,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
  },
  {
    status: "DELIVERED",
    label: "تم التسليم",
    icon: Package,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/30",
  },
  {
    status: "COMPLETED",
    label: "مكتمل",
    icon: CheckCircle2,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/30",
  },
];

const CANCELLED_STEP: TimelineStep = {
  status: "CANCELLED",
  label: "ملغي",
  icon: XCircle,
  color: "text-red-600 dark:text-red-400",
  bg: "bg-red-50 dark:bg-red-950/30",
};

/* ── Status order for progress ── */
const STATUS_ORDER: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
];

function getStepIndex(status: OrderStatus): number {
  return STATUS_ORDER.indexOf(status);
}

/* ── Props ── */

interface OrderTimelineProps {
  currentStatus: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

/* ── Component ── */

export function OrderTimeline({ currentStatus, createdAt, updatedAt }: OrderTimelineProps) {
  const isCancelled = currentStatus === "CANCELLED";
  const currentIndex = getStepIndex(currentStatus);

  // For cancelled orders, show the cancelled step
  if (isCancelled) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="rounded-4xl bg-[var(--surface)] border border-[var(--border)] p-4 sm:p-5"
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-[var(--surface-secondary)] flex items-center justify-center">
            <Clock className="w-4 h-4 text-[var(--muted)]" />
          </div>
          <h3 className="text-sm font-bold text-[var(--foreground)] leading-none">مراحل الطلب</h3>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-red-50 dark:bg-red-950/20 p-3.5">
          <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center flex-shrink-0">
            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-red-700 dark:text-red-400">تم إلغاء الطلب</p>
            <p className="text-[11px] text-red-600/70 dark:text-red-400/60 mt-0.5">
              {new Date(updatedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Normal flow steps — only show up to DELIVERED or COMPLETED
  const steps = ALL_STEPS.filter((s) => {
    const idx = getStepIndex(s.status);
    // Don't show COMPLETED if not yet completed (keep DELIVERED as last)
    if (s.status === "COMPLETED" && currentStatus !== "COMPLETED") return false;
    // Don't show DELIVERED if completed (COMPLETED replaces it)
    if (s.status === "DELIVERED" && currentStatus === "COMPLETED") return false;
    return idx >= 0;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-4xl bg-[var(--surface)] border border-[var(--border)] p-4 sm:p-5"
    >
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-xl bg-[var(--surface-secondary)] flex items-center justify-center">
          <Clock className="w-4 h-4 text-[var(--muted)]" />
        </div>
        <h3 className="text-sm font-bold text-[var(--foreground)] leading-none">مراحل الطلب</h3>
      </div>

      <div className="relative">
        {steps.map((step, i) => {
          const stepIndex = getStepIndex(step.status);
          const isCompleted = stepIndex <= currentIndex;
          const isCurrent = step.status === currentStatus;
          const isLast = i === steps.length - 1;
          const Icon = step.icon;

          return (
            <motion.div
              key={step.status}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + i * 0.08 }}
              className="relative flex gap-3 pb-6 last:pb-0"
            >
              {/* Vertical line */}
              {!isLast && (
                <div className="absolute right-[15px] top-[32px] w-0.5 h-[calc(100%-24px)]">
                  <div
                    className={cn(
                      "w-full h-full rounded-full transition-colors duration-500",
                      isCompleted ? "bg-green-400/50 dark:bg-green-500/30" : "bg-[var(--border)]"
                    )}
                  />
                </div>
              )}

              {/* Icon circle */}
              <div
                className={cn(
                  "relative z-10 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300",
                  isCurrent
                    ? cn(step.bg, "ring-2 ring-offset-2 ring-offset-[var(--surface)]", step.status === "COMPLETED" || step.status === "DELIVERED" ? "ring-green-400/50" : "ring-[var(--primary)]/30")
                    : isCompleted
                      ? "bg-green-50 dark:bg-green-950/30"
                      : "bg-[var(--surface-secondary)]"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors duration-300",
                    isCurrent
                      ? step.color
                      : isCompleted
                        ? "text-green-600 dark:text-green-400"
                        : "text-[var(--muted)]/50"
                  )}
                />
              </div>

              {/* Label */}
              <div className="pt-1">
                <p
                  className={cn(
                    "text-[13px] font-medium leading-none transition-colors duration-300",
                    isCurrent
                      ? "text-[var(--foreground)] font-semibold"
                      : isCompleted
                        ? "text-[var(--foreground)]"
                        : "text-[var(--muted)]"
                  )}
                >
                  {step.label}
                </p>
                {isCurrent && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[11px] text-[var(--muted)] mt-1"
                  >
                    {new Date(updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </motion.p>
                )}
                {stepIndex === 0 && !isCurrent && isCompleted && (
                  <p className="text-[11px] text-[var(--muted)] mt-1">
                    {new Date(createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
