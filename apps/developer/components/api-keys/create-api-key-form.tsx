'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TextField, Label, Input, Button } from '@heroui/react';
import {
  ArrowLeft,
  ArrowRight,
  Key,
  Globe,
  FlaskConical,
  Shield,
  Lock,
  Copy,
  Check,
  CheckCircle2,
  CalendarDays,
} from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { useCurrentApp } from '@/components/providers/app-context';
import {
  useCreateApiKey,
  useDeveloperSubscription,
  useApiKeys,
} from '@/hooks/use-api-keys';
import { ApiKeysAlert } from '@/components/api-keys/api-keys-alert';
import { ApiKeyQuotaBanner } from '@/components/api-keys/api-key-quota-banner';
import type { ApiKeyQuotaLabels } from '@/components/api-keys/api-key-quota-indicator';
import { ApiKeyScopeGrid } from '@/components/api-keys/api-key-scope-grid';
import {
  ApiKeyIpField,
  validateIpEntry,
} from '@/components/api-keys/api-key-ip-field';
import {
  DEFAULT_API_KEY_SCOPES,
  computeExpiresAt,
  hasWriteScopes,
  type ApiKeyExpirationPreset,
} from '@/lib/api/scopes';
import type { ApiKeyEnvironment } from '@/lib/api/types';
import { appApiKeys } from '@/lib/app-routes';
import { appToast, getApiErrorMessage } from '@/lib/app-toast';
import { resolveApiKeyQuota, formatUsageCount, isQuotaAtLimit } from '@/lib/developer-plan-limits';
import { cn } from '@/lib/utils';

