'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpDown, Download, Plus, Search, X } from 'lucide-react';
import { Button, Switch } from '@heroui/react';
import {
  PRODUCTS_SORT_TABS,
  getNextToggleSort,
  getToggleSortLabel,
  isToggleSortActive,
  type ProductsSortOption,
} from '@/components/products/products-view-mode';
import { dashboardTopTabsChipClass } from '@/components/app/nav-glass';
import { cn } from '@/lib/utils';

interface ProductsToolbarProps {
  showSearch?: boolean;
  showSort?: boolean;
  showExport?: boolean;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  sortBy?: ProductsSortOption;
  onSortByChange?: (sort: ProductsSortOption) => void;
  showHidden?: boolean;
  onShowHiddenChange?: (show: boolean) => void;
  searchPlaceholder?: string;
  addButtonLabel?: string;
  showHiddenLabel?: string;
  hiddenSwitchAriaLabel?: string;
  exportLabel?: string;
  exportDisabled?: boolean;
  onAdd?: () => void;
  onExport?: () => void;
}

function iconButtonClass(isActive = false) {
  return cn(
    'flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors sm:size-10',
    isActive
      ? 'border-[var(--foreground)]/15 bg-[var(--foreground)] text-[var(--background)]'
      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] hover:border-[var(--foreground)]/12 hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]',
  );
}

const actionButtonClass =
  'h-10 shrink-0 gap-2 rounded-xl px-3.5 text-[13px] font-semibold sm:px-4 sm:text-[14px]';

const toolbarRevealClass =
  'animate-in fade-in-0 slide-in-from-top-2 duration-250 ease-out fill-mode-both';

const searchRevealClass =
  'animate-in fade-in-0 slide-in-from-end-2 zoom-in-95 duration-200 ease-out fill-mode-both';

export function ProductsToolbar({
  showSearch = true,
  showSort = true,
  showExport = true,
  searchQuery = '',
  onSearchQueryChange,
  sortBy = 'newest',
  onSortByChange,
  showHidden = false,
  onShowHiddenChange,
  searchPlaceholder = 'بحث في المنتجات…',
  addButtonLabel = 'إضافة منتج',
  showHiddenLabel = 'إظهار المخفي',
  hiddenSwitchAriaLabel = 'إظهار المنتجات المخفية',
  exportLabel = 'تصدير',
  exportDisabled = false,
  onAdd,
  onExport,
}: ProductsToolbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const sortActive = sortBy !== 'newest' || showHidden;
  const searchActive = searchOpen || Boolean(searchQuery.trim());

  useEffect(() => {
    if (!showSearch || !searchOpen) return;
    searchRef.current?.focus();
  }, [searchOpen, showSearch]);

  useEffect(() => {
    if (!showSearch || !searchQuery.trim()) return;
    setSearchOpen(true);
  }, [searchQuery, showSearch]);

  const handleSortChange = useCallback(
    (value: ProductsSortOption) => {
      onSortByChange?.(value);
    },
    [onSortByChange],
  );

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="order-2 flex min-w-0 flex-wrap items-center justify-end gap-2 sm:order-1 sm:flex-none">
          {showSearch ? (
            searchOpen ? (
              <div
                className={cn(
                  'flex min-w-0 flex-1 items-center gap-2 sm:max-w-[16rem]',
                  searchRevealClass,
                )}
              >
                <div className="relative min-w-0 flex-1">
                  <Search
                    className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <input
                    ref={searchRef}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => onSearchQueryChange?.(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="h-10 w-full rounded-full border border-[var(--border)] bg-[var(--surface)] py-0 pe-9 ps-9 text-[13px] text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)] focus:border-[var(--foreground)]/20 focus:ring-2 focus:ring-[var(--foreground)]/8"
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      aria-label="مسح البحث"
                      onClick={() => onSearchQueryChange?.('')}
                      className="absolute end-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
                    >
                      <X className="size-3.5" strokeWidth={2} aria-hidden />
                    </button>
                  ) : null}
                </div>
                <button
                  type="button"
                  aria-label="إغلاق البحث"
                  onClick={() => {
                    setSearchOpen(false);
                    onSearchQueryChange?.('');
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
                className={cn(
                  iconButtonClass(searchActive),
                  'animate-in fade-in-0 zoom-in-95 duration-200 ease-out fill-mode-both',
                )}
              >
                <Search className="size-[17px]" strokeWidth={1.75} aria-hidden />
              </button>
            )
          ) : null}

          {showSort ? (
            <button
              type="button"
              aria-label="الترتيب"
              aria-expanded={sortOpen}
              aria-pressed={sortActive}
              onClick={() => setSortOpen((open) => !open)}
              className={cn(
                actionButtonClass,
                'inline-flex items-center border transition-all duration-200',
                sortOpen || sortActive
                  ? 'border-[var(--foreground)]/15 bg-[var(--foreground)] text-[var(--background)]'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-secondary)]',
              )}
            >
              <ArrowUpDown className="size-4" strokeWidth={1.75} aria-hidden />
              <span>ترتيب</span>
            </button>
          ) : null}

          {showExport && onExport ? (
            <Button
              isDisabled={exportDisabled}
              onPress={onExport}
              className={cn(
                actionButtonClass,
                'border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-secondary)] disabled:opacity-45',
              )}
            >
              <Download className="size-4" strokeWidth={2} aria-hidden />
              <span>{exportLabel}</span>
            </Button>
          ) : null}
        </div>

        <Button
          onPress={onAdd}
          className={cn(
            actionButtonClass,
            'order-1 self-end font-bold bg-[var(--foreground)] text-[var(--background)] hover:opacity-92 sm:order-2 sm:self-auto',
          )}
        >
          <Plus className="size-4" strokeWidth={2.5} aria-hidden />
          <span>{addButtonLabel}</span>
        </Button>
      </div>

      {showSort && sortOpen ? (
        <div
          className={cn(
            'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
            toolbarRevealClass,
          )}
        >
          <nav
            role="tablist"
            aria-label="ترتيب المنتجات"
            className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2"
          >
            {PRODUCTS_SORT_TABS.map((tab) => {
              if (tab.kind === 'single') {
                const active = sortBy === tab.value;

                return (
                  <button
                    key={tab.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => handleSortChange(tab.value)}
                    className={cn(
                      dashboardTopTabsChipClass,
                      'inline-flex min-h-9 items-center px-3.5 py-2 text-[13px] sm:min-h-[2.375rem] sm:px-4 sm:text-[14px]',
                    )}
                  >
                    {tab.label}
                  </button>
                );
              }

              const active = isToggleSortActive(sortBy, tab);
              const label = getToggleSortLabel(sortBy, tab);

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => handleSortChange(getNextToggleSort(sortBy, tab))}
                  className={cn(
                    dashboardTopTabsChipClass,
                    'inline-flex min-h-9 items-center px-3.5 py-2 text-[13px] sm:min-h-[2.375rem] sm:px-4 sm:text-[14px]',
                  )}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          {onShowHiddenChange ? (
            <div className="flex items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 sm:px-4">
              <span className="text-[13px] font-medium text-[var(--foreground)] sm:text-[14px]">
                {showHiddenLabel}
              </span>
              <Switch
                isSelected={showHidden}
                onChange={onShowHiddenChange}
                aria-label={hiddenSwitchAriaLabel}
                className="scale-110"
              >
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
