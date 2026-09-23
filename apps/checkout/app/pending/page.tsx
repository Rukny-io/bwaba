'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckoutShell } from '@/components/checkout/checkout-shell';
import { getMailPublicPaymentStatus, getPaymentStatus } from '@/lib/api';
import { useLocale } from '@/lib/i18n/locale';
import { Spinner } from '@/components/ui/spinner';

function PendingContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useLocale();
  const orderId = params.get('orderId');
  const orders = params.get('orders');
  const product = params.get('product');
  const paymentId = params.get('payment');
  const invoiceToken = params.get('invoiceToken');
  const returnUrl = params.get('return');
  const appId = params.get('app');
  const [message, setMessage] = useState(t('pendingConfirming'));

  useEffect(() => {
    setMessage(t('pendingConfirming'));
  }, [t]);

  useEffect(() => {
    if (product === 'mail' && paymentId && invoiceToken) {
      let cancelled = false;
      let attempts = 0;

      const tick = async () => {
        attempts += 1;
        try {
          const status = await getMailPublicPaymentStatus(
            paymentId,
            invoiceToken,
          );
          if (cancelled) return;
          if (status.paymentStatus === 'COMPLETED') {
            const qs = new URLSearchParams({
              product: 'mail',
              payment: paymentId,
              invoiceToken,
              paid: '1',
            });
            if (appId) qs.set('app', appId);
            if (returnUrl) qs.set('return', returnUrl);
            router.replace(`/success?${qs.toString()}`);
            return;
          }
          if (status.paymentStatus === 'FAILED') {
            const qs = new URLSearchParams({
              product: 'mail',
              payment: paymentId,
              status: 'FAILED',
            });
            if (appId) qs.set('app', appId);
            router.replace(`/failed?${qs.toString()}`);
            return;
          }
        } catch {
          // keep polling
        }

        if (attempts >= 10) {
          setMessage(t('pendingStill'));
          return;
        }
        window.setTimeout(() => {
          void tick();
        }, 2500);
      };

      void tick();
      return () => {
        cancelled = true;
      };
    }

    if (!orderId) {
      setMessage(t('pendingWaiting'));
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const tick = async () => {
      attempts += 1;
      try {
        const status = await getPaymentStatus(orderId);
        if (cancelled) return;
        if (status.paymentStatus === 'PAID' || status.qasehStatus === 'succeeded') {
          router.replace(
            `/success?orders=${encodeURIComponent(status.orderNumber || orders || '')}&paid=1`,
          );
          return;
        }
        if (
          status.paymentStatus === 'FAILED' ||
          ['failed', 'declined', 'expired'].includes(status.qasehStatus || '')
        ) {
          router.replace(
            `/failed?order=${encodeURIComponent(status.orderNumber || orders || '')}&status=${encodeURIComponent(status.paymentStatus)}`,
          );
          return;
        }
      } catch {
        // keep polling
      }

      if (attempts >= 8) {
        setMessage(t('pendingStill'));
        return;
      }
      window.setTimeout(() => {
        void tick();
      }, 2500);
    };

    void tick();
    return () => {
      cancelled = true;
    };
  }, [
    orderId,
    orders,
    router,
    t,
    product,
    paymentId,
    invoiceToken,
    returnUrl,
    appId,
  ]);

  return (
    <CheckoutShell title={t('pendingTitle')} description={message}>
      <div className="flex flex-col items-center gap-3 py-8 text-sm text-muted-foreground">
        <Spinner size="md" label={t('pendingConfirming')} />
        {orders ? (
          <p className="tabular-nums animate-in fade-in-0 duration-300">
            {t('orderLabel')}: {orders}
          </p>
        ) : null}
        {product === 'mail' && paymentId ? (
          <p className="tabular-nums animate-in fade-in-0 duration-300">
            {paymentId.slice(0, 8)}…
          </p>
        ) : null}
      </div>
    </CheckoutShell>
  );
}

export default function PendingPage() {
  return (
    <Suspense fallback={<CheckoutShell><div className="py-8" /></CheckoutShell>}>
      <PendingContent />
    </Suspense>
  );
}
