import Link from 'next/link';
import { Button } from '@heroui/react';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';

interface PlaceholderPageProps {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}

export function PlaceholderPage({
  title,
  description,
  actionHref,
  actionLabel,
}: PlaceholderPageProps) {
  return (
    <section className="dashboard-page dashboard-section-stack">
      <DashboardPageHeader title={title} description={description} />
      {actionHref && actionLabel ? (
        <Link href={actionHref}>
          <Button variant="primary">{actionLabel}</Button>
        </Link>
      ) : null}
    </section>
  );
}
