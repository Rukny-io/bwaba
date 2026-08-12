'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TextField, Label, Input, Button } from '@heroui/react';
import {
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
  SettingsRow,
  SettingsRowDivider,
} from '@/components/settings/settings-primitives';
import {
  AppSettingsSection,
  settingsInputClassName,
  settingsLabelClassName,
} from '@/components/settings/app-settings-section';
import {
  DEFAULT_API_KEY_SCOPES,
  computeExpiresAt,
  hasWriteScopes,
  type ApiKeyExpirationPreset,
} from '@/lib/api/scopes';
import type { ApiKeyEnvironment } from '@/lib/api/types';
import { appApiKeys } from '@/lib/app-routes';
import { appToast, getApiErrorMessage } from '@/lib/app-toast';
import {
  resolveApiKeyQuota,
  formatUsageCount,
  isQuotaAtLimit,
} from '@/lib/developer-plan-limits';
import { cn } from '@/lib/utils';

export function CreateApiKeyForm() {
  const router = useRouter();
  const t = useTranslations();
  const s = t.apiKeys;
  const cp = (s.createPage ?? {}) as Record<string, string>;
  const scopeLabels = (s.scopeLabels ?? {}) as Record<string, string>;
  const { app } = useCurrentApp();
  const createMutation = useCreateApiKey(app.id, app.appId);
  const {
    data: subscription,
    isError: subscriptionError,
    refetch: refetchSubscription,
  } = useDeveloperSubscription();
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
      <div className="mx-auto w-full max-w-xl">
        <AppSettingsSection
          flush
          title={ss.heading ?? s.createKey}
          description={ss.description}
        >
          <div className="flex flex-col items-center gap-5 p-5 text-center sm:p-6">
            <div className="relative">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--success)_12%,var(--background))]">
                <Key className="size-6 text-[var(--success)]" />
              </div>
              <div className="absolute -bottom-1 -end-1 flex size-6 items-center justify-center rounded-full bg-[var(--success)] text-white ring-2 ring-[var(--surface)]">
                <CheckCircle2 className="size-3.5" />
              </div>
            </div>

            <ApiKeysAlert variant="warning" message={ss.warning} />

            <div className="flex w-full items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
              <code
                dir="ltr"
                className="flex-1 break-all text-start font-mono text-xs text-[var(--foreground)] select-all"
              >
                {createdKey}
              </code>
              <button
                type="button"
                onClick={() => void handleCopyKey()}
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
                aria-label={ss.copy}
              >
                {copied ? (
                  <Check className="size-3.5 text-[var(--success)]" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
            </div>
          </div>
        </AppSettingsSection>

        <div className="mt-4 flex justify-end">
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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 sm:gap-8">
      <ApiKeyQuotaBanner
        used={apiKeysUsed}
        limit={apiKeysLimit}
        quotaLabels={quotaLabels}
        limitMessage={formatUsageCount(
          s.limitReached,
          apiKeysUsed,
          apiKeysLimit,
        )}
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

      <AppSettingsSection
        flush
        title={cp.basicsSection}
        description={cp.envDesc}
      >
        <div className="grid gap-x-4 gap-y-4 p-4 sm:grid-cols-2 sm:gap-y-5 sm:p-5">
          <TextField
            isRequired
            className="sm:col-span-2"
            value={name}
            onChange={(value) => {
              setName(value);
              clearErrors();
            }}
            isDisabled={isAtLimit}
            isInvalid={Boolean(formError && !name.trim())}
          >
            <Label className={settingsLabelClassName}>{cp.nameLabel}</Label>
            <Input
              placeholder={cp.namePlaceholder}
              className={settingsInputClassName}
            />
          </TextField>
        </div>

        <SettingsRowDivider />

        <SettingsRow
          isStatic
          icon={environment === 'live' ? Globe : FlaskConical}
          title={cp.envLabel}
          subtitle={
            environment === 'live' ? cp.envLiveDesc : cp.envTestDesc
          }
        />

        <SettingsRowDivider />

        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
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
                  'flex items-start gap-3 rounded-xl border px-3.5 py-3.5 text-start transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                  selected
                    ? 'border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_8%,var(--background))]'
                    : 'border-[var(--border)] bg-[var(--background)] hover:bg-[var(--surface-secondary)]/50',
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
                  <span className="block text-[13px] font-medium text-[var(--foreground)]">
                    {env === 'live' ? s.live : s.test}
                  </span>
                  <span className="mt-0.5 block text-[12px] text-[var(--muted-foreground)]">
                    {env === 'live' ? cp.envLiveDesc : cp.envTestDesc}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </AppSettingsSection>

      <AppSettingsSection
        flush
        title={cp.permissionsSection}
        description={cp.scopesHelp}
      >
        <SettingsRow
          isStatic
          icon={Shield}
          title={cp.scopesLabel}
          subtitle={
            selectedScopes.length > 0
              ? selectedScopes
                  .slice(0, 3)
                  .map((scope) => scopeLabels[scope] ?? scope)
                  .join(' · ') +
                (selectedScopes.length > 3
                  ? ` +${selectedScopes.length - 3}`
                  : '')
              : cp.scopesHelp
          }
        />
        <SettingsRowDivider />
        <div
          className={cn(
            'p-4 sm:p-5',
            isAtLimit && 'pointer-events-none opacity-50',
          )}
        >
          <ApiKeyScopeGrid
            selectedScopes={selectedScopes}
            scopeLabels={scopeLabels}
            onChange={(scopes) => {
              setSelectedScopes(scopes);
              clearErrors();
            }}
          />
        </div>
      </AppSettingsSection>

      <AppSettingsSection
        flush
        title={cp.securitySection}
        description={cp.ipDesc}
      >
        <SettingsRow
          isStatic
          icon={Lock}
          title={cp.ipLabel}
          subtitle={
            ipList.length > 0
              ? ipList.join(' · ')
              : (cp.ipPlaceholder ?? '—')
          }
        />
        <SettingsRowDivider />
        <div
          className={cn(
            'p-4 sm:p-5',
            isAtLimit && 'pointer-events-none opacity-50',
          )}
        >
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
            onRemove={(ip) =>
              setIpList((prev) => prev.filter((item) => item !== ip))
            }
          />
        </div>

        <SettingsRowDivider />

        <SettingsRow
          isStatic
          icon={CalendarDays}
          title={cp.expiryLabel}
          subtitle={
            expirationOptions.find((o) => o.id === expiration)?.label
          }
        />
        <SettingsRowDivider />
        <div className="flex flex-wrap gap-2 p-4 sm:p-5">
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
                'rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                expiration === option.id
                  ? 'border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_8%,var(--background))] text-[var(--foreground)]'
                  : 'border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)]',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </AppSettingsSection>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href={appApiKeys(app.appId)}
          className="inline-flex w-full items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-6 py-2.5 text-[13px] font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)] sm:w-auto"
        >
          {s.cancel}
        </Link>
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!name.trim() || createMutation.isPending || isAtLimit}
          className="inline-flex w-full items-center justify-center rounded-full bg-[var(--primary)] px-8 py-2.5 text-[13px] font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          {createMutation.isPending ? cp.creating : cp.create}
        </button>
      </div>
    </div>
  );
}
