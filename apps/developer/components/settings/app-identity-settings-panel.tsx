'use client';

import { useEffect, useMemo, useState } from 'react';
import { TextField, Label, Input, Button, TextArea } from '@heroui/react';
import { useCurrentApp } from '@/components/providers/app-context';
import { useTranslations } from '@/components/providers/translations-provider';
import { useUpdateApp } from '@/hooks/use-apps';
import { uploadAppImage } from '@/lib/api/app-upload';
import type { UpdateAppInput } from '@/lib/api/types';
import { appToast, getApiErrorMessage } from '@/lib/app-toast';
import { AppImageUpload } from '@/components/settings/app-image-upload';
import {
  AppSettingsSection,
  mergeAppState,
  settingsInputClassName,
  settingsTextareaClassName,
} from '@/components/settings/app-settings-section';

export function AppIdentitySettingsPanel() {
  const t = useTranslations();
  const s = t.appSettings;
  const { app, patchApp } = useCurrentApp();
  const updateMutation = useUpdateApp(app.appId);

  const [identity, setIdentity] = useState({
    name: app.name,
    description: app.description ?? '',
    icon: app.icon ?? '',
    profileImage: app.profileImage ?? '',
  });

  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);

  useEffect(() => {
    setIdentity({
      name: app.name,
      description: app.description ?? '',
      icon: app.icon ?? '',
      profileImage: app.profileImage ?? '',
    });
  }, [app]);

  const identityDirty = useMemo(
    () =>
      identity.name.trim() !== app.name ||
      identity.description !== (app.description ?? '') ||
      identity.icon !== (app.icon ?? '') ||
      identity.profileImage !== (app.profileImage ?? ''),
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
    await saveSection(
      {
        name: identity.name.trim(),
        description: identity.description.trim() || undefined,
        icon: identity.icon.trim() || undefined,
        profileImage: identity.profileImage.trim() || undefined,
      },
      s.saveSuccessIdentity,
    );
  }

  async function handleImageUpload(type: 'icon' | 'profile', file: File) {
    const setUploading = type === 'icon' ? setUploadingIcon : setUploadingProfile;
    setUploading(true);
    try {
      const key = await uploadAppImage(app.appId, type, file);
      const field = type === 'icon' ? 'icon' : 'profileImage';
      const updated = await updateMutation.mutateAsync({ [field]: key });
      patchApp(mergeAppState(app, updated));
      if (type === 'icon') {
        setIdentity((prev) => ({ ...prev, icon: key }));
      } else {
        setIdentity((prev) => ({ ...prev, profileImage: key }));
      }
      appToast.success(s.uploadSuccess);
    } catch (error) {
      appToast.error(getApiErrorMessage(error, s.uploadFailed));
    } finally {
      setUploading(false);
    }
  }

  return (
    <AppSettingsSection
      title={s.identityTitle}
      description={s.identityDesc}
      footer={
        <Button
          onPress={() => void handleSaveIdentity()}
          isDisabled={!identityDirty || updateMutation.isPending}
          className="w-full rounded-xl sm:w-auto"
        >
          {updateMutation.isPending ? s.saving : s.save}
        </Button>
      }
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <AppImageUpload
          label={s.appIcon}
          hint={s.uploadImage}
          value={identity.icon}
          fallbackInitial={identity.name}
          uploading={uploadingIcon}
          onUpload={(file) => handleImageUpload('icon', file)}
          onClear={() => setIdentity((prev) => ({ ...prev, icon: '' }))}
        />
        <AppImageUpload
          label={s.profileImage}
          hint={s.uploadImage}
          value={identity.profileImage}
          fallbackInitial={identity.name}
          uploading={uploadingProfile}
          shape="circle"
          onUpload={(file) => handleImageUpload('profile', file)}
          onClear={() => setIdentity((prev) => ({ ...prev, profileImage: '' }))}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField isRequired>
          <Label className="text-xs font-medium">{s.appName}</Label>
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
          <Label className="text-xs font-medium">{s.appId}</Label>
          <Input
            value={app.appId}
            readOnly
            dir="ltr"
            className={`${settingsInputClassName} font-mono opacity-80`}
          />
        </TextField>
      </div>

      <TextField>
        <Label className="text-xs font-medium">{s.contactEmail}</Label>
        <Input
          value={app.contactEmail}
          readOnly
          dir="ltr"
          className={`${settingsInputClassName} opacity-80`}
        />
      </TextField>

      <TextField>
        <Label className="text-xs font-medium">{s.description}</Label>
        <TextArea
          value={identity.description}
          onChange={(e) =>
            setIdentity((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder={s.descriptionPlaceholder}
          className={`${settingsTextareaClassName} min-h-24`}
        />
      </TextField>
    </AppSettingsSection>
  );
}
