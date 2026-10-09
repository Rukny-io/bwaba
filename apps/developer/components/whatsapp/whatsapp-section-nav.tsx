'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCurrentApp } from '@/components/providers/app-context';
import { useTranslations } from '@/components/providers/translations-provider';
import {
  WHATSAPP_TABS,
  appWhatsappHref,
  isWhatsappTabActive,
  type WhatsappTabSegment,
} from '@/lib/whatsapp-routes';
import { cn } from '@/lib/utils';

export function WhatsappSectionNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const { app } = useCurrentApp();
  const w = useTranslations().whatsapp;

  const labels: Record<WhatsappTabSegment, string> = {
    overview: w.navOverview,
    phones: w.navPhones,
    webhooks: w.navWebhooks,
    contacts: w.navContacts,
  };

  return (
    <nav
      className={cn(
        '-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
      aria-label={w.navIslandAria}
    >
      {WHATSAPP_TABS.map(({ segment }) => {
        const href = appWhatsappHref(app.appId, segment);
        const active = isWhatsappTabActive(pathname, app.appId, segment);

        return (
          <Link
            key={segment}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex h-8 shrink-0 items-center rounded-full px-3.5 text-[13px] font-medium transition-colors',
              active
                ? 'bg-[var(--foreground)] text-[var(--background)] shadow-sm'
                : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:bg-[color-mix(in_srgb,var(--surface-secondary)_88%,var(--foreground)_6%)] hover:text-[var(--foreground)]',
            )}
          >
            {labels[segment]}
          </Link>
        );
      })}
    </nav>
  );
}
