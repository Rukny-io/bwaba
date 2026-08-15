'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  LayoutGrid,
  MessageSquare,
} from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { PhoneStatusBadge } from '@/components/whatsapp/whatsapp-ui';
import { useWhatsappPhone } from '@/components/whatsapp/whatsapp-phone-context';
import { appWhatsappHref } from '@/lib/whatsapp-routes';
import {
  WHATSAPP_PHONE_TABS,
  appWhatsappPhoneHref,
  isWhatsappPhoneTabActive,
  type WhatsappPhoneTabSegment,
} from '@/lib/whatsapp-phone-routes';
import { cn } from '@/lib/utils';

const TAB_ICONS: Record<WhatsappPhoneTabSegment, typeof LayoutGrid> = {
  overview: LayoutGrid,
  templates: BookOpen,
  logs: MessageSquare,
  errors: AlertTriangle,
};

export function WhatsappPhoneTabsNav() {
  const pathname = usePathname();
  const w = useTranslations().whatsapp;
  const { appId, phoneId } = useWhatsappPhone();

  const labels: Record<WhatsappPhoneTabSegment, string> = {
    overview: w.navPhoneOverview,
    templates: w.navTemplates,
    logs: w.navLogs,
    errors: w.navErrors,
  };

  return (
    <nav
      className="flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label={w.phoneWorkspaceTitle}
    >
      {WHATSAPP_PHONE_TABS.map((tab) => {
        const href = appWhatsappPhoneHref(appId, phoneId, tab.segment);
        const active = isWhatsappPhoneTabActive(pathname, appId, phoneId, tab.segment);
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

export function WhatsappPhoneChrome({ children }: { children: React.ReactNode }) {
  const w = useTranslations().whatsapp;
  const { appId, phone, isLoading, isError } = useWhatsappPhone();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="size-6 animate-spin rounded-full border-2 border-[var(--muted-foreground)] border-t-transparent" />
      </div>
    );
  }

  if (isError || !phone) {
    return (
      <section className="dashboard-panel rounded-2xl p-6 text-center sm:rounded-3xl">
        <p className="text-sm text-[var(--muted-foreground)]">{w.phoneNotFound}</p>
        <Link
          href={appWhatsappHref(appId, 'phones')}
          className="mt-4 inline-flex text-sm font-medium text-[var(--primary)] hover:underline"
        >
          {w.backToPhones}
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="dashboard-panel rounded-2xl p-5 sm:rounded-3xl sm:p-6">
        <div className="flex flex-col gap-4">
          <Link
            href={appWhatsappHref(appId, 'phones')}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <ArrowLeft className="size-3.5" />
            {w.backToPhones}
          </Link>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  className="font-mono text-lg font-semibold text-[var(--foreground)] sm:text-xl"
                  dir="ltr"
                >
                  {phone.displayPhoneNumber || phone.phoneNumber}
                </h2>
                <PhoneStatusBadge status={phone.status} />
              </div>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {phone.verifiedName || w.businessName}
              </p>
              <p className="mt-2 font-mono text-xs text-[var(--muted-foreground)]" dir="ltr">
                {w.phonePublicId}: {phone.phoneId}
              </p>
            </div>
          </div>
          <WhatsappPhoneTabsNav />
        </div>
      </section>
      {children}
    </div>
  );
}
