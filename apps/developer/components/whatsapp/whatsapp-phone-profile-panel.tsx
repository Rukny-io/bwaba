'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Label, TextField } from '@heroui/react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { AppImageUpload } from '@/components/settings/app-image-upload';
import {
  AppSettingsSection,
  settingsInputClassName,
  settingsLabelClassName,
  settingsTextareaClassName,
} from '@/components/settings/app-settings-section';
import { SettingsRowDivider } from '@/components/settings/settings-primitives';
import { useWhatsappPhone } from '@/components/whatsapp/whatsapp-phone-context';
import { useWhatsappMutations } from '@/hooks/use-whatsapp';
import { appToast, getApiErrorMessage } from '@/lib/app-toast';
import { cn } from '@/lib/utils';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HTTPS_RE = /^https:\/\/.+/i;
const MAX_WEBSITES = 2;
const MAX_ABOUT = 139;
const MAX_DESCRIPTION = 512;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Image upload failed'));
    };
    reader.onerror = () => reject(new Error('Image upload failed'));
    reader.readAsDataURL(file);
  });
}

function parseWebsites(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

export function WhatsappPhoneProfilePanel() {
  const w = useTranslations().whatsapp;
  const { phone, appId } = useWhatsappPhone();
  const { profileMutation, profilePictureMutation } = useWhatsappMutations(appId);

  const [about, setAbout] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [websites, setWebsites] = useState<string[]>(['']);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [uploadingPicture, setUploadingPicture] = useState(false);

  useEffect(() => {
    if (!phone) return;
    setAbout(phone.aboutText ?? '');
    setDescription(phone.description ?? '');
    setAddress(phone.address ?? '');
    setEmail(phone.email ?? '');
    const parsed = parseWebsites(phone.websites);
    setWebsites(parsed.length > 0 ? parsed : ['']);
    setProfilePictureUrl(phone.profilePictureUrl ?? '');
  }, [phone]);

  const initialWebsites = useMemo(
    () => parseWebsites(phone?.websites),
    [phone?.websites],
  );

  const dirty = useMemo(() => {
    if (!phone) return false;
    const normalizedWebsites = websites.map((url) => url.trim()).filter(Boolean);
    const initialNormalized = initialWebsites.map((url) => url.trim()).filter(Boolean);
    return (
      about !== (phone.aboutText ?? '') ||
      description !== (phone.description ?? '') ||
      address !== (phone.address ?? '') ||
      email !== (phone.email ?? '') ||
      JSON.stringify(normalizedWebsites) !== JSON.stringify(initialNormalized)
    );
  }, [about, address, description, email, initialWebsites, phone, websites]);

  if (!phone) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  const displayName =
    phone.verifiedName || phone.account?.businessName || w.businessName;

  function updateWebsite(index: number, value: string) {
    setWebsites((prev) => prev.map((url, i) => (i === index ? value : url)));
  }

  function addWebsite() {
    if (websites.length >= MAX_WEBSITES) {
      appToast.error(w.profileMaxWebsites);
      return;
    }
    setWebsites((prev) => [...prev, '']);
  }

  function removeWebsite(index: number) {
    setWebsites((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [''];
    });
  }

  async function handlePictureUpload(file: File) {
    setUploadingPicture(true);
    try {
      const image = await readFileAsDataUrl(file);
      const result = await profilePictureMutation.mutateAsync({
        phoneId: phone.id,
        image,
      });
      setProfilePictureUrl(result.profilePictureUrl);
      appToast.success(w.profileUploadSuccess);
    } catch (error) {
      appToast.error(getApiErrorMessage(error, w.profileUploadFailed));
    } finally {
      setUploadingPicture(false);
    }
  }

  async function handleSave() {
    const trimmedEmail = email.trim();
    if (trimmedEmail && !EMAIL_RE.test(trimmedEmail)) {
      appToast.error(w.profileEmailInvalid);
      return;
    }

    const normalizedWebsites = websites.map((url) => url.trim()).filter(Boolean);
    if (normalizedWebsites.length > MAX_WEBSITES) {
      appToast.error(w.profileMaxWebsites);
      return;
    }
    for (const url of normalizedWebsites) {
      if (!HTTPS_RE.test(url)) {
        appToast.error(w.profileWebsiteInvalid);
        return;
      }
    }

    try {
      await profileMutation.mutateAsync({
        phoneId: phone.id,
        body: {
          about: about.trim() || undefined,
          description: description.trim() || undefined,
          address: address.trim() || undefined,
          email: trimmedEmail.toLowerCase() || undefined,
          websites: normalizedWebsites,
        },
      });
      appToast.success(w.profileSaved);
    } catch (error) {
      appToast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <AppSettingsSection flush title={w.profileTitle} description={w.profileDesc}>
        <AppImageUpload
          label={w.profilePicture}
          hint={w.profilePictureHint}
          value={profilePictureUrl}
          fallbackInitial={displayName}
          shape="circle"
          uploading={uploadingPicture}
          onUpload={(file) => handlePictureUpload(file)}
          onClear={() => setProfilePictureUrl('')}
        />

        <SettingsRowDivider />

        <div className="grid gap-x-4 gap-y-4 p-4 sm:grid-cols-2 sm:gap-y-5 sm:p-5">
          <div className="sm:col-span-2">
            <p className={settingsLabelClassName}>{w.profileDisplayName}</p>
            <Input
              value={displayName}
              readOnly
              className={cn(settingsInputClassName, 'mt-1.5 opacity-80')}
            />
            <p className="mt-1.5 text-[12px] text-[var(--muted-foreground)]">
              {w.profileDisplayNameHint}
            </p>
          </div>

          <TextField className="sm:col-span-2">
            <Label className={settingsLabelClassName}>{w.profileAbout}</Label>
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value.slice(0, MAX_ABOUT))}
              rows={2}
              className={settingsTextareaClassName}
              placeholder={w.profileAboutHint}
            />
            <p className="mt-1 text-[11px] text-[var(--muted-foreground)]" dir="ltr">
              {about.length}/{MAX_ABOUT}
            </p>
          </TextField>

          <TextField className="sm:col-span-2">
            <Label className={settingsLabelClassName}>{w.profileDescription}</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION))}
              rows={4}
              className={settingsTextareaClassName}
              placeholder={w.profileDescriptionHint}
            />
            <p className="mt-1 text-[11px] text-[var(--muted-foreground)]" dir="ltr">
              {description.length}/{MAX_DESCRIPTION}
            </p>
          </TextField>

          <TextField className="sm:col-span-2">
            <Label className={settingsLabelClassName}>{w.profileAddress}</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={settingsInputClassName}
            />
          </TextField>

          <TextField>
            <Label className={settingsLabelClassName}>{w.profileEmail}</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hello@example.com"
              dir="ltr"
              className={settingsInputClassName}
            />
          </TextField>
        </div>
      </AppSettingsSection>

      <AppSettingsSection
        title={w.profileWebsites}
        description={w.profileWebsitesHint}
      >
        <div className="space-y-3">
          {websites.map((url, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={url}
                onChange={(e) => updateWebsite(index, e.target.value)}
                placeholder={w.profileWebsitePlaceholder}
                dir="ltr"
                className={settingsInputClassName}
              />
              {websites.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeWebsite(index)}
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
                  aria-label={w.profileRemoveWebsite}
                >
                  <Trash2 className="size-4" />
                </button>
              ) : null}
            </div>
          ))}

          {websites.length < MAX_WEBSITES ? (
            <button
              type="button"
              onClick={addWebsite}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--primary)] hover:underline"
            >
              <Plus className="size-3.5" />
              {w.profileAddWebsite}
            </button>
          ) : null}
        </div>
      </AppSettingsSection>

      <div className="flex justify-end">
        <Button
          onPress={() => void handleSave()}
          isDisabled={!dirty || profileMutation.isPending}
          className="w-full rounded-full sm:w-auto"
        >
          {profileMutation.isPending ? w.profileSaving : w.profileSave}
        </Button>
      </div>
    </div>
  );
}
