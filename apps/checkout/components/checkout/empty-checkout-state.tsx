'use client';

import { Mail, PackageOpen, ShoppingBag, Wallet } from 'lucide-react';
import { CheckoutShell } from '@/components/checkout/checkout-shell';
import { SoftPanel } from '@/components/checkout/ui-bits';
import { useLocale } from '@/lib/i18n/locale';
import { cn } from '@/lib/utils';

export type EmptyCheckoutVariant = 'store' | 'mail' | 'developer';

type EmptyCheckoutStateProps = {
  variant: EmptyCheckoutVariant;
  detail?: string | null;
  storeName?: string | null;
};

function variantMeta(variant: EmptyCheckoutVariant) {
  switch (variant) {
    case 'mail':
      return {
        icon: Mail,
        iconClass: 'bg-zinc-900 text-white',
        ringClass: 'ring-zinc-200/80',
      };
    case 'developer':
      return {
        icon: Wallet,
        iconClass: 'bg-zinc-900 text-white',
        ringClass: 'ring-zinc-200/80',
      };
    default:
      return {
        icon: ShoppingBag,
        iconClass: 'bg-white text-zinc-700',
        ringClass: 'ring-zinc-200/80',
      };
  }
}

export function EmptyCheckoutState({
  variant,
  detail,
  storeName,
}: EmptyCheckoutStateProps) {
  const { t } = useLocale();
  const meta = variantMeta(variant);
  const Icon = meta.icon;

  const title = t('emptyCheckoutTitle');
  const subtitle = t('emptyCheckoutSubtitle');
  const body =
    detail ||
    (variant === 'mail'
      ? t('mailSessionLoadError')
      : variant === 'developer'
        ? t('developerSessionLoadError')
        : t('emptyCart'));

  const hints =
    variant === 'store'
      ? [t('emptyCheckoutHint1'), t('emptyCheckoutHint2')]
      : variant === 'mail'
        ? [t('emptyCheckoutMailHint')]
        : [t('emptyCheckoutDeveloperHint')];

  return (
    <CheckoutShell title={title} description={subtitle} wide>
      <section
        className="checkout-section-enter space-y-5 rounded-[1.35rem] bg-zinc-100 p-5 sm:p-6"
        aria-labelledby="empty-checkout-heading"
      >
        <div className="flex flex-col items-center text-center">
          <div
            className={cn(
              'flex size-14 items-center justify-center rounded-full ring-1',
              meta.iconClass,
              meta.ringClass,
            )}
          >
            <Icon className="size-6" aria-hidden />
          </div>
          <h2
            id="empty-checkout-heading"
            className="mt-4 text-[17px] font-semibold tracking-tight text-zinc-900"
          >
            {variant === 'mail'
              ? t('emptyCheckoutMailHeading')
              : variant === 'developer'
                ? t('emptyCheckoutDeveloperHeading')
                : t('emptyCheckoutStoreHeading')}
          </h2>
          <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-zinc-500">
            {body}
          </p>
        </div>

        {storeName ? (
          <SoftPanel className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
              <PackageOpen className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 text-start">
              <p className="text-[12px] text-zinc-500">{t('invoiceStore')}</p>
              <p className="truncate text-[14px] font-medium text-zinc-900">
                {storeName}
              </p>
            </div>
          </SoftPanel>
        ) : null}

        <SoftPanel className="space-y-2.5 text-start">
          {hints.map((hint) => (
            <p
              key={hint}
              className="flex items-start gap-2 text-[13px] leading-relaxed text-zinc-600"
            >
              <span
                className="mt-1.5 size-1.5 shrink-0 rounded-full bg-zinc-400"
                aria-hidden
              />
              {hint}
            </p>
          ))}
        </SoftPanel>
      </section>
    </CheckoutShell>
  );
}
