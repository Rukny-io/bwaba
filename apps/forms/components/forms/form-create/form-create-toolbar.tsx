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
import { cn } from '@/lib/utils';

export type FormSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface FormCreateToolbarProps {
  saveStatus: FormSaveStatus;
  loading?: boolean;
  fieldCount: number;
  sectionCount?: number;
  backHref?: string;
  onCustomize: () => void;
  onSections?: () => void;
  onPreview: () => void;
  onPublish: () => void;
}

const toolbarClusterClass =
  'form-create-toolbar-glass inline-flex min-h-10 min-w-0 items-center gap-1 p-1.5 sm:gap-1.5';

const toolbarIconButtonClass =
  'inline-flex h-8 shrink-0 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-black/[0.06] hover:text-[var(--foreground)] dark:hover:bg-white/10 disabled:pointer-events-none disabled:opacity-40';

const toolbarMetaClass =
  'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium leading-none sm:text-xs';

function ToolbarDivider() {
  return (
    <span
      className="mx-0.5 hidden h-5 w-px shrink-0 bg-black/10 dark:bg-white/15 sm:block"
      aria-hidden
    />
  );
}

function SaveStatusBadge({
  status,
  iconOnly = false,
}: {
  status: FormSaveStatus;
  iconOnly?: boolean;
}) {
  if (status === 'saving') {
    return (
      <span
        className={cn(toolbarMetaClass, 'text-[var(--muted-foreground)]')}
        title="جاري الحفظ"
      >
        <Loader2 className="size-3.5 shrink-0 animate-spin" />
        {!iconOnly ? <span className="whitespace-nowrap">جاري الحفظ…</span> : null}
      </span>
    );
  }

  if (status === 'saved') {
    return (
      <span
        className={cn(toolbarMetaClass, 'text-[var(--success)]')}
        title="تم الحفظ"
      >
        <Save className="size-3.5 shrink-0" />
        {!iconOnly ? <span className="whitespace-nowrap">تم الحفظ</span> : null}
      </span>
    );
  }

  if (status === 'error') {
    return (
      <span
        className={cn(toolbarMetaClass, 'text-[var(--danger)]')}
        title="تعذّر الحفظ"
      >
        {!iconOnly ? <span className="whitespace-nowrap">تعذّر الحفظ</span> : <span>!</span>}
      </span>
    );
  }

  return (
    <span
      className={cn(toolbarMetaClass, 'text-[var(--muted-foreground)]')}
      title="يُحفظ تلقائياً"
    >
      <Save className="size-3.5 shrink-0 opacity-55" />
      {!iconOnly ? <span className="whitespace-nowrap">يُحفظ تلقائياً</span> : null}
    </span>
  );
}

function FieldCountMeta({ count }: { count: number }) {
  return (
    <span className={cn(toolbarMetaClass, 'text-[var(--muted-foreground)]')}>
      {count} {count === 1 ? 'حقل' : 'حقول'}
    </span>
  );
}

function ToolbarActionButton({
  label,
  icon: Icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={toolbarIconButtonClass}
    >
      <Icon className="size-4" strokeWidth={1.85} />
    </button>
  );
}

function PublishButton({
  label,
  loading,
  disabled,
  onClick,
}: {
  label: string;
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-[13px] font-semibold leading-none transition-opacity sm:px-3.5',
        'bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-40',
      )}
    >
      <CircleCheck className="size-4 shrink-0" strokeWidth={2.2} />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

export function FormCreateToolbar({
  saveStatus,
  loading = false,
  fieldCount,
  sectionCount = 1,
  backHref = '/app/forms',
  onCustomize,
  onSections,
  onPreview,
  onPublish,
}: FormCreateToolbarProps) {
  const showSections = sectionCount > 1 && onSections;

  return (
    <header className="form-create-toolbar-shell">
      <div className="pointer-events-auto mx-auto flex max-w-3xl items-center justify-between gap-2.5 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:gap-3 sm:px-4 sm:pb-2.5 sm:pt-[max(0.625rem,env(safe-area-inset-top))]">
        <div className={toolbarClusterClass}>
          <Link
            href={backHref}
            className={cn(
              toolbarIconButtonClass,
              'gap-1 px-2.5 text-xs font-medium sm:px-3',
            )}
            aria-label="العودة لتفاصيل النموذج"
          >
            <ChevronRight className="size-4 shrink-0" strokeWidth={2} />
            <span className="hidden whitespace-nowrap sm:inline">رجوع</span>
          </Link>

          <ToolbarDivider />

          <span className="sm:hidden">
            <SaveStatusBadge status={saveStatus} iconOnly />
          </span>
          <span className="hidden sm:inline-flex">
            <SaveStatusBadge status={saveStatus} />
          </span>

          {fieldCount > 0 ? (
            <>
              <ToolbarDivider />
              <FieldCountMeta count={fieldCount} />
            </>
          ) : null}
        </div>

        <div className={cn(toolbarClusterClass, 'shrink-0')}>
          {showSections ? (
            <ToolbarActionButton
              label="الأقسام"
              icon={Layers}
              onClick={onSections}
              disabled={loading}
            />
          ) : null}
          <ToolbarActionButton
            label="تخصيص"
            icon={Palette}
            onClick={onCustomize}
            disabled={loading}
          />
          <ToolbarActionButton
            label="معاينة"
            icon={Eye}
            onClick={onPreview}
            disabled={loading}
          />
          <PublishButton
            label={loading ? 'جاري النشر…' : 'نشر'}
            loading={loading}
            disabled={loading || fieldCount === 0}
            onClick={onPublish}
          />
        </div>
      </div>
    </header>
  );
}
