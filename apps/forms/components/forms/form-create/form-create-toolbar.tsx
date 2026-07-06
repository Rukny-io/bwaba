'use client';

import Link from 'next/link';
import {
  ChevronRight,
  CircleCheck,
  Eye,
  Layers,
  Loader2,
  Palette,
  Save,
  type LucideIcon,
} from 'lucide-react';
import { formsNavGlassClass } from '@/components/app/nav-glass';
import { cn } from '@/lib/utils';

export type FormSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface FormCreateToolbarProps {
  saveStatus: FormSaveStatus;
  loading?: boolean;
  fieldCount: number;
  backHref?: string;
  onCustomize: () => void;
  onSteps: () => void;
  onPreview: () => void;
  onPublish: () => void;
}

function SaveStatusBadge({
  status,
  compact = false,
}: {
  status: FormSaveStatus;
  compact?: boolean;
}) {
  if (status === 'saving') {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]"
        title="جاري الحفظ"
      >
        <Loader2 className="size-3 animate-spin" />
        {!compact ? 'جاري الحفظ…' : null}
      </span>
    );
  }
  if (status === 'saved') {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs text-[var(--success)]"
        title="تم الحفظ"
      >
        <Save className="size-3" />
        {!compact ? 'تم الحفظ' : null}
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="text-xs text-[var(--danger)]" title="تعذّر الحفظ">
        {compact ? '!' : 'تعذّر الحفظ'}
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]"
      title="يُحفظ تلقائياً"
    >
      <Save className="size-3 opacity-50" />
      {!compact ? 'يُحفظ تلقائياً' : null}
    </span>
  );
}

function NavActionButton({
  label,
  icon: Icon,
  onClick,
  disabled,
  filled,
  showLabel = true,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  filled?: boolean;
  showLabel?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'flex h-8 items-center justify-center gap-1.5 rounded-full px-2.5 text-sm font-medium transition-colors sm:px-3',
        filled
          ? 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 disabled:opacity-60'
          : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] disabled:opacity-50',
      )}
    >
      <Icon className="size-4 shrink-0" strokeWidth={filled ? 2.2 : 1.8} />
      {showLabel ? (
        <span className="hidden sm:inline">{label}</span>
      ) : null}
    </button>
  );
}

export function FormCreateToolbar({
  saveStatus,
  loading = false,
  fieldCount,
  backHref = '/app/forms',
  onCustomize,
  onSteps,
  onPreview,
  onPublish,
}: FormCreateToolbarProps) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 font-sans">
      <div className="pointer-events-auto flex items-center justify-between gap-2 px-3 pt-2.5 pb-1.5 sm:px-6 lg:pt-4">
        <div
          className={cn(
            'flex min-w-0 items-center gap-2 px-2 py-1.5 sm:px-3 sm:py-2 lg:px-4 lg:py-2.5',
            formsNavGlassClass,
          )}
        >
          <Link
            href={backHref}
            className="inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-1 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] sm:gap-1 sm:px-2"
            aria-label="العودة لتفاصيل النموذج"
          >
            <ChevronRight className="size-4 shrink-0" strokeWidth={2} />
            <span className="hidden sm:inline">رجوع</span>
          </Link>
          <div className="h-4 w-px shrink-0 bg-[var(--border)]/40" aria-hidden />
          <span className="sm:hidden">
            <SaveStatusBadge status={saveStatus} compact />
          </span>
          <span className="hidden sm:inline">
            <SaveStatusBadge status={saveStatus} />
          </span>
          {fieldCount > 0 ? (
            <span className="hidden text-xs text-[var(--muted-foreground)] sm:inline">
              · {fieldCount} {fieldCount === 1 ? 'حقل' : 'حقول'}
            </span>
          ) : null}
        </div>

        <div
          className={cn(
            'ms-auto flex shrink-0 items-center gap-1 px-1.5 py-1 sm:gap-1.5 sm:px-2 sm:py-1.5',
            formsNavGlassClass,
          )}
        >
          <NavActionButton
            label="تخصيص"
            icon={Palette}
            onClick={onCustomize}
            disabled={loading}
          />
          <div className="h-5 w-px bg-[var(--border)]/30" aria-hidden />
          <NavActionButton
            label="معاينة"
            icon={Eye}
            onClick={onPreview}
            disabled={loading}
          />
          <div className="h-5 w-px bg-[var(--border)]/30" aria-hidden />
          <NavActionButton
            label={loading ? 'جاري النشر…' : 'نشر'}
            icon={CircleCheck}
            onClick={onPublish}
            disabled={loading}
            filled
          />
        </div>
      </div>
    </header>
  );
}
