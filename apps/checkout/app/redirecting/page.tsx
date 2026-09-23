'use client';

import { CheckoutShell } from '@/components/checkout/checkout-shell';
import { Spinner } from '@/components/ui/spinner';
import { useLocale } from '@/lib/i18n/locale';

export default function RedirectingPage() {
  const { t } = useLocale();

  return (
    <CheckoutShell
      title={t('openingPay')}
      description={t('cardPayHint')}
    >
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Spinner size="md" label={t('openingPay')} />
        {t('moments')}
      </div>
    </CheckoutShell>
  );
}
