'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Download } from 'lucide-react';
import { CheckoutShell } from '@/components/checkout/checkout-shell';
import { SoftPanel } from '@/components/checkout/ui-bits';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/lib/i18n/locale';
import {
  getMailInvoiceDeliveryStatus,
  type MailInvoiceDeliveryStatus,
} from '@/lib/api';

function channelOk(status: string | undefined) {
  return status === 'sent' || status === 'sent_link';
}

function channelFailed(status: string | undefined) {
  return Boolean(status?.startsWith('failed'));
}

function SuccessContent() {
  const params = useSearchParams();
  const { t } = useLocale();
  const orders = params.get('orders');
  const store = params.get('store');
  const product = params.get('product');
  const returnUrl = params.get('return');
  const paymentId = params.get('payment');
  const invoiceToken = params.get('invoiceToken');
  const isMail = product === 'mail';
  const isDeveloper = product === 'developer';
  const kind = params.get('kind');

  const [delivery, setDelivery] = useState<MailInvoiceDeliveryStatus | null>(
    null,
  );
  const [deliveryError, setDeliveryError] = useState('');

  useEffect(() => {
    if (!isMail || !paymentId || !invoiceToken) return;
    let cancelled = false;
    let attempts = 0;

    const tick = async () => {
      attempts += 1;
      try {
        const status = await getMailInvoiceDeliveryStatus(
          paymentId,
          invoiceToken,
        );
        if (cancelled) return;
        setDelivery(status);
        setDeliveryError('');
        const ready =
          status.paymentStatus === 'COMPLETED' || status.status === 'COMPLETED';
        const settled =
          ready &&
          (Boolean(status.deliveredAt) ||
            channelOk(status.emailStatus) ||
            channelOk(status.whatsappStatus) ||
            channelFailed(status.emailStatus) ||
            channelFailed(status.whatsappStatus) ||
            status.emailStatus === 'no_recipient' ||
            status.whatsappStatus === 'no_recipient' ||
            status.emailStatus === 'skipped' ||
            status.whatsappStatus === 'skipped');
        if (!settled && attempts < 10) {
          window.setTimeout(() => {
            void tick();
          }, 2000);
        }
      } catch (err) {
        if (cancelled) return;
        setDeliveryError(
          err instanceof Error ? err.message : 'Could not load invoice status.',
        );
        if (attempts < 6) {
          window.setTimeout(() => {
            void tick();
          }, 2500);
        }
      }
    };

    void tick();
    return () => {
      cancelled = true;
    };
  }, [isMail, paymentId, invoiceToken]);

  return (
    <CheckoutShell title={t('successTitle')} description={t('successDescription')}>
      <div className="space-y-6 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
          <CheckCircle2 className="size-8" />
        </div>
        {orders ? (
          <SoftPanel className="text-center">
            <p className="text-[12px] text-muted-foreground">{t('orderNumber')}</p>
            <p className="mt-1 text-base font-semibold tabular-nums tracking-wide">
              {orders}
            </p>
          </SoftPanel>
        ) : null}
        {isMail ? (
          <SoftPanel className="space-y-3 text-center">
            <div>
              <p className="text-[13px] text-muted-foreground">Rukny Mail</p>
              <p className="mt-1 text-sm font-medium">{t('mailPlanActivated')}</p>
            </div>
            {delivery?.invoiceNumber ? (
              <div>
                <p className="text-[12px] text-muted-foreground">
                  {t('mailInvoiceLabel')}
                </p>
                <p className="mt-0.5 font-mono text-sm font-semibold tracking-wide">
                  {delivery.invoiceNumber}
                </p>
              </div>
            ) : null}
            <div className="space-y-1.5 text-start text-[13px] text-muted-foreground">
              {!delivery && !deliveryError ? (
                <p>{t('mailInvoiceSending')}</p>
              ) : null}
              {deliveryError ? (
                <p className="text-amber-700">{deliveryError}</p>
              ) : null}
              {delivery ? (
                <>
                  {channelOk(delivery.whatsappStatus) && delivery.phoneMasked ? (
                    <p>
                      {t('mailInvoiceSentWhatsapp', {
                        phone: delivery.phoneMasked,
                      })}
                    </p>
                  ) : null}
                  {channelOk(delivery.emailStatus) && delivery.emailMasked ? (
                    <p>
                      {t('mailInvoiceSentEmail', {
                        email: delivery.emailMasked,
                      })}
                    </p>
                  ) : null}
                  {channelFailed(delivery.whatsappStatus) ? (
                    <p className="text-amber-700">{t('mailInvoiceWhatsappFailed')}</p>
                  ) : null}
                  {channelFailed(delivery.emailStatus) ? (
                    <p className="text-amber-700">{t('mailInvoiceEmailFailed')}</p>
                  ) : null}
                  {!delivery.deliveredAt &&
                  !channelOk(delivery.emailStatus) &&
                  !channelOk(delivery.whatsappStatus) &&
                  !channelFailed(delivery.emailStatus) &&
                  !channelFailed(delivery.whatsappStatus) ? (
                    <p>{t('mailInvoiceSending')}</p>
                  ) : null}
                </>
              ) : null}
            </div>
          </SoftPanel>
        ) : null}
        {isDeveloper ? (
          <SoftPanel className="space-y-2 text-center">
            <p className="text-[13px] text-muted-foreground">Rukny Developers</p>
            <p className="text-sm font-medium">
              {kind === 'PRO_UPGRADE'
                ? t('developerProActivated')
                : kind === 'WALLET_TOPUP'
                  ? t('developerWalletCredited')
                  : t('developerPaymentDone')}
            </p>
          </SoftPanel>
        ) : null}
        <div className="flex flex-col gap-2.5">
          {isMail && delivery?.downloadUrl ? (
            <Button
              className="h-11 w-full text-[15px]"
              size="lg"
              variant="outline"
              onClick={() => {
                window.open(delivery.downloadUrl!, '_blank', 'noopener');
              }}
            >
              <Download className="me-2 size-4" aria-hidden />
              {t('mailInvoiceDownload')}
            </Button>
          ) : null}
          {isMail && returnUrl ? (
            <Button
              className="h-11 w-full text-[15px]"
              size="lg"
              onClick={() => {
                window.location.href = returnUrl;
              }}
            >
              {t('mailContinue')}
            </Button>
          ) : null}
          {isDeveloper && returnUrl ? (
            <Button
              className="h-11 w-full text-[15px]"
              size="lg"
              onClick={() => {
                window.location.href = returnUrl;
              }}
            >
              {t('developerContinue')}
            </Button>
          ) : null}
          {store ? (
            <Button
              className="h-11 w-full text-[15px]"
              size="lg"
              onClick={() => {
                window.location.href = `https://rukny.io/${encodeURIComponent(store)}`;
              }}
            >
              {t('backToStore')}
            </Button>
          ) : null}
          {!isMail && !isDeveloper ? (
            <Link
              href="/"
              className="inline-flex h-11 w-full items-center justify-center rounded-full border border-border bg-white px-4 text-sm font-medium transition hover:bg-muted"
            >
              {t('startNew')}
            </Link>
          ) : null}
        </div>
      </div>
    </CheckoutShell>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<CheckoutShell><div className="py-8" /></CheckoutShell>}>
      <SuccessContent />
    </Suspense>
  );
}
