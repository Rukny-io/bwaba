'use client';

import { useRouter } from 'next/navigation';
import {
  Key,
  Globe,
  FlaskConical,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Tooltip, Dropdown } from '@heroui/react';
import type { DeveloperApiKey } from '@/lib/api/types';
import {
  formatApiKeyDate,
  formatApiKeyNumber,
} from '@/lib/api-key-format';
import { cn } from '@/lib/utils';
import type { DashboardMetricChipTone } from '@/components/dashboard/dashboard-metric-card';

const STATUS_TONE: Record<string, DashboardMetricChipTone> = {
  ACTIVE: 'success',
  REVOKED: 'danger',
  EXPIRED: 'warning',
};

interface ApiKeyCardProps {
  apiKey: DeveloperApiKey;
  inactive?: boolean;
  editHref?: string;
  scopeLabels: Record<string, string>;
  labels: {
    live: string;
    test: string;
    active: string;
    revoked: string;
    expired: string;
    never: string;
    requests: string;
    revoke: string;
    edit: string;
    reveal: string;
    expires: string;
  };
  onRevoke?: () => void;
  onReveal?: () => void;
}

function InfoTip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip delay={300}>
      <Tooltip.Trigger aria-label={label}>{children}</Tooltip.Trigger>
      <Tooltip.Content className="max-w-[14rem] text-xs" showArrow>
        <Tooltip.Arrow />
        {label}
      </Tooltip.Content>
    </Tooltip>
  );
}

