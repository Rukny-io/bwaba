'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCurrentApp } from '@/components/providers/app-context';
import { WHATSAPP_API_COPY } from '@/lib/whatsapp-api-copy';
import {
  WHATSAPP_API_NAV_SECTIONS,
  type WhatsappApiSectionId,
} from '@/lib/whatsapp-api-catalog';
import {
  appWhatsappApiHref,
  isWhatsappApiSectionActive,
} from '@/lib/whatsapp-api-routes';
import { cn } from '@/lib/utils';

export function WhatsappApiNav() {
  const pathname = usePathname();
  const { app } = useCurrentApp();
  const d = WHATSAPP_API_COPY;

  return (
    <nav
      className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label={d.title}
    >
      {WHATSAPP_API_NAV_SECTIONS.map((item) => {
        const href = appWhatsappApiHref(app.appId, item.id);
        const active = isWhatsappApiSectionActive(
          pathname,
          app.appId,
          item.id as WhatsappApiSectionId,
        );

        return (
          <Link
            key={item.id}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex h-8 shrink-0 items-center rounded-full px-3.5 text-[13px] font-medium transition-colors',
              active
                ? 'bg-[var(--foreground)] text-[var(--background)] shadow-sm'
                : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:bg-[color-mix(in_srgb,var(--surface-secondary)_88%,var(--foreground)_6%)] hover:text-[var(--foreground)]',
            )}
          >
            {d[item.labelKey]}
          </Link>
        );
      })}
    </nav>
  );
}
