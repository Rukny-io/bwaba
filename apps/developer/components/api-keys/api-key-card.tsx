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

const STATUS_DOT: Record<string, string> = {
  ACTIVE: 'bg-[var(--success)]',
  REVOKED: 'bg-[var(--danger)]',
  EXPIRED: 'bg-[var(--warning)]',
};

const COVER_GRADIENT: Record<string, string> = {
  live:
    'bg-gradient-to-br from-[color-mix(in_srgb,var(--success)_16%,var(--surface))] via-[var(--surface-secondary)]/45 to-[var(--surface)]',
  test:
    'bg-gradient-to-br from-[color-mix(in_srgb,var(--warning)_14%,var(--surface))] via-[var(--surface-secondary)]/45 to-[var(--surface)]',
  inactive:
    'bg-gradient-to-br from-[color-mix(in_srgb,var(--foreground)_8%,var(--surface))] via-[var(--surface-secondary)]/40 to-[var(--surface)]',
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
          'flex size-8 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors outline-none',
          'hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]',
          'data-[pressed]:bg-[var(--surface-secondary)] data-[pressed]:text-[var(--foreground)]',
        )}
      >
        <MoreHorizontal className="size-4" />
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

  const visibleScopes = apiKey.scopes.slice(0, 2);
  const hiddenScopeCount = Math.max(apiKey.scopes.length - visibleScopes.length, 0);
  const hiddenScopesLabel = apiKey.scopes
    .slice(2)
    .map((scope) => scopeLabels[scope] ?? scope)
    .join(' · ');

  const lastUsed = apiKey.lastUsedAt
    ? formatApiKeyDate(apiKey.lastUsedAt)
    : labels.never;
  const requestLine = `${formatApiKeyNumber(apiKey.requestCount)} ${labels.requests}`;
  const coverTone = inactive ? 'inactive' : isLive ? 'live' : 'test';

  const openEdit = () => {
    if (editHref) router.push(editHref);
  };

  return (
    <article
      className={cn(
        'group dashboard-metric-tile flex flex-col rounded-2xl p-2.5 transition-[border-color,background-color] duration-200',
        'hover:border-[color-mix(in_srgb,var(--border)_45%,var(--foreground)_12%)]',
        inactive && 'opacity-[0.9]',
        !inactive && editHref && 'cursor-pointer',
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
      <div
        className={cn(
          'relative aspect-[4/3] overflow-hidden rounded-xl',
          COVER_GRADIENT[coverTone],
          inactive && 'grayscale-[30%]',
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
          <span className="flex size-12 items-center justify-center rounded-2xl bg-[var(--surface)]/80 text-[var(--primary)]">
            <Key className="size-5" strokeWidth={1.75} />
          </span>
        </div>
        <div className="absolute start-2 top-2 flex flex-wrap gap-1">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1',
              isLive
                ? 'bg-[var(--surface)]/90 text-[var(--success)] ring-[color-mix(in_srgb,var(--success)_25%,transparent)]'
                : 'bg-[var(--surface)]/90 text-[var(--warning)] ring-[color-mix(in_srgb,var(--warning)_25%,transparent)]',
            )}
          >
            <EnvIcon className="size-2.5" />
            {envLabel}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)]/90 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--muted-foreground)] ring-1 ring-[var(--border)]/60">
            <span
              className={cn(
                'size-1.5 rounded-full',
                STATUS_DOT[apiKey.status] ?? STATUS_DOT.ACTIVE,
                apiKey.status === 'ACTIVE' && 'animate-pulse',
              )}
            />
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 px-0.5 pt-2.5 text-start">
        <h3
          className={cn(
            'truncate text-[14px] font-semibold leading-[1.35] tracking-tight text-[var(--foreground)]',
            inactive && 'line-through decoration-[var(--muted-foreground)]/30',
          )}
          title={apiKey.name}
        >
          {apiKey.name}
        </h3>

        <code
          dir="ltr"
          className="truncate font-mono text-[11px] text-[var(--muted-foreground)]"
        >
          {maskedKey}
        </code>

        <div className="flex flex-wrap items-center gap-1 pt-0.5">
          {visibleScopes.map((scope) => (
            <span
              key={scope}
              className="rounded-full bg-[var(--surface-secondary)] px-1.5 py-px text-[10px] font-medium text-[var(--foreground)]"
            >
              {scopeLabels[scope] ?? scope}
            </span>
          ))}
          {hiddenScopeCount > 0 ? (
            <InfoTip label={hiddenScopesLabel}>
              <span className="cursor-default rounded-full bg-[var(--surface-secondary)] px-1.5 py-px text-[10px] font-medium">
                +{hiddenScopeCount}
              </span>
            </InfoTip>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <p className="min-w-0 truncate text-[11px] text-[var(--muted-foreground)]">
            <span dir="ltr" lang="en">
              {requestLine}
            </span>
            <span className="mx-1 text-[var(--border)]">·</span>
            <span>{lastUsed}</span>
          </p>

          {!inactive ? (
            <div
              className="shrink-0"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <ApiKeyActions
                labels={labels}
                editHref={editHref}
                onReveal={onReveal}
                onRevoke={onRevoke}
              />
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function ApiKeyCardSkeleton() {
  return (
    <div className="dashboard-metric-tile animate-pulse rounded-2xl p-2.5">
      <div className="aspect-[4/3] rounded-xl bg-[var(--surface-secondary)]/70" />
      <div className="space-y-2 px-0.5 pt-2.5">
        <div className="h-3.5 w-[72%] rounded-md bg-[var(--surface-secondary)]/70" />
        <div className="h-3 w-[48%] rounded-md bg-[var(--surface-secondary)]/50" />
        <div className="flex gap-1 pt-1">
          <div className="h-5 w-12 rounded-full bg-[var(--surface-secondary)]/45" />
          <div className="h-5 w-10 rounded-full bg-[var(--surface-secondary)]/45" />
        </div>
      </div>
    </div>
  );
}
