"use client";

/**
 * 🔍 Order Filters
 * فلاتر وبحث الطلبات — بحث فوري + Tabs + فلتر تاريخ
 */

import { useState, useTransition, useCallback, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Search, X, CalendarDays, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrdersStats } from "@/lib/api/orders";

/* ── Tab Definitions ── */

interface FilterTab {
  id: string;
  label: string;
  count: number;
}

/* ── Date Quick Filters ── */

const DATE_FILTERS = [
  { id: "all", label: "الكل" },
  { id: "today", label: "اليوم" },
  { id: "week", label: "هذا الأسبوع" },
  { id: "month", label: "هذا الشهر" },
];

/* ── Custom debounce hook ── */

function useDebouncedCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay]
  ) as T;
}

/* ── Props ── */

interface OrderFiltersProps {
  stats: OrdersStats;
  activeStatus: string;
  searchQuery: string;
}

/* ── Component ── */

export function OrderFilters({ stats, activeStatus, searchQuery }: OrderFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchQuery);
  const [activeDateFilter, setActiveDateFilter] = useState(
    searchParams.get("dateRange") || "all"
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const tabs: FilterTab[] = [
    { id: "ALL", label: "الكل", count: stats.total },
    { id: "PENDING", label: "معلقة", count: stats.pending },
    { id: "CONFIRMED", label: "مؤكدة", count: stats.confirmed },
    { id: "PROCESSING", label: "قيد التجهيز", count: stats.processing },
    { id: "SHIPPED", label: "مشحونة", count: stats.shipped },
    { id: "DELIVERED", label: "مسلّمة", count: stats.delivered },
    { id: "COMPLETED", label: "مكتملة", count: stats.completed },
    { id: "CANCELLED", label: "ملغية", count: stats.cancelled },
  ].filter((t) => t.id === "ALL" || t.count > 0);

  /* ── URL update helper ── */
  const updateUrl = useCallback(
    (params: Record<string, string | undefined>) => {
      const newParams = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          newParams.set(key, value);
        } else {
          newParams.delete(key);
        }
      });
      newParams.delete("page");
      startTransition(() => {
        router.push(`?${newParams.toString()}`);
      });
    },
    [router, searchParams, startTransition],
  );

  /* ── Debounced search — يبحث تلقائياً بعد 400ms ── */
  const debouncedSearch = useDebouncedCallback(
    (query: string) => {
      updateUrl({ search: query.trim() || undefined });
    },
    400
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value);
  };

  /* ── Instant search on Enter ── */
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl({ search: search.trim() || undefined });
  };

  const clearSearch = () => {
    setSearch("");
    updateUrl({ search: undefined });
    inputRef.current?.focus();
  };

  const handleStatusChange = (status: string) => {
    updateUrl({ status: status === "ALL" ? undefined : status });
  };

  const handleDateFilter = (filterId: string) => {
    setActiveDateFilter(filterId);
    updateUrl({ dateRange: filterId === "all" ? undefined : filterId });
  };

  /* ── Keyboard shortcut: Ctrl+K or / to focus search ── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "k" && (e.metaKey || e.ctrlKey)) ||
        (e.key === "/" && document.activeElement?.tagName !== "INPUT")
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="space-y-3">
      {/* ── Search Bar + Date Filter ── */}
      <div className="flex items-center gap-2">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <div className="relative">
            {isPending ? (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--primary)] animate-spin" />
            ) : (
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="بحث برقم الطلب أو اسم العميل..."
              className={cn(
                "w-full h-10 pr-10 pl-16 rounded-4xl text-sm",
                "bg-[var(--surface)] border border-[var(--border)]",
                "text-[var(--foreground)] placeholder:text-[var(--muted)]",
                "focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]/40",
                "transition-all duration-200"
              )}
            />
            {/* Clear + Keyboard Shortcut hint */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {search ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="w-6 h-6 rounded-full bg-[var(--muted)]/15 flex items-center justify-center hover:bg-[var(--muted)]/30 transition-colors"
                >
                  <X className="w-3 h-3 text-[var(--muted)]" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[var(--surface-secondary)] border border-[var(--border)] text-[10px] text-[var(--muted)] font-mono">
                  ⌘K
                </kbd>
              )}
            </div>
          </div>
        </form>

        {/* Date Quick Filters */}
        <div className="hidden sm:flex items-center gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-4xl p-1">
          <CalendarDays className="w-3.5 h-3.5 text-[var(--muted)] mx-1.5" />
          {DATE_FILTERS.map((df) => (
            <button
              key={df.id}
              onClick={() => handleDateFilter(df.id)}
              className={cn(
                "px-2.5 py-1 rounded-3xl text-[11px] font-medium transition-all duration-200 whitespace-nowrap",
                activeDateFilter === df.id
                  ? "bg-[var(--surface-secondary)] text-[var(--foreground)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              {df.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Active search indicator ── */}
      {searchQuery && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center gap-2 text-xs text-[var(--muted)]"
        >
          <span>نتائج البحث عن:</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-medium">
            &ldquo;{searchQuery}&rdquo;
            <button
              onClick={clearSearch}
              className="hover:text-[var(--foreground)] transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        </motion.div>
      )}

      {/* ── Status Tabs ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleStatusChange(tab.id)}
            className={cn(
              "relative shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-200 overflow-hidden",
              activeStatus === tab.id
                ? "text-brand-white dark:text-brand-black-300"
                : "text-brand-grey-200 dark:text-brand-grey-300 border border-brand-purple-100 dark:border-brand-black-200 hover:border-brand-purple-200 dark:hover:border-brand-grey-300"
            )}
          >
            {activeStatus === tab.id && (
              <motion.span
                layoutId="order-tab-indicator"
                className="absolute inset-0 bg-brand-black-300 dark:bg-brand-purple-200"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.label}
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold tabular-nums",
                  activeStatus === tab.id
                    ? "bg-white/20 text-white dark:bg-brand-black-300/30 dark:text-brand-black-300"
                    : "bg-[var(--surface-secondary)] text-[var(--muted)]"
                )}
              >
                {tab.count}
              </span>
            </span>
          </button>
        ))}

        {/* Loading indicator */}
        {isPending && (
          <div className="flex-shrink-0 w-4 h-4 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
        )}
      </div>
    </div>
  );
}
