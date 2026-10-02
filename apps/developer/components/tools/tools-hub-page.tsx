'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  BookOpen,
  FormInput,
  KeyRound,
  Mail,
  MessageSquare,
  Package,
  Settings,
  Webhook,
  Wallet,
  Play,
} from 'lucide-react';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { useTranslations } from '@/components/providers/translations-provider';
import { useCurrentApp } from '@/components/providers/app-context';
import {
  appAnalytics,
  appApiKeys,
  appEmailApi,
  appEmailApiHref,
  appForms,
  appProducts,
  appSettings,
  appWallet,
  appWhatsapp,
  appWhatsappApi,
  appWhatsappApiHref,
} from '@/lib/app-routes';
import { DOCUMENTATION_BASE } from '@/lib/documentation-nav';
import { appWhatsappHref } from '@/lib/whatsapp-routes';
import { cn } from '@/lib/utils';

type ToolItem = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  external?: boolean;
};

function FeaturedToolCard({ item }: { item: ToolItem }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className="dashboard-panel group flex flex-col gap-4 p-5 transition-colors hover:bg-[color-mix(in_srgb,var(--surface-secondary)_55%,var(--surface))] sm:p-6"
    >
      <span className="flex size-11 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--foreground)]">
        <Icon className="size-5" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0 space-y-1.5">
        <h3 className="text-[15px] font-semibold text-[var(--foreground)]">
          {item.title}
        </h3>
        <p className="text-[13px] leading-relaxed text-[var(--muted-foreground)]">
          {item.description}
        </p>
      </div>
    </Link>
  );
}

function ToolRow({ item }: { item: ToolItem }) {
  const Icon = item.icon;

  const content = (
    <>
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--foreground)]">
        <Icon className="size-4" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-[var(--foreground)]">
          {item.title}
        </p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--muted-foreground)]">
          {item.description}
        </p>
      </div>
    </>
  );

  const className = cn(
    'group flex items-start gap-3.5 rounded-xl px-3 py-3 transition-colors',
    'hover:bg-[color-mix(in_srgb,var(--surface-secondary)_70%,transparent)]',
  );

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noreferrer"
        className={className}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={item.href} className={className}>
      {content}
    </Link>
  );
}

export function ToolsHubPage() {
  const t = useTranslations().tools;
  const { appId } = useCurrentApp();

  const featured: ToolItem[] = [
    {
      title: t.waExplorerTitle,
      description: t.waExplorerDesc,
      href: appWhatsappApiHref(appId, 'try'),
      icon: Play,
    },
    {
      title: t.emailExplorerTitle,
      description: t.emailExplorerDesc,
      href: appEmailApiHref(appId, 'try'),
      icon: Mail,
    },
    {
      title: t.apiKeysTitle,
      description: t.apiKeysDesc,
      href: appApiKeys(appId),
      icon: KeyRound,
    },
  ];

  const other: ToolItem[] = [
    {
      title: t.waDocsTitle,
      description: t.waDocsDesc,
      href: appWhatsappApi(appId),
      icon: MessageSquare,
    },
    {
      title: t.emailDocsTitle,
      description: t.emailDocsDesc,
      href: appEmailApi(appId),
      icon: BookOpen,
    },
    {
      title: t.webhooksTitle,
      description: t.webhooksDesc,
      href: appWhatsappHref(appId, 'webhooks'),
      icon: Webhook,
    },
    {
      title: t.formsTitle,
      description: t.formsDesc,
      href: appForms(appId),
      icon: FormInput,
    },
    {
      title: t.analyticsTitle,
      description: t.analyticsDesc,
      href: appAnalytics(appId),
      icon: BarChart3,
    },
    {
      title: t.docsHubTitle,
      description: t.docsHubDesc,
      href: DOCUMENTATION_BASE,
      icon: BookOpen,
      external: true,
    },
  ];

  const products: ToolItem[] = [
    {
      title: t.waBusinessTitle,
      description: t.waBusinessDesc,
      href: appWhatsapp(appId),
      icon: MessageSquare,
    },
    {
      title: t.productsTitle,
      description: t.productsDesc,
      href: appProducts(appId),
      icon: Package,
    },
    {
      title: t.walletTitle,
      description: t.walletDesc,
      href: appWallet(appId),
      icon: Wallet,
    },
    {
      title: t.settingsTitle,
      description: t.settingsDesc,
      href: appSettings(appId),
      icon: Settings,
    },
  ];

  return (
    <div className="dashboard-section-stack">
      <DashboardPageHeader
        className="mb-0"
        title={t.title}
        description={t.subtitle}
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          {t.featuredTitle}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((item) => (
            <FeaturedToolCard key={item.href} item={item} />
          ))}
        </div>
      </section>

      <section className="dashboard-panel space-y-2 p-3 sm:p-4">
        <h2 className="px-3 pt-1 text-sm font-semibold text-[var(--foreground)]">
          {t.otherTitle}
        </h2>
        <div className="grid gap-0.5 sm:grid-cols-2">
          {other.map((item) => (
            <ToolRow key={item.href + item.title} item={item} />
          ))}
        </div>
      </section>

      <section className="dashboard-panel space-y-2 p-3 sm:p-4">
        <h2 className="px-3 pt-1 text-sm font-semibold text-[var(--foreground)]">
          {t.productTitle}
        </h2>
        <div className="grid gap-0.5 sm:grid-cols-2">
          {products.map((item) => (
            <ToolRow key={item.href} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
