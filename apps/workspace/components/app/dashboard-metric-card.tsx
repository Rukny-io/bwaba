import type { LucideIcon } from 'lucide-react';
import { Card, Chip, Typography } from '@heroui/react';
import { cn } from '@/lib/utils';

export type DashboardMetricChipTone =
  | 'success'
  | 'warning'
  | 'neutral'
  | 'danger';

export interface DashboardMetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  comparisonPrimary: string;
  comparisonSecondary: string;
  trend?: string;
  trendPositive?: boolean;
  chip?: string;
  chipTone?: DashboardMetricChipTone;
  tabular?: boolean;
}

const chipColorMap: Record<
  DashboardMetricChipTone,
  'success' | 'warning' | 'danger' | 'default'
> = {
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  neutral: 'default',
};

function MetricMeta({
  chip,
  chipTone = 'neutral',
  trend,
  trendPositive = true,
}: {
  chip?: string;
  chipTone?: DashboardMetricChipTone;
  trend?: string;
  trendPositive?: boolean;
}) {
  if (chip) {
    return (
      <Chip size="sm" color={chipColorMap[chipTone]} variant="soft">
        {chip}
      </Chip>
    );
  }

  if (trend) {
    return (
      <Chip
        size="sm"
        color={trendPositive ? 'success' : 'danger'}
        variant="soft"
        className="tabular-nums"
      >
        <span dir="ltr" lang="en">
          {trend}
        </span>
      </Chip>
    );
  }

  return null;
}

export function DashboardMetricCard({
  icon: Icon,
  label,
  value,
  comparisonPrimary,
  comparisonSecondary,
  trend,
  trendPositive = true,
  chip,
  chipTone = 'neutral',
  tabular = true,
}: DashboardMetricCardProps) {
  const valueNode = tabular ? (
    <span dir="ltr" lang="en">
      {value}
    </span>
  ) : (
    value
  );

  const meta = (
    <MetricMeta
      chip={chip}
      chipTone={chipTone}
      trend={trend}
      trendPositive={trendPositive}
    />
  );

  return (
    <Card className="flex min-h-[7.5rem] flex-col gap-3 p-3.5 border-2 border-border/40 sm:min-h-[8.5rem] sm:gap-4 sm:p-5">
      <div className="flex min-h-0 flex-1 flex-col sm:hidden">
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-primary ring-1 ring-border/40">
            <Icon size={15} strokeWidth={1.85} />
          </div>
          <Typography.Paragraph
            size="xs"
            weight="semibold"
            color="muted"
            className="min-w-0 flex-1 leading-snug"
          >
            {label}
          </Typography.Paragraph>
          {meta}
        </div>

        <div className="mt-auto flex min-h-[2.75rem] w-full flex-col justify-end pt-2.5">
          <Typography.Heading
            level={3}
            className={cn(
              'text-right leading-none tracking-tight',
              tabular ? 'text-[1.65rem] tabular-nums' : 'text-[1.35rem] leading-snug',
            )}
          >
            {valueNode}
          </Typography.Heading>
          <Typography.Paragraph
            size="xs"
            color="muted"
            className="mt-1 line-clamp-2 text-right leading-relaxed opacity-75"
          >
            {comparisonPrimary}
            {comparisonSecondary && comparisonSecondary !== comparisonPrimary
              ? ` · ${comparisonSecondary}`
              : null}
          </Typography.Paragraph>
        </div>
      </div>

      <div className="hidden sm:contents">
        <div className="flex items-center justify-between gap-2">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-primary">
            <Icon className="size-5" strokeWidth={1.6} />
          </div>
          {meta}
        </div>

        <Typography.Paragraph
          size="sm"
          color="muted"
          className="line-clamp-2 leading-snug"
        >
          {label}
        </Typography.Paragraph>

        <div className="mt-auto">
          <div className="flex items-end justify-between gap-3">
            <Typography.Heading
              level={3}
              className={cn(
                'text-right leading-none tracking-tight',
                tabular ? 'text-[1.75rem] tabular-nums' : 'text-[1.35rem] leading-snug',
              )}
            >
              {valueNode}
            </Typography.Heading>
            <Typography.Paragraph
              size="xs"
              color="muted"
              className="max-w-[9rem] shrink-0 text-end leading-snug opacity-70"
            >
              {comparisonPrimary}
              <br />
              {comparisonSecondary}
            </Typography.Paragraph>
          </div>
        </div>
      </div>
    </Card>
  );
}
