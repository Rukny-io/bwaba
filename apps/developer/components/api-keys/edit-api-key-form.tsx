'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TextField, Label, Input } from '@heroui/react';
import {
  Key,
  Globe,
  FlaskConical,
  Shield,
  Lock,
  CalendarDays,
} from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { useCurrentApp } from '@/components/providers/app-context';
import { useUpdateApiKey } from '@/hooks/use-api-keys';
import { ApiKeysAlert } from '@/components/api-keys/api-keys-alert';
import { ApiKeyScopeGrid } from '@/components/api-keys/api-key-scope-grid';
import {
  ApiKeyIpField,
  validateIpEntry,
} from '@/components/api-keys/api-key-ip-field';
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
  const EnvIcon = apiKey.environment === 'live' ? Globe : FlaskConical;

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
    <div className="mx-auto max-w-2xl space-y-5 pb-8 sm:space-y-6">
      {isInactive ? (
        <ApiKeysAlert variant="warning" message={ep.inactiveWarning ?? ''} />
      ) : null}

      {formError ? <ApiKeysAlert message={formError} /> : null}

      <section className="space-y-3">
        <div className="flex items-center gap-2 px-0.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-[var(--surface-secondary)] text-[var(--primary)] ring-1 ring-[var(--border)]/50">
            <Key className="size-3.5" />
          </span>
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            {ep.basicsSection}
          </h2>
        </div>

        <div className="dashboard-metric-tile space-y-5 rounded-2xl p-4 sm:rounded-[1.75rem] sm:p-5">
          <TextField
            value={name}
            onChange={(value) => {
              setName(value);
              clearErrors();
            }}
            isRequired
            isDisabled={isInactive}
            isInvalid={Boolean(formError && !name.trim())}
          >
            <Label>{ep.nameLabel}</Label>
            <Input placeholder={ep.namePlaceholder} />
          </TextField>

          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">
              {ep.envLabel}
            </p>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              {ep.envReadOnly}
            </p>
            <div
              className={cn(
                'mt-3 inline-flex items-center gap-2 rounded-xl border px-4 py-3',
                apiKey.environment === 'live'
                  ? 'border-[color-mix(in_srgb,var(--success)_30%,var(--border))] bg-[color-mix(in_srgb,var(--success)_8%,var(--background))]'
                  : 'border-[color-mix(in_srgb,var(--warning)_30%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_8%,var(--background))]',
              )}
            >
              <EnvIcon
                className={cn(
                  'size-4',
                  apiKey.environment === 'live'
                    ? 'text-[var(--success)]'
                    : 'text-[var(--warning)]',
                )}
              />
              <span className="text-sm font-medium">
                {apiKey.environment === 'live' ? s.live : s.test}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-[var(--surface-secondary)] px-3 py-2.5">
            <p className="text-[11px] text-[var(--muted-foreground)]">
              {ep.keyIdLabel}
            </p>
            <code dir="ltr" className="font-mono text-xs text-[var(--foreground)]">
              {apiKey.keyPrefix}•••{apiKey.keySuffix}
            </code>
          </div>

          {apiKey.expiresAt ? (
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <CalendarDays className="size-4" />
              <span>
                {ep.expiresLabel}: {formatApiKeyDate(apiKey.expiresAt)}
              </span>
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 px-0.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-[var(--surface-secondary)] text-[var(--primary)] ring-1 ring-[var(--border)]/50">
            <Shield className="size-3.5" />
          </span>
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            {ep.permissionsSection}
          </h2>
        </div>

        <div
          className={cn(
            'dashboard-metric-tile rounded-2xl p-4 sm:rounded-[1.75rem] sm:p-5',
            isInactive && 'pointer-events-none opacity-60',
          )}
        >
          <p className="text-sm font-medium text-[var(--foreground)]">
            {ep.scopesLabel}
          </p>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
            {ep.scopesHelp}
          </p>
          <div className="mt-3">
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

      <section className="space-y-3">
        <div className="flex items-center gap-2 px-0.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-[var(--surface-secondary)] text-[var(--primary)] ring-1 ring-[var(--border)]/50">
            <Lock className="size-3.5" />
          </span>
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            {ep.securitySection}
          </h2>
        </div>

        <div
          className={cn(
            'dashboard-metric-tile rounded-2xl p-4 sm:rounded-[1.75rem] sm:p-5',
            isInactive && 'pointer-events-none opacity-60',
          )}
        >
          <p className="text-sm font-medium text-[var(--foreground)]">
            {ep.ipLabel}
          </p>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
            {ep.ipDesc}
          </p>
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
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href={appApiKeys(app.appId)}
          className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-6 py-2.5 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)]"
        >
          {s.cancel}
        </Link>
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!name.trim() || updateMutation.isPending || isInactive}
          className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-8 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {updateMutation.isPending ? ep.saving : ep.save}
        </button>
      </div>
    </div>
  );
}
