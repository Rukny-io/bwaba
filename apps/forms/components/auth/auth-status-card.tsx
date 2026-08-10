'use client';

import { ArrowRight, Link2Off, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthStatusCardProps {
  className?: string;
}

export function AuthLoadingCard({
  title = 'جارٍ تسجيل الدخول',
  description = 'يتم التحقق من جلستك…',
  className,
}: AuthStatusCardProps & {
  title?: string;
  description?: string;
}) {
  return (
    <section
      className={cn('w-full px-2 py-2 text-center sm:px-4', className)}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="mb-7 flex flex-col items-center">
        <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-[var(--secondary)] px-4 py-2 text-xs font-medium text-[var(--secondary-foreground)]">
          <Sparkles className="size-3.5" aria-hidden />
          جارٍ المعالجة
        </span>

        <div className="relative mb-5 flex size-14 items-center justify-center">
          <span
            className="absolute inset-0 animate-ping rounded-full bg-[var(--primary)]/10"
            aria-hidden
          />
          <div className="relative flex size-14 items-center justify-center rounded-2xl border border-[var(--border)]/70 bg-[var(--surface)] shadow-sm">
            <Loader2
              className="size-6 animate-spin text-[var(--primary)]"
              strokeWidth={1.75}
              aria-hidden
            />
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-[1.65rem]">
          {title}
        </h1>
        <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-[var(--muted-foreground)]">
          {description}
        </p>
      </div>
    </section>
  );
}

export function AuthErrorCard({
  title,
  description,
  actionLabel = 'العودة لتسجيل الدخول',
  onAction,
  className,
}: AuthStatusCardProps & {
  title: string;
  description: string;
  actionLabel?: string;
  onAction: () => void;
}) {
  return (
    <section className={cn('w-full px-2 sm:px-4', className)} role="alert">
      <div className="mb-8 flex flex-col items-center text-center">
        <span className="mb-5 inline-flex items-center rounded-full border border-amber-200/80 bg-amber-50 px-4 py-1.5 text-xs font-medium text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          تعذّر إكمال الدخول
        </span>

        <div className="mb-5 flex size-[3.75rem] items-center justify-center rounded-[1.125rem] border border-[var(--border)]/60 bg-gradient-to-b from-[var(--surface)] to-[var(--surface-secondary)]/80 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <Link2Off
            className="size-6 text-[var(--muted-foreground)]"
            strokeWidth={1.5}
            aria-hidden
          />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-[1.65rem]">
          {title}
        </h1>
        <p className="mt-2.5 max-w-[19rem] text-sm leading-relaxed text-[var(--muted-foreground)]">
          {description}
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-[var(--border)]/60 bg-[var(--surface-secondary)]/35 px-4 py-3.5 text-center">
          <p className="text-[12px] leading-relaxed text-[var(--muted-foreground)]">
            ابدأ من صفحة تسجيل الدخول مرة أخرى. إذا استمرت المشكلة، أغلق هذه النافذة
            وجرّب متصفحاً آخر أو وضع التصفح الخاص.
          </p>
        </div>

        <button
          type="button"
          onClick={onAction}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-5 text-sm font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-95"
        >
          <span>{actionLabel}</span>
          <ArrowRight className="size-4 rotate-180" aria-hidden />
        </button>
      </div>
    </section>
  );
}
