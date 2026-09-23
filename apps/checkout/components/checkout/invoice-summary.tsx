'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  ReceiptText,
  Wallet,
} from 'lucide-react';
import { AlertDialog, Button } from '@heroui/react';
import { useLocale } from '@/lib/i18n/locale';
import type {
  CheckoutCartState,
  DeveloperCheckoutCart,
  MailCheckoutCart,
} from '@/lib/session';
import { cn } from '@/lib/utils';

const FILL = '#f4f4f5';
const RADIUS = 20;
const SCOOP = 14;
const TAB_MIN_W = 168;

function formatMoney(amount: number) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return String(amount);
  }
}

function MoneyAmount({
  amount,
  unit,
  className,
}: {
  amount: number;
  unit: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-baseline gap-1 tabular-nums text-zinc-900',
        className,
      )}
      dir="ltr"
    >
      <span>{formatMoney(amount)}</span>
      <bdi className="text-[0.92em] font-medium text-zinc-600">{unit}</bdi>
    </span>
  );
}

function DetailRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="shrink-0 text-[13px] text-zinc-500">{label}</span>
      <span
        className={cn(
          'min-w-0 text-end text-[13px] leading-snug text-zinc-900',
          strong && 'font-semibold',
        )}
      >
        {value}
      </span>
    </div>
  );
}

/** L-shaped ticket path with a concave scoop at the inner corner. */
function buildTicketPath(
  width: number,
  bodyHeight: number,
  tabWidth: number,
  tabHeight: number,
  rtl: boolean,
): string {
  const w = Math.max(width, tabWidth + SCOOP + RADIUS);
  const bh = Math.max(bodyHeight, RADIUS * 2);
  const tw = Math.min(Math.max(tabWidth, TAB_MIN_W), w - SCOOP);
  const th = Math.max(tabHeight, 36);
  const r = Math.min(RADIUS, bh / 2, tw / 2);
  const s = Math.min(SCOOP, tw / 2, th);

  if (!rtl) {
    return [
      `M ${r} 0`,
      `H ${w - r}`,
      `A ${r} ${r} 0 0 1 ${w} ${r}`,
      `V ${bh - r}`,
      `A ${r} ${r} 0 0 1 ${w - r} ${bh}`,
      `H ${tw + s}`,
      `A ${s} ${s} 0 0 0 ${tw} ${bh + s}`,
      `V ${bh + th - r}`,
      `A ${r} ${r} 0 0 1 ${tw - r} ${bh + th}`,
      `H ${r}`,
      `A ${r} ${r} 0 0 1 0 ${bh + th - r}`,
      `V ${r}`,
      `A ${r} ${r} 0 0 1 ${r} 0`,
      'Z',
    ].join(' ');
  }

  const tabLeft = w - tw;
  return [
    `M ${r} 0`,
    `H ${w - r}`,
    `A ${r} ${r} 0 0 1 ${w} ${r}`,
    `V ${bh + th - r}`,
    `A ${r} ${r} 0 0 1 ${w - r} ${bh + th}`,
    `H ${tabLeft + r}`,
    `A ${r} ${r} 0 0 1 ${tabLeft} ${bh + th - r}`,
    `V ${bh + s}`,
    `A ${s} ${s} 0 0 0 ${tabLeft - s} ${bh}`,
    `H ${r}`,
    `A ${r} ${r} 0 0 1 0 ${bh - r}`,
    `V ${r}`,
    `A ${r} ${r} 0 0 1 ${r} 0`,
    'Z',
  ].join(' ');
}

