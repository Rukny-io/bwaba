'use client';

import Image from 'next/image';
import { ExternalLink, Package, ShoppingCart, Tag } from 'lucide-react';
import { Button } from '@heroui/react';
import type { AdminStoreDetail } from '@/lib/types/stores';
import { StoresTableOwnerCell } from '@/components/stores/stores-table-owner-cell';
import { getStorePublicUrl } from '@/lib/stores-url';
import { resolveMediaUrl } from '@/lib/media-url';
import {
  formatCategoryLabel,
  formatStoreDateTime,
  formatStoreStatus,
} from '@/lib/stores-format';
import { formatNumber } from '@/lib/dashboard-format';
import { detailPanelClassName } from '@/components/ui/pill-tab';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border)]/60 py-2.5 last:border-0">
      <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
      <span
        className="max-w-[65%] text-end text-xs font-medium text-[var(--foreground)]"
        dir="auto"
      >
        {value}
      </span>
    </div>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Package;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-[var(--surface-secondary)] px-4 py-3">
      <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
        <Icon className="size-3.5" aria-hidden />
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <p className="mt-1.5 text-xl font-bold tabular-nums text-[var(--foreground)]" dir="ltr">
        {value}
      </p>
    </div>
  );
}

export function StoreOverviewPanel({ store }: { store: AdminStoreDetail }) {
  const logoUrl = resolveMediaUrl(store.logo);
  const bannerUrl = resolveMediaUrl(store.banner);
  const category = store.store_categories;
  const publicUrl = getStorePublicUrl(store.slug);

  return (
    <div className="space-y-4">
      {bannerUrl ? (
        <div className="relative h-32 overflow-hidden rounded-2xl bg-[var(--surface-secondary)] sm:h-40">
          <Image
            src={bannerUrl}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricTile
          icon={Package}
          label="Products"
          value={formatNumber(store._count.products)}
        />
        <MetricTile
          icon={ShoppingCart}
          label="Orders"
          value={formatNumber(store._count.orders)}
        />
        <MetricTile
          icon={Tag}
          label="Coupons"
          value={formatNumber(store._count.coupons)}
        />
        <MetricTile
          icon={Package}
          label="Status"
          value={formatStoreStatus(store.status)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={detailPanelClassName}>
          <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Store info</h2>
          <div className="rounded-2xl bg-[var(--surface-secondary)] px-4 py-1">
            {logoUrl ? (
              <div className="flex justify-center border-b border-[var(--border)]/60 py-3">
                <Image
                  src={logoUrl}
                  alt=""
                  width={64}
                  height={64}
                  className="size-16 rounded-xl object-cover"
                  unoptimized
                />
              </div>
            ) : null}
            <DetailRow label="Name" value={store.name} />
            <DetailRow label="Slug" value={`/${store.slug}`} />
            <DetailRow label="Status" value={formatStoreStatus(store.status)} />
            <DetailRow
              label="Category"
              value={category ? formatCategoryLabel(category) : store.category ?? '—'}
            />
            <DetailRow label="Description" value={store.description?.trim() || '—'} />
            {store.descriptionAr ? (
              <DetailRow label="Description (AR)" value={store.descriptionAr} />
            ) : null}
            <DetailRow label="Employees" value={store.employeesCount ?? '—'} />
          </div>
          <div className="mt-3">
            <Button
              variant="tertiary"
              size="sm"
              className="rounded-xl"
              onPress={() => window.open(publicUrl, '_blank', 'noopener,noreferrer')}
            >
              <ExternalLink className="size-4" />
              Open storefront
            </Button>
          </div>
        </section>

        <section className={detailPanelClassName}>
          <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Contact & location</h2>
          <div className="rounded-2xl bg-[var(--surface-secondary)] px-4 py-1">
            <DetailRow label="Email" value={store.contactEmail ?? '—'} />
            <DetailRow label="Phone" value={store.contactPhone ?? '—'} />
            <DetailRow label="City" value={store.city ?? '—'} />
            <DetailRow label="Country" value={store.country} />
            <DetailRow label="Address" value={store.address ?? '—'} />
            {store.latitude != null && store.longitude != null ? (
              <DetailRow
                label="Coordinates"
                value={`${store.latitude}, ${store.longitude}`}
              />
            ) : null}
            <DetailRow label="Created" value={formatStoreDateTime(store.createdAt)} />
            <DetailRow label="Updated" value={formatStoreDateTime(store.updatedAt)} />
          </div>
        </section>
      </div>

      <section className={detailPanelClassName}>
        <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Owner</h2>
        <div className="rounded-2xl bg-[var(--surface-secondary)] p-3">
          <StoresTableOwnerCell owner={store.user} />
        </div>
      </section>
    </div>
  );
}
