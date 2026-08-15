'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TextField, Label, Input } from '@heroui/react';
import { Globe, FlaskConical, Shield, Lock, CalendarDays, Key } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { useCurrentApp } from '@/components/providers/app-context';
import { useUpdateApiKey } from '@/hooks/use-api-keys';
import { ApiKeysAlert } from '@/components/api-keys/api-keys-alert';
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
import type { DeveloperApiKey } from '@/lib/api/types';
import { appApiKeys } from '@/lib/app-routes';
import { formatApiKeyDate } from '@/lib/api-key-format';
import { appToast, getApiErrorMessage } from '@/lib/app-toast';
import { cn } from '@/lib/utils';

interface EditApiKeyFormProps {
  apiKey: DeveloperApiKey;
}

export function EditApiKeyForm({ apiKey }: EditApiKeyFormProps) {
  const router = useRouter();
  const t = useTranslations();
  const s = t.apiKeys;
  const ep = (s.editPage ?? {}) as Record<string, string>;
  const scopeLabels = (s.scopeLabels ?? {}) as Record<string, string>;
  const { app } = useCurrentApp();
  const updateMutation = useUpdateApiKey(app.id, app.appId);

  const [name, setName] = useState(apiKey.name);
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    ...apiKey.scopes,
  ]);
  const [ipInput, setIpInput] = useState('');
  const [ipList, setIpList] = useState<string[]>([...apiKey.ipAllowlist]);
  const [formError, setFormError] = useState<string | null>(null);
  const [ipError, setIpError] = useState<string | null>(null);

  const isInactive = apiKey.status !== 'ACTIVE';
  const isLive = apiKey.environment === 'live';
  const EnvIcon = isLive ? Globe : FlaskConical;
  const envLabel = isLive ? s.live : s.test;
  const maskedKey = `${apiKey.keyPrefix}•••${apiKey.keySuffix}`;
  const statusLabel =
    apiKey.status === 'ACTIVE'
      ? s.active
      : apiKey.status === 'REVOKED'
        ? s.revoked
        : s.expired;

  const scopeSummary =
    selectedScopes.length > 0
      ? selectedScopes
          .slice(0, 3)
          .map((scope) => scopeLabels[scope] ?? scope)
          .join(' · ') +
        (selectedScopes.length > 3 ? ` +${selectedScopes.length - 3}` : '')
      : ep.scopesHelp;

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

  const handleSubmit = useCallback(async () => {
    if (isInactive) return;
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
      await updateMutation.mutateAsync({
        keySlug: apiKey.slug,
        input: {
          name: name.trim(),
          scopes: selectedScopes,
          ipAllowlist: ipList,
        },
      });
      appToast.success(ep.saveSuccess ?? s.createKey);
      router.push(appApiKeys(app.appId));
    } catch (error) {
      const message = getApiErrorMessage(error, ep.saveFailed ?? s.createFailed);
      setFormError(message);
      appToast.fromError(error, ep.saveFailed ?? s.createFailed);
    }
  }, [
    apiKey.slug,
    app.appId,
    clearErrors,
    ep.saveFailed,
    ep.saveSuccess,
    ipList,
    isInactive,
    name,
    router,
    selectedScopes,
    s,
    updateMutation,
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 sm:gap-8">
      {isInactive ? (
        <ApiKeysAlert variant="warning" message={ep.inactiveWarning ?? ''} />
      ) : null}

      {formError ? <ApiKeysAlert message={formError} /> : null}

      <AppSettingsSection flush title={ep.basicsSection}>
        <div className="grid gap-x-4 gap-y-4 p-4 sm:grid-cols-2 sm:gap-y-5 sm:p-5">
          <TextField
            isRequired
            className="sm:col-span-2"
            value={name}
            onChange={(value) => {
              setName(value);
              clearErrors();
            }}
            isDisabled={isInactive}
            isInvalid={Boolean(formError && !name.trim())}
          >
            <Label className={settingsLabelClassName}>{ep.nameLabel}</Label>
            <Input
              placeholder={ep.namePlaceholder}
              className={settingsInputClassName}
            />
          </TextField>
        </div>

        <SettingsRowDivider />

        <SettingsRow
          isStatic
          icon={EnvIcon}
          title={ep.envLabel}
          subtitle={ep.envReadOnly}
          trailing={
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold',
                isLive
                  ? 'border-[color-mix(in_srgb,var(--success)_28%,var(--border))] bg-[color-mix(in_srgb,var(--success)_10%,var(--background))] text-[var(--success)]'
                  : 'border-[color-mix(in_srgb,var(--warning)_28%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_10%,var(--background))] text-[var(--warning)]',
              )}
            >
              <EnvIcon className="size-3.5" aria-hidden />
              {envLabel}
            </span>
          }
        />

        <SettingsRowDivider />

        <SettingsRow
          isStatic
          icon={Key}
          title={ep.keyIdLabel}
          trailing={
            <code
              dir="ltr"
              className="max-w-[12rem] truncate font-mono text-[12px] text-[var(--muted-foreground)] sm:max-w-none"
            >
              {maskedKey}
            </code>
          }
        />

        <SettingsRowDivider />

        <SettingsRow
          isStatic
          title={statusLabel}
          trailing={
            <span
              className={cn(
                'inline-flex items-center gap-1.5 text-[13px] font-medium',
                apiKey.status === 'ACTIVE'
                  ? 'text-[var(--success)]'
                  : apiKey.status === 'REVOKED'
                    ? 'text-[var(--danger)]'
                    : 'text-[var(--warning)]',
              )}
            >
              <span
                className={cn(
                  'size-1.5 rounded-full',
                  apiKey.status === 'ACTIVE'
                    ? 'bg-[var(--success)]'
                    : apiKey.status === 'REVOKED'
                      ? 'bg-[var(--danger)]'
                      : 'bg-[var(--warning)]',
                )}
              />
              {statusLabel}
            </span>
          }
        />

        {apiKey.expiresAt ? (
          <>
            <SettingsRowDivider />
            <SettingsRow
              isStatic
              icon={CalendarDays}
              title={ep.expiresLabel}
              trailing={
                <span className="text-[13px] text-[var(--muted-foreground)]" dir="ltr" lang="en">
                  {formatApiKeyDate(apiKey.expiresAt)}
                </span>
              }
            />
          </>
        ) : null}
      </AppSettingsSection>

      <AppSettingsSection
        flush
        title={ep.permissionsSection}
        description={ep.scopesHelp}
      >
        <SettingsRow
          isStatic
          icon={Shield}
          title={ep.scopesLabel}
          subtitle={scopeSummary}
        />
        <SettingsRowDivider />
        <div
          className={cn(
            'p-4 sm:p-5',
            isInactive && 'pointer-events-none opacity-50',
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

      <AppSettingsSection flush title={ep.securitySection} description={ep.ipDesc}>
        <SettingsRow
          isStatic
          icon={Lock}
          title={ep.ipLabel}
          subtitle={
            ipList.length > 0 ? ipList.join(' · ') : (ep.ipPlaceholder ?? '—')
          }
        />
        <SettingsRowDivider />
        <div
          className={cn(
            'p-4 sm:p-5',
            isInactive && 'pointer-events-none opacity-50',
          )}
        >
          <ApiKeyIpField
            ipInput={ipInput}
            ipList={ipList}
            ipError={ipError}
            placeholder={ep.ipPlaceholder}
            addLabel={ep.addIp}
            removeIpLabel={s.removeIp}
            onInputChange={(value) => {
              setIpInput(value);
              setIpError(null);
            }}
            onAdd={handleAddIp}
            onRemove={(ip) => setIpList((prev) => prev.filter((item) => item !== ip))}
          />
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
          disabled={!name.trim() || updateMutation.isPending || isInactive}
          className="inline-flex w-full items-center justify-center rounded-full bg-[var(--primary)] px-8 py-2.5 text-[13px] font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          {updateMutation.isPending ? ep.saving : ep.save}
        </button>
      </div>
    </div>
  );
}
