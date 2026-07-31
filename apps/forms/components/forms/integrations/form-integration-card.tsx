'use client';

import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@heroui/react';
import type { IntegrationLogoAsset } from '@/lib/integration-logos';
import { cn } from '@/lib/utils';

export type IntegrationCardStatus = 'connected' | 'inactive' | 'coming_soon';

interface FormIntegrationCardProps {
  logo?: IntegrationLogoAsset;
  icon?: LucideIcon;
  title: string;
  description: string;
  status: IntegrationCardStatus;
  statusLabel: string;
  detailLine?: string | null;
  comingSoon?: boolean;
  onAction?: () => void;
  actionLabel?: string;
}

const STATUS_STYLES: Record<
  IntegrationCardStatus,
  { badge: string; dot: string }
> = {
  connected: {
    badge: 'bg-[var(--success)]/12 text-[var(--success)]',
    dot: 'bg-[var(--success)]',
  },
  inactive: {
    badge: 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]',
    dot: 'bg-[var(--muted-foreground)]/40',
  },
  coming_soon: {
    badge: 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]',
    dot: 'bg-[var(--muted-foreground)]/30',
  },
};

export function FormIntegrationCard({
  logo,
  icon: Icon,
  title,
  description,
  status,
  statusLabel,
  detailLine,
  comingSoon = false,
  onAction,
  actionLabel,
}: FormIntegrationCardProps) {
  const styles = STATUS_STYLES[status];

  return (
    <article
      className={cn(
        'dashboard-card flex h-full flex-col rounded-2xl p-4 transition-all duration-200 sm:rounded-3xl sm:p-6',
        !comingSoon &&
          'dashboard-card-interactive hover:shadow-[var(--card-shadow-hover)]',
        comingSoon && 'opacity-60',
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)]/60 bg-white p-1.5">
          {logo ? (
            <Image
              src={logo.src}
              alt={logo.alt}
              width={32}
              height={32}
              className="max-h-full max-w-full object-contain"
            />
          ) : Icon ? (
            <Icon className="size-5 text-[var(--foreground)]" strokeWidth={1.6} aria-hidden />
          ) : null}
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold',
            styles.badge,
          )}
        >
          <span
            className={cn('size-1.5 rounded-full', styles.dot)}
            aria-hidden
          />
          {statusLabel}
        </span>
      </div>

      <h3 className="text-sm font-semibold text-[var(--foreground)] sm:text-base">
        {title}
      </h3>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-[var(--muted-foreground)] sm:text-[13px]">
        {description}
      </p>

      {detailLine ? (
        <p className="mt-3 text-[11px] text-[var(--muted-foreground)]">
          {detailLine}
        </p>
      ) : null}

      {!comingSoon && onAction ? (
        <Button
          size="sm"
          variant={status === 'connected' ? 'outline' : 'primary'}
          className="mt-4 w-full rounded-full sm:mt-5"
          onPress={onAction}
        >
          {actionLabel ?? (status === 'connected' ? 'إدارة' : 'ربط')}
        </Button>
      ) : comingSoon ? (
        <p className="mt-4 text-[11px] font-medium text-[var(--muted-foreground)] sm:mt-5">
          قريباً
        </p>
      ) : null}
    </article>
  );
}
