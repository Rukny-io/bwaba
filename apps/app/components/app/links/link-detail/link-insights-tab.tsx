'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, MousePointerClick } from 'lucide-react';
import { Alert, Card, Spinner, Surface, cn } from '@heroui/react';
import { formatNumber } from '@/lib/dashboard-format';
import { fetchLinkStats } from '@/lib/links/api';
import type { LinkStatsResponse, SocialLink } from '@/lib/links/types';

interface LinkInsightsTabProps {
  linkId: string;
  link: SocialLink;
}

function MetricCard({
  label,
  value,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: number;
  icon: typeof MousePointerClick;
  accent?: boolean;
}) {
  return (
    <Card variant="secondary" className="gap-2.5 p-3.5 sm:p-4">
      <Card.Content className="gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <Card.Description className="text-xs font-medium">{label}</Card.Description>
          <Surface
            variant={accent ? 'tertiary' : 'default'}
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-xl',
              accent
                ? 'text-accent'
                : 'text-muted ring-1 ring-border',
            )}
          >
            <Icon className="size-4" strokeWidth={1.75} aria-hidden />
          </Surface>
        </div>
        <Card.Title
          className="text-[1.65rem] font-bold leading-none tabular-nums sm:text-[1.75rem]"
          dir="ltr"
          lang="en"
        >
          {formatNumber(value)}
        </Card.Title>
      </Card.Content>
    </Card>
  );
}

export function LinkInsightsTab({ linkId, link }: LinkInsightsTabProps) {
  const [data, setData] = useState<LinkStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchLinkStats(linkId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'تعذر تحميل الإحصاءات');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [linkId]);

  if (loading) {
    return (
      <div className="flex min-h-[160px] items-center justify-center">
        <Spinner size="lg" color="accent" aria-label="جاري تحميل الإحصاءات" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert status="danger">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>تعذر تحميل الإحصاءات</Alert.Title>
          <Alert.Description>{error}</Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }

  const totalClicks = data?.stats?.clicks ?? data?.totalClicks ?? link.totalClicks;
  const views = data?.views ?? link.views;

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <Card variant="transparent" className="gap-1 p-0 shadow-none">
        <Card.Header className="gap-1">
          <Card.Title className="text-sm font-bold">أداء الرابط</Card.Title>
          <Card.Description className="text-xs leading-relaxed">
            ملخص النقرات والمشاهدات لهذا الرابط
          </Card.Description>
        </Card.Header>
      </Card>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        <MetricCard label="النقرات" value={totalClicks} icon={MousePointerClick} accent />
        <MetricCard label="المشاهدات" value={views} icon={Eye} />
      </div>

      <p className="text-center text-xs text-muted">
        لمزيد من التحليلات على مستوى الصفحة، راجع{' '}
        <Link href="/app/analytics" className="font-semibold text-link hover:underline">
          التحليلات
        </Link>
      </p>
    </div>
  );
}
