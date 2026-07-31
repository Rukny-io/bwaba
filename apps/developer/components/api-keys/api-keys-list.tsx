'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Key,
  Plus,
  Activity,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { useCurrentApp } from '@/components/providers/app-context';
import {
  useApiKeys,
  useDeveloperSubscription,
  useRevokeApiKey,
} from '@/hooks/use-api-keys';
import { ApiKeyCard } from '@/components/api-keys/api-key-card';
import { useIsWorkspaceOwner } from '@/components/workspace/workspace-role-provider';
import { RevokeApiKeyDialog } from '@/components/api-keys/revoke-api-key-dialog';
import { RevealApiKeyDialog } from '@/components/api-keys/reveal-api-key-dialog';
import { ApiKeysAlert } from '@/components/api-keys/api-keys-alert';
import { DashboardMetricCard } from '@/components/dashboard/dashboard-metric-card';
import { appApiKeysNew, appApiKeyEdit } from '@/lib/app-routes';
import { appToast, getApiErrorMessage } from '@/lib/app-toast';
import { formatApiKeyNumber } from '@/lib/api-key-format';
import { ApiKeyQuotaIndicator, type ApiKeyQuotaLabels } from '@/components/api-keys/api-key-quota-indicator';
import { resolveApiKeyQuota, formatUsageCount, isQuotaAtLimit, isUnlimitedLimit } from '@/lib/developer-plan-limits';
import type { DeveloperApiKey } from '@/lib/api/types';
import { cn } from '@/lib/utils';

function ApiKeysSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'dashboard-card h-[7.25rem] animate-pulse rounded-2xl sm:rounded-3xl',
              i === 2 && 'col-span-2 sm:col-span-1',
            )}
          />
        ))}
      </div>
      <div className="dashboard-card h-24 animate-pulse rounded-2xl sm:rounded-3xl" />
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="dashboard-card h-[5.5rem] animate-pulse rounded-2xl"
          />
        ))}
      </div>
    </div>
  );
}

function SectionLabel({
  label,
  count,
  tone = 'active',
}: {
  label: string;
  count: number;
  tone?: 'active' | 'muted';
}) {
  return (
    <div className="flex items-center gap-2 px-0.5">
      <span
        className={cn(
          'size-1.5 rounded-full',
          tone === 'active'
            ? 'bg-[var(--success)]'
            : 'bg-[var(--muted-foreground)]/50',
        )}
      />
      <h2
        className={cn(
          'text-xs font-semibold tracking-wide sm:text-sm',
          tone === 'active'
            ? 'text-[var(--foreground)]'
            : 'text-[var(--muted-foreground)]',
        )}
      >
        {label}
        <span className="ms-1.5 font-normal text-[var(--muted-foreground)]" dir="ltr" lang="en">
          ({count})
        </span>
      </h2>
      <span className="h-px flex-1 bg-[var(--border)]" />
    </div>
  );
}

function CreateKeyBanner({
  appId,
  title,
  desc,
  quotaLabels,
  used,
  limit,
  isAtLimit,
  limitTitle,
  isRtl,
}: {
  appId: string;
  title: string;
  desc: string;
  quotaLabels: ApiKeyQuotaLabels;
  used: number;
  limit: number;
  isAtLimit: boolean;
  limitTitle?: string;
  isRtl: boolean;
}) {
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  const content = (
    <>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--foreground)] text-[var(--background)]">
        <Plus size={18} strokeWidth={1.8} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--foreground)]">{title}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--muted-foreground)] sm:text-[13px]">
          {desc}
        </p>

        <ApiKeyQuotaIndicator used={used} limit={limit} labels={quotaLabels} />
      </div>

      {!isAtLimit ? (
        <Arrow
          size={16}
          className={cn(
            'hidden shrink-0 text-[var(--muted-foreground)] transition-transform duration-200 sm:block',
            isRtl
              ? 'group-hover:-translate-x-0.5'
              : 'group-hover:translate-x-0.5',
          )}
        />
      ) : null}
    </>
  );

  if (isAtLimit) {
    return (
      <div
        title={limitTitle}
        className="dashboard-card flex flex-col gap-4 rounded-2xl p-4 opacity-90 sm:flex-row sm:items-center sm:rounded-3xl sm:p-5"
      >
        {content}
        <span className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-[var(--primary-foreground)] opacity-50 sm:w-auto">
          <Plus className="size-4" />
          {title}
        </span>
      </div>
    );
  }

  return (
    <Link
      href={appApiKeysNew(appId)}
      className="dashboard-card dashboard-card-interactive group flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:rounded-3xl sm:p-5"
    >
      {content}
      <span className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-opacity group-hover:opacity-90 sm:w-auto">
        <Plus className="size-4" />
        {title}
      </span>
    </Link>
  );
}

function EmptyState({
  appId,
  label,
  desc,
  isRtl,
}: {
  appId: string;
  label: string;
  desc: string;
  isRtl: boolean;
}) {
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div className="dashboard-card flex flex-col items-center justify-center gap-5 rounded-2xl px-5 py-14 text-center sm:rounded-3xl sm:py-16">
      <div className="relative">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--primary)_12%,var(--background))]">
          <Key className="size-7 text-[var(--primary)]" />
        </div>
        <div className="absolute -bottom-1.5 -end-1.5 flex size-7 items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--background)] ring-2 ring-[var(--background)]">
          <Plus className="size-3.5" />
        </div>
      </div>
      <div className="max-w-sm">
        <p className="text-base font-semibold text-[var(--foreground)]">{label}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted-foreground)]">
          {desc}
        </p>
      </div>
      <Link
        href={appApiKeysNew(appId)}
        className="dashboard-card-interactive inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90 sm:w-auto"
      >
        <Plus className="size-4" />
        {label}
        <Arrow size={14} />
      </Link>
    </div>
  );
}

