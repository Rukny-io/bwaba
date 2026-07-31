'use client';

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { WeeklySalesDay } from '@/lib/commerce/types';
import { formatCurrency, formatNumber } from '@/lib/dashboard-format';
import { cn } from '@/lib/utils';

export function AnalyticsSalesChart({
  days,
  className,
  height = 200,
}: {
  days: WeeklySalesDay[];
  className?: string;
  height?: number;
}) {
  const chartData = useMemo(
    () =>
      days.map((d) => ({
        ...d,
        label: d.day.slice(0, 3),
      })),
    [days],
  );

  if (days.length === 0) {
    return (
      <p className="text-sm italic text-[var(--muted-foreground)]">
        لا توجد مبيعات في الأسبوع الحالي
      </p>
    );
  }

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="4 6"
            vertical={false}
            strokeOpacity={0.5}
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
            width={40}
            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
          />
          <Tooltip
            cursor={{ fill: 'var(--surface-secondary)', opacity: 0.5 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0]?.payload as WeeklySalesDay & { label: string };
              return (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs shadow-lg">
                  <p className="font-semibold text-[var(--foreground)]">{row.day}</p>
                  <p className="mt-1 text-[var(--muted-foreground)]">
                    {formatCurrency(row.sales)} · {formatNumber(row.orders)} طلب
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="sales" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
