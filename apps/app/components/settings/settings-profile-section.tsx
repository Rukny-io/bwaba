'use client';

import { useCallback, useRef, useState } from 'react';
import { Avatar, Button, Input, TextArea, TextField } from '@heroui/react';
import { Camera, Loader2 } from 'lucide-react';
import { DashboardNotice } from '@/components/app/dashboard-section';
import {
  checkUsernameAvailable,
  updateMyProfile,
  uploadProfileAvatar,
} from '@/lib/profile/api';
import { getPublicProfileUrl } from '@/lib/profile/public-url';
import type { MyProfile } from '@/lib/profile/types';
import { resolveAvatarUrl } from '@/lib/media-url';
import { ApiException } from '@/lib/api-client';
import { SettingsFormRow } from '@/components/settings/settings-form-row';
import { cn } from '@/lib/utils';

const USERNAME_PATTERN = /^[a-z0-9_-]+$/;

function profileInitials(name: string | null | undefined, username: string) {
  const source = name?.trim() || username;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '؟';
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase();
}

const SETTINGS_FIELD_INPUT_CLASS =
  'min-h-11 text-[15px] shadow-none sm:min-h-[2.75rem] sm:text-[15px]';

const SETTINGS_FIELD_TEXTAREA_CLASS =
  'min-h-[7.5rem] text-[15px] shadow-none sm:text-[15px]';

interface SettingsProfileSectionProps {
  profile: MyProfile;
  onProfileChange: (profile: MyProfile) => void;
}

export function SettingsProfileSection({
  profile,
  onProfileChange,
}: SettingsProfileSectionProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(profile.name ?? '');
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio ?? '');
  const [location, setLocation] = useState(profile.location ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; text: string } | null>(
    null,
  );

  const publicUrl = getPublicProfileUrl(profile.username);
  const avatarUrl = resolveAvatarUrl(profile.avatar);

  const handleAvatarPick = useCallback(async (file: File) => {
    setUploading(true);
    setNotice(null);
    try {
      const updated = await uploadProfileAvatar(file);
      onProfileChange({ ...profile, ...updated });
      setNotice({ tone: 'success', text: 'تم تحديث الصورة الشخصية.' });
    } catch (err) {
      setNotice({
        tone: 'danger',
        text: err instanceof ApiException ? err.message : 'تعذّر رفع الصورة',
      });
    } finally {
      setUploading(false);
    }
  }, [onProfileChange, profile]);

  const handleSave = useCallback(async () => {
    const trimmedUsername = username.trim().toLowerCase();
    if (!trimmedUsername) {
      setNotice({ tone: 'danger', text: 'اسم المستخدم مطلوب.' });
      return;
    }
    if (!USERNAME_PATTERN.test(trimmedUsername)) {
      setNotice({
        tone: 'danger',
        text: 'اسم المستخدم: حروف إنجليزية صغيرة، أرقام، - و _ فقط.',
      });
      return;
    }
    if (trimmedUsername.length > 30) {
      setNotice({ tone: 'danger', text: 'اسم المستخدم طويل جداً (30 حرفاً كحد أقصى).' });
      return;
    }

    setSaving(true);
    setNotice(null);
    try {
      if (trimmedUsername !== profile.username) {
        const { available } = await checkUsernameAvailable(trimmedUsername);
        if (!available) {
          setNotice({ tone: 'danger', text: 'اسم المستخدم غير متاح.' });
          setSaving(false);
          return;
        }
      }

      const updated = await updateMyProfile({
        name: name.trim() || undefined,
        username: trimmedUsername,
        bio: bio.trim() || undefined,
        location: location.trim() || undefined,
      });
      onProfileChange({ ...profile, ...updated });
      setUsername(updated.username);
      setNotice({ tone: 'success', text: 'تم حفظ الملف الشخصي.' });
    } catch (err) {
      setNotice({
        tone: 'danger',
        text: err instanceof ApiException ? err.message : 'تعذّر الحفظ',
      });
    } finally {
      setSaving(false);
    }
  }, [bio, location, name, onProfileChange, profile, username]);

  return (
    <div className="flex flex-col gap-5">
      {notice ? (
        <DashboardNotice
          tone={notice.tone}
          title={notice.tone === 'success' ? 'تم' : 'تنبيه'}
          description={notice.text}
        />
      ) : null}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <div className="flex shrink-0 flex-col items-center gap-3 text-center lg:w-[9.5rem] lg:items-stretch lg:text-start">
          <div className="relative mx-auto lg:mx-0">
            <Avatar size="lg" className="size-24 sm:size-28">
              {avatarUrl ? <Avatar.Image alt="" src={avatarUrl} /> : null}
              <Avatar.Fallback className="text-xl">
                {profileInitials(profile.name, profile.username)}
              </Avatar.Fallback>
            </Avatar>
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className={cn(
                'absolute -bottom-1 -end-1 flex size-9 items-center justify-center rounded-full',
                'border border-[color-mix(in_oklab,var(--border)_60%,transparent)] bg-[var(--surface)]',
                'text-[var(--foreground)] shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50',
              )}
              aria-label="تغيير الصورة"
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Camera className="size-4" strokeWidth={1.75} aria-hidden />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) void handleAvatarPick(file);
              }}
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--foreground)]">
              {profile.name || profile.username}
            </p>
            {publicUrl ? (
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block max-w-full truncate text-[12px] text-[var(--primary)] hover:underline"
                dir="ltr"
              >
                {publicUrl}
              </a>
            ) : (
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--muted-foreground)]">
                أضف اسم مستخدم لعرض رابط صفحتك.
              </p>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-5 border-t border-[var(--separator)] pt-5 lg:border-t-0 lg:border-s lg:pt-0 lg:ps-10">
          <SettingsFormRow label="الاسم">
            <TextField value={name} onChange={setName} fullWidth className="w-full">
              <Input
                fullWidth
                variant="secondary"
                placeholder="الاسم الظاهر للزوار"
                className={SETTINGS_FIELD_INPUT_CLASS}
              />
            </TextField>
          </SettingsFormRow>

          <SettingsFormRow
            label="اسم المستخدم"
            hint="حروف إنجليزية صغيرة، أرقام، شرطة وشرطة سفلية"
          >
            <TextField
              value={username}
              onChange={(value) => setUsername(value.toLowerCase())}
              fullWidth
              className="w-full"
            >
              <Input
                fullWidth
                variant="secondary"
                dir="ltr"
                className={SETTINGS_FIELD_INPUT_CLASS}
              />
            </TextField>
          </SettingsFormRow>

          <SettingsFormRow label="نبذة" alignTop>
            <TextField value={bio} onChange={setBio} fullWidth className="w-full">
              <TextArea
                fullWidth
                variant="secondary"
                placeholder="وصف قصير يظهر في صفحتك"
                className={SETTINGS_FIELD_TEXTAREA_CLASS}
                maxLength={500}
              />
            </TextField>
          </SettingsFormRow>

          <SettingsFormRow label="الموقع">
            <TextField value={location} onChange={setLocation} fullWidth className="w-full">
              <Input
                fullWidth
                variant="secondary"
                placeholder="مثال: بغداد، العراق"
                className={SETTINGS_FIELD_INPUT_CLASS}
              />
            </TextField>
          </SettingsFormRow>

          <div className="flex justify-end pt-1 sm:grid sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-x-6">
            <div className="hidden sm:block" aria-hidden />
            <Button
              variant="primary"
              onPress={() => void handleSave()}
              isDisabled={saving || uploading}
            >
              {saving ? 'جاري الحفظ…' : 'حفظ الملف الشخصي'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
