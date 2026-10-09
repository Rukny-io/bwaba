'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Code2,
  LayoutGrid,
  MessageSquare,
  Play,
  type LucideIcon,
} from 'lucide-react';
import { useCurrentApp } from '@/components/providers/app-context';
import { useTranslations } from '@/components/providers/translations-provider';
import { cn } from '@/lib/utils';
import {
  WHATSAPP_API_NAV_SECTIONS,
  type WhatsappApiSectionId,
} from '@/lib/whatsapp-api-catalog';
import {
  appWhatsappApiHref,
  isWhatsappApiSectionActive,
} from '@/lib/whatsapp-api-routes';

const SECTION_ICONS: Partial<Record<WhatsappApiSectionId, LucideIcon>> = {
  overview: LayoutGrid,
  messages: MessageSquare,
  try: Play,
  sdks: Code2,
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

export function WhatsappApiIslandNav() {
  const pathname = usePathname();
  const { app } = useCurrentApp();
  const d = useTranslations().whatsappApi;

  return (
    <div
      className="island-nav-shell pointer-events-none fixed bottom-4 left-1/2 z-50 max-w-[calc(100vw-24px)] -translate-x-1/2"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <nav
        aria-label={d.navIslandAria}
        className={cn(
          ISLAND_NAV_CLASS,
          'max-w-[calc(100vw-24px)] overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        )}
      >
        {WHATSAPP_API_NAV_SECTIONS.map((item) => {
          const sectionId = item.id as WhatsappApiSectionId;
          const href = appWhatsappApiHref(app.appId, sectionId);
          const active = isWhatsappApiSectionActive(
            pathname,
            app.appId,
            sectionId,
          );
          const Icon = SECTION_ICONS[sectionId];
          const label = d[item.labelKey];

          return (
            <Link
              key={item.id}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(ISLAND_ITEM_CLASS, islandItemActive(active))}
            >
              {Icon ? (
                <Icon
                  className="size-4 shrink-0"
                  strokeWidth={active ? 2 : 1.75}
                  aria-hidden
                />
              ) : null}
              <span className="whitespace-nowrap">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
