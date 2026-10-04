"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function MailPlanStatTile({
  icon: Icon,
  label,
  value,
  hint,
  warning,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  warning?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-w-0 flex-1 rounded-xl border px-3 py-2.5 sm:px-3.5",
        warning
          ? "border-[color-mix(in_srgb,var(--warning)_35%,transparent)] bg-[color-mix(in_srgb,var(--warning)_8%,var(--background))]"
          : "border-[var(--border)] bg-[var(--background)]",
      )}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
        <Icon className="size-3 shrink-0" aria-hidden />
        {label}
      </div>
      <p className="mt-1 text-sm font-semibold tabular-nums text-[var(--foreground)]">
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">{hint}</p>
      ) : null}
    </div>
  );
}

export function MailPlanUsageBar({
  label,
  used,
  limit,
  warning,
  className,
}: {
  label: string;
  used: number;
  limit: number;
  warning?: boolean;
  className?: string;
}) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const isFull = limit > 0 && used >= limit;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
        <span>{label}</span>
        <span className="tabular-nums">
          {used} / {limit}
          {limit > 0 ? ` · ${pct}%` : ""}
        </span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]"
        role="progressbar"
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-label={label}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-300",
            warning || isFull ? "bg-[var(--warning)]" : "bg-[var(--foreground)]",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
