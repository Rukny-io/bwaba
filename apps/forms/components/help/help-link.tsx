import type { ReactNode } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HelpLinkProps {
  href: string;
  children: ReactNode;
  external?: boolean;
  className?: string;
}

export function HelpLink({
  href,
  children,
  external,
  className,
}: HelpLinkProps) {
  const classes = cn(
    'inline-flex items-center gap-1 font-medium text-[var(--primary)] underline-offset-2 transition-colors hover:text-[var(--foreground)] hover:underline',
    className,
  );

  if (external || href.startsWith('http') || href.startsWith('mailto:')) {
    return (
      <a
        href={href}
        className={classes}
        target={href.startsWith('mailto:') ? undefined : '_blank'}
        rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
      >
        {children}
        {!href.startsWith('mailto:') ? (
          <ExternalLink className="size-3 shrink-0 opacity-70" aria-hidden />
        ) : null}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}

interface HelpLinkChipProps {
  href: string;
  label: string;
  external?: boolean;
}

export function HelpLinkChip({ href, label, external }: HelpLinkChipProps) {
  const isExternal =
    external || href.startsWith('http') || href.startsWith('mailto:');

  const className = cn(
    'inline-flex items-center gap-1.5 rounded-full border border-[var(--border)]/60',
    'bg-[var(--surface-secondary)]/50 px-3 py-1.5 text-xs font-semibold',
    'text-[var(--foreground)] transition-colors',
    'hover:border-[var(--primary)]/30 hover:bg-[var(--primary)]/8 hover:text-[var(--primary)]',
  );

  if (isExternal) {
    return (
      <a
        href={href}
        className={className}
        target={href.startsWith('mailto:') ? undefined : '_blank'}
        rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
      >
        {label}
        {!href.startsWith('mailto:') ? (
          <ExternalLink className="size-3 opacity-60" aria-hidden />
        ) : null}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}
