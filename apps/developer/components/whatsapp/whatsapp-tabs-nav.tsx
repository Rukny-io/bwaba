'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Contact,
  LayoutGrid,
  Phone,
  Webhook,
} from 'lucide-react';
import { useCurrentApp } from '@/components/providers/app-context';
import { useTranslations } from '@/components/providers/translations-provider';
import { cn } from '@/lib/utils';
import {
  WHATSAPP_TABS,
  appWhatsappHref,
  isWhatsappTabActive,
  type WhatsappTabSegment,
} from '@/lib/whatsapp-routes';

const TAB_ICONS: Record<WhatsappTabSegment, typeof LayoutGrid> = {
  overview: LayoutGrid,
  phones: Phone,
  webhooks: Webhook,
  contacts: Contact,
};

export function WhatsappTabsNav() {
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
      className="flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label={w.title}
    >
      {WHATSAPP_TABS.map((tab) => {
        const href = appWhatsappHref(app.appId, tab.segment);
        const active = isWhatsappTabActive(pathname, app.appId, tab.segment);
        const Icon = TAB_ICONS[tab.segment];

        return (
          <Link
            key={tab.segment}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-[13px] font-medium transition-colors',
              active
                ? 'bg-[var(--foreground)] text-[var(--background)]'
                : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
            )}
          >
            <Icon className="size-3.5" strokeWidth={active ? 2 : 1.75} aria-hidden />
            {labels[tab.segment]}
          </Link>
        );
      })}
    </nav>
  );
}
