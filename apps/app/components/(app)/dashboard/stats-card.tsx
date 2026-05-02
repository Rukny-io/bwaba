/**
 * 📊 Stats Card Component
 * بطاقة إحصائيات — تصميم حديث مع أيقونة
 */

import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon?: LucideIcon;
  subtitle?: string;
  highlight?: boolean;
}

export function StatsCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  subtitle,
  highlight = false,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "rounded-4xl p-3.5 sm:p-4 border transition-all duration-200 flex flex-col gap-3",
        highlight
          ? "bg-[var(--accent)] border-transparent"
          : "bg-[var(--surface)] border-[var(--border)]"
      )}
    >
      {/* Row: Icon + Badge */}
      <div className="flex items-center justify-between">
        {Icon ? (
          <div
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
              highlight ? "bg-white/15" : "bg-[var(--surface-secondary)]"
            )}
          >
            <Icon
              className={cn(
                "w-[18px] h-[18px]",
                highlight ? "text-white" : "text-[var(--muted)]"
              )}
            />
          </div>
        ) : <div />}

        {/* Trend Badge */}
        <span
          className={cn(
            "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-semibold",
            highlight
              ? trend === "up"
                ? "bg-white/20 text-white"
                : "bg-white/15 text-white/80"
              : trend === "up"
                ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
          )}
        >
          {trend === "up" ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
          {change}
        </span>
      </div>

      {/* Value + Labels */}
      <div>
        <h3
          className={cn(
            "text-xl sm:text-2xl font-bold leading-none tabular-nums mb-1",
            highlight ? "text-white" : "text-[var(--foreground)]"
          )}
        >
          {value}
        </h3>
        <p
          className={cn(
            "text-xs font-medium leading-tight",
            highlight ? "text-white/80" : "text-[var(--foreground)]/70"
          )}
        >
          {title}
        </p>
        {subtitle && (
          <p
            className={cn(
              "text-[11px] mt-0.5 leading-tight",
              highlight ? "text-white/60" : "text-[var(--muted)]"
            )}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="rounded-2xl p-3.5 sm:p-4 bg-[var(--surface)] border border-[var(--border)] flex flex-col gap-3">
      {/* Row: Icon + Badge */}
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-xl bg-[var(--surface-secondary)] animate-pulse" />
        <div className="w-14 h-5 rounded-full bg-[var(--surface-secondary)] animate-pulse" />
      </div>

      {/* Content skeleton */}
      <div className="space-y-1.5">
        <div className="h-6 w-24 rounded bg-[var(--surface-secondary)] animate-pulse" />
        <div className="h-3 w-16 rounded bg-[var(--surface-secondary)] animate-pulse" />
        <div className="h-3 w-20 rounded bg-[var(--surface-secondary)] animate-pulse" />
      </div>
    </div>
  );
}
