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
import {
  getOrderPaymentMethodLabel,
  getOrderPaymentStatusStyle,
} from '@/lib/orders/order-payment-display';
import { downloadStoreOrderInvoice } from '@/lib/orders/download-invoice';
import type { StoreOrder, StoreOrderAddress } from '@/lib/orders/types';
import { formatVariantAttributes } from '@/lib/products/product-display';
import { ApiException } from '@/lib/api-client';
import { cn } from '@/lib/utils';

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
      className="inline-flex items-center gap-1.5 rounded-lg border border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)] disabled:pointer-events-none disabled:opacity-50"
    >
      <Icon className="size-3.5 shrink-0 text-[var(--muted-foreground)]" strokeWidth={1.75} />
      {label}
    </button>
  );
}

function PaymentStatusPill({ order }: { order: StoreOrder }) {
  const style = getOrderPaymentStatusStyle(order.paymentStatus);

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium',
        style.textClassName,
        'border-current',
      )}
    >
      <span className="size-2 rounded-full border border-current bg-transparent" aria-hidden />
      {style.label}
    </span>
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
    <div className="flex items-center justify-between gap-4 py-2">
      <dt className={cn('text-start text-[13px] font-medium text-[var(--foreground)]', labelClassName)}>
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

function DetailBlock({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'border-t border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] pt-5 pb-5',
        className,
      )}
    >
      <h3 className="mb-3.5 text-start text-[13px] font-semibold text-[var(--foreground)]">
        {title}
      </h3>
      {children}
    </section>
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

function formatAddressLines(address: StoreOrderAddress): string[] {
  const area = [address.city, address.district, address.street].filter(Boolean).join('، ');
  const building = [
    address.buildingNo ? `بناية ${address.buildingNo}` : null,
    address.floor ? `طابق ${address.floor}` : null,
    address.apartmentNo ? `شقة ${address.apartmentNo}` : null,
  ]
    .filter(Boolean)
    .join('، ');

  return [area, building, address.landmark ?? ''].filter(Boolean);
}

export function OrderDetailSummary({ order }: { order: StoreOrder }) {
  return (
    <header className="pb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 text-start">
          <h2 className="text-[22px] font-bold leading-tight tracking-tight text-[var(--foreground)]">
            <bdi dir="ltr">{getOrderDisplayId(order)}</bdi>
          </h2>
          <p className="mt-1.5 text-start text-[12px] leading-relaxed text-[var(--muted-foreground)]">
            تم الطلب في{' '}
            <bdi dir="ltr" className="tabular-nums">
              {formatOrderPlacedAtDateTime(order.createdAt)}
            </bdi>
          </p>
        </div>
        <PaymentStatusPill order={order} />
      </div>
    </header>
  );
}

/** @deprecated Use OrderDetailSummary inside OrderDetailContent */
export function OrderDetailHeader({ order }: { order: StoreOrder }) {
  return <OrderDetailSummary order={order} />;
}

function OrderDetailQuickActions({ order }: { order: StoreOrder }) {
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
          : 'تعذّر إنشاء الفاتورة',
      );
    }
  }, [order.id]);

  return (
    <section className="border-t border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] py-4">
      <h3 className="mb-2.5 text-start text-[13px] font-semibold text-[var(--foreground)]">
        إجراءات سريعة
      </h3>
      <div className="flex flex-wrap gap-2">
        <QuickActionButton
          icon={Copy}
          label={copied === 'id' ? 'تم النسخ' : 'نسخ المعرّف'}
          onClick={() => void copyText(order.id, 'id')}
        />
        <QuickActionButton
          icon={Link2}
          label={copied === 'number' ? 'تم النسخ' : 'نسخ رقم الطلب'}
          onClick={() => void copyText(getOrderDisplayNumber(order), 'number')}
        />
        <QuickActionButton
          icon={FileText}
          label={invoiceState === 'loading' ? 'جاري الإنشاء…' : 'تحميل الفاتورة PDF'}
          onClick={() => void downloadInvoice()}
          disabled={invoiceState === 'loading'}
        />
      </div>
      {invoiceError ? (
        <p className="mt-2 text-start text-[12px] text-[var(--danger)]">{invoiceError}</p>
      ) : null}
    </section>
  );
}

