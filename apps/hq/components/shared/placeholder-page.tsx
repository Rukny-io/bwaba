import { EmptyState } from '@heroui/react';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <EmptyState className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <h2 className="text-lg font-semibold text-[var(--foreground)]">{title}</h2>
      <p className="max-w-md text-sm text-[var(--muted-foreground)]">
        {description}
      </p>
    </EmptyState>
  );
}
