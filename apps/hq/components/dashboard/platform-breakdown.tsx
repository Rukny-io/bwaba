import type { PlatformStats, OrdersStats } from '@/lib/types/admin';
import { formatNumber } from '@/lib/dashboard-format';

function MiniStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl bg-[var(--surface-secondary)] px-3 py-3">
      <p className="text-[11px] text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums text-[var(--foreground)]" dir="ltr">
        {value}
      </p>
      {sub ? (
        <p className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">{sub}</p>
      ) : null}
    </div>
  );
}

export function PlatformBreakdown({
  platform,
  orders,
}: {
  platform: PlatformStats;
  orders: OrdersStats;
}) {
  const pendingOrders = orders.byStatus.pending ?? 0;
  const delivered = orders.byStatus.delivered ?? 0;

  return (
    <section className="dashboard-card rounded-2xl p-4 sm:rounded-3xl sm:p-6">
      <h2 className="mb-4 text-base font-semibold text-[var(--foreground)]">
        Platform overview
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <MiniStat
          label="Stores"
          value={formatNumber(platform.stores.total)}
          sub={`${formatNumber(platform.stores.active)} active`}
        />
        <MiniStat
          label="Forms"
          value={formatNumber(platform.forms.total)}
          sub={`${formatNumber(platform.forms.active)} published`}
        />
        <MiniStat
          label="Events"
          value={formatNumber(platform.events.total)}
          sub={`${formatNumber(platform.events.active)} active`}
        />
        <MiniStat
          label="Orders"
          value={formatNumber(orders.total)}
          sub={`${formatNumber(pendingOrders)} pending`}
        />
        <MiniStat
          label="Delivered"
          value={formatNumber(delivered)}
          sub={`${orders.cancellationRate}% cancelled`}
        />
        <MiniStat
          label="New today"
          value={formatNumber(platform.users.newToday)}
          sub={`${formatNumber(platform.users.newThisWeek)} this week`}
        />
      </div>
    </section>
  );
}
