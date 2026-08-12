'use client';

import { useEffect, useMemo, useState } from 'react';
import { TextField, Label, Input, Button } from '@heroui/react';
import { Check, Copy } from 'lucide-react';
import { useCurrentApp } from '@/components/providers/app-context';
import { useTranslations } from '@/components/providers/translations-provider';
import { useUpdateApp } from '@/hooks/use-apps';
import { uploadAppImage } from '@/lib/api/app-upload';
import type { UpdateAppInput } from '@/lib/api/types';
import { appToast, getApiErrorMessage } from '@/lib/app-toast';
import { cn } from '@/lib/utils';
import { AppImageUpload } from '@/components/settings/app-image-upload';
import { SettingsRowDivider } from '@/components/settings/settings-primitives';
import {
  AppSettingsSection,
  mergeAppState,
  settingsInputClassName,
  settingsLabelClassName,
} from '@/components/settings/app-settings-section';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AppIdentitySettingsPanel() {
  const t = useTranslations();
  const s = t.appSettings;
  const { app, patchApp } = useCurrentApp();
  const updateMutation = useUpdateApp(app.appId);
  const [copiedAppId, setCopiedAppId] = useState(false);

  const [identity, setIdentity] = useState({
    name: app.name,
    icon: app.icon ?? '',
    contactEmail: app.contactEmail ?? '',
    companyEmail: app.companyEmail ?? '',
    privacyPolicyUrl: app.privacyPolicyUrl ?? '',
    termsOfUseUrl: app.termsOfUseUrl ?? '',
    dpoName: app.dpoName ?? '',
    dpoEmail: app.dpoEmail ?? '',
    dpoPhone: app.dpoPhone ?? '',
  });

  const [uploadingIcon, setUploadingIcon] = useState(false);

  useEffect(() => {
    setIdentity({
      name: app.name,
      icon: app.icon ?? '',
      contactEmail: app.contactEmail ?? '',
      companyEmail: app.companyEmail ?? '',
      privacyPolicyUrl: app.privacyPolicyUrl ?? '',
      termsOfUseUrl: app.termsOfUseUrl ?? '',
      dpoName: app.dpoName ?? '',
      dpoEmail: app.dpoEmail ?? '',
      dpoPhone: app.dpoPhone ?? '',
    });
  }, [app]);

  const identityDirty = useMemo(
    () =>
      identity.name.trim() !== app.name ||
      identity.icon !== (app.icon ?? '') ||
      identity.contactEmail.trim().toLowerCase() !==
        (app.contactEmail ?? '').trim().toLowerCase() ||
      identity.companyEmail.trim().toLowerCase() !==
        (app.companyEmail ?? '').trim().toLowerCase() ||
      identity.privacyPolicyUrl !== (app.privacyPolicyUrl ?? '') ||
      identity.termsOfUseUrl !== (app.termsOfUseUrl ?? '') ||
      identity.dpoName !== (app.dpoName ?? '') ||
      identity.dpoEmail !== (app.dpoEmail ?? '') ||
      identity.dpoPhone !== (app.dpoPhone ?? ''),
    [identity, app],
  );

  async function saveSection(input: UpdateAppInput, successMessage: string) {
    try {
      const updated = await updateMutation.mutateAsync(input);
      patchApp(mergeAppState(app, updated));
      appToast.success(successMessage);
    } catch (error) {
      appToast.error(getApiErrorMessage(error, s.saveFailed));
    }
  }

  async function handleSaveIdentity() {
    if (identity.name.trim().length < 2) {
      appToast.error(s.toastNameRequired);
      return;
    }
    const email = identity.contactEmail.trim();
    if (!EMAIL_RE.test(email)) {
      appToast.error(s.toastContactEmailInvalid);
      return;
    }
    const companyEmail = identity.companyEmail.trim();
    if (companyEmail && !EMAIL_RE.test(companyEmail)) {
      appToast.error(s.toastCompanyEmailInvalid);
      return;
    }
    await saveSection(
      {
        name: identity.name.trim(),
        icon: identity.icon.trim() || undefined,
        contactEmail: email.toLowerCase(),
        companyEmail: companyEmail.toLowerCase(),
        privacyPolicyUrl: identity.privacyPolicyUrl.trim() || undefined,
        termsOfUseUrl: identity.termsOfUseUrl.trim() || undefined,
        dpoName: identity.dpoName.trim() || undefined,
        dpoEmail: identity.dpoEmail.trim() || undefined,
        dpoPhone: identity.dpoPhone.trim() || undefined,
      },
      s.saveSuccessIdentity,
    );
  }

  async function handleImageUpload(file: File) {
    setUploadingIcon(true);
    try {
      const key = await uploadAppImage(app.appId, 'icon', file);
      const updated = await updateMutation.mutateAsync({ icon: key });
      patchApp(mergeAppState(app, updated));
      setIdentity((prev) => ({ ...prev, icon: key }));
      appToast.success(s.uploadSuccess);
    } catch (error) {
      appToast.error(getApiErrorMessage(error, s.uploadFailed));
    } finally {
      setUploadingIcon(false);
    }
  }

  async function handleCopyAppId() {
    try {
      await navigator.clipboard.writeText(app.appId);
      setCopiedAppId(true);
      appToast.success(t.common.copied);
      window.setTimeout(() => setCopiedAppId(false), 1600);
    } catch {
      appToast.error(t.common.copy);
    }
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <AppSettingsSection
        flush
        title={s.identityTitle}
        description={s.identityDesc}
      >
        <AppImageUpload
          label={s.appIcon}
          hint={s.uploadImage}
          value={identity.icon}
          fallbackInitial={identity.name}
          uploading={uploadingIcon}
          onUpload={(file) => handleImageUpload(file)}
          onClear={() => setIdentity((prev) => ({ ...prev, icon: '' }))}
        />

        <SettingsRowDivider />

        <div className="grid gap-x-4 gap-y-4 p-4 sm:grid-cols-2 sm:gap-y-5 sm:p-5">
          <div>
            <p className={settingsLabelClassName}>{s.appId}</p>
            <div
              className={cn(
                'mt-1.5 flex h-11 items-stretch overflow-hidden rounded-xl border bg-[var(--background)] transition-[border-color,box-shadow]',
                copiedAppId
                  ? 'border-[color-mix(in_srgb,var(--success)_35%,var(--border))]'
                  : 'border-[var(--border)]',
              )}
            >
              <code
                dir="ltr"
                className="flex min-w-0 flex-1 items-center truncate px-3.5 font-mono text-[13px] text-[var(--foreground)] select-all"
              >
                {app.appId}
              </code>
              <button
                type="button"
                onClick={() => void handleCopyAppId()}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 border-s px-3 text-xs font-medium transition-colors',
                  copiedAppId
                    ? 'border-[color-mix(in_srgb,var(--success)_25%,var(--border))] bg-[color-mix(in_srgb,var(--success)_10%,var(--background))] text-[var(--success)]'
                    : 'border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]',
                )}
                aria-label={t.common.copy}
              >
                {copiedAppId ? (
                  <Check className="size-3.5 shrink-0" />
                ) : (
                  <Copy className="size-3.5 shrink-0" />
                )}
                <span className="hidden sm:inline">
                  {copiedAppId ? t.common.copied : t.common.copy}
                </span>
              </button>
            </div>
          </div>

          <TextField isRequired>
            <Label className={settingsLabelClassName}>{s.contactEmail}</Label>
            <Input
              type="email"
              value={identity.contactEmail}
              onChange={(e) =>
                setIdentity((prev) => ({
                  ...prev,
                  contactEmail: e.target.value,
                }))
              }
              placeholder={s.contactEmailPlaceholder}
              dir="ltr"
              className={settingsInputClassName}
            />
          </TextField>

          <TextField>
            <Label className={settingsLabelClassName}>{s.companyEmail}</Label>
            <Input
              type="email"
              value={identity.companyEmail}
              onChange={(e) =>
                setIdentity((prev) => ({
                  ...prev,
                  companyEmail: e.target.value,
                }))
              }
              placeholder={s.companyEmailPlaceholder}
              dir="ltr"
              className={settingsInputClassName}
            />
          </TextField>

          <TextField isRequired>
            <Label className={settingsLabelClassName}>{s.appName}</Label>
            <Input
              value={identity.name}
              onChange={(e) =>
                setIdentity((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder={s.appNamePlaceholder}
              className={settingsInputClassName}
            />
          </TextField>

          <TextField>
            <Label className={settingsLabelClassName}>
              {s.privacyPolicyUrl}
            </Label>
            <Input
              value={identity.privacyPolicyUrl}
              onChange={(e) =>
                setIdentity((prev) => ({
                  ...prev,
                  privacyPolicyUrl: e.target.value,
                }))
              }
              placeholder="https://"
              dir="ltr"
              className={settingsInputClassName}
            />
          </TextField>

          <TextField>
            <Label className={settingsLabelClassName}>
              {s.termsOfServiceUrl}
            </Label>
            <Input
              value={identity.termsOfUseUrl}
              onChange={(e) =>
                setIdentity((prev) => ({
                  ...prev,
                  termsOfUseUrl: e.target.value,
                }))
              }
              placeholder="https://"
              dir="ltr"
              className={settingsInputClassName}
            />
          </TextField>
        </div>
      </AppSettingsSection>

      <AppSettingsSection flush title={s.dpoTitle} description={s.dpoDesc}>
        <div className="grid gap-x-4 gap-y-4 p-4 sm:grid-cols-2 sm:gap-y-5 sm:p-5">
          <TextField>
            <Label className={settingsLabelClassName}>{s.dpoName}</Label>
            <Input
              value={identity.dpoName}
              onChange={(e) =>
                setIdentity((prev) => ({ ...prev, dpoName: e.target.value }))
              }
              className={settingsInputClassName}
            />
          </TextField>

          <TextField>
            <Label className={settingsLabelClassName}>{s.dpoEmail}</Label>
            <Input
              type="email"
              value={identity.dpoEmail}
              onChange={(e) =>
                setIdentity((prev) => ({ ...prev, dpoEmail: e.target.value }))
              }
              dir="ltr"
              className={settingsInputClassName}
            />
          </TextField>

          <TextField className="sm:col-span-2">
            <Label className={settingsLabelClassName}>{s.dpoPhone}</Label>
            <Input
              value={identity.dpoPhone}
              onChange={(e) =>
                setIdentity((prev) => ({ ...prev, dpoPhone: e.target.value }))
              }
              dir="ltr"
              className={settingsInputClassName}
            />
          </TextField>
        </div>
      </AppSettingsSection>

      <div className="flex justify-end">
        <Button
          onPress={() => void handleSaveIdentity()}
          isDisabled={!identityDirty || updateMutation.isPending}
          className="w-full rounded-full sm:w-auto"
        >
          {updateMutation.isPending ? s.saving : s.save}
        </Button>
      </div>
    </div>
  );
}
