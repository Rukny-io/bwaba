'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { AppImageUpload } from '@/components/settings/app-image-upload';
import {
  settingsInputClassName,
  settingsLabelClassName,
  settingsTextareaClassName,
} from '@/components/settings/app-settings-section';
import {
  PhoneStatusBadge,
  whatsappBtnPrimary,
  whatsappBtnSecondary,
} from '@/components/whatsapp/whatsapp-ui';
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

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className={settingsLabelClassName}>{label}</label>
      {children}
      {hint ? (
        <p className="text-[12px] leading-relaxed text-[var(--muted-foreground)]">{hint}</p>
      ) : null}
    </div>
  );
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

  const phoneId = phone.id;
  const displayName =
    phone.verifiedName || phone.account?.businessName || w.businessName;
  const displayNumber = phone.displayPhoneNumber || phone.phoneNumber;

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
        phoneId,
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
        phoneId,
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
    <div className="dashboard-section-stack pb-28 sm:pb-0">
      <p className="text-sm text-[var(--muted-foreground)]">{w.profileDesc}</p>

      <section className="dashboard-panel overflow-hidden">
        <AppImageUpload
          variant="hero"
          label={w.profilePicture}
          hint={w.profilePictureHint}
          value={profilePictureUrl}
          fallbackInitial={displayName}
          shape="circle"
          uploading={uploadingPicture}
          onUpload={(file) => handlePictureUpload(file)}
          onClear={() => setProfilePictureUrl('')}
        />
        <div className="border-t border-[var(--border)]/70 px-4 py-4 text-center sm:px-5 sm:text-start">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h3 className="text-base font-semibold text-[var(--foreground)]">{displayName}</h3>
            <PhoneStatusBadge status={phone.status} />
          </div>
          <p className="mt-1 font-mono text-sm text-[var(--muted-foreground)]" dir="ltr">
            {displayNumber}
          </p>
          <p className="mt-2 text-[12px] text-[var(--muted-foreground)]">
            {w.profileDisplayNameHint}
          </p>
        </div>
      </section>

      <section className="dashboard-panel space-y-5 p-4 sm:p-5">
        <header>
          <h3 className="text-[15px] font-semibold text-[var(--foreground)]">
            {w.profileTitle}
          </h3>
        </header>

        <Field label={w.profileAbout}>
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value.slice(0, MAX_ABOUT))}
            rows={3}
            className={settingsTextareaClassName}
            placeholder={w.profileAboutHint}
          />
          <p className="text-[11px] text-[var(--muted-foreground)]" dir="ltr">
            {about.length}/{MAX_ABOUT}
          </p>
        </Field>

        <Field label={w.profileDescription}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION))}
            rows={4}
            className={settingsTextareaClassName}
            placeholder={w.profileDescriptionHint}
          />
          <p className="text-[11px] text-[var(--muted-foreground)]" dir="ltr">
            {description.length}/{MAX_DESCRIPTION}
          </p>
        </Field>

        <Field label={w.profileAddress}>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={settingsInputClassName}
          />
        </Field>

        <Field label={w.profileEmail}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hello@example.com"
            dir="ltr"
            className={settingsInputClassName}
          />
        </Field>
      </section>

      <section className="dashboard-panel space-y-4 p-4 sm:p-5">
        <header>
          <h3 className="text-[15px] font-semibold text-[var(--foreground)]">
            {w.profileWebsites}
          </h3>
          <p className="mt-1 text-[13px] text-[var(--muted-foreground)]">
            {w.profileWebsitesHint}
          </p>
        </header>

        <div className="space-y-3">
          {websites.map((url, index) => (
            <div
              key={index}
              className="flex flex-col gap-2 sm:flex-row sm:items-center"
            >
              <input
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
                  className={cn(
                    whatsappBtnSecondary,
                    'w-full shrink-0 sm:w-auto sm:min-w-[2.75rem] sm:px-0',
                  )}
                  aria-label={w.profileRemoveWebsite}
                >
                  <Trash2 className="size-4" />
                  <span className="sm:hidden">{w.profileRemoveWebsite}</span>
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
      </section>

      <div
        className={cn(
          'max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:z-40',
          'max-sm:border-t max-sm:border-[var(--border)]/80 max-sm:bg-[var(--background)]/95 max-sm:px-4 max-sm:py-3 max-sm:backdrop-blur-md',
          'max-sm:pb-[max(calc(0.75rem+4.75rem),env(safe-area-inset-bottom))]',
          'sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none',
        )}
      >
        <div className="mx-auto flex max-w-3xl sm:justify-end">
          <button
            type="button"
            disabled={!dirty || profileMutation.isPending}
            onClick={() => void handleSave()}
            className={cn(whatsappBtnPrimary, 'h-11 w-full sm:w-auto sm:min-w-[10rem]')}
          >
            {profileMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {w.profileSaving}
              </>
            ) : (
              w.profileSave
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
