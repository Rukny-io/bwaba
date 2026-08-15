'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Key,
  Plus,
  Activity,
  ShieldCheck,
  Gauge,
} from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { useCurrentApp } from '@/components/providers/app-context';
import {
  useApiKeys,
  useDeveloperSubscription,
  useRevokeApiKey,
} from '@/hooks/use-api-keys';
import {
  ApiKeyCard,
  ApiKeyCardSkeleton,
} from '@/components/api-keys/api-key-card';
import { useIsWorkspaceOwner } from '@/components/workspace/workspace-role-provider';
import { RevokeApiKeyDialog } from '@/components/api-keys/revoke-api-key-dialog';
import { RevealApiKeyDialog } from '@/components/api-keys/reveal-api-key-dialog';
import { ApiKeysAlert } from '@/components/api-keys/api-keys-alert';
import { DashboardMetricCard } from '@/components/dashboard/dashboard-metric-card';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { DashboardEmptyState } from '@/components/app/dashboard-empty-state';
import { appApiKeysNew, appApiKeyEdit } from '@/lib/app-routes';
import { appToast, getApiErrorMessage } from '@/lib/app-toast';
import { formatApiKeyNumber } from '@/lib/api-key-format';
import {
  resolveApiKeyQuota,
  formatUsageCount,
  isQuotaAtLimit,
  isUnlimitedLimit,
} from '@/lib/developer-plan-limits';
import type { DeveloperApiKey } from '@/lib/api/types';
import { cn } from '@/lib/utils';

function SectionDivider({ label, count }: { label: string; count: number }) {
  return (
    <div
      className="col-span-full flex items-center gap-3 py-1 sm:py-2"
      role="separator"
      aria-label={label}
    >
      <div className="h-px flex-1 bg-[var(--separator,var(--border))]" />
      <span className="shrink-0 text-xs font-medium text-[var(--muted-foreground)]">
        {label}
        <span className="ms-1.5 font-normal" dir="ltr" lang="en">
          ({count})
        </span>
      </span>
      <div className="h-px flex-1 bg-[var(--separator,var(--border))]" />
    </div>
  );
}

