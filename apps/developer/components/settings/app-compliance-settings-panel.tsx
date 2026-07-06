'use client';

import { useEffect, useState } from 'react';
import { TextField, Label, Input, Button } from '@heroui/react';
import { Mail, Phone } from 'lucide-react';
import { useCurrentApp } from '@/components/providers/app-context';
import { useTranslations } from '@/components/providers/translations-provider';
import { useUpdateApp } from '@/hooks/use-apps';
import type { UpdateAppInput } from '@/lib/api/types';
import { appToast, getApiErrorMessage } from '@/lib/app-toast';
import {
  AppSettingsSection,
  mergeAppState,
} from '@/components/settings/app-settings-section';

export function AppComplianceSettingsPanel() {
  const s = useTranslations().appSettings;
  const { app, patchApp } = useCurrentApp();
  const updateMutation = useUpdateApp(app.appId);

  const [dpo, setDpo] = useState({
    dpoName: app.dpoName ?? '',
    dpoEmail: app.dpoEmail ?? '',
    dpoPhone: app.dpoPhone ?? '',
  });

  useEffect(() => {
    setDpo({
      dpoName: app.dpoName ?? '',
      dpoEmail: app.dpoEmail ?? '',
      dpoPhone: app.dpoPhone ?? '',
    });
  }, [app]);

  const dpoDirty =
    dpo.dpoName !== (app.dpoName ?? '') ||
    dpo.dpoEmail !== (app.dpoEmail ?? '') ||
    dpo.dpoPhone !== (app.dpoPhone ?? '');

  async function handleSaveDpo() {
    const input: UpdateAppInput = {
      dpoName: dpo.dpoName.trim() || undefined,
      dpoEmail: dpo.dpoEmail.trim() || undefined,
      dpoPhone: dpo.dpoPhone.trim() || undefined,
    };
    try {
      const updated = await updateMutation.mutateAsync(input);
      patchApp(mergeAppState(app, updated));
      appToast.success(s.saveSuccessDpo);
    } catch (error) {
      appToast.error(getApiErrorMessage(error, s.saveFailed));
    }
  }

  return (
    <AppSettingsSection
      title={s.dpoTitle}
      description={s.dpoDesc}
      footer={
        <Button
          onPress={() => void handleSaveDpo()}
          isDisabled={!dpoDirty || updateMutation.isPending}
          className="w-full rounded-xl sm:w-auto"
        >
          {updateMutation.isPending ? s.saving : s.save}
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField>
          <Label className="flex items-center gap-2 text-xs font-medium">
            <Mail size={14} className="text-[var(--muted-foreground)]" />
            {s.dpoName}
          </Label>
          <Input
            value={dpo.dpoName}
            onChange={(e) =>
              setDpo((prev) => ({ ...prev, dpoName: e.target.value }))
            }
            className="w-full rounded-xl sm:w-auto"
          />
        </TextField>

        <TextField>
          <Label className="flex items-center gap-2 text-xs font-medium">
            <Mail size={14} className="text-[var(--muted-foreground)]" />
            {s.dpoEmail}
          </Label>
          <Input
            value={dpo.dpoEmail}
            onChange={(e) =>
              setDpo((prev) => ({ ...prev, dpoEmail: e.target.value }))
            }
            type="email"
            dir="ltr"
            className="w-full rounded-xl sm:w-auto"
          />
        </TextField>

        <TextField className="sm:col-span-2">
          <Label className="flex items-center gap-2 text-xs font-medium">
            <Phone size={14} className="text-[var(--muted-foreground)]" />
            {s.dpoPhone}
          </Label>
          <Input
            value={dpo.dpoPhone}
            onChange={(e) =>
              setDpo((prev) => ({ ...prev, dpoPhone: e.target.value }))
            }
            dir="ltr"
            className="w-full rounded-xl sm:w-auto"
          />
        </TextField>
      </div>
    </AppSettingsSection>
  );
}
