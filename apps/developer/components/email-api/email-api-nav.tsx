'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const sections = [
  ['Overview', ''],
  ['Authentication', 'auth'],
  ['Messages', 'messages'],
  ['Domains', 'domains'],
  ['Try it', 'try'],
  ['Errors', 'errors'],
] as const;

export function EmailApiNav({ appId: _appId, baseHref }: { appId: string; baseHref: string }) {
  const pathname = usePathname();
  return (
    <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5 pt-0.5" aria-label="Email API">
      {sections.map(([label, slug]) => {
        const href = slug ? `${baseHref}/${slug}` : baseHref;
        const active = slug ? pathname === href || pathname.startsWith(`${href}/`) : pathname === baseHref || pathname === `${baseHref}/`;
        return (
          <Link key={label} href={href} aria-current={active ? 'page' : undefined} className={cn(
            'inline-flex h-8 shrink-0 items-center rounded-full px-3.5 text-[13px] font-medium transition-colors',
            active ? 'bg-[var(--foreground)] text-[var(--background)] shadow-sm' : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
          )}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
