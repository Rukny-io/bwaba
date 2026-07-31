import Image from 'next/image';
import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { siteUrls } from '@/lib/site-urls';

export function PublicFormEmptyState({
  title,
  description,
  showHomeLink = true,
}: {
  title: string;
  description: string;
  showHomeLink?: boolean;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-8 py-10 text-center shadow-[var(--card-shadow)]">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
          <FileQuestion className="size-7" strokeWidth={1.8} aria-hidden />
        </div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
          {description}
        </p>
        {showHomeLink ? (
          <Link
            href={siteUrls.home}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)]"
          >
            <Image
              src="/rukny-logo.svg"
              alt=""
              width={18}
              height={18}
              className="size-[18px]"
            />
            العودة إلى Rukny
          </Link>
        ) : null}
      </div>
    </div>
  );
}
