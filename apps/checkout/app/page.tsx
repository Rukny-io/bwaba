'use client';

import { Suspense } from 'react';
import { CheckoutFlow } from '@/components/checkout/checkout-flow';
import { CheckoutShell } from '@/components/checkout/checkout-shell';
import { Spinner } from '@/components/ui/spinner';
import { useLocale } from '@/lib/i18n/locale';

function HomeFallback() {
  const { t } = useLocale();
  return (
    <CheckoutShell title={t('pageTitle')} description={t('preparing')} wide>
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Spinner size="sm" label={t('moments')} />
        {t('moments')}
      </div>
    </CheckoutShell>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <CheckoutFlow />
    </Suspense>
  );
}
