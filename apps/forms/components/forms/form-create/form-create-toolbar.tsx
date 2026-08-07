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
  'form-create-toolbar-glass inline-flex min-w-0 items-center gap-0.5 p-1 sm:min-h-10 sm:gap-1.5 sm:p-1.5';

const toolbarIconButtonClass =
  'inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-black/[0.06] hover:text-[var(--foreground)] dark:hover:bg-white/10 disabled:pointer-events-none disabled:opacity-40 sm:size-8';

const toolbarMetaClass =
  'inline-flex size-9 shrink-0 items-center justify-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium leading-none sm:h-8 sm:text-xs';

function ToolbarDivider({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'mx-0.5 h-5 w-px shrink-0 bg-black/10 dark:bg-white/15',
        className,
      )}
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
    <span className={cn(toolbarMetaClass, 'hidden text-[var(--muted-foreground)] sm:inline-flex')}>
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
  disabled,
  onClick,
  className,
}: {
  label: string;
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold leading-none transition-opacity sm:h-8 sm:px-3.5 sm:text-[13px]',
        'bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-40',
        className,
      )}
    >
      <CircleCheck className="size-4 shrink-0 sm:size-4" strokeWidth={2.2} />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

function ToolbarSecondaryActions({
  showSections,
  loading,
  onSections,
  onCustomize,
  onPreview,
}: {
  showSections: boolean;
  loading: boolean;
  onSections?: () => void;
  onCustomize: () => void;
  onPreview: () => void;
}) {
  return (
    <>
      {showSections && onSections ? (
        <>
          <ToolbarActionButton
            label="الأقسام"
            icon={Layers}
            onClick={onSections}
            disabled={loading}
          />
          <ToolbarDivider />
        </>
      ) : null}
      <ToolbarActionButton
        label="تخصيص"
        icon={Palette}
        onClick={onCustomize}
        disabled={loading}
      />
      <ToolbarDivider />
      <ToolbarActionButton
        label="معاينة"
        icon={Eye}
        onClick={onPreview}
        disabled={loading}
      />
    </>
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
      <div className="pointer-events-auto mx-auto flex max-w-3xl items-center justify-between gap-2 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:gap-3 sm:px-4 sm:pb-2.5 sm:pt-[max(0.625rem,env(safe-area-inset-top))]">
        <div className={cn(toolbarClusterClass, 'min-h-11 sm:min-h-10')}>
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
              <ToolbarDivider className="hidden sm:block" />
              <FieldCountMeta count={fieldCount} />
            </>
          ) : null}
        </div>

        {/* Mobile: أيقونات في حبة زجاجية + زر نشر بارز خارجها */}
        <div className="flex shrink-0 items-center gap-2 sm:hidden">
          <div className={cn(toolbarClusterClass, 'min-h-11')}>
            <ToolbarSecondaryActions
              showSections={Boolean(showSections)}
              loading={loading}
              onSections={onSections}
              onCustomize={onCustomize}
              onPreview={onPreview}
            />
          </div>
          <PublishButton
            label={loading ? '…' : 'نشر'}
            loading={loading}
            disabled={loading || fieldCount === 0}
            onClick={onPublish}
          />
        </div>

        {/* Desktop: كل الإجراءات في حبة واحدة */}
        <div className={cn(toolbarClusterClass, 'hidden shrink-0 sm:inline-flex')}>
          <ToolbarSecondaryActions
            showSections={Boolean(showSections)}
            loading={loading}
            onSections={onSections}
            onCustomize={onCustomize}
            onPreview={onPreview}
          />
          <ToolbarDivider />
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
