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

const ISLAND_NAV_CLASS =
  'pointer-events-auto flex flex-nowrap items-center gap-[6px] rounded-[12px] border border-solid border-[#f0f0f0] bg-white p-[6px] shadow-[0px_6px_6px_rgba(0,0,0,0.06)] dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0px_6px_6px_rgba(0,0,0,0.25)]';

const ISLAND_ITEM_CLASS =
  'inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-[8px] px-3 text-[13px] font-medium transition-colors';

function islandItemActive(active: boolean) {
  return active
    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
    : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100';
}

export function WhatsappIslandNav() {
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
    <div
      className="island-nav-shell pointer-events-none fixed bottom-4 left-1/2 z-50 max-w-[calc(100vw-24px)] -translate-x-1/2"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <nav
        dir="ltr"
        aria-label={w.navIslandAria}
        className={cn(
          ISLAND_NAV_CLASS,
          'max-w-[calc(100vw-24px)] overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        )}
      >
        {WHATSAPP_TABS.map(({ segment }) => {
          const href = appWhatsappHref(app.appId, segment);
          const active = isWhatsappTabActive(pathname, app.appId, segment);
          const Icon = TAB_ICONS[segment];
          const label = labels[segment];

          return (
            <Link
              key={segment}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(ISLAND_ITEM_CLASS, islandItemActive(active))}
            >
              <Icon
                className="size-4 shrink-0"
                strokeWidth={active ? 2 : 1.75}
                aria-hidden
              />
              <span className="whitespace-nowrap">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
