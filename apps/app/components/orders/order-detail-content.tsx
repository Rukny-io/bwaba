'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { Avatar } from '@heroui/react';
import {
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  Link2,
  Lock,
  MapPin,
  MessageSquareText,
  X,
} from 'lucide-react';
import { OrderPaymentBadge } from '@/components/orders/order-payment-badge';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { ProductThumbnail } from '@/components/products/product-list-primitives';
import { formatCurrency, formatNumber } from '@/lib/dashboard-format';
import { resolveAvatarUrl } from '@/lib/media-url';
import {
  formatOrderPlacedAtDateTime,
  getOrderCustomerContact,
  getOrderCustomerInitials,
  getOrderCustomerName,
  getOrderDisplayId,
  getOrderDisplayNumber,
  getOrderStatusStyle,
} from '@/lib/orders/order-display';
import { getOrderPaymentMethodLabel } from '@/lib/orders/order-payment-display';
import { downloadStoreOrderInvoice } from '@/lib/orders/download-invoice';
import type { StoreOrder, StoreOrderAddress } from '@/lib/orders/types';
import { formatVariantAttributes } from '@/lib/products/product-display';
import { ApiException } from '@/lib/api-client';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';

function DetailCard({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'flex min-w-0 flex-col gap-4 rounded-xl bg-[var(--surface)] p-4 sm:p-5',
        className,
      )}
    >
      {title ? (
        <div className="flex min-w-0 items-start justify-between gap-3">
          <h3 className="text-[13px] font-semibold tracking-tight text-[var(--foreground)]">
            {title}
          </h3>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

function QuickActionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: typeof Copy;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] px-3 py-2 text-[12px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)] disabled:pointer-events-none disabled:opacity-50"
    >
      <Icon className="size-3.5 shrink-0 text-[var(--muted-foreground)]" strokeWidth={1.75} />
      {label}
    </button>
  );
}

