"use client";

/**
 * 📊 Activity Bar Chart
 * رسم بياني أسبوعي — أعمدة نظيفة بدون مكتبة خارجية
 */

import { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DayData {
  day: string;
  value: number;
  isHighlighted?: boolean;
}

interface ActivityBarChartProps {
  title?: string;
  totalValue?: string;
  data?: DayData[];
  badge?: {
    value: string;
    trend?: "up" | "down";
  };
}

const arabicDays: Record<string, string> = {
  Mon: "الإثن",
  Tue: "الثل",
  Wed: "الأرب",
  Thu: "الخ",
  Fri: "الجم",
  Sat: "السب",
  Sun: "الأح",
};

const defaultDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function ActivityBarChart({
  title = "إيرادات الأسبوع",
  totalValue = "0",
  data,
  badge,
}: ActivityBarChartProps) {
  const chartData = useMemo<DayData[]>(() => {
    const source = data?.length
      ? data
      : defaultDays.map((day) => ({ day, value: 0, isHighlighted: false }));
    return source.map((item) => ({
      day: item.day,
      value: Math.max(0, Number.isFinite(item.value) ? item.value : 0),
      isHighlighted: item.isHighlighted,
    }));
  }, [data]);

  const maxValue = useMemo(
    () => Math.max(...chartData.map((d) => d.value), 1),
    [chartData]
  );
  const isZeroState = useMemo(
    () => chartData.every((d) => d.value === 0),
    [chartData]
  );

  const badgeTrend = badge?.trend ?? (badge?.value?.startsWith("-") ? "down" : "up");

  return (
    <div className="rounded-4xl bg-[var(--surface)] border border-[var(--border)] p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-xs text-[var(--muted)] mb-0.5">{title}</p>
          <h3 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] tabular-nums">
            {totalValue}
          </h3>
        </div>

        {badge?.value && (
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold mt-0.5",
              badgeTrend === "up"
                ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
            )}
          >
            {badgeTrend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {badge.value}
          </span>
        )}
      </div>

      {/* Chart Bars */}
      <div className="flex items-end gap-1.5 h-[100px] sm:h-[120px]">
        {chartData.map((item) => {
          const heightPct = isZeroState
            ? 8
            : Math.max((item.value / maxValue) * 100, 6);
          return (
            <div
              key={item.day}
              className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
            >
              <div
                className="w-full flex items-end"
                style={{ height: `${heightPct}%` }}
                title={`${arabicDays[item.day] ?? item.day}: ${item.value.toLocaleString("en")}`}
              >
                <div
                  className={cn(
                    "w-full h-full rounded-lg",
                    item.isHighlighted
                      ? "bg-[var(--primary)]"
                      : "bg-[var(--surface-secondary)]"
                  )}
                />
              </div>
              <span className="text-[9px] sm:text-[10px] text-[var(--muted)] whitespace-nowrap select-none">
                {arabicDays[item.day] ?? item.day}
              </span>
            </div>
          );
        })}
      </div>

      {isZeroState && (
        <p className="text-[11px] text-[var(--muted)] mt-3 text-center">
          لا توجد بيانات هذا الأسبوع بعد
        </p>
      )}
    </div>
  );
}

export function ActivityBarChartSkeleton() {
  return (
    <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-4 sm:p-5">
      <div className="flex items-start justify-between mb-5">
        <div className="space-y-1.5">
          <div className="h-3 w-24 rounded bg-[var(--surface-secondary)] animate-pulse" />
          <div className="h-6 w-32 rounded bg-[var(--surface-secondary)] animate-pulse" />
        </div>
        <div className="h-6 w-16 rounded-full bg-[var(--surface-secondary)] animate-pulse" />
      </div>
      <div className="flex items-end gap-1.5 h-[100px] sm:h-[120px]">
        {[60, 35, 80, 50, 90, 40, 65].map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
            <div
              className="w-full rounded-lg bg-[var(--surface-secondary)] animate-pulse"
              style={{ height: `${h}%` }}
            />
            <div className="h-2 w-4 rounded bg-[var(--surface-secondary)] animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
