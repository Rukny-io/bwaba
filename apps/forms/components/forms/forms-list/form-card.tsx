'use client';

import { memo, useCallback, useState, type SyntheticEvent, type Key } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Copy,
  Edit2,
  ExternalLink,
  Eye,
  FormInput,
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
    <Tooltip delay={200}>
      <Tooltip.Trigger
        aria-label={displayName}
        className="rounded-full ring-1 ring-[var(--border)]"
        onClick={stopActivation}
        onPointerDown={stopActivation}
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
  const fieldsCount = form._count?.fields ?? 0;
  const [copied, setCopied] = useState(false);

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
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group dashboard-card dashboard-card-interactive cursor-pointer rounded-3xl p-4 sm:p-3',
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
      <div className="mb-3 flex items-center justify-between gap-2 sm:mb-2.5">
        <span className="rounded-lg bg-[var(--surface-secondary)] px-2.5 py-1 text-[10px] font-semibold text-[var(--muted-foreground)] sm:text-[11px]">
          {isTrash ? 'محذوف' : FORM_STATUS_LABELS[form.status]}
        </span>

        <div
          className="flex items-center gap-1.5"
          onClick={stopActivation}
          onPointerDown={stopActivation}
        >
          {form.isShared && form.sharedWorkspace ? (
            <FormCardSharedOwnerBadge workspace={form.sharedWorkspace} />
          ) : null}

          <Dropdown>
            <Button
              isIconOnly
              size="sm"
              variant="tertiary"
              aria-label="إجراءات النموذج"
              className={cn(
                'size-8 min-w-8 rounded-lg text-[var(--muted-foreground)] sm:size-7 sm:min-w-7',
                'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 sm:data-[pressed]:opacity-100',
              )}
            >
              <MoreHorizontal className="size-4" />
            </Button>
            <Dropdown.Popover placement="bottom end">
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
        <div className="mb-2 flex items-center justify-between gap-2 sm:mb-1.5">
          <h3 className="min-w-0 flex-1 truncate text-[16px] font-semibold leading-snug text-[var(--foreground)] sm:text-[14px]">
            {form.title}
          </h3>
          <span className="shrink-0 whitespace-nowrap rounded-lg bg-[var(--surface-secondary)] px-2.5 py-1 text-[11px] font-semibold text-[var(--muted-foreground)] sm:rounded-md sm:px-2 sm:py-0.5 sm:text-[10px]">
            {FORM_TYPE_LABELS[form.type]}
          </span>
        </div>

        <p
          className={cn(
            'mb-3.5 line-clamp-2 text-[13px] leading-relaxed sm:mb-3 sm:text-[12px]',
            form.description
              ? 'text-[var(--muted-foreground)]'
              : 'text-[var(--muted-foreground)]/55 italic',
          )}
        >
          {form.description || 'بدون وصف'}
        </p>

        {isTrash && form.purgeScheduledAt ? (
          <p className="mb-2 text-[11px] text-[var(--muted-foreground)] sm:text-[10px]">
            حذف نهائي:{' '}
            {new Date(form.purgeScheduledAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-2 border-t border-[var(--separator)] pt-3 text-[12px] text-[var(--muted-foreground)] sm:pt-2.5 sm:text-[11px]">
          <span className="inline-flex items-center gap-1.5" title="الاستجابات">
            <MessageSquare className="size-3.5 sm:size-3" aria-hidden />
            <span dir="ltr" lang="en">
              {submissionsCount}
            </span>
          </span>

          <span className="inline-flex items-center gap-1.5" title="المشاهدات">
            <Eye className="size-3.5 sm:size-3" aria-hidden />
            <span dir="ltr" lang="en">
              {form.viewCount ?? 0}
            </span>
          </span>

          <span className="inline-flex items-center gap-1.5" title="الحقول">
            <FormInput className="size-3.5 sm:size-3" aria-hidden />
            <span dir="ltr" lang="en">
              {fieldsCount}
            </span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function FormCardSkeleton() {
  return (
    <div className="dashboard-card animate-pulse rounded-3xl p-4 sm:p-3">
      <div className="mb-3 flex items-center justify-between gap-2 sm:mb-2.5">
        <div className="h-6 w-16 rounded-lg bg-[var(--surface-secondary)]/70 sm:h-5 sm:w-14" />
        <div className="size-8 rounded-lg bg-[var(--surface-secondary)]/40 sm:size-7" />
      </div>

      <div className="px-1 text-right">
        <div className="mb-2 flex items-center justify-between gap-2 sm:mb-1.5">
          <div className="h-5 flex-1 rounded-md bg-[var(--surface-secondary)]/70 sm:h-4" />
          <div className="h-6 w-16 rounded-lg bg-[var(--surface-secondary)]/40 sm:h-5 sm:w-14 sm:rounded-md" />
        </div>

        <div className="mb-3.5 space-y-1.5 sm:mb-3">
          <div className="h-3.5 w-full rounded-md bg-[var(--surface-secondary)]/40 sm:h-3" />
          <div className="h-3.5 w-3/4 rounded-md bg-[var(--surface-secondary)]/40 sm:h-3" />
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-[var(--separator)] pt-3 sm:pt-2.5">
          <div className="h-3 w-8 rounded-md bg-[var(--surface-secondary)]/40" />
          <div className="h-3 w-8 rounded-md bg-[var(--surface-secondary)]/40" />
          <div className="h-3 w-8 rounded-md bg-[var(--surface-secondary)]/40" />
        </div>
      </div>
    </div>
  );
}

export function FormsGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <FormCardSkeleton key={index} />
      ))}
    </div>
  );
}

export const FormCard = memo(FormCardComponent);
