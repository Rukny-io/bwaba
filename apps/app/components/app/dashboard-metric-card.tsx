import type { LucideIcon } from 'lucide-react';
import { Card, Surface, cn } from '@heroui/react';

export interface DashboardMetricCardProps {
  icon: LucideIcon;
  iconClassName?: string;
  label: string;
  value: string | number;
  comparisonPrimary: string;
  comparisonSecondary?: string;
  trend?: string;
  trendPositive?: boolean;
  className?: string;
}

export function DashboardMetricCard({
  icon: Icon,
  iconClassName,
  label,
  value,
  comparisonPrimary,
  comparisonSecondary,
  trend,
  trendPositive = true,
  className,
}: DashboardMetricCardProps) {
  return (
    <Card className={cn('min-h-[7.25rem] gap-2 p-3 sm:min-h-0 sm:gap-4 sm:p-5', className)}>
      <Card.Header className="flex-row items-center justify-between gap-2 p-0">
        <Surface
          variant="secondary"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg sm:size-10 sm:rounded-xl"
        >
          <Icon
            className={cn(
              'size-[18px] sm:size-5',
              iconClassName ?? 'text-[var(--primary)]',
            )}
            strokeWidth={1.6}
          />
        </Surface>
        {trend ? (
          <span
            className={cn(
              'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums sm:px-2.5 sm:py-1 sm:text-[11px]',
              trendPositive
                ? 'bg-[var(--success)]/15 text-[var(--success)]'
                : 'bg-[var(--danger)]/15 text-[var(--danger)]',
            )}
            dir="ltr"
            lang="en"
          >
            {trend}
          </span>
        ) : (
          <span className="size-0 sm:hidden" aria-hidden />
        )}
      </Card.Header>

      <Card.Title className="line-clamp-2 text-xs font-medium leading-snug text-[var(--muted-foreground)] sm:text-[13px]">
        {label}
      </Card.Title>

      <Card.Content className="mt-auto gap-1 p-0 sm:gap-0">
        <div className="flex items-end justify-between gap-2 sm:gap-3">
          <p
            className="text-[1.35rem] font-bold leading-none tabular-nums text-[var(--foreground)] sm:text-[1.75rem]"
            dir="ltr"
            lang="en"
          >
            {value}
          </p>
          {comparisonSecondary ? (
            <p className="hidden max-w-[9rem] text-end text-[11px] leading-snug text-[var(--muted-foreground)]/70 sm:block">
              {comparisonPrimary}
              <br />
              {comparisonSecondary}
            </p>
          ) : (
            <p className="hidden max-w-[9rem] text-end text-[11px] leading-snug text-[var(--muted-foreground)]/70 sm:block">
              {comparisonPrimary}
            </p>
          )}
        </div>
        <p className="line-clamp-1 text-[10px] leading-tight text-[var(--muted-foreground)]/70 sm:hidden">
          {comparisonPrimary}
        </p>
      </Card.Content>
    </Card>
  );
}
