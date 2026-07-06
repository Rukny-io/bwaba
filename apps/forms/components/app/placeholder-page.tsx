import Link from 'next/link';
import { Button } from '@heroui/react';

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
    <section className="dashboard-page">
      <h1 className="text-2xl font-semibold text-[var(--foreground)]">{title}</h1>
      <p className="mt-2 max-w-lg text-sm text-[var(--muted-foreground)]">
        {description}
      </p>
      {actionHref && actionLabel ? (
        <div className="mt-6">
          <Link href={actionHref}>
            <Button variant="primary">{actionLabel}</Button>
          </Link>
        </div>
      ) : null}
    </section>
  );
}