function SummaryRow({
  label,
  value,
  ltr,
  labelClassName,
  valueClassName,
}: {
  label: string;
  value: ReactNode;
  ltr?: boolean;
  labelClassName?: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <dt
        className={cn(
          'text-start text-[13px] font-medium text-[var(--foreground)]',
          labelClassName,
        )}
      >
        {label}
      </dt>
      <dd
        dir={ltr ? 'ltr' : undefined}
        className={cn(
          'min-w-0 truncate text-[13px] font-medium text-[var(--foreground)]',
          ltr ? 'text-left tabular-nums' : 'text-start',
          valueClassName,
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function MetaRow({ label, value, ltr }: { label: string; value: ReactNode; ltr?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-0.5">
      <span className="shrink-0 text-start text-[12px] text-[var(--muted-foreground)]">
        {label}
      </span>
      <span
        dir={ltr ? 'ltr' : undefined}
        className={cn(
          'min-w-0 truncate text-[12px] font-medium text-[var(--foreground)]',
          ltr ? 'text-left tabular-nums' : 'text-start',
        )}
      >
        {value}
      </span>
    </div>
  );
}

function FooterIconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex size-8 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] disabled:pointer-events-none disabled:opacity-35"
    >
      {children}
    </button>
  );
}

function formatAddressLines(
  address: StoreOrderAddress,
  t: (path: string, vars?: Record<string, string | number>) => string,
): string[] {
  const area = [address.city, address.district, address.street].filter(Boolean).join('، ');
  const building = [
    address.buildingNo ? t('orders.detail.building', { n: address.buildingNo }) : null,
    address.floor ? t('orders.detail.floor', { n: address.floor }) : null,
    address.apartmentNo ? t('orders.detail.apartment', { n: address.apartmentNo }) : null,
  ]
    .filter(Boolean)
    .join('، ');

  return [area, building, address.landmark ?? ''].filter(Boolean);
}

export function OrderDetailSummary({ order }: { order: StoreOrder }) {
  const { t } = useTranslations();

  return (
    <DetailCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 text-start">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
            {t('orders.detailTitle')}
          </p>
          <h2 className="mt-1 text-[22px] font-bold leading-tight tracking-tight text-[var(--foreground)]">
            <bdi dir="ltr">{getOrderDisplayId(order)}</bdi>
          </h2>
          <p className="mt-1.5 text-start text-[12px] leading-relaxed text-[var(--muted-foreground)]">
            {t('orders.detail.placedAt', {
              date: formatOrderPlacedAtDateTime(order.createdAt),
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <OrderPaymentBadge order={order} compact />
        </div>
      </div>
    </DetailCard>
  );
}

/** @deprecated Use OrderDetailSummary inside OrderDetailContent */
export function OrderDetailHeader({ order }: { order: StoreOrder }) {
  return <OrderDetailSummary order={order} />;
}

function OrderDetailQuickActions({ order }: { order: StoreOrder }) {
  const { t } = useTranslations();
  const [copied, setCopied] = useState<'id' | 'number' | null>(null);
  const [invoiceState, setInvoiceState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  const copyText = useCallback(async (text: string, kind: 'id' | 'number') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  }, []);

  const downloadInvoice = useCallback(async () => {
    setInvoiceState('loading');
    setInvoiceError(null);
    try {
      await downloadStoreOrderInvoice(order.id);
      setInvoiceState('idle');
    } catch (error) {
      setInvoiceState('error');
      setInvoiceError(
        error instanceof ApiException
          ? error.message
          : t('orders.detail.invoiceFailed'),
      );
    }
  }, [order.id, t]);

  return (
    <DetailCard title={t('orders.detail.quickActions')}>
      <div className="flex flex-wrap gap-2">
        <QuickActionButton
          icon={Copy}
          label={copied === 'id' ? t('orders.detail.copied') : t('orders.detail.copyId')}
          onClick={() => void copyText(order.id, 'id')}
        />
        <QuickActionButton
          icon={Link2}
          label={
            copied === 'number' ? t('orders.detail.copied') : t('orders.detail.copyNumber')
          }
          onClick={() => void copyText(getOrderDisplayNumber(order), 'number')}
        />
        <QuickActionButton
          icon={FileText}
          label={
            invoiceState === 'loading'
              ? t('orders.detail.invoiceLoading')
              : t('orders.detail.downloadInvoice')
          }
          onClick={() => void downloadInvoice()}
          disabled={invoiceState === 'loading'}
        />
      </div>
      {invoiceError ? (
        <p className="text-start text-[12px] text-[var(--danger)]">{invoiceError}</p>
      ) : null}
    </DetailCard>
  );
}

function OrderDetailPricing({ order }: { order: StoreOrder }) {
  const { t } = useTranslations();
  const currency = order.currency;
  const hasDiscount = Boolean(order.discount && order.discount > 0);

  return (
    <DetailCard title={t('orders.columns.amount')}>
      <dl className="space-y-0.5">
        {typeof order.subtotal === 'number' ? (
          <SummaryRow
            label={t('orders.detail.subtotal')}
            value={formatCurrency(order.subtotal, currency)}
            ltr
          />
        ) : null}
        <SummaryRow
          label={t('orders.detail.discount')}
          value={
            hasDiscount
              ? `- ${formatCurrency(order.discount!, currency)}`
              : t('orders.detail.none')
          }
          ltr={hasDiscount}
          labelClassName={hasDiscount ? 'text-[var(--danger)]' : undefined}
          valueClassName={
            hasDiscount ? 'text-[var(--danger)]' : 'text-[var(--muted-foreground)]'
          }
        />
        {typeof order.shippingFee === 'number' ? (
          <SummaryRow
            label={t('orders.detail.shipping')}
            value={formatCurrency(order.shippingFee, currency)}
            ltr
            labelClassName="text-[var(--muted-foreground)]"
            valueClassName="text-[var(--muted-foreground)]"
          />
        ) : null}
        <SummaryRow
          label={t('orders.detail.promo')}
          value={order.coupon?.code ?? t('orders.detail.na')}
          labelClassName="text-[var(--muted-foreground)]"
          valueClassName="text-[var(--muted-foreground)]"
        />
      </dl>

      <div className="border-t border-[var(--border)] pt-3">
        <SummaryRow
          label={t('orders.detail.total')}
          value={formatCurrency(order.total, currency)}
          ltr
          labelClassName="text-[15px] font-bold"
          valueClassName="text-[15px] font-bold"
        />
      </div>
    </DetailCard>
  );
}

export function OrderDetailFooter({
  order,
  onClose,
  onPrevious,
  onNext,
  canGoPrevious = false,
  canGoNext = false,
}: {
  order: StoreOrder;
  onClose?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
}) {
  const { t } = useTranslations();
  const status = getOrderStatusStyle(order.status);
  const statusPath = `orders.status.${order.status}`;
  const translatedStatus = t(statusPath);
  const statusLabel =
    translatedStatus === statusPath
      ? status.label || order.status
      : translatedStatus;

  return (
    <DetailCard className="sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg bg-[var(--surface-secondary)] px-3 py-1.5 text-[12px] font-medium',
            status.textClassName,
          )}
        >
          <Lock className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
          {statusLabel}
        </span>
        <button
          type="button"
          className="text-[12px] font-medium text-[var(--danger)] transition-opacity hover:opacity-80"
        >
          {t('orders.detail.delete')}
        </button>
      </div>

      {(onPrevious || onNext || onClose) && (
        <div className="flex shrink-0 items-center gap-1.5">
          <FooterIconButton
            label={t('orders.detail.previous')}
            onClick={onPrevious}
            disabled={!canGoPrevious}
          >
            <ChevronUp className="size-4" strokeWidth={1.75} />
          </FooterIconButton>
          <FooterIconButton
            label={t('orders.detail.next')}
            onClick={onNext}
            disabled={!canGoNext}
          >
            <ChevronDown className="size-4" strokeWidth={1.75} />
          </FooterIconButton>
          {onClose ? (
            <FooterIconButton label={t('orders.detail.close')} onClick={onClose}>
              <X className="size-4" strokeWidth={1.75} />
            </FooterIconButton>
          ) : null}
        </div>
      )}
    </DetailCard>
  );
}

export function OrderDetailContent({
  order,
  showFooter = true,
}: {
  order: StoreOrder;
  showFooter?: boolean;
}) {
  const { t, locale } = useTranslations();
  const customerName = getOrderCustomerName(order);
  const customerContact = getOrderCustomerContact(order);
  const avatarUrl = resolveAvatarUrl(order.customer?.avatar ?? null);
  const items = order.items ?? [];
  const address = order.address;
  const addressLines = address ? formatAddressLines(address, t) : [];
  const currency = order.currency;
  const paymentMethod = order.paymentMethod || 'CASH';
  const paymentMethodPath = `orders.paymentMethod.${paymentMethod}`;
  const paymentMethodLabel = t(paymentMethodPath);
  const resolvedPaymentMethodLabel =
    paymentMethodLabel === paymentMethodPath
      ? getOrderPaymentMethodLabel(order.paymentMethod)
      : paymentMethodLabel;
  const itemCount = items.length || order.itemsCount || 0;

  return (
    <div className="flex flex-col gap-4 text-start">
      <OrderDetailSummary order={order} />
      <OrderDetailQuickActions order={order} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <OrderDetailPricing order={order} />

        <DetailCard title={t('orders.detail.customer')}>
          <div className="flex items-center gap-3">
            <Avatar size="sm" className="shrink-0">
              {avatarUrl ? <Avatar.Image alt={customerName} src={avatarUrl} /> : null}
              <Avatar.Fallback>{getOrderCustomerInitials(customerName)}</Avatar.Fallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-1 text-start">
              <p className="truncate text-[14px] font-semibold leading-snug text-[var(--foreground)]">
                {customerName}
              </p>
              {customerContact ? (
                <p className="truncate text-[12px] leading-snug text-[var(--muted-foreground)]">
                  <bdi dir="ltr" className="block truncate">
                    {customerContact}
                  </bdi>
                </p>
              ) : null}
            </div>
          </div>
          <dl className="space-y-1 border-t border-[var(--border)] pt-3">
            <MetaRow
              label={t('orders.detail.paymentMethod')}
              value={resolvedPaymentMethodLabel}
            />
          </dl>
        </DetailCard>
      </div>

      <DetailCard title={t('orders.detail.products', { n: formatNumber(itemCount) })}>
        {items.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {items.map((item) => {
              const variant = formatVariantAttributes(item.variantAttributes);
              const name =
                locale === 'ar'
                  ? item.productNameAr?.trim() || item.productName
                  : item.productName?.trim() || item.productNameAr || item.productName;
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl bg-[var(--surface-secondary)]/50 px-3 py-2.5"
                >
                  <ProductThumbnail
                    imageUrl={item.image ?? null}
                    alt={name}
                    className="size-11 shrink-0 rounded-lg bg-[var(--surface)]"
                  />
                  <div className="min-w-0 flex-1 space-y-1 text-start">
                    <p className="truncate text-[13px] font-semibold leading-snug text-[var(--foreground)]">
                      {name}
                    </p>
                    <p className="truncate text-start text-[12px] leading-snug text-[var(--muted-foreground)]">
                      {variant ? `${variant} · ` : ''}
                      <bdi dir="ltr">
                        {formatNumber(item.quantity)} × {formatCurrency(item.price, currency)}
                      </bdi>
                    </p>
                  </div>
                  <span
                    dir="ltr"
                    className="shrink-0 text-[13px] font-semibold tabular-nums text-[var(--foreground)]"
                  >
                    {formatCurrency(item.subtotal, currency)}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-[12px] leading-relaxed text-[var(--muted-foreground)]">
            {t('orders.detail.noProducts')}
          </p>
        )}
      </DetailCard>

      {address ? (
        <DetailCard title={t('orders.detail.deliveryAddress')}>
          <div className="flex gap-2.5">
            <MapPin
              className="mt-0.5 size-4 shrink-0 text-[var(--muted-foreground)]"
              strokeWidth={1.75}
              aria-hidden
            />
            <div className="min-w-0 flex-1 space-y-1.5 text-start">
              {address.fullName ? (
                <p className="text-[13px] font-semibold leading-snug text-[var(--foreground)]">
                  {address.fullName}
                </p>
              ) : null}
              {address.phoneNumber ? (
                <p className="text-[12px] leading-snug text-[var(--muted-foreground)]">
                  <bdi dir="ltr">{address.phoneNumber}</bdi>
                </p>
              ) : null}
              {addressLines.map((line) => (
                <p
                  key={line}
                  className="text-start text-[12px] leading-relaxed text-[var(--muted-foreground)]"
                >
                  {line}
                </p>
              ))}
            </div>
          </div>
        </DetailCard>
      ) : null}

      {order.customerNote || order.cancellationReason ? (
        <DetailCard title={t('orders.detail.notes')}>
          <div className="flex gap-2.5">
            <MessageSquareText
              className="mt-0.5 size-4 shrink-0 text-[var(--muted-foreground)]"
              strokeWidth={1.75}
              aria-hidden
            />
            <div className="min-w-0 flex-1 space-y-1.5 text-start">
              {order.customerNote ? (
                <p className="text-[13px] leading-relaxed text-[var(--foreground)]">
                  {order.customerNote}
                </p>
              ) : null}
              {order.cancellationReason ? (
                <p className="text-start text-[12px] leading-relaxed text-[var(--danger)]">
                  {t('orders.detail.cancelReason', {
                    reason: order.cancellationReason,
                  })}
                </p>
              ) : null}
            </div>
          </div>
        </DetailCard>
      ) : null}

      {showFooter ? <OrderDetailFooter order={order} /> : null}
    </div>
  );
}
