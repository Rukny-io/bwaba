'use client';

import { Key } from 'lucide-react';
import { ApiKeysAlert } from '@/components/api-keys/api-keys-alert';
import {
  ApiKeyQuotaIndicator,
  type ApiKeyQuotaLabels,
} from '@/components/api-keys/api-key-quota-indicator';
import { isQuotaAtLimit } from '@/lib/developer-plan-limits';

interface ApiKeyQuotaBannerProps {
  used: number;
  limit: number;
  quotaLabels: ApiKeyQuotaLabels;
  limitMessage: string;
  quotaTitle: string;
  quotaDesc: string;
  loadError?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ApiKeyQuotaBanner({
  used,
  limit,
  quotaLabels,
  limitMessage,
  quotaTitle,
  quotaDesc,
  loadError,
  onRetry,
  retryLabel,
}: ApiKeyQuotaBannerProps) {
  const isAtLimit = isQuotaAtLimit(used, limit);

  return (
    <div className="space-y-3">
      {loadError ? (
        <ApiKeysAlert
          variant="warning"
          message={loadError}
          actionLabel={retryLabel}
          onAction={onRetry}
        />
      ) : null}

      <div className="dashboard-card rounded-2xl p-4 sm:rounded-3xl sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_12%,var(--background))] text-[var(--primary)]">
            <Key className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[var(--foreground)]">
              {quotaTitle}
            </p>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              {quotaDesc}
            </p>
            <ApiKeyQuotaIndicator
              used={used}
              limit={limit}
              labels={quotaLabels}
            />
          </div>
        </div>
      </div>

      {isAtLimit ? (
        <ApiKeysAlert variant="warning" message={limitMessage} />
      ) : null}
    </div>
  );
}
