'use client';

import { cn } from '@/lib/utils';

export function PublicFormStatusCard({
  variant,
  title,
  message,
  embed = false,
}: {
  variant: 'success' | 'unavailable';
  title: string;
  message: string;
  embed?: boolean;
}) {
  const isSuccess = variant === 'success';

  return (
    <div
      className={
        embed
          ? 'flex min-h-[280px] items-center justify-center px-4 py-10'
          : 'flex min-h-dvh items-center justify-center px-4 py-16'
      }
    >
      <div
        className={cn(
          'w-full max-w-md rounded-3xl border px-8 py-10 text-center shadow-[var(--card-shadow)]',
          isSuccess
            ? 'border-[color-mix(in_srgb,var(--form-primary,#062c30)_20%,transparent)] bg-[color-mix(in_srgb,var(--form-primary,#062c30)_6%,white)]'
            : 'border-[var(--border)] bg-[var(--surface)]',
        )}
      >
        <div
          className={cn(
            'mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl',
            isSuccess
              ? 'bg-[color-mix(in_srgb,var(--form-primary,#062c30)_14%,white)] text-[var(--form-primary,#062c30)]'
              : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]',
          )}
        >
          {isSuccess ? (
            <svg
              viewBox="0 0 24 24"
              className="size-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M20 6 9 17l-5-5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="size-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
          {message}
        </p>
      </div>
    </div>
  );
}
