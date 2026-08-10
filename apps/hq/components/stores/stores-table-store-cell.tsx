'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Store } from 'lucide-react';
import type { AdminStore } from '@/lib/types/stores';
import { getStorePublicUrl } from '@/lib/stores-url';
import { TableHint } from '@/components/shared/table-hint';
import { resolveMediaUrl } from '@/lib/media-url';
import { cn } from '@/lib/utils';

interface StoresTableStoreCellProps {
  store: AdminStore;
  className?: string;
  linkToDetail?: boolean;
}

export function StoresTableStoreCell({
  store,
  className,
  linkToDetail = true,
}: StoresTableStoreCellProps) {
  const logoUrl = resolveMediaUrl(store.logo);
  const publicUrl = getStorePublicUrl(store.slug);

  const title = linkToDetail ? (
    <Link
      href={`/app/stores/${store.id}`}
      className="block truncate text-sm font-medium leading-snug text-[var(--foreground)] transition-colors hover:text-[var(--primary)]"
      title={`Open details for ${store.name}`}
    >
      {store.name}
    </Link>
  ) : (
    <p className="truncate text-sm font-medium leading-snug text-[var(--foreground)]">
      {store.name}
    </p>
  );

  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt=""
            width={32}
            height={32}
            className="size-full object-cover"
            unoptimized
          />
        ) : (
          <Store className="size-3.5" aria-hidden />
        )}
      </div>
      <div className="min-w-0">
        {title}
        <TableHint
          content={`Slug: /${store.slug}\nPublic: ${publicUrl}`}
          ariaLabel="Store slug and public URL"
        >
          <p
            className="truncate font-mono text-[11px] leading-snug text-[var(--muted-foreground)]"
            dir="ltr"
          >
            /{store.slug}
          </p>
        </TableHint>
      </div>
    </div>
  );
}
