'use client';

import type { AdminStoreDetail } from '@/lib/types/stores';
import {
  formatStoreDate,
  formatStorePrice,
} from '@/lib/stores-format';
import { detailPanelClassName } from '@/components/ui/pill-tab';

export function StoreActivityPanel({ store }: { store: AdminStoreDetail }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className={detailPanelClassName}>
        <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
          Recent products
          <span className="ms-2 text-xs font-normal text-[var(--muted-foreground)]">
            ({store._count.products} total)
          </span>
        </h2>
        {store.products.length === 0 ? (
          <p className="rounded-2xl bg-[var(--surface-secondary)] px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">
            No products yet
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)]/60 rounded-2xl bg-[var(--surface-secondary)]">
            {store.products.map((product) => (
              <li
                key={product.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--foreground)]">
                    {product.name}
                  </p>
                  <p className="truncate font-mono text-[11px] text-[var(--muted-foreground)]" dir="ltr">
                    /{product.slug}
                  </p>
                </div>
                <div className="shrink-0 text-end">
                  <p className="text-xs font-medium text-[var(--foreground)]" dir="ltr">
                    {formatStorePrice(product.salePrice ?? product.price)}
                  </p>
                  <p className="text-[11px] text-[var(--muted-foreground)]">
                    {product.status}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={detailPanelClassName}>
        <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
          Recent orders
          <span className="ms-2 text-xs font-normal text-[var(--muted-foreground)]">
            ({store._count.orders} total)
          </span>
        </h2>
        {store.orders.length === 0 ? (
          <p className="rounded-2xl bg-[var(--surface-secondary)] px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">
            No orders yet
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)]/60 rounded-2xl bg-[var(--surface-secondary)]">
            {store.orders.map((order) => (
              <li
                key={order.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--foreground)]" dir="ltr">
                    {order.orderNumber}
                  </p>
                  <p className="text-[11px] text-[var(--muted-foreground)]">
                    {formatStoreDate(order.createdAt)}
                  </p>
                </div>
                <div className="shrink-0 text-end">
                  <p className="text-xs font-medium text-[var(--foreground)]" dir="ltr">
                    {formatStorePrice(order.total, order.currency)}
                  </p>
                  <p className="text-[11px] text-[var(--muted-foreground)]">
                    {order.status}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