function OrderDetailPricing({ order }: { order: StoreOrder }) {
  const currency = order.currency;
  const hasDiscount = Boolean(order.discount && order.discount > 0);

  return (
    <section className="border-t border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] py-2">
      <dl>
        {typeof order.subtotal === 'number' ? (
          <SummaryRow
            label="المجموع الفرعي"
            value={formatCurrency(order.subtotal, currency)}
            ltr
          />
        ) : null}
        <SummaryRow
          label="الخصم"
          value={hasDiscount ? `- ${formatCurrency(order.discount!, currency)}` : '—'}
          ltr={hasDiscount}
          labelClassName={hasDiscount ? 'text-[var(--danger)]' : undefined}
          valueClassName={hasDiscount ? 'text-[var(--danger)]' : 'text-[var(--muted-foreground)]'}
        />
        {typeof order.shippingFee === 'number' ? (
          <SummaryRow
            label="تكلفة التوصيل"
            value={
              order.shippingFee > 0 ? formatCurrency(order.shippingFee, currency) : '0 د.ع'
            }
            ltr
            labelClassName="text-[var(--muted-foreground)]"
            valueClassName="text-[var(--muted-foreground)]"
          />
        ) : null}
        <SummaryRow
          label="العرض الترويجي"
          value={order.coupon?.code ?? 'م/غ'}
          labelClassName="text-[var(--muted-foreground)]"
          valueClassName="text-[var(--muted-foreground)]"
        />
      </dl>

      <div className="mt-3 border-t border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] pt-4">
        <SummaryRow
          label="الإجمالي"
          value={formatCurrency(order.total, currency)}
          ltr
          labelClassName="text-[15px] font-bold"
          valueClassName="text-[15px] font-bold"
        />
      </div>
    </section>
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
  const status = getOrderStatusStyle(order.status);

  return (
    <footer
      className="flex shrink-0 items-center justify-between gap-3 border-t border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] px-5 py-3"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg bg-[var(--surface-secondary)] px-3 py-1.5 text-[12px] font-medium',
            status.textClassName,
          )}
        >
          <Lock className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
          {status.label}
        </span>
        <button
          type="button"
          className="text-[12px] font-medium text-[var(--danger)] transition-opacity hover:opacity-80"
        >
          حذف
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <FooterIconButton
          label="الطلب السابق"
          onClick={onPrevious}
          disabled={!canGoPrevious}
        >
          <ChevronUp className="size-4" strokeWidth={1.75} />
        </FooterIconButton>
        <FooterIconButton label="الطلب التالي" onClick={onNext} disabled={!canGoNext}>
          <ChevronDown className="size-4" strokeWidth={1.75} />
        </FooterIconButton>
        {onClose ? (
          <FooterIconButton label="إغلاق" onClick={onClose}>
            <X className="size-4" strokeWidth={1.75} />
          </FooterIconButton>
        ) : null}
      </div>
    </footer>
  );
}

export function OrderDetailContent({ order }: { order: StoreOrder }) {
  const customerName = getOrderCustomerName(order);
  const customerContact = getOrderCustomerContact(order);
  const avatarUrl = resolveAvatarUrl(order.customer?.avatar ?? null);
  const items = order.items ?? [];
  const address = order.address;
  const addressLines = address ? formatAddressLines(address) : [];
  const currency = order.currency;

  return (
    <div className="flex flex-col text-start">
      <OrderDetailSummary order={order} />
      <OrderDetailQuickActions order={order} />
      <OrderDetailPricing order={order} />

      <DetailBlock title="العميل">
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
                <bdi dir="ltr" className="block truncate text-end">
                  {customerContact}
                </bdi>
              </p>
            ) : null}
          </div>
        </div>
        <dl className="mt-3.5 space-y-1 border-t border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] pt-3">
          <MetaRow
            label="طريقة الدفع"
            value={getOrderPaymentMethodLabel(order.paymentMethod)}
          />
        </dl>
      </DetailBlock>

      <DetailBlock title={`المنتجات (${formatNumber(items.length || order.itemsCount || 0)})`}>
        {items.length > 0 ? (
          <ul className="flex flex-col gap-2.5 pb-1">
            {items.map((item) => {
              const variant = formatVariantAttributes(item.variantAttributes);
              const name = item.productNameAr?.trim() || item.productName;
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl bg-[var(--surface-secondary)]/40 px-2.5 py-2.5"
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
            لا توجد تفاصيل للمنتجات.
          </p>
        )}
      </DetailBlock>

      {address ? (
        <DetailBlock title="عنوان التوصيل">
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
                  <bdi dir="ltr" className="block text-end">{address.phoneNumber}</bdi>
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
        </DetailBlock>
      ) : null}

      {order.customerNote || order.cancellationReason ? (
        <DetailBlock title="ملاحظات">
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
                  سبب الإلغاء: {order.cancellationReason}
                </p>
              ) : null}
            </div>
          </div>
        </DetailBlock>
      ) : null}
    </div>
  );
}