export function CreateApiKeyForm() {
  const router = useRouter();
  const t = useTranslations();
  const s = t.apiKeys;
  const cp = (s.createPage ?? {}) as Record<string, string>;
  const scopeLabels = (s.scopeLabels ?? {}) as Record<string, string>;
  const isRtl = t.common.switchLang === 'English';
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  const { app } = useCurrentApp();
  const createMutation = useCreateApiKey(app.id, app.appId);
  const { data: subscription, isError: subscriptionError, refetch: refetchSubscription } =
    useDeveloperSubscription();
  const { data: keys } = useApiKeys(app.id);

  const activeCount = useMemo(
    () => (keys ?? []).filter((k) => k.status === 'ACTIVE').length,
    [keys],
  );
  const { used: apiKeysUsed, limit: apiKeysLimit } = resolveApiKeyQuota(
    subscription,
    activeCount,
  );
  const isAtLimit = isQuotaAtLimit(apiKeysUsed, apiKeysLimit);
  const quotaLabels: ApiKeyQuotaLabels = {
    activeCount: s.usageCountOpen ?? '{used} active keys',
    ofLimit: s.quotaOfLimit ?? '{used} of {limit}',
    remaining: s.quotaRemaining ?? '{remaining} remaining',
    openBadge: s.quotaOpenBadge ?? 'Open plan',
    openHint: s.quotaOpenHint ?? 'No cap on API keys',
  };

  const [name, setName] = useState('');
  const [environment, setEnvironment] = useState<ApiKeyEnvironment>('live');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    ...DEFAULT_API_KEY_SCOPES,
  ]);
  const [expiration, setExpiration] = useState<ApiKeyExpirationPreset>('never');
  const [ipInput, setIpInput] = useState('');
  const [ipList, setIpList] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [ipError, setIpError] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const showLiveWarning =
    environment === 'live' && hasWriteScopes(selectedScopes);

  const clearErrors = useCallback(() => {
    setFormError(null);
    setIpError(null);
  }, []);

  const handleAddIp = useCallback(() => {
    const error = validateIpEntry(ipInput, ipList, {
      invalid: s.ipInvalid,
      duplicate: s.ipDuplicate,
    });
    if (error) {
      setIpError(error);
      return;
    }
    const trimmed = ipInput.trim();
    if (!trimmed) return;
    setIpList((prev) => [...prev, trimmed]);
    setIpInput('');
    setIpError(null);
  }, [ipInput, ipList, s.ipDuplicate, s.ipInvalid]);

  const handleCopyKey = useCallback(async () => {
    if (!createdKey) return;
    try {
      await navigator.clipboard.writeText(createdKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      appToast.error(s.copyFailed);
    }
  }, [createdKey, s.copyFailed]);

  const handleSubmit = useCallback(async () => {
    if (isAtLimit) return;
    clearErrors();

    if (!name.trim()) {
      setFormError(s.nameRequired);
      return;
    }

    if (name.trim().length < 2) {
      setFormError(s.nameTooShort);
      return;
    }

    if (selectedScopes.length === 0) {
      setFormError(s.scopesRequired);
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        name: name.trim(),
        developerAppId: app.id,
        scopes: selectedScopes,
        environment,
        ipAllowlist: ipList.length > 0 ? ipList : undefined,
        expiresAt: computeExpiresAt(expiration),
      });

      if (!result.key) {
        setFormError(s.createFailed);
        return;
      }

      setCreatedKey(result.key);
    } catch (error) {
      const message = getApiErrorMessage(error, s.createFailed);
      setFormError(message);
      appToast.fromError(error, s.createFailed);
    }
  }, [
    app.id,
    clearErrors,
    createMutation,
    environment,
    expiration,
    ipList,
    isAtLimit,
    name,
    selectedScopes,
    s,
  ]);

  if (createdKey) {
    const ss = (s.successView ?? {}) as Record<string, string>;
    return (
      <div className="dashboard-card mx-auto max-w-lg rounded-2xl p-6 sm:rounded-3xl sm:p-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="relative">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--success)_12%,var(--background))]">
              <Key className="size-7 text-[var(--success)]" />
            </div>
            <div className="absolute -bottom-1.5 -end-1.5 flex size-7 items-center justify-center rounded-full bg-[var(--success)] text-white ring-2 ring-[var(--background)]">
              <CheckCircle2 className="size-4" />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              {ss.heading ?? s.createKey}
            </h2>
            <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
              {ss.description}
            </p>
          </div>

          <ApiKeysAlert variant="warning" message={ss.warning} />

          <div className="flex w-full items-center gap-2 rounded-xl bg-[var(--surface-secondary)] p-3">
            <code
              dir="ltr"
              className="flex-1 break-all text-start font-mono text-xs text-[var(--foreground)] select-all"
            >
              {createdKey}
            </code>
            <button
              type="button"
              onClick={() => void handleCopyKey()}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--background)] transition-colors hover:bg-[var(--surface-secondary)]"
              aria-label={ss.copy}
            >
              {copied ? (
                <Check className="size-4 text-[var(--success)]" />
              ) : (
                <Copy className="size-4 text-[var(--muted-foreground)]" />
              )}
            </button>
          </div>

          <Button
            onPress={() => router.push(appApiKeys(app.appId))}
            className="w-full rounded-full sm:w-auto sm:px-8"
          >
            {ss.goToKeys}
          </Button>
        </div>
      </div>
    );
  }

  const expirationOptions: { id: ApiKeyExpirationPreset; label: string }[] = [
    { id: 'never', label: cp.expiryNever ?? 'Never' },
    { id: '30d', label: cp.expiry30d ?? '30 days' },
    { id: '90d', label: cp.expiry90d ?? '90 days' },
    { id: '365d', label: cp.expiry365d ?? '1 year' },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-8">
      <Link
        href={appApiKeys(app.appId)}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
      >
        <BackArrow className="size-4" />
        {cp.back}
      </Link>

      <ApiKeyQuotaBanner
        used={apiKeysUsed}
        limit={apiKeysLimit}
        quotaLabels={quotaLabels}
        limitMessage={formatUsageCount(s.limitReached, apiKeysUsed, apiKeysLimit)}
        quotaTitle={cp.quotaTitle ?? s.metricQuota}
        quotaDesc={cp.quotaDesc ?? s.quotaOpenHint ?? ''}
        loadError={subscriptionError ? s.subscriptionLoadError : undefined}
        onRetry={() => void refetchSubscription()}
        retryLabel={s.retry}
      />

      {formError ? <ApiKeysAlert message={formError} /> : null}

      {showLiveWarning ? (
        <ApiKeysAlert variant="warning" message={cp.liveWriteWarning ?? ''} />
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--primary)_12%,var(--background))] text-[var(--primary)]">
            <Key className="size-3.5" />
          </span>
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            {cp.basicsSection}
          </h2>
        </div>

        <div className="dashboard-card space-y-5 rounded-2xl p-5 sm:rounded-3xl">
          <TextField
            value={name}
            onChange={(value) => {
              setName(value);
              clearErrors();
            }}
            isRequired
            isInvalid={Boolean(formError && !name.trim())}
            isDisabled={isAtLimit}
          >
            <Label>{cp.nameLabel}</Label>
            <Input placeholder={cp.namePlaceholder} />
          </TextField>

          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">
              {cp.envLabel}
            </p>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              {cp.envDesc}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(['live', 'test'] as const).map((env) => {
                const selected = environment === env;
                const EnvIcon = env === 'live' ? Globe : FlaskConical;
                return (
                  <button
                    key={env}
                    type="button"
                    disabled={isAtLimit}
                    onClick={() => setEnvironment(env)}
                    className={cn(
                      'flex items-start gap-3 rounded-xl border p-4 text-start transition-all disabled:cursor-not-allowed disabled:opacity-50',
                      selected
                        ? 'border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_8%,var(--background))] ring-1 ring-[color-mix(in_srgb,var(--primary)_20%,transparent)]'
                        : 'border-[var(--border)] hover:border-[color-mix(in_srgb,var(--primary)_25%,var(--border))]',
                    )}
                  >
                    <EnvIcon
                      className={cn(
                        'mt-0.5 size-4 shrink-0',
                        env === 'live'
                          ? 'text-[var(--success)]'
                          : 'text-[var(--warning)]',
                      )}
                    />
                    <span>
                      <span className="block text-sm font-medium text-[var(--foreground)]">
                        {env === 'live' ? s.live : s.test}
                      </span>
                      <span className="mt-1 block text-xs text-[var(--muted-foreground)]">
                        {env === 'live' ? cp.envLiveDesc : cp.envTestDesc}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--primary)_12%,var(--background))] text-[var(--primary)]">
            <Shield className="size-3.5" />
          </span>
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            {cp.permissionsSection}
          </h2>
        </div>

        <div className="dashboard-card rounded-2xl p-5 sm:rounded-3xl">
          <p className="text-sm font-medium text-[var(--foreground)]">
            {cp.scopesLabel}
          </p>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
            {cp.scopesHelp}
          </p>
          <div className={cn('mt-3', isAtLimit && 'pointer-events-none opacity-50')}>
            <ApiKeyScopeGrid
              selectedScopes={selectedScopes}
              scopeLabels={scopeLabels}
              onChange={(scopes) => {
                setSelectedScopes(scopes);
                clearErrors();
              }}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--primary)_12%,var(--background))] text-[var(--primary)]">
            <Lock className="size-3.5" />
          </span>
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            {cp.securitySection}
          </h2>
        </div>

        <div className="dashboard-card space-y-5 rounded-2xl p-5 sm:rounded-3xl">
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">
              {cp.ipLabel}
            </p>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              {cp.ipDesc}
            </p>
            <div className={isAtLimit ? 'pointer-events-none opacity-50' : undefined}>
              <ApiKeyIpField
                ipInput={ipInput}
                ipList={ipList}
                ipError={ipError}
                placeholder={cp.ipPlaceholder}
                addLabel={cp.addIp}
                removeIpLabel={s.removeIp}
                onInputChange={(value) => {
                  setIpInput(value);
                  setIpError(null);
                }}
                onAdd={handleAddIp}
                onRemove={(ip) => setIpList((prev) => prev.filter((item) => item !== ip))}
              />
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-5">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-[var(--primary)]" />
              <p className="text-sm font-medium text-[var(--foreground)]">
                {cp.expiryLabel}
              </p>
            </div>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              {cp.expiryDesc}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {expirationOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  disabled={isAtLimit}
                  onClick={() => {
                    setExpiration(option.id);
                    clearErrors();
                  }}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50',
                    expiration === option.id
                      ? 'border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_8%,var(--background))] text-[var(--foreground)]'
                      : 'border-[var(--border)] text-[var(--muted-foreground)] hover:border-[color-mix(in_srgb,var(--primary)_25%,var(--border))]',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="dashboard-card flex flex-col-reverse gap-3 rounded-2xl p-4 sm:flex-row sm:justify-end sm:rounded-3xl sm:p-5">
        <Link
          href={appApiKeys(app.appId)}
          className="touch-target inline-flex w-full items-center justify-center rounded-full border border-[var(--border)] px-6 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)] sm:w-auto"
        >
          {s.cancel}
        </Link>
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!name.trim() || createMutation.isPending || isAtLimit}
          className="touch-target inline-flex w-full items-center justify-center rounded-full bg-[var(--primary)] px-8 py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          {createMutation.isPending ? cp.creating : cp.create}
        </button>
      </div>
    </div>
  );
}
