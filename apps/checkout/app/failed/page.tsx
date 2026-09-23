'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { XCircle } from 'lucide-react';
import { CheckoutShell } from '@/components/checkout/checkout-shell';
import { SoftPanel } from '@/components/checkout/ui-bits';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/lib/i18n/locale';

function FailedContent() {
  const params = useSearchParams();
  const { t } = useLocale();
  const order = params.get('order');
  const status = params.get('status');
  const error = params.get('error');
  const product = params.get('product');
  const returnUrl = params.get('return');
  const isMail = product === 'mail';
  const isDeveloper = product === 'developer';

  return (
    <CheckoutShell title={t('failedTitle')} description={t('failedDescription')}>
      <div className="space-y-6 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-1 ring-destructive/15">
          <XCircle className="size-8" />
        </div>

        {(order || status || error) && (
          <SoftPanel className="space-y-1 text-sm text-muted-foreground">
            {order ? (
              <p>
                {t('orderLabel')}:{' '}
                <span className="font-medium tabular-nums text-foreground">
                  {order}
                </span>
              </p>
            ) : null}
            {status ? (
              <p>
                {t('statusLabel')}: {status}
              </p>
            ) : null}
            {error ? (
              <p>
                {t('reasonLabel')}: {error}
              </p>
            ) : null}
          </SoftPanel>
        )}

        <div className="flex flex-col gap-2.5">
          <Button
            className="h-11 w-full text-[15px]"
            size="lg"
            onClick={() => {
              if ((isMail || isDeveloper) && returnUrl) {
                window.location.href = returnUrl;
                return;
              }
              window.location.href = '/';
            }}
          >
            {isMail
              ? 'Back to Mail'
              : isDeveloper
                ? t('backToDevelopers')
                : t('retry')}
          </Button>
          <Link
            href="/"
            className="inline-flex h-11 w-full items-center justify-center rounded-full border border-border bg-white px-4 text-sm font-medium transition hover:bg-muted"
          >
            {t('startOver')}
          </Link>
        </div>
      </div>
    </CheckoutShell>
  );
}

export default function FailedPage() {
  return (
    <Suspense fallback={<CheckoutShell><div className="py-8" /></CheckoutShell>}>
      <FailedContent />
    </Suspense>
  );
}
