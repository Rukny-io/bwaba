'use client';

import { useEffect, useMemo, useState } from 'react';
import { TextField, Label, Input, Button } from '@heroui/react';
import { Globe } from 'lucide-react';
import { useCurrentApp } from '@/components/providers/app-context';
import { useTranslations } from '@/components/providers/translations-provider';
import { useUpdateApp } from '@/hooks/use-apps';
import type { UpdateAppInput } from '@/lib/api/types';
import { appToast, getApiErrorMessage } from '@/lib/app-toast';
import {
  AppSettingsSection,
  mergeAppState,
  settingsInputClassName,
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
    <AppSettingsSection
      title={s.domainsWebsiteTitle}
      description={s.domainsWebsiteDesc}
      footer={
        <Button
          onPress={() => void handleSaveWebsite()}
          isDisabled={!websiteDirty || updateMutation.isPending}
          className="w-full rounded-xl sm:w-auto"
        >
          {updateMutation.isPending ? s.saving : s.save}
        </Button>
      }
    >
      <TextField>
        <Label className="flex items-center gap-2 text-xs font-medium">
          <Globe size={14} className="text-[var(--muted-foreground)]" />
          {s.website}
        </Label>
        <Input
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://"
          dir="ltr"
          className={`${settingsInputClassName} font-mono`}
        />
      </TextField>
      {websiteOrigin ? (
        <p className="mt-3 rounded-xl bg-[var(--surface-secondary)] px-3 py-2 text-xs text-[var(--foreground)]">
          {s.websiteOriginLabel}:{' '}
          <code dir="ltr" className="font-mono text-[11px]">
            {websiteOrigin}
          </code>
        </p>
      ) : (
        <p className="mt-3 text-xs text-[var(--warning)]">{s.websiteOriginHint}</p>
      )}
    </AppSettingsSection>
  );
}
