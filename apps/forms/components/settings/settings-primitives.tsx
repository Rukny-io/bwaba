import type { LucideIcon } from 'lucide-react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import Link from 'next/link';
import { formDetailCardClass } from '@/lib/form-detail-styles';
import { cn } from '@/lib/utils';

interface SettingsPanelProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** When true, children render without the bordered surface wrapper */
  plain?: boolean;
  /** Border only — no filled surface background */
  bordered?: boolean;
}

export function SettingsPanel({
  title,
  description,
  children,
  className,
  plain = false,
  bordered = false,
}: SettingsPanelProps) {
  return (
    <section className={cn('space-y-3 sm:space-y-3.5', className)}>
      <header className="px-0.5">
        <h2 className="text-[15px] font-semibold tracking-tight text-[var(--foreground)] sm:text-base">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
            {description}
          </p>
        ) : null}
      </header>
      {plain ? (
        children
      ) : (
        <div
          className={cn(
            bordered
              ? cn('settings-surface overflow-hidden', formDetailCardClass)
              : 'settings-surface overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]',
          )}
        >
          {children}
        </div>
      )}
    </section>
  );
}

type SettingsRowProps = {
  title: string;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
  isStatic?: boolean;
} & (
  | ({ href: string; isStatic?: false } & Omit<ComponentPropsWithoutRef<'a'>, 'title' | 'children'>)
  | ({ href?: never; isStatic?: boolean } & Omit<ComponentPropsWithoutRef<'button'>, 'title' | 'children'>)
);

export function SettingsRow({
  title,
  subtitle,
  icon: Icon,
  leading,
  trailing,
  className,
  isStatic = false,
  href,
  ...props
}: SettingsRowProps) {
  const content = (
    <>
      {leading ? (
        leading
      ) : Icon ? (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
          <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
        </span>
      ) : null}
      <span className="min-w-0 flex-1 text-start">
        <span className="block text-[14px] font-medium leading-snug text-[var(--foreground)]">
          {title}
        </span>
        {subtitle ? (
          <span className="mt-1 block text-[13px] leading-relaxed text-[var(--muted-foreground)]">
            {subtitle}
          </span>
        ) : null}
      </span>
      {trailing ? <span className="shrink-0">{trailing}</span> : null}
    </>
  );

  const rowClass = cn(
    'settings-row group flex w-full items-center gap-3 px-4 py-3.5 text-start transition-colors sm:gap-3.5 sm:px-5 sm:py-4',
    href && 'hover:bg-[var(--surface-secondary)]/55',
    !href && !isStatic && 'hover:bg-[var(--surface-secondary)]/40',
    className,
  );

  if (isStatic) {
    return <div className={rowClass}>{content}</div>;
  }

  if (href) {
    const isExternal = href.startsWith('http');

    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={rowClass}
          {...(props as ComponentPropsWithoutRef<'a'>)}
        >
          {content}
        </a>
      );
    }

    return (
      <Link
        href={href}
        className={rowClass}
        {...(props as Omit<ComponentPropsWithoutRef<typeof Link>, 'href'>)}
      >
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={rowClass} {...(props as ComponentPropsWithoutRef<'button'>)}>
      {content}
    </button>
  );
}

export function SettingsRowDivider() {
  return <div className="mx-4 h-px bg-[var(--border)]/70 sm:mx-5" aria-hidden />;
}

export function SettingsStatusBadge({
  children,
  tone = 'success',
}: {
  children: ReactNode;
  tone?: 'success' | 'muted';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[13px] font-medium',
        tone === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--muted-foreground)]',
      )}
    >
      {children}
    </span>
  );
}
