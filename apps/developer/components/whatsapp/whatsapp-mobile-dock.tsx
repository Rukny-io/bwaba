'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeft,
  Contact,
  LayoutGrid,
  Phone,
  Webhook,
  type LucideIcon,
} from 'lucide-react';
import { useCurrentApp } from '@/components/providers/app-context';
import {
  MobileDockShell,
  MobileDockPill,
  MobileDockNavLink,
  mobileDockSideButtonClass,
} from '@/components/layout/mobile-dock-primitives';
import { useTranslations } from '@/components/providers/translations-provider';
import { appDashboard } from '@/lib/app-routes';
import {
  WHATSAPP_TABS,
  appWhatsappHref,
  isWhatsappTabActive,
  type WhatsappTabSegment,
} from '@/lib/whatsapp-routes';

const TAB_ICONS: Record<WhatsappTabSegment, LucideIcon> = {
  overview: LayoutGrid,
  phones: Phone,
  webhooks: Webhook,
  contacts: Contact,
};

export function WhatsappMobileDock() {
  const pathname = usePathname();
  const { app } = useCurrentApp();
  const w = useTranslations().whatsapp;
  const t = useTranslations();

  const labels: Record<WhatsappTabSegment, string> = {
    overview: w.navOverview,
    phones: w.navPhones,
    webhooks: w.navWebhooks,
    contacts: w.navContacts,
  };

  return (
    <MobileDockShell>
      <Link
        href={appDashboard(app.appId)}
        aria-label={t.mobile.backToMenu}
        className={mobileDockSideButtonClass}
      >
        <ArrowLeft
          className="size-5 rtl:rotate-180"
          strokeWidth={2}
          aria-hidden
        />
      </Link>

      <MobileDockPill aria-label={w.navIslandAria}>
        {WHATSAPP_TABS.map(({ segment }) => {
          const href = appWhatsappHref(app.appId, segment);
          const active = isWhatsappTabActive(pathname, app.appId, segment);
          return (
            <MobileDockNavLink
              key={segment}
              href={href}
              icon={TAB_ICONS[segment]}
              label={labels[segment]}
              isActive={active}
            />
          );
        })}
      </MobileDockPill>
    </MobileDockShell>
  );
}
