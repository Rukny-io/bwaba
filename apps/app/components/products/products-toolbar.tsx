'use client';

import { useEffect, useRef, useState } from 'react';
import {
  LayoutGrid,
  List,
  Maximize2,
  Plus,
  Search,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react';
import { Button, Label, Popover, Switch } from '@heroui/react';
import {
  PRODUCTS_SORT_OPTIONS,
  PRODUCTS_VIEW_MODES,
  type ProductsSortOption,
  type ProductsViewMode,
} from '@/components/products/products-view-mode';
import { dashboardTopTabsChipClass } from '@/components/app/nav-glass';
import { cn } from '@/lib/utils';

const VIEW_ICONS: Record<ProductsViewMode, LucideIcon> = {
  grid: LayoutGrid,
  full: Maximize2,
  inline: List,
};

interface ProductsToolbarProps {
  viewMode: ProductsViewMode;
  onViewModeChange: (mode: ProductsViewMode) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  sortBy: ProductsSortOption;
  onSortByChange: (sort: ProductsSortOption) => void;
  showHidden: boolean;
  onShowHiddenChange: (show: boolean) => void;
  searchPlaceholder?: string;
  addButtonLabel?: string;
  showHiddenLabel?: string;
  hiddenSwitchAriaLabel?: string;
  onAdd?: () => void;
}

function toolbarTriggerClass(isActive: boolean) {
  return cn(
    'flex size-9 shrink-0 items-center justify-center rounded-xl border transition-colors sm:size-10',
    isActive
      ? 'border-[var(--primary)]/30 bg-[var(--primary)]/10 text-[var(--primary)]'
      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]',
  );
}

function PanelOption({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors',
        isActive
          ? 'bg-[var(--foreground)] text-[var(--background)]'
          : 'text-[var(--foreground)] hover:bg-[var(--surface-secondary)]',
      )}
    >
      {label}
    </button>
  );
}

export function ProductsToolbar({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchQueryChange,
  sortBy,
  onSortByChange,
  showHidden,
  onShowHiddenChange,
  searchPlaceholder = 'بحث في المنتجات…',
  addButtonLabel = 'إضافة منتج',
  showHiddenLabel = 'إظهار المخفي',
  hiddenSwitchAriaLabel = 'إظهار المنتجات المخفية',
  onAdd,
}: ProductsToolbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const displayActive = sortBy !== 'newest' || showHidden;
  const searchActive = searchOpen || Boolean(searchQuery.trim());

  useEffect(() => {
    if (searchOpen) {
      searchRef.current?.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!searchQuery.trim()) return;
    setSearchOpen(true);
  }, [searchQuery]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <nav
        role="tablist"
        aria-label="طريقة العرض"
        className="flex min-w-0 flex-wrap items-center gap-1 sm:gap-1.5"
      >
        {PRODUCTS_VIEW_MODES.map(({ value, label }) => {
          const Icon = VIEW_ICONS[value];
          const active = viewMode === value;

          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={active}
              aria-current={active ? 'page' : undefined}
              onClick={() => onViewModeChange(value)}
              className={cn(
                dashboardTopTabsChipClass,
                'inline-flex items-center gap-1.5',
              )}
            >
              <Icon className="size-3.5 sm:size-4" strokeWidth={active ? 2 : 1.75} aria-hidden />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:flex-none">
        {searchOpen ? (
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-[15rem]">
            <input
              ref={searchRef}
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px] text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)]/40 focus:ring-2 focus:ring-[var(--primary)]/15 sm:h-10"
            />
            <button
              type="button"
              aria-label="إغلاق البحث"
              onClick={() => {
                setSearchOpen(false);
                onSearchQueryChange('');
              }}
              className="shrink-0 text-[12px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              إلغاء
            </button>
          </div>
        ) : (
          <button
            type="button"
            aria-label="بحث"
            aria-pressed={searchActive}
            onClick={() => setSearchOpen(true)}
            className={toolbarTriggerClass(searchActive)}
          >
            <Search className="size-[17px]" strokeWidth={1.75} aria-hidden />
          </button>
        )}

        <Popover>
          <Popover.Trigger
            aria-label="إعدادات العرض"
            className={toolbarTriggerClass(displayActive)}
          >
            <SlidersHorizontal className="size-[17px]" strokeWidth={1.75} aria-hidden />
          </Popover.Trigger>
          <Popover.Content placement="bottom end" className="min-w-[12.5rem]">
            <Popover.Dialog className="p-2.5">
              <p className="mb-2 px-1 text-[11px] font-semibold text-[var(--muted-foreground)]">
                الترتيب
              </p>
              <div className="mb-3 flex flex-col gap-0.5">
                {PRODUCTS_SORT_OPTIONS.map(({ value, label }) => (
                  <PanelOption
                    key={value}
                    label={label}
                    isActive={sortBy === value}
                    onClick={() => onSortByChange(value)}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)]/70 px-2.5 py-2">
                <Label className="text-[13px] font-medium">{showHiddenLabel}</Label>
                <Switch
                  isSelected={showHidden}
                  onChange={onShowHiddenChange}
                  aria-label={hiddenSwitchAriaLabel}
                >
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch>
              </div>
            </Popover.Dialog>
          </Popover.Content>
        </Popover>

        <Button
          onPress={onAdd}
          className={cn(
            'h-10 shrink-0 gap-2 rounded-xl px-4 text-[14px] font-bold shadow-[0_4px_14px_rgba(15,23,42,0.18)]',
            'bg-[var(--foreground)] text-[var(--background)] hover:opacity-92',
            'ring-2 ring-[var(--foreground)]/12',
          )}
        >
          <Plus className="size-4" strokeWidth={2.5} aria-hidden />
          <span>{addButtonLabel}</span>
        </Button>
      </div>
    </div>
  );
}