function ApiKeyActions({
  labels,
  editHref,
  onReveal,
  onRevoke,
}: {
  labels: ApiKeyCardProps['labels'];
  editHref?: string;
  onReveal?: () => void;
  onRevoke?: () => void;
}) {
  const router = useRouter();
  const menuLabel = [labels.reveal, labels.edit, labels.revoke]
    .filter(Boolean)
    .join(' · ');

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label={menuLabel}
        className={cn(
          'flex size-7 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors outline-none',
          'hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]',
          'data-[pressed]:bg-[var(--surface-secondary)] data-[pressed]:text-[var(--foreground)]',
        )}
      >
        <MoreHorizontal className="size-3.5" />
      </Dropdown.Trigger>

      <Dropdown.Popover placement="top end" className="min-w-[11rem]">
        <Dropdown.Menu
          onAction={(key) => {
            if (key === 'reveal') onReveal?.();
            if (key === 'edit' && editHref) router.push(editHref);
            if (key === 'revoke') onRevoke?.();
          }}
        >
          {onReveal ? (
            <Dropdown.Item id="reveal" textValue={labels.reveal} className="gap-2">
              <Eye className="size-4 shrink-0" />
              {labels.reveal}
            </Dropdown.Item>
          ) : null}
          {editHref ? (
            <Dropdown.Item id="edit" textValue={labels.edit} className="gap-2">
              <Pencil className="size-4 shrink-0" />
              {labels.edit}
            </Dropdown.Item>
          ) : null}
          {onRevoke ? (
            <Dropdown.Item
              id="revoke"
              textValue={labels.revoke}
              variant="danger"
              className="gap-2"
            >
              <Trash2 className="size-4 shrink-0" />
              {labels.revoke}
            </Dropdown.Item>
          ) : null}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

const chipToneClass: Record<DashboardMetricChipTone, string> = {
  success: 'text-[var(--success)]',
  warning: 'text-[var(--warning)]',
  danger: 'text-[var(--danger)]',
  neutral: 'text-[var(--muted-foreground)]',
};

export function ApiKeyCard({
  apiKey,
  inactive = false,
  editHref,
  scopeLabels,
  labels,
  onRevoke,
  onReveal,
}: ApiKeyCardProps) {
  const router = useRouter();
  const maskedKey = `${apiKey.keyPrefix}•••${apiKey.keySuffix}`;
  const statusLabel =
    apiKey.status === 'ACTIVE'
      ? labels.active
      : apiKey.status === 'REVOKED'
        ? labels.revoked
        : labels.expired;
  const isLive = apiKey.environment === 'live';
  const EnvIcon = isLive ? Globe : FlaskConical;
  const envLabel = isLive ? labels.live : labels.test;
  const statusTone = STATUS_TONE[apiKey.status] ?? 'neutral';

  const visibleScopes = apiKey.scopes.slice(0, 2);
  const hiddenScopeCount = Math.max(apiKey.scopes.length - visibleScopes.length, 0);
  const hiddenScopesLabel = apiKey.scopes
    .slice(2)
    .map((scope) => scopeLabels[scope] ?? scope)
    .join(' · ');
  const scopeSummary = [
    ...visibleScopes.map((scope) => scopeLabels[scope] ?? scope),
    hiddenScopeCount > 0 ? `+${hiddenScopeCount}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const lastUsed = apiKey.lastUsedAt
    ? formatApiKeyDate(apiKey.lastUsedAt)
    : labels.never;
  const requestLine = `${formatApiKeyNumber(apiKey.requestCount)} ${labels.requests}`;

  const openEdit = () => {
    if (editHref) router.push(editHref);
  };

  return (
    <article
      className={cn(
        'dashboard-metric-tile group flex min-h-[7.25rem] flex-col rounded-2xl p-4 transition-colors duration-200 sm:min-h-[7.75rem] sm:p-[1.125rem]',
        inactive && 'opacity-85',
        !inactive && editHref && 'cursor-pointer hover:bg-[var(--surface-secondary)]',
      )}
      onClick={!inactive && editHref ? openEdit : undefined}
      role={!inactive && editHref ? 'button' : undefined}
      tabIndex={!inactive && editHref ? 0 : undefined}
      onKeyDown={
        !inactive && editHref
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openEdit();
              }
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-[13px] font-medium leading-snug text-[var(--muted-foreground)]">
          <span className="inline-flex items-center gap-1">
            <EnvIcon className="size-3.5 shrink-0 opacity-80" aria-hidden />
            <span>{envLabel}</span>
          </span>
        </p>

        <div
          className="flex shrink-0 items-center gap-0.5"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {!inactive ? (
            <ApiKeyActions
              labels={labels}
              editHref={editHref}
              onReveal={onReveal}
              onRevoke={onRevoke}
            />
          ) : null}
          <Key
            className="size-[18px] text-[var(--muted-foreground)]/75"
            strokeWidth={1.75}
            aria-hidden
          />
        </div>
      </div>

      <h3
        className={cn(
          'mt-3 min-w-0 truncate text-[1.25rem] font-semibold leading-snug tracking-tight text-[var(--foreground)] sm:text-[1.35rem]',
          inactive && 'line-through decoration-[var(--muted-foreground)]/35',
        )}
        title={apiKey.name}
      >
        {apiKey.name}
      </h3>

      <code
        dir="ltr"
        className="mt-1 block min-w-0 truncate font-mono text-[11px] text-[var(--muted-foreground)] sm:text-[12px]"
      >
        {maskedKey}
      </code>

      <p className="mt-auto pt-3 text-[12px] leading-relaxed text-[var(--muted-foreground)]">
        <span className={cn('font-medium', chipToneClass[statusTone])}>
          {statusLabel}
        </span>
        {scopeSummary ? (
          <>
            {' · '}
            {hiddenScopeCount > 0 ? (
              <InfoTip label={hiddenScopesLabel}>
                <span className="cursor-default">{scopeSummary}</span>
              </InfoTip>
            ) : (
              scopeSummary
            )}
          </>
        ) : null}
        {' · '}
        <span dir="ltr" lang="en">
          {requestLine}
        </span>
        {' · '}
        <span>{lastUsed}</span>
      </p>
    </article>
  );
}

export function ApiKeyCardSkeleton() {
  return (
    <div className="dashboard-metric-tile h-[7.25rem] animate-pulse rounded-2xl p-4 sm:h-[7.75rem] sm:p-[1.125rem]">
      <div className="flex items-start justify-between gap-2">
        <div className="h-3.5 w-16 rounded-md bg-[var(--surface-secondary)]/70" />
        <div className="size-[18px] rounded-md bg-[var(--surface-secondary)]/50" />
      </div>
      <div className="mt-3 h-5 w-[68%] rounded-md bg-[var(--surface-secondary)]/70" />
      <div className="mt-1.5 h-3 w-[52%] rounded-md bg-[var(--surface-secondary)]/50" />
      <div className="mt-auto h-3 w-[88%] rounded-md bg-[var(--surface-secondary)]/45 pt-3" />
    </div>
  );
}