function ApiKeysGridSkeleton() {
  return (
    <div className="grid auto-rows-fr grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <ApiKeyCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ApiKeysList() {
  const t = useTranslations();
  const s = t.apiKeys;
  const scopeLabels = (s.scopeLabels ?? {}) as Record<string, string>;
  const { app } = useCurrentApp();

  const {
    data: keys,
    isLoading: keysLoading,
    isError: keysError,
    error: keysFetchError,
    refetch: refetchKeys,
    isFetching: keysFetching,
  } = useApiKeys(app.id);

  const {
    data: subscription,
    isError: subscriptionError,
    refetch: refetchSubscription,
  } = useDeveloperSubscription();

  const revokeMutation = useRevokeApiKey(app.appId, app.id);
  const [revokeTarget, setRevokeTarget] = useState<DeveloperApiKey | null>(null);
  const [revealTarget, setRevealTarget] = useState<DeveloperApiKey | null>(null);
  const isOwner = useIsWorkspaceOwner();

  const activeKeys = useMemo(
    () => (keys ?? []).filter((k) => k.status === 'ACTIVE'),
    [keys],
  );
  const inactiveKeys = useMemo(
    () => (keys ?? []).filter((k) => k.status !== 'ACTIVE'),
    [keys],
  );

  const totalRequests = useMemo(
    () =>
      (keys ?? []).reduce(
        (sum, key) => sum + Number(key.requestCount ?? 0),
        0,
      ),
    [keys],
  );

  const {
    used: apiKeysUsed,
    limit: apiKeysLimit,
    effectivePlan,
    platformPlan,
  } = resolveApiKeyQuota(subscription, activeKeys.length);
  const isAtLimit = isQuotaAtLimit(apiKeysUsed, apiKeysLimit);
  const limitMessage = formatUsageCount(s.limitReached, apiKeysUsed, apiKeysLimit);
  const unlimited = isUnlimitedLimit(apiKeysLimit);
  const metricQuotaValue = unlimited
    ? String(apiKeysUsed)
    : (s.quotaOfLimit ?? '{used} of {limit}')
        .replace('{used}', String(apiKeysUsed))
        .replace('{limit}', String(apiKeysLimit));
  const metricQuotaPrimary = unlimited
    ? (s.usageCountOpen ?? '{used} active keys').replace(
        '{used}',
        String(apiKeysUsed),
      )
    : (s.quotaRemaining ?? '{remaining} remaining').replace(
        '{remaining}',
        String(Math.max(apiKeysLimit - apiKeysUsed, 0)),
      );
  const planLabels = (s.planLabels ?? {}) as Record<string, string>;
  const quotaPlanHint =
    effectivePlan === 'PRO'
      ? platformPlan
        ? (s.quotaPlatformPro ?? '{plan}').replace(
            '{plan}',
            planLabels[platformPlan] ?? platformPlan,
          )
        : (s.quotaDeveloperPro ?? 'Pro')
      : (s.quotaDeveloperFree ?? 'Free');

  const cardLabels = {
    live: s.live,
    test: s.test,
    active: s.active,
    revoked: s.revoked,
    expired: s.expired,
    never: s.never,
    requests: s.requests,
    revoke: s.revoke,
    edit: s.edit,
    reveal: s.reveal,
    expires: s.expires,
  };

  const revealLabels = (s.revealDialog ?? {}) as Record<string, string>;

  const handleRevoke = useCallback(async () => {
    if (!revokeTarget) return;
    try {
      await revokeMutation.mutateAsync(revokeTarget.slug);
      appToast.success(s.revokeSuccess);
      setRevokeTarget(null);
    } catch (error) {
      appToast.fromError(error, s.revokeFailed);
    }
  }, [revokeMutation, revokeTarget, s]);

  const handleRetry = useCallback(() => {
    void refetchKeys();
    void refetchSubscription();
  }, [refetchKeys, refetchSubscription]);

  const createAction =
    !isAtLimit ? (
      <Link
        href={appApiKeysNew(app.appId)}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-2.5 text-[13px] font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90 sm:w-auto sm:py-2"
      >
        <Plus size={15} strokeWidth={2.2} />
        {s.createKey}
      </Link>
    ) : (
      <span
        title={limitMessage}
        className="inline-flex w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-2.5 text-[13px] font-semibold text-[var(--primary-foreground)] opacity-50 sm:w-auto sm:py-2"
      >
        <Plus size={15} strokeWidth={2.2} />
        {s.createKey}
      </span>
    );

  if (keysLoading) {
    return (
      <section className="dashboard-page flex flex-col gap-5 sm:gap-6">
        <DashboardPageHeader
          className="mb-0"
          title={s.title}
          description={s.subtitle}
        />
        <div className="grid auto-rows-fr grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="dashboard-metric-tile h-[7.25rem] animate-pulse rounded-2xl"
            />
          ))}
        </div>
        <ApiKeysGridSkeleton />
      </section>
    );
  }

  if (keysError) {
    return (
      <section className="dashboard-page flex flex-col gap-5 sm:gap-6">
        <DashboardPageHeader
          className="mb-0"
          title={s.title}
          description={s.subtitle}
        />
        <ApiKeysAlert
          message={getApiErrorMessage(keysFetchError, s.loadError)}
          actionLabel={s.retry}
          onAction={handleRetry}
        />
      </section>
    );
  }

  return (
    <section className="dashboard-page flex flex-col gap-5 sm:gap-6">
      <DashboardPageHeader
        className="mb-0 [&_h1]:text-xl sm:[&_h1]:text-2xl"
        title={s.title}
        description={s.subtitle}
        actions={createAction}
      />

      {subscriptionError ? (
        <ApiKeysAlert
          variant="warning"
          message={s.subscriptionLoadError}
          actionLabel={s.retry}
          onAction={() => void refetchSubscription()}
        />
      ) : null}

      <div className="grid auto-rows-fr grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        <DashboardMetricCard
          icon={ShieldCheck}
          label={s.metricActive}
          value={formatApiKeyNumber(activeKeys.length)}
          comparisonPrimary={s.metricActiveHint}
          comparisonSecondary={s.active}
        />
        <DashboardMetricCard
          icon={Activity}
          label={s.metricRequests}
          value={formatApiKeyNumber(totalRequests)}
          comparisonPrimary={s.metricRequestsHint}
        />
        <DashboardMetricCard
          icon={Gauge}
          label={s.metricQuota}
          value={metricQuotaValue}
          comparisonPrimary={metricQuotaPrimary}
          comparisonSecondary={quotaPlanHint}
        />
        <DashboardMetricCard
          icon={Key}
          label={s.inactive}
          value={formatApiKeyNumber(inactiveKeys.length)}
          comparisonPrimary={s.revoked}
          comparisonSecondary={s.expired}
        />
      </div>

      {isAtLimit ? (
        <ApiKeysAlert variant="warning" message={limitMessage} />
      ) : null}

      {keysFetching && !keysLoading ? (
        <p className="text-xs text-[var(--muted-foreground)]">{s.refreshing}</p>
      ) : null}

      {!keys?.length ? (
        <DashboardEmptyState
          icon={Key}
          title={s.emptyTitle ?? s.createKey}
          description={s.noKeysDesc}
        >
          {!isAtLimit ? (
            <Link
              href={appApiKeysNew(app.appId)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-2 text-[13px] font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
            >
              <Plus size={15} strokeWidth={2.2} />
              {s.createKey}
            </Link>
          ) : null}
        </DashboardEmptyState>
      ) : (
        <div
          className={cn(
            'grid auto-rows-fr grid-cols-2 gap-2.5 transition-opacity duration-150 sm:grid-cols-4 sm:gap-3',
            keysFetching && 'opacity-60',
          )}
          aria-busy={keysFetching || undefined}
        >
          {activeKeys.map((apiKey) => (
            <ApiKeyCard
              key={apiKey.id}
              apiKey={apiKey}
              editHref={appApiKeyEdit(app.appId, apiKey.slug)}
              scopeLabels={scopeLabels}
              labels={cardLabels}
              onReveal={isOwner ? () => setRevealTarget(apiKey) : undefined}
              onRevoke={() => setRevokeTarget(apiKey)}
            />
          ))}

          {activeKeys.length > 0 && inactiveKeys.length > 0 ? (
            <SectionDivider label={s.inactive} count={inactiveKeys.length} />
          ) : null}

          {inactiveKeys.map((apiKey) => (
            <ApiKeyCard
              key={apiKey.id}
              apiKey={apiKey}
              inactive
              scopeLabels={scopeLabels}
              labels={cardLabels}
            />
          ))}
        </div>
      )}

      <RevokeApiKeyDialog
        open={Boolean(revokeTarget)}
        keyName={revokeTarget?.name}
        maskedKey={
          revokeTarget
            ? `${revokeTarget.keyPrefix}•••${revokeTarget.keySuffix}`
            : undefined
        }
        isPending={revokeMutation.isPending}
        onClose={() => setRevokeTarget(null)}
        onConfirm={() => void handleRevoke()}
      />

      <RevealApiKeyDialog
        open={Boolean(revealTarget)}
        keyName={revealTarget?.name}
        keySlug={revealTarget?.slug}
        labels={{
          title: revealLabels.title ?? s.reveal,
          desc: revealLabels.desc ?? '',
          dataSection: revealLabels.dataSection,
          tokenLabel: revealLabels.tokenLabel ?? '',
          tokenPlaceholder: revealLabels.tokenPlaceholder ?? '000000',
          reveal: revealLabels.reveal ?? s.reveal,
          revealing: revealLabels.revealing ?? '',
          cancel: s.cancel,
          copy: revealLabels.copy ?? s.successView?.copy ?? 'Copy',
          warning: revealLabels.warning ?? '',
          twoFaRequired: revealLabels.twoFaRequired ?? '',
          twoFaLoading: revealLabels.twoFaLoading ?? '',
        }}
        onClose={() => setRevealTarget(null)}
      />
    </section>
  );
}
