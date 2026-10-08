'use client';

import { useEffect, useState } from 'react';
import { Input, Switch, TextField } from '@heroui/react';
import { DashboardNotice } from '@/components/app/dashboard-section';
import { SettingsFormRow } from '@/components/settings/settings-form-row';
import { useTranslations } from '@/lib/i18n';

const KEY = 'rukny-store-delivery-preferences';

type DeliveryPrefs = {
  local: boolean;
  courier: boolean;
  pickup: boolean;
  fee: string;
  freeFrom: string;
};

const DEFAULTS: DeliveryPrefs = {
  local: true,
  courier: false,
  pickup: true,
  fee: '5000',
  freeFrom: '',
};

function DeliveryMethodRow({
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
    <div className="flex items-start justify-between gap-4 rounded-lg bg-[var(--surface-secondary)]/60 px-4 py-3">
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

export function SettingsDeliverySection() {
  const { t } = useTranslations();
  const [prefs, setPrefs] = useState<DeliveryPrefs>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  const methods: Array<{
    key: keyof Pick<DeliveryPrefs, 'local' | 'courier' | 'pickup'>;
    label: string;
    description: string;
  }> = [
    {
      key: 'local',
      label: t('settings.delivery.local'),
      description: t('settings.delivery.localHint'),
    },
    {
      key: 'courier',
      label: t('settings.delivery.courier'),
      description: t('settings.delivery.courierHint'),
    },
    {
      key: 'pickup',
      label: t('settings.delivery.pickup'),
      description: t('settings.delivery.pickupHint'),
    },
  ];

  useEffect(() => {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) ?? 'null');
      if (value) setPrefs({ ...DEFAULTS, ...value });
    } catch {
      /* keep defaults */
    }
  }, []);

  function update(next: Partial<DeliveryPrefs>) {
    const value = { ...prefs, ...next };
    setPrefs(value);
    localStorage.setItem(KEY, JSON.stringify(value));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div className="flex flex-col gap-5">
      {saved ? (
        <DashboardNotice
          tone="success"
          title={t('common.done')}
          description={t('settings.delivery.saved')}
        />
      ) : null}

      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-medium text-[var(--foreground)]">
          {t('settings.delivery.methods')}
        </p>
        {methods.map((method) => (
          <DeliveryMethodRow
            key={method.key}
            label={method.label}
            description={method.description}
            checked={prefs[method.key]}
            onChange={(value) => update({ [method.key]: value })}
          />
        ))}
      </div>

      <div className="flex flex-col gap-4 border-t border-[var(--border)] pt-4">
        <SettingsFormRow
          label={t('settings.delivery.fee')}
          hint={t('settings.delivery.feeHint')}
        >
          <TextField
            value={prefs.fee}
            onChange={(value) => update({ fee: value })}
            fullWidth
            className="w-full"
          >
            <Input
              fullWidth
              variant="secondary"
              inputMode="decimal"
              placeholder="0"
              className="rounded-lg"
            />
          </TextField>
        </SettingsFormRow>

        <SettingsFormRow
          label={t('settings.delivery.freeFrom')}
          hint={t('settings.delivery.freeFromHint')}
        >
          <TextField
            value={prefs.freeFrom}
            onChange={(value) => update({ freeFrom: value })}
            fullWidth
            className="w-full"
          >
            <Input
              fullWidth
              variant="secondary"
              inputMode="decimal"
              placeholder="100000"
              className="rounded-lg"
            />
          </TextField>
        </SettingsFormRow>
      </div>
    </div>
  );
}
