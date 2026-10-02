'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Code2,
  LayoutGrid,
  MessageSquare,
  Play,
  ScrollText,
  Webhook,
  type LucideIcon,
} from 'lucide-react';
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

const SECTION_ICONS: Partial<Record<WhatsappApiSectionId, LucideIcon>> = {
  overview: LayoutGrid,
  messages: MessageSquare,
  templates: ScrollText,
  webhooks: Webhook,
  try: Play,
  sdks: Code2,
};

export function WhatsappApiNav() {
  const pathname = usePathname();
  const { app } = useCurrentApp();
  const d = WHATSAPP_API_COPY;

  return (
    <nav
      className="flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label={d.title}
    >
      {WHATSAPP_API_NAV_SECTIONS.map((item) => {
        const href = appWhatsappApiHref(app.appId, item.id);
        const active = isWhatsappApiSectionActive(
          pathname,
          app.appId,
          item.id as WhatsappApiSectionId,
        );
        const Icon = SECTION_ICONS[item.id as WhatsappApiSectionId];

        return (
          <Link
            key={item.id}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-[13px] font-medium transition-colors',
              active
                ? 'bg-[var(--foreground)] text-[var(--background)]'
                : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
            )}
          >
            {Icon ? (
              <Icon className="size-3.5" strokeWidth={active ? 2 : 1.75} aria-hidden />
            ) : null}
            {d[item.labelKey]}
          </Link>
        );
      })}
    </nav>
  );
}
