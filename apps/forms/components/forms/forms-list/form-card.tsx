'use client';

import { memo, useCallback, useState, type SyntheticEvent, type Key } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Copy,
  Edit2,
  ExternalLink,
  Link2,
  MoreHorizontal,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { Avatar, Button, Dropdown, Label, Tooltip } from '@heroui/react';
import type { FormListItem, FormSharedWorkspace, FormStatus } from '@/lib/forms-api';
import { recordFormShare } from '@/lib/forms-api';
import { getPublicFormUrl } from '@/lib/forms-format';
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

const PLACEHOLDER_GRADIENT_CLASS: Record<FormStatus, string> = {
  DRAFT:
    'bg-gradient-to-br from-[color-mix(in_srgb,var(--foreground)_7%,var(--surface))] via-[var(--surface-secondary)]/55 to-[var(--surface)]',
  PUBLISHED:
    'bg-gradient-to-br from-[color-mix(in_srgb,var(--success)_16%,var(--surface))] via-[var(--surface-secondary)]/45 to-[var(--surface)]',
  CLOSED:
    'bg-gradient-to-br from-[color-mix(in_srgb,var(--warning)_14%,var(--surface))] via-[var(--surface-secondary)]/45 to-[var(--surface)]',
  ARCHIVED:
    'bg-gradient-to-br from-[color-mix(in_srgb,var(--foreground)_10%,var(--surface))] via-[var(--surface-secondary)]/40 to-[var(--surface)]',
};

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
      className="absolute top-2 start-2 z-20"
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

function FormCoverPlaceholder({ status }: { status: FormStatus }) {
  return (
    <div
      className={cn(
        'absolute inset-0 transition-colors duration-200',
        PLACEHOLDER_GRADIENT_CLASS[status],
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--border) 55%, transparent) 1px, transparent 0)',
          backgroundSize: '14px 14px',
        }}
        aria-hidden
      />

      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src="/rukny-logo.svg"
          alt=""
          aria-hidden
          className="size-10 object-contain opacity-[0.2] sm:size-11 dark:opacity-[0.26] dark:brightness-0 dark:invert"
        />
      </div>
    </div>
  );
}

function FormCardMenu({
  form,
  isTrash,
  copied,
  onAction,
  onEdit,
  onDuplicate,
  onDelete,
  onRestore,
}: {
  form: FormListItem;
  isTrash?: boolean;
  copied: boolean;
  onAction: (key: Key) => void;
  onEdit?: (form: FormListItem) => void;
  onDuplicate?: (form: FormListItem) => void;
  onDelete?: (form: FormListItem) => void;
  onRestore?: (form: FormListItem) => void;
}) {
  return (
    <Dropdown>
      <Button
        isIconOnly
        size="sm"
        variant="secondary"
        aria-label="إجراءات النموذج"
        className={cn(
          'size-7 min-w-7 rounded-lg border border-[var(--border)]/50 bg-[var(--surface)] text-[var(--muted-foreground)]',
          'transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]',
        )}
      >
        <MoreHorizontal className="size-3.5" />
      </Button>
      <Dropdown.Popover
        placement="bottom end"
        shouldFlip
        offset={8}
        containerPadding={12}
        className="min-w-[12.5rem] text-right [direction:rtl]"
      >
        <Dropdown.Menu onAction={onAction} className="text-right [direction:rtl]">
          {!isTrash && onEdit && (
            <Dropdown.Item id="edit" textValue="تحرير">
              <Edit2 className="size-3.5" />
              <Label>تحرير</Label>
            </Dropdown.Item>
          )}
          {!isTrash && (
            <Dropdown.Item id="copy" textValue="نسخ الرابط">
              {copied ? <Check className="size-3.5" /> : <Link2 className="size-3.5" />}
              <Label>{copied ? 'تم النسخ' : 'نسخ الرابط'}</Label>
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

  const canOpenPublic = !isTrash && form.status === 'PUBLISHED';
  const openButtonLabel = canOpenPublic ? 'فتح' : 'عرض';

  const handleOpenPress = useCallback(() => {
    if (canOpenPublic) {
      openFormPage();
      return;
    }
    onView?.(form);
  }, [canOpenPublic, form, onView, openFormPage]);

  function handleMenuAction(key: Key) {
    switch (key) {
      case 'edit':
        onEdit?.(form);
        break;
      case 'copy':
        void copyFormLink();
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
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className={cn(
        'group dashboard-metric-tile flex cursor-pointer flex-col rounded-2xl p-2.5 transition-[border-color,background-color] duration-200',
        'hover:border-[color-mix(in_srgb,var(--border)_45%,var(--foreground)_12%)]',
        form.isShared && 'border-dashed',
        (form.status === 'ARCHIVED' || isTrash) && 'opacity-[0.94]',
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
          'relative aspect-[4/3] overflow-hidden rounded-xl',
          form.status === 'ARCHIVED' && 'grayscale-[35%]',
        )}
      >
        {showCover ? (
          <>
            <img
              src={form.coverImage!}
              alt=""
              loading="lazy"
              onError={() => setCoverFailed(true)}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
          </>
        ) : (
          <FormCoverPlaceholder status={form.status} />
        )}

        {form.isShared && form.sharedWorkspace ? (
          <FormCardSharedOwnerBadge workspace={form.sharedWorkspace} />
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 px-0.5 pt-2.5 text-start">
        <h3
          dir="auto"
          className="truncate text-[14px] font-semibold leading-[1.35] tracking-tight text-[var(--foreground)]"
          title={form.title}
        >
          {form.title}
        </h3>

        <div className="flex min-w-0 items-center justify-end gap-2">
          <div
            className="flex shrink-0 items-center gap-1"
            onClick={stopActivation}
            onPointerDown={stopActivation}
          >
            <Button
              size="sm"
              variant="outline"
              className="h-7 min-h-7 rounded-full px-2.5 text-[11px] font-medium"
              onPress={handleOpenPress}
            >
              <ExternalLink className="size-3 shrink-0" aria-hidden />
              {openButtonLabel}
            </Button>

            <FormCardMenu
              form={form}
              isTrash={isTrash}
              copied={copied}
              onAction={handleMenuAction}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onRestore={onRestore}
            />
          </div>
        </div>

        {isTrash && form.purgeScheduledAt ? (
          <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
            حذف نهائي:{' '}
            {new Date(form.purgeScheduledAt).toLocaleDateString('ar', {
              month: 'short',
              day: 'numeric',
            })}
          </p>
        ) : null}
      </div>
    </motion.article>
  );
}

export function FormCardSkeleton() {
  return (
    <div className="dashboard-metric-tile animate-pulse rounded-2xl p-2.5">
      <div className="aspect-[4/3] rounded-xl bg-[var(--surface-secondary)]/70" />

      <div className="px-0.5 pt-2.5 text-start">
        <div className="h-3.5 w-[78%] rounded-md bg-[var(--surface-secondary)]/70" />
        <div className="mt-2 flex items-center justify-end gap-2">
          <div className="flex gap-1">
            <div className="h-7 w-14 rounded-full bg-[var(--surface-secondary)]/45" />
            <div className="size-7 rounded-lg bg-[var(--surface-secondary)]/45" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FormsGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <FormCardSkeleton key={index} />
      ))}
    </div>
  );
}

export const FormCard = memo(FormCardComponent);
