import Link from 'next/link';

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
      <h1 className="text-2xl font-semibold text-[var(--foreground)]">{title}</h1>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-[var(--muted-foreground)]">
        {description}
      </p>
      {actionHref && actionLabel ? (
        <div className="mt-6">
          <Link
            href={actionHref}
            className="inline-flex h-11 items-center justify-center rounded-3xl bg-[var(--foreground)] px-5 text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-90"
          >
            {actionLabel}
          </Link>
        </div>
      ) : null}
    </section>
  );
}
