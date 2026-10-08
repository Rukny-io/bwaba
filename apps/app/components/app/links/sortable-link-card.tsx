'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Reorder, useDragControls } from 'framer-motion';
import {
  BarChart3,
  Bell,
  CalendarClock,
  ExternalLink,
  Folder,
  Grip,
  Lock,
  Pencil,
  Star,
  Trash2,
} from 'lucide-react';
import { Button, Popover, Switch } from '@heroui/react';
import { LinkThumbnailControl } from '@/components/app/links/link-thumbnail-control';
import { LinkPlatformIconBadge } from '@/components/app/links/platform-icons/link-platform-icon-badge';
import { formatNumber } from '@/lib/dashboard-format';
import {
  getLinkDisplayLabel,
  resolveCatalogTypeForLink,
} from '@/lib/links/resolve-platform';
import {
  linksCardClass,
  linksPressableClass,
  linksToolBtnClass,
} from '@/components/app/links/links-interaction';
import type { LinkGroup, SocialLink, UpdateSocialLinkInput } from '@/lib/links/types';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface SortableLinkCardProps {
  link: SocialLink;
  busyId: string | null;
  sortable?: boolean;
  groups?: LinkGroup[];
  onToggleStatus: (link: SocialLink) => void;
  onTogglePin: (link: SocialLink) => void;
  onToggleNotify: (link: SocialLink) => void;
  onQuickUpdate: (link: SocialLink, patch: UpdateSocialLinkInput) => Promise<void>;
  onDelete: (link: SocialLink) => void;
  onMoveToGroup?: (link: SocialLink, groupId: string | null) => void;
  onLinkUpdated?: (link: SocialLink) => void;
  onThumbnailError?: (message: string) => void;
}

const reorderTransition = {
  type: 'spring' as const,
  stiffness: 520,
  damping: 38,
  mass: 0.55,
};

function formatLinkUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.href.replace(/\/$/, '');
  } catch {
    return url;
  }
}

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): string | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function SortableLinkCard({
  link,
  busyId,
  sortable = true,
  groups = [],
  onToggleStatus,
  onTogglePin,
  onToggleNotify,
  onQuickUpdate,
  onDelete,
  onMoveToGroup,
  onLinkUpdated,
  onThumbnailError,
}: SortableLinkCardProps) {
  const { t } = useTranslations();
  const router = useRouter();
  const dragControls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);
  const [editTitle, setEditTitle] = useState(link.title || '');
  const [editUrl, setEditUrl] = useState(link.url);
  const [scheduleStart, setScheduleStart] = useState(toDatetimeLocalValue(link.scheduledStartAt));
  const [scheduleEnd, setScheduleEnd] = useState(toDatetimeLocalValue(link.scheduledEndAt));
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const catalogType = resolveCatalogTypeForLink(link);
  const label = getLinkDisplayLabel(link);
  const isHidden = link.status === 'hidden';
  const isBusy = busyId === link.id || busyId === 'reorder' || saving;
  const isBlock = catalogType === 'header' || catalogType === 'text';
  const displayUrl = isBlock ? t('linksPage.textBlock') : formatLinkUrl(link.url);
  const isScheduled = Boolean(link.scheduledStartAt || link.scheduledEndAt);
  const isProtected = Boolean(link.isLocked || link.isPasswordProtected);

  useEffect(() => {
    setEditTitle(link.title || '');
    setEditUrl(link.url);
    setScheduleStart(toDatetimeLocalValue(link.scheduledStartAt));
    setScheduleEnd(toDatetimeLocalValue(link.scheduledEndAt));
  }, [link.title, link.url, link.scheduledStartAt, link.scheduledEndAt]);

  const clearDragChrome = useCallback(() => {
    document.body.style.removeProperty('user-select');
    document.body.style.removeProperty('cursor');
  }, []);

  useEffect(() => () => clearDragChrome(), [clearDragChrome]);

  const openInsights = useCallback(() => {
    router.push(`/app/links/${link.id}?tab=insights`);
  }, [link.id, router]);

  const openDetail = useCallback(() => {
    router.push(`/app/links/${link.id}`);
  }, [link.id, router]);

  async function runSave(patch: UpdateSocialLinkInput) {
    setSaving(true);
    try {
      await onQuickUpdate(link, patch);
    } finally {
      setSaving(false);
    }
  }

  const cardClassName = cn(
    'group/link relative list-none w-full',
    'rounded-2xl border border-[var(--border)] bg-[var(--surface)]',
    linksCardClass,
    'hover:border-[color-mix(in_srgb,var(--border)_50%,var(--foreground)_50%)]',
    isHidden && 'opacity-70',
    isDragging &&
      'z-20 scale-[1.01] border-[color-mix(in_srgb,var(--border)_35%,var(--primary)_65%)] bg-[var(--surface)] shadow-[0_12px_32px_-12px_rgba(0,0,0,0.18)] active:scale-[1.01]',
  );

  function renderEditPopover() {
    return (
      <Popover.Content placement="top start" className="w-[min(22rem,calc(100vw-2rem))]">
        <Popover.Dialog className="flex flex-col gap-3 p-3">
          <Popover.Heading className="text-sm font-semibold">تعديل الرابط</Popover.Heading>
          <label className="flex flex-col gap-1.5 text-xs text-[var(--muted-foreground)]">
            العنوان
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="h-9 rounded-lg border border-[var(--border)] bg-transparent px-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--foreground)]"
            />
          </label>
          {!isBlock ? (
            <label className="flex flex-col gap-1.5 text-xs text-[var(--muted-foreground)]">
              الرابط
              <input
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                dir="ltr"
                className="h-9 rounded-lg border border-[var(--border)] bg-transparent px-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--foreground)]"
              />
            </label>
          ) : null}
          <Button
            isDisabled={isBusy}
            className="h-9 rounded-lg bg-[var(--primary)] text-sm font-semibold text-[var(--primary-foreground)]"
            onPress={() =>
              void runSave({
                title: editTitle.trim() || undefined,
                ...(isBlock ? {} : { url: editUrl.trim() }),
              })
            }
          >
            حفظ
          </Button>
        </Popover.Dialog>
      </Popover.Content>
    );
  }

  const content = (
    <div className="flex gap-1 p-2.5 sm:gap-2 sm:p-4">
      {sortable ? (
        <button
          type="button"
          className={cn(
            'mt-0.5 flex size-9 shrink-0 touch-none cursor-grab items-center justify-center rounded-lg sm:size-8',
            'text-[var(--muted-foreground)]/55 transition-[color,background-color,transform] duration-150',
            'hover:bg-[var(--surface-secondary)] hover:text-[var(--muted-foreground)]',
            'active:scale-95 active:cursor-grabbing active:bg-[var(--surface-secondary)]',
            isDragging && 'cursor-grabbing scale-100 text-[var(--foreground)]',
          )}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            dragControls.start(e);
          }}
          aria-label={t('linksPage.dragReorder')}
        >
          <Grip className="size-4" strokeWidth={1.75} aria-hidden />
        </button>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col gap-2.5 sm:gap-3">
        <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
          {!isBlock ? (
            <LinkThumbnailControl
              link={link}
              catalogType={catalogType}
              disabled={isBusy}
              variant="thumb"
              onUpdated={(updated) => onLinkUpdated?.(updated)}
              onError={onThumbnailError}
            />
          ) : (
            <LinkPlatformIconBadge type={catalogType} size="md" className="size-10 rounded-full sm:size-12" />
          )}

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex min-w-0 items-center gap-0.5">
              <button
                type="button"
                onClick={openDetail}
                className={cn(
                  'group/title min-w-0 flex-1 rounded-lg px-1 py-0.5 text-start -mx-1',
                  linksPressableClass,
                )}
              >
                <span className="block min-w-0 truncate text-sm font-semibold text-[var(--foreground)] sm:text-[0.95rem]">
                  {label}
                </span>
              </button>
              <Popover>
                <Popover.Trigger>
                  <button
                    type="button"
                    className={cn(linksToolBtnClass, 'size-8 sm:opacity-0 sm:group-hover/link:opacity-100')}
                    aria-label={t('linksPage.quickEdit')}
                    disabled={isBusy}
                  >
                    <Pencil className="size-3.5" strokeWidth={1.75} aria-hidden />
                  </button>
                </Popover.Trigger>
                {renderEditPopover()}
              </Popover>
            </div>

            <button
              type="button"
              onClick={openDetail}
              className={cn(
                'group/url w-full max-w-full rounded-lg px-1 py-0.5 text-start -mx-1',
                linksPressableClass,
              )}
            >
              <span
                className="block min-w-0 truncate text-xs text-[var(--muted-foreground)] sm:text-[13px]"
                dir="ltr"
              >
                {displayUrl}
              </span>
            </button>
          </div>
        </div>

        <div
          className="flex items-center justify-between gap-2 border-t border-[var(--border)]/70 pt-2 sm:border-0 sm:pt-0"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div
            className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto overscroll-x-contain scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {!isBlock ? (
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className={linksToolBtnClass}
                aria-label={t('linksPage.openLink')}
              >
                <ExternalLink className="size-4" strokeWidth={1.75} aria-hidden />
              </a>
            ) : null}

            <button
              type="button"
              className={cn(
                linksToolBtnClass,
                link.isPinned && 'text-amber-500 hover:text-amber-600',
              )}
              aria-label={link.isPinned ? t('linksPage.unpin') : t('linksPage.pin')}
              disabled={isBusy}
              onClick={() => onTogglePin(link)}
            >
              <Star
                className={cn(
                  'size-4 transition-transform duration-200 ease-out',
                  link.isPinned && 'scale-110',
                )}
                strokeWidth={1.75}
                fill={link.isPinned ? 'currentColor' : 'none'}
                aria-hidden
              />
            </button>

            {onMoveToGroup && groups.length > 0 ? (
              <Popover>
                <Popover.Trigger>
                  <button
                    type="button"
                    className={cn(linksToolBtnClass, link.groupId && 'text-[var(--foreground)]')}
                    aria-label={t('linksPage.moveToGroup')}
                    disabled={isBusy}
                  >
                    <Folder className="size-4" strokeWidth={1.75} aria-hidden />
                  </button>
                </Popover.Trigger>
                <Popover.Content placement="bottom start" className="w-[min(16rem,calc(100vw-2rem))]">
                  <Popover.Dialog className="flex flex-col gap-1 p-2">
                    <Popover.Heading className="px-2 py-1 text-xs font-semibold text-[var(--muted-foreground)]">
                      {t('linksPage.moveToGroup')}
                    </Popover.Heading>
                    <button
                      type="button"
                      className={cn(
                        'rounded-lg px-2.5 py-2 text-start text-sm',
                        !link.groupId
                          ? 'bg-[var(--surface-secondary)] font-semibold'
                          : 'hover:bg-[var(--surface-secondary)]',
                      )}
                      onClick={() => onMoveToGroup(link, null)}
                    >
                      {t('linksPage.noGroup')}
                    </button>
                    {groups.map((group) => (
                      <button
                        key={group.id}
                        type="button"
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-2.5 py-2 text-start text-sm',
                          link.groupId === group.id
                            ? 'bg-[var(--surface-secondary)] font-semibold'
                            : 'hover:bg-[var(--surface-secondary)]',
                        )}
                        onClick={() => onMoveToGroup(link, group.id)}
                      >
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: group.color }}
                          aria-hidden
                        />
                        <span className="min-w-0 truncate">{group.nameAr || group.name}</span>
                      </button>
                    ))}
                  </Popover.Dialog>
                </Popover.Content>
              </Popover>
            ) : null}

            <Popover>
              <Popover.Trigger>
                <button
                  type="button"
                  className={cn(linksToolBtnClass, isScheduled && 'text-[var(--foreground)]')}
                  aria-label={t('linksPage.schedule')}
                  disabled={isBusy}
                >
                  <CalendarClock className="size-4" strokeWidth={1.75} aria-hidden />
                </button>
              </Popover.Trigger>
              <Popover.Content placement="bottom start" className="w-[min(22rem,calc(100vw-2rem))]">
                <Popover.Dialog className="flex flex-col gap-3 p-3">
                  <Popover.Heading className="text-sm font-semibold">جدولة الظهور</Popover.Heading>
                  <label className="flex flex-col gap-1.5 text-xs text-[var(--muted-foreground)]">
                    يبدأ في
                    <input
                      type="datetime-local"
                      value={scheduleStart}
                      onChange={(e) => setScheduleStart(e.target.value)}
                      className="h-9 rounded-lg border border-[var(--border)] bg-transparent px-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--foreground)]"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs text-[var(--muted-foreground)]">
                    ينتهي في
                    <input
                      type="datetime-local"
                      value={scheduleEnd}
                      onChange={(e) => setScheduleEnd(e.target.value)}
                      className="h-9 rounded-lg border border-[var(--border)] bg-transparent px-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--foreground)]"
                    />
                  </label>
                  <div className="flex gap-2">
                    <Button
                      isDisabled={isBusy}
                      className="h-9 flex-1 rounded-lg bg-[var(--primary)] text-sm font-semibold text-[var(--primary-foreground)]"
                      onPress={() =>
                        void runSave({
                          scheduledStartAt: fromDatetimeLocalValue(scheduleStart),
                          scheduledEndAt: fromDatetimeLocalValue(scheduleEnd),
                        })
                      }
                    >
                      حفظ
                    </Button>
                    <Button
                      isDisabled={isBusy}
                      variant="secondary"
                      className="h-9 rounded-lg text-sm"
                      onPress={() => {
                        setScheduleStart('');
                        setScheduleEnd('');
                        void runSave({
                          scheduledStartAt: null,
                          scheduledEndAt: null,
                        });
                      }}
                    >
                      مسح
                    </Button>
                  </div>
                </Popover.Dialog>
              </Popover.Content>
            </Popover>

            <Popover>
              <Popover.Trigger>
                <button
                  type="button"
                  className={cn(linksToolBtnClass, isProtected && 'text-[var(--foreground)]')}
                  aria-label={t('linksPage.lockLink')}
                  disabled={isBusy}
                >
                  <Lock className="size-4" strokeWidth={1.75} aria-hidden />
                </button>
              </Popover.Trigger>
              <Popover.Content placement="bottom start" className="w-[min(22rem,calc(100vw-2rem))]">
                <Popover.Dialog className="flex flex-col gap-3 p-3">
                  <Popover.Heading className="text-sm font-semibold">قفل الرابط</Popover.Heading>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {isProtected
                      ? t('linksPage.lockActive')
                      : t('linksPage.lockHint')}
                  </p>
                  <label className="flex flex-col gap-1.5 text-xs text-[var(--muted-foreground)]">
                    كلمة المرور
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-9 rounded-lg border border-[var(--border)] bg-transparent px-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--foreground)]"
                    />
                  </label>
                  <div className="flex gap-2">
                    <Button
                      isDisabled={isBusy || password.trim().length < 4}
                      className="h-9 flex-1 rounded-lg bg-[var(--primary)] text-sm font-semibold text-[var(--primary-foreground)]"
                      onPress={() => {
                        void runSave({ password: password.trim() }).then(() => setPassword(''));
                      }}
                    >
                      {isProtected ? t('linksPage.changeLock') : t('linksPage.enableLock')}
                    </Button>
                    {isProtected ? (
                      <Button
                        isDisabled={isBusy}
                        variant="secondary"
                        className="h-9 rounded-lg text-sm"
                        onPress={() =>
                          void runSave({ clearPassword: true, isLocked: false }).then(() =>
                            setPassword(''),
                          )
                        }
                      >
                        إزالة
                      </Button>
                    ) : null}
                  </div>
                </Popover.Dialog>
              </Popover.Content>
            </Popover>

            {!isBlock ? (
              <button
                type="button"
                className={cn(
                  linksToolBtnClass,
                  'h-8 w-auto gap-1.5 px-2 text-xs font-medium',
                )}
                aria-label={`${formatNumber(link.totalClicks)} نقرة`}
                onClick={openInsights}
              >
                <BarChart3 className="size-4" strokeWidth={1.75} aria-hidden />
                <span className="tabular-nums">
                  {formatNumber(link.totalClicks)} نقرة
                </span>
              </button>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              className={cn(
                linksToolBtnClass,
                link.notifyOnClick && 'text-[var(--foreground)]',
              )}
              aria-label={link.notifyOnClick ? t('linksPage.notifyOff') : t('linksPage.notifyOn')}
              disabled={isBusy}
              onClick={() => onToggleNotify(link)}
            >
              <Bell
                className={cn(
                  'size-4 transition-transform duration-200 ease-out',
                  link.notifyOnClick && 'scale-110',
                )}
                strokeWidth={1.75}
                fill={link.notifyOnClick ? 'currentColor' : 'none'}
                aria-hidden
              />
            </button>

            <Switch
              isSelected={!isHidden}
              isDisabled={isBusy}
              onChange={() => onToggleStatus(link)}
              aria-label={isHidden ? t('linksPage.showLink') : t('linksPage.hideLink')}
              className="shrink-0 [--switch-control-bg-checked:#10b981] [--switch-control-bg-checked-hover:#059669]"
            >
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch>

            <button
              type="button"
              className={cn(linksToolBtnClass, 'text-[var(--muted-foreground)] hover:text-[var(--danger)]')}
              aria-label={t('linksPage.deleteLink')}
              disabled={isBusy}
              onClick={() => onDelete(link)}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!sortable) {
    return <div className={cardClassName}>{content}</div>;
  }

  return (
    <Reorder.Item
      value={link}
      layout
      dragListener={false}
      dragControls={dragControls}
      dragElastic={0.08}
      dragTransition={{ bounceStiffness: 420, bounceDamping: 28 }}
      onDragStart={() => {
        setIsDragging(true);
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
      }}
      onDragEnd={() => {
        setIsDragging(false);
        clearDragChrome();
      }}
      className={cardClassName}
      transition={reorderTransition}
      whileDrag={{
        scale: 1.01,
        zIndex: 20,
      }}
    >
      {content}
    </Reorder.Item>
  );
}
