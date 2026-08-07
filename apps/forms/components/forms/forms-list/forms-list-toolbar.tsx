'use client';

import {
  Archive,
  CheckCircle2,
  CircleDot,
  FilePenLine,
  FileText,
  Lock,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import type { FormStatus } from '@/lib/forms-api';
import { getFormStatusLabel } from '@/lib/forms-format';
import { cn } from '@/lib/utils';

export type FormsListViewMode = 'active' | 'trash';

const VIEW_TABS: {
  value: FormsListViewMode;
  label: string;
  icon: LucideIcon;
}[] = [
  { value: 'active', label: 'النماذج النشطة', icon: FileText },
  { value: 'trash', label: 'سلة المحذوفات', icon: Trash2 },
];

const FILTER_OPTIONS: {
  value: '' | FormStatus;
  label: string;
  icon: LucideIcon;
}[] = [
  { value: '', label: 'الكل', icon: CircleDot },
  { value: 'DRAFT', label: getFormStatusLabel('DRAFT'), icon: FilePenLine },
  {
    value: 'PUBLISHED',
    label: getFormStatusLabel('PUBLISHED'),
    icon: CheckCircle2,
  },
  { value: 'CLOSED', label: getFormStatusLabel('CLOSED'), icon: Lock },
  { value: 'ARCHIVED', label: getFormStatusLabel('ARCHIVED'), icon: Archive },
];

/**
 * Constrains width so overflow-x scrolls instead of expanding
 * and getting clipped by the dashboard shell (`overflow-clip`).
 */
function PillScroller({
  'aria-label': ariaLabel,
  wrap = false,
  children,
}: {
  'aria-label': string;
  wrap?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden">
      <div
        role="group"
        aria-label={ariaLabel}
        className={cn(
          'flex w-full min-w-0 gap-2 pb-0.5',
          wrap
            ? 'flex-wrap'
            : 'overflow-x-auto overscroll-x-contain touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        )}
        style={wrap ? undefined : { WebkitOverflowScrolling: 'touch' }}
      >
        {children}
      </div>
    </div>
  );
}

function FormsPillTab({
  label,
  icon: Icon,
  isActive,
  badge,
  onClick,
  pressed,
}: {
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  badge?: number | string | null;
  onClick: () => void;
  pressed: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={cn(
        'group shrink-0 rounded-full p-[1.5px] transition-colors duration-200',
        isActive
          ? 'bg-gradient-to-l from-[var(--brand-lime-soft)] via-[var(--primary)] to-[var(--brand-lime)]'
          : 'bg-[var(--border)] hover:bg-[color-mix(in_srgb,var(--border)_70%,var(--primary)_30%)]',
      )}
    >
      <span
        className={cn(
          'flex min-h-10 items-center gap-2 rounded-full bg-[var(--surface)] px-3.5 py-2 text-[13px] font-semibold transition-colors sm:min-h-0',
          isActive
            ? 'text-[var(--foreground)]'
            : 'text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]',
        )}
      >
        <Icon
          size={16}
          strokeWidth={isActive ? 2.2 : 1.8}
          className="shrink-0 opacity-80"
          aria-hidden
        />
        <span className="whitespace-nowrap">{label}</span>
        {badge != null && badge !== '' ? (
          <span
            className={cn(
              'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums',
              isActive
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]',
            )}
          >
            {badge}
          </span>
        ) : null}
      </span>
    </button>
  );
}

export function FormsListToolbar({
  viewMode,
  onViewModeChange,
  status,
  onStatusChange,
  activeCount,
  trashCount,
  filterCount,
}: {
  viewMode: FormsListViewMode;
  onViewModeChange: (mode: FormsListViewMode) => void;
  status: '' | FormStatus;
  onStatusChange: (status: '' | FormStatus) => void;
  activeCount?: number;
  trashCount?: number;
  filterCount?: number;
}) {
  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-2.5 sm:gap-3">
      <PillScroller aria-label="عرض النماذج">
        {VIEW_TABS.map((tab) => {
          const isActive = viewMode === tab.value;
          const badge =
            tab.value === 'active'
              ? activeCount
              : tab.value === 'trash'
                ? trashCount
                : undefined;

          return (
            <FormsPillTab
              key={tab.value}
              label={tab.label}
              icon={tab.icon}
              isActive={isActive}
              pressed={isActive}
              badge={isActive ? badge : undefined}
              onClick={() => onViewModeChange(tab.value)}
            />
          );
        })}
      </PillScroller>

      {viewMode === 'active' ? (
        <PillScroller aria-label="تصفية النماذج" wrap>
          {FILTER_OPTIONS.map((opt) => {
            const isActive = status === opt.value;
            return (
              <FormsPillTab
                key={opt.value || 'all'}
                label={opt.label}
                icon={opt.icon}
                isActive={isActive}
                pressed={isActive}
                badge={isActive ? filterCount : undefined}
                onClick={() => onStatusChange(opt.value)}
              />
            );
          })}
        </PillScroller>
      ) : null}
    </div>
  );
}