export function ApiKeysList() {
  const t = useTranslations();
  const s = t.apiKeys;
  const isRtl = t.common.switchLang === 'English';
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
  // كشف المفتاح مقصور على مالك الحساب (تحقق ثنائي مطلوب من الـ API).
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
  const quotaLabels: ApiKeyQuotaLabels = {
    activeCount: s.usageCountOpen ?? '{used} active keys',
    ofLimit: s.quotaOfLimit ?? '{used} of {limit}',
    remaining: s.quotaRemaining ?? '{remaining} remaining',
    openBadge: s.quotaOpenBadge ?? 'Open plan',
    openHint: s.quotaOpenHint ?? 'No cap on API keys',
  };
  const limitMessage = formatUsageCount(s.limitReached, apiKeysUsed, apiKeysLimit);
  const unlimited = isUnlimitedLimit(apiKeysLimit);
  const metricQuotaValue = unlimited
    ? String(apiKeysUsed)
    : (s.quotaOfLimit ?? '{used} of {limit}')
        .replace('{used}', String(apiKeysUsed))
        .replace('{limit}', String(apiKeysLimit));
  const metricQuotaPrimary = unlimited
    ? (s.usageCountOpen ?? '{used} active keys').replace('{used}', String(apiKeysUsed))
    : (s.quotaRemaining ?? '{remaining} remaining').replace(
        '{remaining}',
        String(Math.max(apiKeysLimit - apiKeysUsed, 0)),
      );
  const planLabels = (s.planLabels ?? {}) as Record<string, string>;
  const quotaPlanHint =
    effectivePlan === 'PRO'
      ? platformPlan
        ? (s.quotaPlatformPro ?? '{plan}')
            .replace('{plan}', planLabels[platformPlan] ?? platformPlan)
        : (s.quotaDeveloperPro ?? 'Pro')
      : (s.quotaDeveloperFree ?? 'Free');
  const usageHint = s.usageBillingHint ?? '';

  const bannerDesc = isAtLimit
    ? limitMessage
    : activeKeys.length > 0
      ? s.hasKeysDesc
      : s.noKeysDesc;

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

  if (keysLoading) {
    return <ApiKeysSkeleton />;
  }

  if (keysError) {
    return (
      <ApiKeysAlert
        message={getApiErrorMessage(keysFetchError, s.loadError)}
        actionLabel={s.retry}
        onAction={handleRetry}
      />
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {subscriptionError ? (
        <ApiKeysAlert
          variant="warning"
          message={s.subscriptionLoadError}
          actionLabel={s.retry}
          onAction={() => void refetchSubscription()}
        />
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <DashboardMetricCard
          icon={ShieldCheck}
          label={s.metricActive}
          value={formatApiKeyNumber(activeKeys.length)}
          comparisonPrimary={s.metricActiveHint}
        />
        <DashboardMetricCard
          icon={Activity}
          label={s.metricRequests}
          value={formatApiKeyNumber(totalRequests)}
          comparisonPrimary={s.metricRequestsHint}
        />
        <div className="col-span-2 sm:col-span-1">
          <DashboardMetricCard
            icon={Key}
            label={s.metricQuota}
            value={metricQuotaValue}
            comparisonPrimary={metricQuotaPrimary}
            comparisonSecondary={[quotaPlanHint, usageHint].filter(Boolean).join(' · ')}
          />
        </div>
      </div>

      <CreateKeyBanner
        appId={app.appId}
        title={s.createKey}
        desc={bannerDesc}
        quotaLabels={quotaLabels}
        used={apiKeysUsed}
        limit={apiKeysLimit}
        isAtLimit={isAtLimit}
        limitTitle={limitMessage}
        isRtl={isRtl}
      />

      {isAtLimit ? (
        <ApiKeysAlert variant="warning" message={limitMessage} />
      ) : null}

      {keysFetching && !keysLoading ? (
        <p className="text-xs text-[var(--muted-foreground)]">{s.refreshing}</p>
      ) : null}

      {!keys?.length ? (
        <EmptyState
          appId={app.appId}
          label={s.createKey}
          desc={s.noKeysDesc}
          isRtl={isRtl}
        />
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {activeKeys.length > 0 ? (
            <section className="space-y-3">
              <SectionLabel label={s.active} count={activeKeys.length} />
              <div className="space-y-2">
                {activeKeys.map((apiKey) => (
                  <ApiKeyCard
                    key={apiKey.id}
                    apiKey={apiKey}
                    editHref={appApiKeyEdit(app.appId, apiKey.slug)}
                    scopeLabels={scopeLabels}
                    labels={cardLabels}
                    onReveal={
                      isOwner ? () => setRevealTarget(apiKey) : undefined
                    }
                    onRevoke={() => setRevokeTarget(apiKey)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {inactiveKeys.length > 0 ? (
            <section className="space-y-3">
              <SectionLabel
                label={s.inactive}
                count={inactiveKeys.length}
                tone="muted"
              />
              <div className="space-y-2">
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
            </section>
          ) : null}
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
    </div>
  );
}
