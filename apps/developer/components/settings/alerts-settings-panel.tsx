'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { useDeveloperUserPrefs } from '@/hooks/use-developer-user-prefs';
import { getTwoFactorStatus } from '@/lib/api/two-factor';
import { ACCOUNTS_URL } from '@/lib/auth-redirect';
import {
  SettingsSection,
  ToggleRow,
} from '@/components/settings/settings-ui';

export function AlertsSettingsPanel() {
  const s = useTranslations().developerSettings;
  const { prefs, setNotification } = useDeveloperUserPrefs();
  const { data: twoFa, isLoading: twoFaLoading } = useQuery({
    queryKey: ['auth', '2fa', 'status'],
    queryFn: getTwoFactorStatus,
  });

  return (
    <>
      <SettingsSection
        title={s.notificationsTitle}
        description={s.notificationsDesc}
      >
        <div className="divide-y divide-[var(--border)]">
          <ToggleRow
            label={s.notifSecurity}
            description={s.notifSecurityDesc}
            checked
            disabled
            onChange={() => {}}
          />
          <ToggleRow
            label={s.notifQuota}
            description={s.notifQuotaDesc}
            checked={prefs.notifications.quotaWarnings}
            onChange={(v) => setNotification('quotaWarnings', v)}
          />
          <ToggleRow
            label={s.notifBalance}
            description={s.notifBalanceDesc}
            checked={prefs.notifications.lowBalance}
            onChange={(v) => setNotification('lowBalance', v)}
          />
          <ToggleRow
            label={s.notifBilling}
            description={s.notifBillingDesc}
            checked={prefs.notifications.billing}
            onChange={(v) => setNotification('billing', v)}
          />
          <ToggleRow
            label={s.notifUpdates}
            description={s.notifUpdatesDesc}
            checked={prefs.notifications.productUpdates}
            onChange={(v) => setNotification('productUpdates', v)}
          />
        </div>
        <p className="text-[11px] text-[var(--muted-foreground)]">
          {s.notificationsNote}
        </p>
      </SettingsSection>

      <SettingsSection title={s.securityTitle} description={s.securityDesc}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_10%,var(--background))] text-[var(--primary)]">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <p className="text-sm font-medium">{s.twoFaTitle}</p>
              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                {s.twoFaDesc}
              </p>
              <p className="mt-2 text-xs font-semibold">
                {twoFaLoading
                  ? s.twoFaLoading
                  : twoFa?.enabled
                    ? s.twoFaEnabled
                    : s.twoFaDisabled}
              </p>
            </div>
          </div>
          <Link
            href={`${ACCOUNTS_URL}/settings`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[var(--surface-secondary)] px-4 text-sm font-medium text-[var(--foreground)] ring-1 ring-[var(--border)] transition-colors hover:bg-[var(--border)] sm:w-auto"
          >
            {twoFa?.enabled ? s.twoFaManage : s.twoFaEnable}
          </Link>
        </div>
      </SettingsSection>
    </>
  );
}
