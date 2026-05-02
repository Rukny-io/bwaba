"use client";

/**
 * 📊 Overview Stats Component
 * Area chart مع tabs للتنقل — مستوحى من تصميم احترافي
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Download } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChartDataPoint {
  x: string | number;
  value: number;
  secondaryValue?: number;
}

export interface AnalyticsTab {
  id: string;
  label: string;
  value: string | number;
  change: number;
  changeType?: "percent" | "number";
  suffix?: string;
  data: ChartDataPoint[];
  /** highlight label on chart (e.g. "All Time High") */
  highlightLabel?: string;
}

interface OverviewStatsProps {
  title?: string;
  tabs: AnalyticsTab[];
  onDownload?: (tabId: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatChange(change: number, type: "percent" | "number" = "percent"): string {
  if (type === "percent") return change >= 0 ? `+${change}%` : `${change}%`;
  return change >= 0 ? `+${change.toLocaleString("en")}` : change.toLocaleString("en");
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, coordinate }: any) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  return (
    <div
      className="pointer-events-none"
      style={{ transform: "translate(-50%, -110%)", position: "absolute", left: coordinate?.x, top: coordinate?.y }}
    >
      <div className="bg-foreground text-background text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
        {typeof val === "number" ? val.toLocaleString("en") : val}
        {/* speech-bubble tail */}
        <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-foreground" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function OverviewStats({
  title = "التحليلات",
  tabs,
  onDownload,
}: OverviewStatsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "");

  const currentTab = useMemo(
    () => tabs.find((t) => t.id === activeTab) ?? tabs[0],
    [tabs, activeTab]
  );

  const isPositive = (currentTab?.change ?? 0) >= 0;
  const changeLabel = formatChange(currentTab?.change ?? 0, currentTab?.changeType ?? "percent");

  // find peak for ReferenceDot
  const peakPoint = useMemo(() => {
    if (!currentTab?.data?.length) return null;
    return currentTab.data.reduce((max, p) => (p.value > max.value ? p : max), currentTab.data[0]);
  }, [currentTab]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="min-w-0 rounded-4xl bg-card border border-border/60 overflow-hidden"
    >
      {/* ── Tabs ── */}
      <div className="flex items-center gap-2 px-2 pt-4 pb-0 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 overflow-hidden",
              activeTab === tab.id
                ? "text-brand-white dark:text-brand-black-300"
                : "text-brand-grey-200 dark:text-brand-grey-300 border border-brand-purple-100 dark:border-brand-black-200 hover:border-brand-purple-200 dark:hover:border-brand-grey-300"
            )}
          >
            {activeTab === tab.id && (
              <motion.span
                layoutId="tab-indicator"
                className="absolute inset-0 bg-brand-black-300 dark:bg-brand-purple-200"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Chart Area ── */}
      <div className="px-2 pt-3 pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {currentTab?.data?.length ? (
              <div className="w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={currentTab.data}
                    margin={{ top: 20, right: 8, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.01} />
                      </linearGradient>
                      <linearGradient id="areaGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.10} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.00} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="0"
                      vertical={false}
                      stroke="hsl(var(--border))"
                      strokeOpacity={0.5}
                    />
                    <XAxis
                      dataKey="x"
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      tickCount={5}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "4 4" }} />
                    {/* Secondary area (shadow effect) */}
                    {currentTab.data.some((d) => d.secondaryValue !== undefined) && (
                      <Area
                        type="monotone"
                        dataKey="secondaryValue"
                        stroke="none"
                        fill="url(#areaGrad2)"
                        isAnimationActive={true}
                        animationDuration={800}
                      />
                    )}
                    {/* Primary area */}
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#areaGrad)"
                      dot={false}
                      activeDot={{ r: 4, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                      isAnimationActive={true}
                      animationDuration={900}
                      animationEasing="ease-out"
                    />
                    {/* Peak dot */}
                    {peakPoint && (
                      <ReferenceDot
                        x={peakPoint.x}
                        y={peakPoint.value}
                        r={4}
                        fill="hsl(var(--primary))"
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[220px] flex items-center justify-center">
                <p className="text-xs text-muted-foreground">لا توجد بيانات كافية بعد.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between px-4 py-3 ">
        {/* Left: download + change + highlight label */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onDownload?.(activeTab)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-2xl border border-border/60 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors"
          >
            <Download className="w-3 h-3" />
            تحميل التقرير
          </button>

          <span
            className={cn(
              "text-xs font-semibold tabular-nums",
              isPositive ? "text-green-500" : "text-red-500"
            )}
          >
            {changeLabel}
          </span>

          {currentTab?.highlightLabel && (
            <span className="text-xs text-muted-foreground">{currentTab.highlightLabel}</span>
          )}
        </div>

        {/* Right: big value */}
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-foreground tabular-nums">
            {typeof currentTab?.value === "number"
              ? currentTab.value.toLocaleString("en")
              : currentTab?.value}
          </span>
          {currentTab?.suffix && (
            <span className="text-xs text-muted-foreground">{currentTab.suffix}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function OverviewStatsSkeleton() {
  return (
    <div className="rounded-2xl bg-card border border-border/60 shadow-sm overflow-hidden">
      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-4 pb-0">
        {[80, 64, 96, 72].map((w, i) => (
          <div key={i} className="h-7 rounded-lg bg-muted animate-pulse" style={{ width: w }} />
        ))}
      </div>
      {/* Chart */}
      <div className="px-4 pt-4">
        <div className="h-[220px] rounded-xl bg-muted/30 animate-pulse" />
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border/40">
        <div className="flex gap-2">
          <div className="h-6 w-28 rounded-lg bg-muted animate-pulse" />
          <div className="h-4 w-10 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-7 w-20 rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}

