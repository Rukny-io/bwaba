'use client';

import { memo, useCallback, useState, type SyntheticEvent, type Key } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Copy,
  Edit2,
  ExternalLink,
  Eye,
  Link2,
  MessageSquare,
  MoreHorizontal,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { Avatar, Button, Dropdown, Label, Tooltip } from '@heroui/react';
import type { FormListItem, FormSharedWorkspace } from '@/lib/forms-api';
import { recordFormShare } from '@/lib/forms-api';
import {
  FORM_STATUS_LABELS,
  FORM_TYPE_LABELS,
  getPublicFormUrl,
} from '@/lib/forms-format';
import { resolveMediaUrl } from '@/lib/media-url';
import { cn } from '@/lib/utils';

interface FormCardProps {
  form: FormListItem;
  busy?: boolean;
  isTrash?: boolean;
  onView?: (form: FormListItem) => void;
  onEdit?: (form: FormListItem) => void;
  onDelete?: (form: FormListItem) => void;
  onRestore?: (form: FormListItem) => void;
  onDuplicate?: (form: FormListItem) => void;
}

function stopActivation(event: SyntheticEvent) {
  event.stopPropagation();
}

function FormCardSharedOwnerBadge({
  workspace,
}: {
  workspace: FormSharedWorkspace;
}) {
  const displayName = workspace.name.trim() || 'عضو الفريق';
  const initials = displayName.charAt(0).toUpperCase();
  const avatarSrc = resolveMediaUrl(workspace.avatar);

  return (
    <div
      className="absolute top-2 end-2 z-20"
      onClick={stopActivation}
      onPointerDown={stopActivation}
    >
      <Tooltip delay={200}>
        <Tooltip.Trigger
          aria-label={displayName}
          className="rounded-full ring-2 ring-[var(--surface)]/95"
        >
          <Avatar size="sm" variant="soft">
            {avatarSrc ? (
              <Avatar.Image src={avatarSrc} alt={displayName} />
            ) : null}
            <Avatar.Fallback delayMs={avatarSrc ? 600 : 0}>
              {initials}
            </Avatar.Fallback>
          </Avatar>
        </Tooltip.Trigger>
        <Tooltip.Content placement="bottom" showArrow offset={8}>
          <Tooltip.Arrow />
          <span className="text-xs font-semibold">{displayName}</span>
        </Tooltip.Content>
      </Tooltip>
    </div>
  );
}