export function summarizeCart(cart: CheckoutCartState | null) {
  if (cart?.mail) {
    const seats = Math.max(1, cart.mail.mailboxCount || 1);
    const label = `${cart.mail.planName} · ${cart.mail.appName}`;
    return {
      items: [
        {
          productId: `mail:${cart.mail.plan}`,
          quantity: 1,
          name: label,
          price: cart.mail.amount,
        },
      ] as CheckoutCartState['items'],
      quantity: 1,
      subtotal: cart.mail.amount,
      hasPricedItems: true,
      isMail: true as const,
      isDeveloper: false as const,
      mail: cart.mail,
      developer: undefined,
      seats,
    };
  }
  if (cart?.developer) {
    return {
      items: [
        {
          productId: `developer:${cart.developer.kind}`,
          quantity: 1,
          name: cart.developer.title,
          price: cart.developer.amount,
        },
      ] as CheckoutCartState['items'],
      quantity: 1,
      subtotal: cart.developer.amount,
      hasPricedItems: true,
      isMail: false as const,
      isDeveloper: true as const,
      mail: undefined,
      developer: cart.developer,
      seats: undefined as number | undefined,
    };
  }
  const items = cart?.items || [];
  const quantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const subtotal = items.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
    0,
  );
  const hasPricedItems = items.some((item) => typeof item.price === 'number');
  return {
    items,
    quantity,
    subtotal,
    hasPricedItems,
    isMail: false as const,
    isDeveloper: false as const,
    mail: undefined,
    developer: undefined,
    seats: undefined as number | undefined,
  };
}

function MailInvoiceDetails({
  mail,
  seats,
  unit,
}: {
  mail: MailCheckoutCart;
  seats: number;
  unit: string;
}) {
  const { t } = useLocale();
  const seatLabel =
    seats === 1 ? t('invoiceMailSeatUnit') : t('invoiceMailSeatsUnit');

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl bg-zinc-100">
        <div className="flex items-start gap-3 border-b border-zinc-200/80 px-4 py-3.5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-zinc-700 ring-1 ring-zinc-200/80">
            <Mail className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium tracking-wide text-zinc-500">
              {t('invoiceMailProduct')}
            </p>
            <p className="mt-0.5 text-[16px] font-semibold tracking-tight text-zinc-900">
              {mail.planName}
            </p>
            <p className="mt-1 text-[13px] leading-snug text-zinc-600">
              {mail.appName}
            </p>
          </div>
          <div className="shrink-0 text-end">
            <MoneyAmount
              amount={mail.amount}
              unit={unit}
              className="text-[15px] font-semibold"
            />
            <p className="mt-0.5 text-[11px] text-zinc-500">{t('invoicePerMonth')}</p>
          </div>
        </div>

        <div className="divide-y divide-zinc-200/70 px-4">
          <DetailRow label={t('invoiceMailPlan')} value={mail.planName} strong />
          <DetailRow label={t('invoiceMailWorkspace')} value={mail.appName} />
          <DetailRow
            label={t('invoiceMailSeats')}
            value={
              <span dir="ltr" className="tabular-nums">
                {seats} {seatLabel}
              </span>
            }
          />
          <DetailRow
            label={t('invoiceMailBilling')}
            value={t('invoiceMailMonthly')}
          />
        </div>
      </div>

      <div className="rounded-2xl bg-zinc-100 px-4 py-3.5">
        <div className="flex items-center justify-between gap-3 text-[13px] text-zinc-500">
          <span>{t('invoiceSubtotal')}</span>
          <MoneyAmount amount={mail.amount} unit={unit} className="text-[13px]" />
        </div>
        <div className="mt-2.5 flex items-baseline justify-between gap-3 border-t border-zinc-200/80 pt-2.5">
          <span className="text-[14px] font-semibold text-zinc-900">
            {t('invoiceDueNow')}
          </span>
          <MoneyAmount
            amount={mail.amount}
            unit={unit}
            className="text-[17px] font-semibold tracking-tight"
          />
        </div>
        <p className="mt-1 text-end text-[11px] text-zinc-500">
          {t('invoiceMailMonthly')} {t('invoicePerMonth')}
        </p>
      </div>
    </div>
  );
}

