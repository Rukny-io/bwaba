import Link from 'next/link';
import { Button, Typography } from '@heroui/react';

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
    <section className="w-full pt-6 sm:pt-8">
      <Typography.Heading level={1} className="text-2xl">
        {title}
      </Typography.Heading>
      <Typography.Paragraph size="sm" color="muted" className="mt-2 max-w-lg leading-relaxed">
        {description}
      </Typography.Paragraph>
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
