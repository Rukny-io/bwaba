import { Activity, Database, HardDrive, Zap } from 'lucide-react';
import type { SystemHealth } from '@/lib/types/admin';
import {
  formatBytes,
  formatNumber,
  formatUptime,
} from '@/lib/dashboard-format';

const STATUS_LABELS: Record<string, string> = {
  healthy: 'Healthy',
  degraded: 'Degraded',
  unhealthy: 'Unhealthy',
};

const STATUS_COLORS: Record<string, string> = {
  healthy: 'text-[var(--success)] bg-[var(--success)]/15',
  degraded: 'text-[var(--warning)] bg-[var(--warning)]/15',
  unhealthy: 'text-[var(--danger)] bg-[var(--danger)]/15',
};

export function SystemHealthPanel({ health }: { health: SystemHealth | null }) {
  if (!health) {
    return (
      <section className="dashboard-card rounded-2xl p-4 sm:p-6">
        <h2 className="mb-4 text-base font-semibold">System health</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Could not load system health data.
        </p>
      </section>
    );
  }

  const statusClass =
    STATUS_COLORS[health.status] ?? STATUS_COLORS.degraded;

  return (
    <section className="dashboard-card rounded-2xl p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[var(--foreground)]">
          System health
        </h2>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}
        >
          {STATUS_LABELS[health.status] ?? health.status}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-xl bg-[var(--surface-secondary)] p-3">
          <Zap className="size-4 text-[var(--primary)]" />
          <div className="flex-1 text-sm">
            <span className="text-[var(--muted-foreground)]">Uptime</span>
            <p className="font-semibold tabular-nums" dir="ltr">
              {formatUptime(health.uptime)}
            </p>
          </div>
          <span className="text-[11px] text-[var(--muted-foreground)]">
            {health.environment}
          </span>
        </div>

        <ServiceRow
          icon={Database}
          name="Database"
          status={health.services.database.status}
          ms={health.services.database.responseTime}
        />
        <ServiceRow
          icon={HardDrive}
          name="Redis"
          status={health.services.redis.status}
          ms={health.services.redis.responseTime}
        />

        <div className="flex items-center gap-3 rounded-xl bg-[var(--surface-secondary)] p-3 text-sm">
          <Activity className="size-4 text-[var(--primary)]" />
          <div className="flex-1">
            <p className="text-[var(--muted-foreground)]">Memory</p>
            <p className="font-medium tabular-nums" dir="ltr">
              {formatBytes(health.memory.used)} / {formatBytes(health.memory.total)}
            </p>
          </div>
          <p className="text-[11px] tabular-nums text-[var(--muted-foreground)]" dir="ltr">
            RSS {formatBytes(health.memory.rss)}
          </p>
        </div>
      </div>
    </section>
  );
}

function ServiceRow({
  icon: Icon,
  name,
  status,
  ms,
}: {
  icon: typeof Database;
  name: string;
  status: string;
  ms: number;
}) {
  const ok = status === 'healthy';
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[var(--surface-secondary)] p-3 text-sm">
      <Icon className={`size-4 ${ok ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`} />
      <span className="flex-1">{name}</span>
      <span
        className={`text-xs font-medium ${ok ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}
      >
        {ok ? 'Connected' : 'Error'}
      </span>
      <span className="text-[11px] tabular-nums text-[var(--muted-foreground)]" dir="ltr">
        {formatNumber(ms)} ms
      </span>
    </div>
  );
}
