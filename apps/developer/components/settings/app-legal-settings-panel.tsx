'use client';

import { useEffect, useMemo, useState } from 'react';
import { TextField, Label, Input, Button } from '@heroui/react';
import { AppWindow, Mail, Phone, ShieldCheck } from 'lucide-react';
import { useCurrentApp } from '@/components/providers/app-context';
import { useTranslations } from '@/components/providers/translations-provider';
import { useUpdateApp } from '@/hooks/use-apps';
import type { UpdateAppInput } from '@/lib/api/types';
import { appToast, getApiErrorMessage } from '@/lib/app-toast';
import {
  AppSettingsSection,
  mergeAppState,
  settingsInputClassName,
  settingsTextareaClassName,
} from '@/components/settings/app-settings-section';

export function AppLegalSettingsPanel() {
  const s = useTranslations().appSettings;
  const { app, patchApp } = useCurrentApp();
  const updateMutation = useUpdateApp(app.appId);

  const [legal, setLegal] = useState({
    termsOfUseUrl: app.termsOfUseUrl ?? '',
    privacyPolicyUrl: app.privacyPolicyUrl ?? '',
    dpoName: app.dpoName ?? '',
    dpoEmail: app.dpoEmail ?? '',
    dpoPhone: app.dpoPhone ?? '',
  });

  useEffect(() => {
    setLegal({
      termsOfUseUrl: app.termsOfUseUrl ?? '',
      privacyPolicyUrl: app.privacyPolicyUrl ?? '',
      dpoName: app.dpoName ?? '',
      dpoEmail: app.dpoEmail ?? '',
      dpoPhone: app.dpoPhone ?? '',
    });
  }, [app]);

  const legalDirty = useMemo(
    () =>
      legal.termsOfUseUrl !== (app.termsOfUseUrl ?? '') ||
      legal.privacyPolicyUrl !== (app.privacyPolicyUrl ?? '') ||
      legal.dpoName !== (app.dpoName ?? '') ||
      legal.dpoEmail !== (app.dpoEmail ?? '') ||
      legal.dpoPhone !== (app.dpoPhone ?? ''),
    [legal, app],
  );

  async function handleSave() {
    const input: UpdateAppInput = {
      termsOfUseUrl: legal.termsOfUseUrl.trim() || undefined,
      privacyPolicyUrl: legal.privacyPolicyUrl.trim() || undefined,
      dpoName: legal.dpoName.trim() || undefined,
      dpoEmail: legal.dpoEmail.trim() || undefined,
      dpoPhone: legal.dpoPhone.trim() || undefined,
    };
    try {
      const updated = await updateMutation.mutateAsync(input);
      patchApp(mergeAppState(app, updated));
      appToast.success(s.saveSuccessLegal);
    } catch (error) {
      appToast.error(getApiErrorMessage(error, s.saveFailed));
    }
  }

  return (
    <div className="space-y-6">
      <AppSettingsSection title={s.legalLinksTitle} description={s.legalDesc}>
        <div className="space-y-4">
          {[
            { key: 'termsOfUseUrl' as const, label: s.termsOfUse, icon: AppWindow },
            {
              key: 'privacyPolicyUrl' as const,
              label: s.privacyPolicy,
              icon: ShieldCheck,
            },
          ].map(({ key, label, icon: Icon }) => (
            <TextField key={key}>
              <Label className="flex items-center gap-2 text-xs font-medium">
                <Icon size={14} className="text-[var(--muted-foreground)]" />
                {label}
              </Label>
              <Input
                value={legal[key]}
                onChange={(e) =>
                  setLegal((prev) => ({ ...prev, [key]: e.target.value }))
                }
                placeholder="https://"
                dir="ltr"
                className={`${settingsInputClassName} font-mono`}
              />
            </TextField>
          ))}
        </div>
      </AppSettingsSection>

      <AppSettingsSection title={s.dpoTitle} description={s.dpoDesc}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField>
            <Label className="flex items-center gap-2 text-xs font-medium">
              <Mail size={14} className="text-[var(--muted-foreground)]" />
              {s.dpoName}
            </Label>
            <Input
              value={legal.dpoName}
              onChange={(e) =>
                setLegal((prev) => ({ ...prev, dpoName: e.target.value }))
              }
              className={settingsInputClassName}
            />
          </TextField>

          <TextField>
            <Label className="flex items-center gap-2 text-xs font-medium">
              <Mail size={14} className="text-[var(--muted-foreground)]" />
              {s.dpoEmail}
            </Label>
            <Input
              value={legal.dpoEmail}
              onChange={(e) =>
                setLegal((prev) => ({ ...prev, dpoEmail: e.target.value }))
              }
              type="email"
              dir="ltr"
              className={settingsInputClassName}
            />
          </TextField>

          <TextField className="sm:col-span-2">
            <Label className="flex items-center gap-2 text-xs font-medium">
              <Phone size={14} className="text-[var(--muted-foreground)]" />
              {s.dpoPhone}
            </Label>
            <Input
              value={legal.dpoPhone}
              onChange={(e) =>
                setLegal((prev) => ({ ...prev, dpoPhone: e.target.value }))
              }
              dir="ltr"
              className={settingsInputClassName}
            />
          </TextField>
        </div>
      </AppSettingsSection>

      <div className="flex justify-end">
        <Button
          onPress={() => void handleSave()}
          isDisabled={!legalDirty || updateMutation.isPending}
          className="w-full rounded-xl sm:w-auto"
        >
          {updateMutation.isPending ? s.saving : s.save}
        </Button>
      </div>
    </div>
  );
}
