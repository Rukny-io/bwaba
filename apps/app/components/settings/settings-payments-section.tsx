'use client';

import { useEffect, useState } from 'react';
import { Check, CreditCard, WalletCards } from 'lucide-react';

const KEY = 'rukny-store-payment-preferences';
type PaymentPrefs = { card: boolean; cash: boolean; wallet: boolean; currency: string };
const DEFAULTS: PaymentPrefs = { card: true, cash: true, wallet: false, currency: 'IQD' };

export function SettingsPaymentsSection() {
  const [prefs, setPrefs] = useState<PaymentPrefs>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) ?? 'null');
      if (value) setPrefs({ ...DEFAULTS, ...value });
    } catch {
      /* defaults */
    }
  }, []);

  function update(next: Partial<PaymentPrefs>) {
    const value = { ...prefs, ...next };
    setPrefs(value);
    localStorage.setItem(KEY, JSON.stringify(value));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  const methods = [
    { key: 'card', label: 'بطاقات الدفع', hint: 'الدفع الإلكتروني', icon: CreditCard },
    { key: 'cash', label: 'الدفع عند الاستلام', hint: 'تحصيل نقدي', icon: WalletCards },
    { key: 'wallet', label: 'المحافظ الرقمية', hint: 'محافظ محلية', icon: WalletCards },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {methods.map((item) => {
          const active = prefs[item.key] === true;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => update({ [item.key]: !active })}
              className={`flex items-center gap-3 rounded-2xl border p-4 text-start transition ${
                active
                  ? 'border-[var(--foreground)] bg-[var(--surface)]'
                  : 'border-[var(--border)] bg-[var(--surface-secondary)]/50'
              }`}
            >
              <span
                className={`flex size-9 items-center justify-center rounded-xl ${
                  active
                    ? 'bg-[var(--foreground)] text-[var(--background)]'
                    : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]'
                }`}
              >
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{item.label}</span>
                <span className="text-xs text-[var(--muted-foreground)]">{item.hint}</span>
              </span>
              {active ? <Check className="size-4" /> : null}
            </button>
          );
        })}
      </div>
      {saved ? (
        <p className="text-xs text-[var(--success)]">تم حفظ إعدادات الدفع</p>
      ) : null}
    </div>
  );
}
