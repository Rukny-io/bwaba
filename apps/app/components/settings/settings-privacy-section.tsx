'use client';

import { useCallback, useState } from 'react';
import { Button, Switch } from '@heroui/react';
import { DashboardNotice } from '@/components/app/dashboard-section';
import { orderPillButtonClass } from '@/components/orders/order-pill-button';
import { updateMyProfile } from '@/lib/profile/api';
import type { MyProfile, ProfileVisibility } from '@/lib/profile/types';
import { ApiException } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface SettingsPrivacySectionProps {
  profile: MyProfile;
  onProfileChange: (profile: MyProfile) => void;
}

const VISIBILITY_OPTIONS: { id: ProfileVisibility; label: string; hint: string }[] = [
  { id: 'PUBLIC', label: 'عامة', hint: 'أي شخص يمكنه زيارة صفحتك' },
  { id: 'PRIVATE', label: 'خاصة', hint: 'الصفحة غير متاحة للعامة' },
];

function PrivacyRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl bg-[var(--surface-secondary)]/60 px-4 py-3">
      <div className="min-w-0 text-start">
        <p className="text-[13px] font-medium text-[var(--foreground)]">{label}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--muted-foreground)]">
          {description}
        </p>
      </div>
      <Switch isSelected={checked} onChange={onChange} aria-label={label}>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch>
    </div>
  );
}

export function SettingsPrivacySection({
  profile,
  onProfileChange,
}: SettingsPrivacySectionProps) {
  const [visibility, setVisibility] = useState<ProfileVisibility>(
    profile.visibility ?? 'PUBLIC',
  );
  const [hideEmail, setHideEmail] = useState(profile.hideEmail ?? false);
  const [hidePhone, setHidePhone] = useState(profile.hidePhone ?? true);
  const [hideLocation, setHideLocation] = useState(profile.hideLocation ?? false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; text: string } | null>(
    null,
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    setNotice(null);
    try {
      const updated = await updateMyProfile({
        visibility,
        hideEmail,
        hidePhone,
        hideLocation,
      });
      onProfileChange({ ...profile, ...updated });
      setNotice({ tone: 'success', text: 'تم حفظ إعدادات الخصوصية.' });
    } catch (err) {
      setNotice({
        tone: 'danger',
        text: err instanceof ApiException ? err.message : 'تعذّر الحفظ',
      });
    } finally {
      setSaving(false);
    }
  }, [hideEmail, hideLocation, hidePhone, onProfileChange, profile, visibility]);

  return (
    <div className="flex flex-col gap-5">
      {notice ? (
        <DashboardNotice
          tone={notice.tone}
          title={notice.tone === 'success' ? 'تم' : 'تنبيه'}
          description={notice.text}
        />
      ) : null}

      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-medium text-[var(--foreground)]">ظهور الصفحة</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {VISIBILITY_OPTIONS.map((option) => {
            const selected = visibility === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setVisibility(option.id)}
                className={cn(
                  orderPillButtonClass,
                  'px-3 py-1.5 text-[12px]',
                  selected && 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-100',
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <p className="text-[12px] leading-relaxed text-[var(--muted-foreground)]">
          {VISIBILITY_OPTIONS.find((o) => o.id === visibility)?.hint}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-medium text-[var(--foreground)]">إخفاء من الصفحة العامة</p>
        <PrivacyRow
          label="إخفاء البريد"
          description="لا يظهر بريدك في صفحتك العامة"
          checked={hideEmail}
          onChange={setHideEmail}
        />
        <PrivacyRow
          label="إخفاء الهاتف"
          description="لا يظهر رقم هاتفك في صفحتك العامة"
          checked={hidePhone}
          onChange={setHidePhone}
        />
        <PrivacyRow
          label="إخفاء الموقع"
          description="لا يظهر موقعك في صفحتك العامة"
          checked={hideLocation}
          onChange={setHideLocation}
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button variant="primary" onPress={() => void handleSave()} isDisabled={saving}>
          {saving ? 'جاري الحفظ…' : 'حفظ الخصوصية'}
        </Button>
      </div>
    </div>
  );
}