function FormCardComponent({
  form,
  busy,
  isTrash,
  onView,
  onEdit,
  onDelete,
  onRestore,
  onDuplicate,
}: FormCardProps) {
  const submissionsCount = form._count?.submissions ?? form.submissionCount ?? 0;
  const [copied, setCopied] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const showCover = Boolean(form.coverImage) && !coverFailed;

  const copyFormLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getPublicFormUrl(form.slug));
      setCopied(true);
      void recordFormShare(form.id).catch(() => undefined);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, [form.id, form.slug]);

  const openFormPage = useCallback(() => {
    window.open(getPublicFormUrl(form.slug), '_blank', 'noopener,noreferrer');
  }, [form.slug]);

  function handleMenuAction(key: Key) {
    switch (key) {
      case 'edit':
        onEdit?.(form);
        break;
      case 'copy':
        void copyFormLink();
        break;
      case 'open':
        openFormPage();
        break;
      case 'duplicate':
        onDuplicate?.(form);
        break;
      case 'delete':
        onDelete?.(form);
        break;
      case 'restore':
        onRestore?.(form);
        break;
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ y: -1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group dashboard-card cursor-pointer rounded-2xl bg-[var(--surface)] p-2.5 sm:rounded-3xl sm:p-3',
        'transition-[border-color,box-shadow] duration-200',
        'hover:border-[color-mix(in_srgb,var(--foreground)_10%,var(--border))]',
        'hover:shadow-[var(--card-shadow-hover)]',
        form.isShared && 'border-dashed',
        (form.status === 'ARCHIVED' || isTrash) && 'opacity-[0.92]',
        busy && 'pointer-events-none opacity-60',
      )}
      onClick={() => onView?.(form)}
      role="button"
      tabIndex={0}
      aria-label={`فتح ${form.title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onView?.(form);
        }
      }}
    >
      <div
        className={cn(
          'relative mb-2.5 aspect-[16/10] overflow-hidden rounded-xl sm:mb-3 sm:aspect-[4/3] sm:rounded-2xl',
          form.status === 'ARCHIVED' && 'grayscale-[40%]',
        )}
      >
        {showCover ? (
          <>
            <img
              src={form.coverImage!}
              alt={form.title}
              loading="lazy"
              onError={() => setCoverFailed(true)}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-black/5" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--foreground)_5%,var(--surface))] transition-colors duration-200 group-hover:bg-[color-mix(in_srgb,var(--foreground)_7%,var(--surface))]">
            <img
              src="/rukny-logo.svg"
              alt=""
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 size-[30%] max-h-10 max-w-10 -translate-x-1/2 -translate-y-1/2 opacity-[0.1] dark:opacity-[0.14] dark:brightness-0 dark:invert"
            />
          </div>
        )}

        <span className="absolute top-2 start-2 z-20 rounded-lg bg-[var(--surface)]/95 px-2 py-0.5 text-[10px] font-semibold text-[var(--foreground)] shadow-sm backdrop-blur-sm sm:top-2.5 sm:start-2.5 sm:px-2.5 sm:py-1">
          {isTrash ? 'محذوف' : FORM_STATUS_LABELS[form.status]}
        </span>

        {form.isShared && form.sharedWorkspace ? (
          <FormCardSharedOwnerBadge workspace={form.sharedWorkspace} />
        ) : null}

        <div
          className="absolute bottom-2 start-2 z-30"
          onClick={stopActivation}
          onPointerDown={stopActivation}
        >
          <Dropdown>
            <Button
              isIconOnly
              size="sm"
              variant="secondary"
              aria-label="إجراءات النموذج"
              className={cn(
                'size-7 min-w-7 rounded-lg bg-[var(--surface)]/90 text-[var(--muted-foreground)] shadow-sm backdrop-blur-sm',
                'opacity-100 transition-all duration-200 hover:bg-[var(--surface)] hover:text-[var(--foreground)]',
                'sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 sm:data-[pressed]:opacity-100',
              )}
            >
              <MoreHorizontal className="size-3.5" />
            </Button>
            <Dropdown.Popover placement="top end">
              <Dropdown.Menu onAction={handleMenuAction}>
                {!isTrash && onEdit && (
                  <Dropdown.Item id="edit" textValue="تحرير">
                    <Edit2 className="size-3.5" />
                    <Label>تحرير</Label>
                  </Dropdown.Item>
                )}
                {!isTrash && (
                  <Dropdown.Item id="copy" textValue="نسخ الرابط">
                    {copied ? (
                      <Check className="size-3.5" />
                    ) : (
                      <Link2 className="size-3.5" />
                    )}
                    <Label>{copied ? 'تم النسخ' : 'نسخ الرابط'}</Label>
                  </Dropdown.Item>
                )}
                {!isTrash && form.status === 'PUBLISHED' && (
                  <Dropdown.Item id="open" textValue="فتح النموذج">
                    <ExternalLink className="size-3.5" />
                    <Label>فتح النموذج</Label>
                  </Dropdown.Item>
                )}
                {!isTrash && onDuplicate && !form.isShared && (
                  <Dropdown.Item id="duplicate" textValue="نسخ">
                    <Copy className="size-3.5" />
                    <Label>نسخ النموذج</Label>
                  </Dropdown.Item>
                )}
                {!isTrash && onDelete && !form.isShared && (
                  <Dropdown.Item id="delete" textValue="حذف" variant="danger">
                    <Trash2 className="size-3.5" />
                    <Label>حذف</Label>
                  </Dropdown.Item>
                )}
                {isTrash && onRestore && !form.isShared && (
                  <Dropdown.Item id="restore" textValue="استعادة">
                    <RotateCcw className="size-3.5" />
                    <Label>استعادة</Label>
                  </Dropdown.Item>
                )}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </div>

      <div className="px-0.5 text-right sm:px-1">
        <div className="mb-1 flex items-center justify-between gap-1.5 sm:mb-1.5 sm:gap-2">
          <h3 className="min-w-0 flex-1 truncate text-[13px] font-semibold leading-snug text-[var(--foreground)] sm:text-[14px]">
            {form.title}
          </h3>
          <span className="shrink-0 whitespace-nowrap rounded-md bg-[var(--surface-secondary)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--muted-foreground)] sm:rounded-md sm:px-2">
            {FORM_TYPE_LABELS[form.type]}
          </span>
        </div>

        <p
          className={cn(
            'mb-2 line-clamp-2 text-[11px] leading-relaxed sm:mb-3 sm:text-[12px]',
            form.description
              ? 'text-[var(--muted-foreground)]'
              : 'text-[var(--muted-foreground)]/55 italic',
          )}
        >
          {form.description || 'بدون وصف'}
        </p>

        {isTrash && form.purgeScheduledAt ? (
          <p className="mb-1.5 text-[10px] text-[var(--muted-foreground)]">
            حذف نهائي:{' '}
            {new Date(form.purgeScheduledAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </p>
        ) : null}

        <div className="flex items-center justify-center gap-3 border-t border-[var(--separator)] pt-2 text-[11px] tabular-nums text-[var(--muted-foreground)] sm:pt-2.5">
          <span
            className="inline-flex items-center gap-1 leading-none"
            title="الاستجابات"
          >
            <MessageSquare className="size-3 shrink-0" aria-hidden />
            <span dir="ltr" lang="en" className="leading-none">
              {submissionsCount}
            </span>
          </span>

          <span className="text-[var(--border)]" aria-hidden>
            |
          </span>

          <span
            className="inline-flex items-center gap-1 leading-none"
            title="المشاهدات"
          >
            <Eye className="size-3 shrink-0" aria-hidden />
            <span dir="ltr" lang="en" className="leading-none">
              {form.viewCount ?? 0}
            </span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function FormCardSkeleton() {
  return (
    <div className="dashboard-card animate-pulse rounded-2xl p-2.5 sm:rounded-3xl sm:p-3">
      <div className="relative mb-2.5 aspect-[16/10] rounded-xl bg-[var(--surface-secondary)] sm:mb-3 sm:aspect-[4/3] sm:rounded-2xl" />

      <div className="px-0.5 text-right sm:px-1">
        <div className="mb-1 flex items-center justify-between gap-1.5 sm:mb-1.5">
          <div className="h-3.5 flex-1 rounded-md bg-[var(--surface-secondary)]/70 sm:h-4" />
          <div className="h-5 w-12 rounded-md bg-[var(--surface-secondary)]/40" />
        </div>

        <div className="mb-2 space-y-1 sm:mb-3">
          <div className="h-3 w-full rounded-md bg-[var(--surface-secondary)]/40" />
          <div className="h-3 w-3/4 rounded-md bg-[var(--surface-secondary)]/40" />
        </div>

        <div className="flex items-center justify-center gap-3 border-t border-[var(--separator)] pt-2 sm:pt-2.5">
          <div className="h-3 w-7 rounded-md bg-[var(--surface-secondary)]/40" />
          <div className="h-3 w-px bg-[var(--border)]/40" />
          <div className="h-3 w-7 rounded-md bg-[var(--surface-secondary)]/40" />
        </div>
      </div>
    </div>
  );
}

export function FormsGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <FormCardSkeleton key={index} />
      ))}
    </div>
  );
}

export const FormCard = memo(FormCardComponent);
