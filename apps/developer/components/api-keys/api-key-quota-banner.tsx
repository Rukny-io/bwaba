'use client';

import { Key } from 'lucide-react';
import { ApiKeysAlert } from '@/components/api-keys/api-keys-alert';
import {
  ApiKeyQuotaIndicator,
  type ApiKeyQuotaLabels,
} from '@/components/api-keys/api-key-quota-indicator';
import {
  SettingsRow,
  SettingsRowDivider,
} from '@/components/settings/settings-primitives';
import { AppSettingsSection } from '@/components/settings/app-settings-section';
import { isQuotaAtLimit, isUnlimitedLimit } from '@/lib/developer-plan-limits';

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
  const unlimited = isUnlimitedLimit(limit);
  const usageLabel = unlimited
    ? quotaLabels.activeCount.replace('{used}', String(used))
    : quotaLabels.ofLimit
        .replace('{used}', String(used))
        .replace('{limit}', String(limit));

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

      <AppSettingsSection flush title={quotaTitle} description={quotaDesc}>
        <SettingsRow
          isStatic
          icon={Key}
          title={usageLabel}
          subtitle={unlimited ? quotaLabels.openHint : quotaLabels.remaining.replace(
            '{remaining}',
            String(Math.max(limit - used, 0)),
          )}
        />
        <SettingsRowDivider />
        <div className="px-4 pb-4 pt-1 sm:px-5 sm:pb-5">
          <ApiKeyQuotaIndicator
            used={used}
            limit={limit}
            labels={quotaLabels}
          />
        </div>
      </AppSettingsSection>

      {isAtLimit ? (
        <ApiKeysAlert variant="warning" message={limitMessage} />
      ) : null}
    </div>
  );
}
