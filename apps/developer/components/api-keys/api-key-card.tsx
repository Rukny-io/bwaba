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

function EnvBadge({
  environment,
  liveLabel,
  testLabel,
}: {
  environment: DeveloperApiKey['environment'];
  liveLabel: string;
  testLabel: string;
}) {
  const isLive = environment === 'live';
  const Icon = isLive ? Globe : FlaskConical;
  const label = isLive ? liveLabel : testLabel;

  return (
    <InfoTip label={label}>
      <span
        className={cn(
          'inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[10px] font-medium',
          isLive
            ? 'bg-[color-mix(in_srgb,var(--success)_12%,var(--background))] text-[var(--success)]'
            : 'bg-[color-mix(in_srgb,var(--warning)_12%,var(--background))] text-[var(--warning)]',
        )}
      >
        <Icon className="size-2.5" />
        {label}
      </span>
    </InfoTip>
  );
}

function StatusBadge({
  status,
  label,
}: {
  status: DeveloperApiKey['status'];
  label: string;
}) {
  return (
    <InfoTip label={label}>
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-secondary)] px-1.5 py-px text-[10px] font-medium text-[var(--muted-foreground)]">
        <span
          className={cn(
            'size-1.5 rounded-full',
            STATUS_DOT[status] ?? STATUS_DOT.ACTIVE,
            status === 'ACTIVE' && 'animate-pulse',
          )}
        />
        {label}
      </span>
    </InfoTip>
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
  const maskedKey = `${apiKey.keyPrefix}•••${apiKey.keySuffix}`;
  const statusLabel =
    apiKey.status === 'ACTIVE'
      ? labels.active
      : apiKey.status === 'REVOKED'
        ? labels.revoked
        : labels.expired;

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
  const createdLine = formatApiKeyDate(apiKey.createdAt);
  const metaLine = [lastUsed, requestLine, createdLine].join(' · ');

  return (
    <article
      className={cn(
        'dashboard-card overflow-visible px-3 py-2.5 transition-colors',
        inactive ? 'opacity-60' : 'dashboard-card-interactive',
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg',
            inactive
              ? 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]'
              : apiKey.environment === 'live'
                ? 'bg-[var(--foreground)] text-[var(--background)]'
                : 'bg-[color-mix(in_srgb,var(--primary)_12%,var(--background))] text-[var(--primary)]',
          )}
        >
          <Key className="size-4" strokeWidth={1.8} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <h3
              className={cn(
                'truncate text-sm font-semibold text-[var(--foreground)]',
                inactive && 'line-through decoration-[var(--muted-foreground)]/30',
              )}
            >
              {apiKey.name}
            </h3>
            <EnvBadge
              environment={apiKey.environment}
              liveLabel={labels.live}
              testLabel={labels.test}
            />
            <StatusBadge status={apiKey.status} label={statusLabel} />
          </div>

          <code
            dir="ltr"
            className="mt-0.5 block truncate font-mono text-[10px] text-[var(--muted-foreground)]"
          >
            {maskedKey}
          </code>
        </div>

        {!inactive ? (
          <ApiKeyActions
            labels={labels}
            editHref={editHref}
            onReveal={onReveal}
            onRevoke={onRevoke}
          />
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 ps-10 text-[10px] text-[var(--muted-foreground)]">
        {visibleScopes.map((scope) => (
          <span
            key={scope}
            className="rounded-full bg-[var(--surface-secondary)] px-1.5 py-px font-medium text-[var(--foreground)]"
          >
            {scopeLabels[scope] ?? scope}
          </span>
        ))}
        {hiddenScopeCount > 0 ? (
          <InfoTip label={hiddenScopesLabel}>
            <span className="cursor-default rounded-full bg-[var(--surface-secondary)] px-1.5 py-px font-medium">
              +{hiddenScopeCount}
            </span>
          </InfoTip>
        ) : null}

        <span className="hidden h-3 w-px bg-[var(--border)] sm:block" aria-hidden />

        <InfoTip label={metaLine}>
          <span className="line-clamp-1 min-w-0 flex-1 cursor-default">{metaLine}</span>
        </InfoTip>
      </div>
    </article>
  );
}
