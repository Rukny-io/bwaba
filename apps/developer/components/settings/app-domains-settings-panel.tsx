'use client';

import { useEffect, useMemo, useState } from 'react';
import { TextField, Label, Input, Button } from '@heroui/react';
import { CheckCircle2, Globe } from 'lucide-react';
import { useCurrentApp } from '@/components/providers/app-context';
import { useTranslations } from '@/components/providers/translations-provider';
import { useUpdateApp } from '@/hooks/use-apps';
import type { UpdateAppInput } from '@/lib/api/types';
import { appToast, getApiErrorMessage } from '@/lib/app-toast';
import {
  SettingsRow,
  SettingsRowDivider,
  SettingsStatusBadge,
} from '@/components/settings/settings-primitives';
import {
  AppSettingsSection,
  mergeAppState,
  settingsInputClassName,
  settingsLabelClassName,
} from '@/components/settings/app-settings-section';

export function AppDomainsSettingsPanel() {
  const s = useTranslations().appSettings;
  const { app, patchApp } = useCurrentApp();
  const updateMutation = useUpdateApp(app.appId);

  const [websiteUrl, setWebsiteUrl] = useState(app.websiteUrl ?? '');

  useEffect(() => {
    setWebsiteUrl(app.websiteUrl ?? '');
  }, [app.websiteUrl]);

  const websiteDirty = websiteUrl !== (app.websiteUrl ?? '');

  async function handleSaveWebsite() {
    const input: UpdateAppInput = {
      websiteUrl: websiteUrl.trim() || undefined,
    };
    try {
      const updated = await updateMutation.mutateAsync(input);
      patchApp(mergeAppState(app, updated));
      appToast.success(s.saveSuccessDomains);
    } catch (error) {
      appToast.error(getApiErrorMessage(error, s.saveFailed));
    }
  }

  const websiteOrigin = useMemo(() => {
    if (!websiteUrl.trim()) return null;
    try {
      return new URL(websiteUrl.trim()).origin;
    } catch {
      return null;
    }
  }, [websiteUrl]);

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <AppSettingsSection
        flush
        title={s.domainsWebsiteTitle}
        description={s.domainsWebsiteDesc}
      >
        <SettingsRow
          isStatic
          icon={Globe}
          title={s.website}
          subtitle={
            websiteOrigin ? (
              <span dir="ltr" className="font-mono text-[12px]">
                {websiteOrigin}
              </span>
            ) : (
              s.websiteOriginHint
            )
          }
          trailing={
            websiteOrigin ? (
              <SettingsStatusBadge>
                <CheckCircle2 className="size-3.5" strokeWidth={1.85} aria-hidden />
                {s.websiteOriginLabel}
              </SettingsStatusBadge>
            ) : null
          }
        />
        <SettingsRowDivider />
        <div className="space-y-4 p-4 sm:space-y-5 sm:p-5">
          <TextField>
            <Label className={settingsLabelClassName}>{s.website}</Label>
            <Input
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://"
              dir="ltr"
              className={`${settingsInputClassName} font-mono`}
            />
          </TextField>
        </div>
      </AppSettingsSection>

      <div className="flex justify-end">
        <Button
          onPress={() => void handleSaveWebsite()}
          isDisabled={!websiteDirty || updateMutation.isPending}
          className="w-full rounded-full sm:w-auto"
        >
          {updateMutation.isPending ? s.saving : s.save}
        </Button>
      </div>
    </div>
  );
}