function DeveloperInvoiceDetails({
  developer,
  unit,
}: {
  developer: DeveloperCheckoutCart;
  unit: string;
}) {
  const { t } = useLocale();
  const kindLabel =
    developer.kind === 'PRO_UPGRADE'
      ? t('invoiceDeveloperPro')
      : t('invoiceDeveloperWallet');
  const billingLabel =
    developer.billingCycle === 'YEARLY'
      ? t('invoiceDeveloperYearly')
      : developer.billingCycle === 'MONTHLY'
        ? t('invoiceDeveloperMonthly')
        : null;

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl bg-zinc-100">
        <div className="flex items-start gap-3 border-b border-zinc-200/80 px-4 py-3.5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-zinc-700 ring-1 ring-zinc-200/80">
            <Wallet className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium tracking-wide text-zinc-500">
              {t('invoiceDeveloperProduct')}
            </p>
            <p className="mt-0.5 text-[16px] font-semibold tracking-tight text-zinc-900">
              {kindLabel}
            </p>
            <p className="mt-1 text-[13px] leading-snug text-zinc-600">
              {developer.title}
            </p>
          </div>
          <div className="shrink-0 text-end">
            <MoneyAmount
              amount={developer.amount}
              unit={unit}
              className="text-[15px] font-semibold"
            />
            {billingLabel ? (
              <p className="mt-0.5 text-[11px] text-zinc-500">{billingLabel}</p>
            ) : null}
          </div>
        </div>

        <div className="divide-y divide-zinc-200/70 px-4">
          <DetailRow
            label={t('invoiceDeveloperKind')}
            value={kindLabel}
            strong
          />
          {billingLabel ? (
            <DetailRow
              label={t('invoiceDeveloperBilling')}
              value={billingLabel}
            />
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl bg-zinc-100 px-4 py-3.5">
        <div className="flex items-center justify-between gap-3 text-[13px] text-zinc-500">
          <span>{t('invoiceSubtotal')}</span>
          <MoneyAmount
            amount={developer.amount}
            unit={unit}
            className="text-[13px]"
          />
        </div>
        <div className="mt-2.5 flex items-baseline justify-between gap-3 border-t border-zinc-200/80 pt-2.5">
          <span className="text-[14px] font-semibold text-zinc-900">
            {t('invoiceDueNow')}
          </span>
          <MoneyAmount
            amount={developer.amount}
            unit={unit}
            className="text-[17px] font-semibold tracking-tight"
          />
        </div>
      </div>
    </div>
  );
}

interface InvoiceSummaryProps {
  cart: CheckoutCartState | null;
  className?: string;
}

export function InvoiceSummary({ cart, className }: InvoiceSummaryProps) {
  const { t, locale, dir } = useLocale();
  const isRtl = dir === 'rtl';
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const tabRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState({
    width: 320,
    bodyHeight: 72,
    tabWidth: TAB_MIN_W,
    tabHeight: 44,
  });

  const {
    items,
    quantity,
    subtotal,
    hasPricedItems,
    isMail,
    isDeveloper,
    mail,
    developer,
    seats,
  } = summarizeCart(cart);

  const seatWord =
    (seats || 1) === 1 ? t('invoiceMailSeatUnit') : t('invoiceMailSeatsUnit');
  const storePrefix = cart?.storeName ? `${cart.storeName} · ` : '';
  const countLabel = isMail
    ? `${mail?.planName || 'Mail'} · ${seats || 1} ${seatWord}`
    : isDeveloper
      ? developer?.kind === 'PRO_UPGRADE'
        ? t('invoiceDeveloperPro')
        : t('invoiceDeveloperWallet')
      : quantity === 1
        ? `${storePrefix}${t('invoiceItemsCount', { count: quantity })}`
        : `${storePrefix}${t('invoiceItemsCount_plural', { count: quantity })}`;

  const preview = items.slice(0, 2);
  const remaining = Math.max(0, items.length - preview.length);
  const totalAmount = hasPricedItems ? subtotal : 0;
  const unit = t('invoiceUnit');
  const Chevron = isRtl ? ChevronLeft : ChevronRight;

  useLayoutEffect(() => {
    const root = rootRef.current;
    const body = bodyRef.current;
    const tab = tabRef.current;
    if (!root || !body || !tab) return;

    const measure = () => {
      setMetrics({
        width: root.offsetWidth || 320,
        bodyHeight: body.offsetHeight || 72,
        tabWidth: Math.max(tab.offsetWidth, TAB_MIN_W),
        tabHeight: tab.offsetHeight || 44,
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    ro.observe(body);
    ro.observe(tab);
    return () => ro.disconnect();
  }, [
    locale,
    quantity,
    preview.length,
    isMail,
    isDeveloper,
    totalAmount,
    seats,
    countLabel,
  ]);

  const totalHeight = metrics.bodyHeight + metrics.tabHeight;
  const path = buildTicketPath(
    metrics.width,
    metrics.bodyHeight,
    metrics.tabWidth,
    metrics.tabHeight,
    isRtl,
  );

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0"
        width={metrics.width}
        height={totalHeight}
        viewBox={`0 0 ${metrics.width} ${totalHeight}`}
        fill="none"
      >
        <path d={path} fill={FILL} />
      </svg>

      <div className="relative" style={{ paddingBottom: metrics.tabHeight }}>
        <div ref={bodyRef} className="relative px-4 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/90 text-zinc-600">
                {isMail ? (
                  <Mail className="size-4" aria-hidden />
                ) : isDeveloper ? (
                  <Wallet className="size-4" aria-hidden />
                ) : (
                  <ReceiptText className="size-4" aria-hidden />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold leading-tight tracking-tight text-zinc-900">
                  {t('invoiceTitle')}
                </p>
                <p
                  key={quantity > 0 ? countLabel : 'empty'}
                  className="mt-0.5 truncate text-[12px] leading-5 text-zinc-500 animate-in fade-in-0 duration-200"
                >
                  {quantity > 0 ? countLabel : t('invoiceEmpty')}
                </p>
              </div>
            </div>

            <AlertDialog>
              <Button
                size="sm"
                variant="secondary"
                className="h-8 shrink-0 gap-0.5 rounded-full bg-white/90 pe-2.5 ps-3 text-[12px] font-medium text-zinc-700 shadow-none"
                isDisabled={items.length === 0}
              >
                {t('invoiceViewFull')}
                <Chevron className="size-3.5 opacity-60" aria-hidden />
              </Button>
              <AlertDialog.Backdrop
                className={cn(
                  'data-[entering]:animate-in data-[entering]:fade-in-0 data-[entering]:duration-200',
                  'data-[exiting]:animate-out data-[exiting]:fade-out-0 data-[exiting]:duration-150',
                )}
              >
                <AlertDialog.Container>
                  <AlertDialog.Dialog
                    className={cn(
                      'max-h-[85vh] w-[min(100%,420px)] overflow-hidden text-zinc-900',
                      'data-[entering]:animate-in data-[entering]:fade-in-0 data-[entering]:zoom-in-95 data-[entering]:duration-250',
                      'data-[exiting]:animate-out data-[exiting]:fade-out-0 data-[exiting]:zoom-out-95 data-[exiting]:duration-150',
                    )}
                  >
                    <AlertDialog.CloseTrigger />
                    <AlertDialog.Header>
                      <AlertDialog.Heading>
                        {t('invoiceDialogTitle')}
                      </AlertDialog.Heading>
                    </AlertDialog.Header>
                    <AlertDialog.Body className="overflow-y-auto">
                      {items.length === 0 ? (
                        <p className="text-sm text-zinc-500">{t('invoiceEmpty')}</p>
                      ) : isMail && mail ? (
                        <MailInvoiceDetails
                          mail={mail}
                          seats={seats || 1}
                          unit={unit}
                        />
                      ) : isDeveloper && developer ? (
                        <DeveloperInvoiceDetails
                          developer={developer}
                          unit={unit}
                        />
                      ) : (
                        <div className="space-y-3">
                          <ul className="overflow-hidden rounded-2xl bg-zinc-100">
                            {items.map((item, index) => {
                              const line =
                                typeof item.price === 'number'
                                  ? item.price * item.quantity
                                  : null;
                              return (
                                <li
                                  key={`${item.productId}-${item.variantId || 'base'}-full`}
                                  className={cn(
                                    'flex items-start justify-between gap-3 px-4 py-3.5',
                                    index > 0 && 'border-t border-zinc-200/70',
                                  )}
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-[14px] font-semibold text-zinc-900">
                                      {item.name || item.productId}
                                    </p>
                                    <p className="mt-1 text-[12px] text-zinc-500">
                                      {t('invoiceQty')}:{' '}
                                      <span className="tabular-nums text-zinc-700">
                                        {item.quantity}
                                      </span>
                                      {typeof item.price === 'number' ? (
                                        <>
                                          {' · '}
                                          <MoneyAmount
                                            amount={item.price}
                                            unit={unit}
                                            className="text-[12px]"
                                          />
                                        </>
                                      ) : null}
                                    </p>
                                  </div>
                                  {line !== null ? (
                                    <MoneyAmount
                                      amount={line}
                                      unit={unit}
                                      className="shrink-0 text-[14px] font-semibold"
                                    />
                                  ) : null}
                                </li>
                              );
                            })}
                          </ul>

                          <div className="rounded-2xl bg-zinc-100 px-4 py-3.5">
                            <div className="flex items-center justify-between gap-3 text-[13px] text-zinc-500">
                              <span>{t('invoiceSubtotal')}</span>
                              <MoneyAmount
                                amount={totalAmount}
                                unit={unit}
                                className="text-[13px]"
                              />
                            </div>
                            <div className="mt-2.5 flex items-baseline justify-between gap-3 border-t border-zinc-200/80 pt-2.5">
                              <span className="text-[14px] font-semibold text-zinc-900">
                                {t('invoiceDueNow')}
                              </span>
                              <MoneyAmount
                                amount={totalAmount}
                                unit={unit}
                                className="text-[17px] font-semibold tracking-tight"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </AlertDialog.Body>
                    <AlertDialog.Footer>
                      <Button
                        slot="close"
                        variant="secondary"
                        className="h-11 w-full rounded-full text-[14px] font-medium"
                      >
                        {t('invoiceClose')}
                      </Button>
                    </AlertDialog.Footer>
                  </AlertDialog.Dialog>
                </AlertDialog.Container>
              </AlertDialog.Backdrop>
            </AlertDialog>
          </div>

          {preview.length > 0 ? (
            <ul className="mt-2.5 space-y-1 border-t border-zinc-200/70 pt-2.5 ps-12 animate-in fade-in-0 duration-300">
              {isMail && mail ? (
                <>
                  <li className="truncate text-[12px] leading-5 text-zinc-700">
                    <span className="font-medium text-zinc-900">{mail.planName}</span>
                    <span className="text-zinc-400"> · </span>
                    <span>{mail.appName}</span>
                  </li>
                  <li className="text-[12px] leading-5 text-zinc-500">
                    <span dir="ltr" className="tabular-nums">
                      {seats} {seatWord}
                    </span>
                    <span className="text-zinc-400"> · </span>
                    <MoneyAmount
                      amount={mail.amount}
                      unit={unit}
                      className="text-[12px] font-medium"
                    />
                    <span className="text-zinc-500"> {t('invoicePerMonth')}</span>
                  </li>
                </>
              ) : isDeveloper && developer ? (
                <>
                  <li className="truncate text-[12px] leading-5 text-zinc-700">
                    <span className="font-medium text-zinc-900">
                      {developer.kind === 'PRO_UPGRADE'
                        ? t('invoiceDeveloperPro')
                        : t('invoiceDeveloperWallet')}
                    </span>
                  </li>
                  <li className="text-[12px] leading-5 text-zinc-500">
                    <MoneyAmount
                      amount={developer.amount}
                      unit={unit}
                      className="text-[12px] font-medium"
                    />
                    {developer.billingCycle ? (
                      <>
                        <span className="text-zinc-400"> · </span>
                        <span>
                          {developer.billingCycle === 'YEARLY'
                            ? t('invoiceDeveloperYearly')
                            : t('invoiceDeveloperMonthly')}
                        </span>
                      </>
                    ) : null}
                  </li>
                </>
              ) : (
                <>
                  {preview.map((item) => (
                    <li
                      key={`${item.productId}-${item.variantId || 'base'}`}
                      className="truncate text-[12px] leading-5 text-zinc-600"
                    >
                      {t('invoicePreviewLine', {
                        name: item.name || item.productId,
                        qty: item.quantity,
                      })}
                    </li>
                  ))}
                  {remaining > 0 ? (
                    <li className="text-[12px] text-zinc-500">
                      {t('invoiceMoreItems', { count: remaining })}
                    </li>
                  ) : null}
                </>
              )}
            </ul>
          ) : null}
        </div>

        <div
          ref={tabRef}
          className="absolute bottom-0 start-0 flex min-w-[10.5rem] items-baseline justify-between gap-5 px-4 py-2.5"
        >
          <span className="text-[11px] font-medium tracking-wide text-zinc-500">
            {t('invoiceTotalPrice')}
          </span>
          <MoneyAmount
            key={`${totalAmount}-${unit}`}
            amount={totalAmount}
            unit={unit}
            className="text-[15px] font-semibold tracking-tight text-zinc-900 animate-in fade-in-0 zoom-in-95 duration-200"
          />
        </div>
      </div>
    </div>
  );
}
