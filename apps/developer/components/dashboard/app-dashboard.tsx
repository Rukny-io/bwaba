'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  KeyRound,
  Link2,
  Wallet,
  BookOpen,
  Activity,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  FileText,
} from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { useCurrentApp } from '@/components/providers/app-context';
import { useAppDashboard } from '@/hooks/use-app-dashboard';
import { DashboardGrid } from '@/components/dashboard/dashboard-ui';
import { DashboardMetricCard } from '@/components/dashboard/dashboard-metric-card';
import {
  appApiKeys,
  appWhatsappApi,
  appForms,
  appWallet,
  appWhatsapp,
} from '@/lib/app-routes';
import { cn } from '@/lib/utils';

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatBalance(value: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value);
}

type QuickActionVariant = 'primary' | 'accent' | 'soft';

const iconVariantClass: Record<QuickActionVariant, string> = {
  primary: 'bg-[var(--foreground)] text-[var(--background)]',
  accent:
    'bg-[color-mix(in_srgb,var(--primary)_12%,var(--background))] text-[var(--primary)]',
  soft: 'bg-[var(--surface-secondary)] text-[var(--primary)]',
};

function QuickActionCard({
  href,
  label,
  desc,
  icon: Icon,
  variant,
  isRtl,
}: {
  href: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  variant: QuickActionVariant;
  isRtl: boolean;
}) {
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  return (
    <Link
      href={href}
      className="dashboard-card dashboard-card-interactive group flex h-full flex-col rounded-2xl p-3.5 sm:rounded-3xl sm:p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-[1.03]',
            iconVariantClass[variant],
          )}
        >
          <Icon size={18} strokeWidth={1.8} />
        </div>
        <Arrow
          size={15}
          className={cn(
            'mt-0.5 shrink-0 text-[var(--muted-foreground)] transition-all duration-200',
            isRtl
              ? 'opacity-60 group-hover:-translate-x-0.5 group-hover:opacity-100'
              : 'opacity-60 group-hover:translate-x-0.5 group-hover:opacity-100',
          )}
        />
      </div>

      <div className="mt-3 min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]">
          {label}
        </h3>
        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[var(--muted-foreground)] sm:text-xs">
          {desc}
        </p>
      </div>
    </Link>
  );
}

interface AppDashboardProps {
  publicAppId: string;
  internalAppId: string;
}

export function AppDashboard({
  publicAppId,
  internalAppId,
}: AppDashboardProps) {
  const t = useTranslations();
  const d = t.dashboard;
  const isRtl = t.common.switchLang === 'English';
  const Arrow = isRtl ? ArrowLeft : ArrowRight;
  const { app } = useCurrentApp();

  const { data, isLoading } = useAppDashboard(
    publicAppId,
    internalAppId,
  );

  const statPlaceholder = isLoading ? '…' : '—';

  const apiRequests = data
    ? formatCount(data.totalRequests)
    : statPlaceholder;

  const activeKeys = data
    ? formatCount(data.activeKeysCount)
    : statPlaceholder;

  const walletBalance = data?.wallet
    ? formatBalance(data.wallet.balance)
    : statPlaceholder;

  const integrationCount = data
    ? formatCount(data.accounts.length + (data.formsSummary?.linkedCount ?? 0))
    : statPlaceholder;

  const quickActions: {
    href: string;
    label: string;
    desc: string;
    icon: LucideIcon;
    variant: QuickActionVariant;
  }[] = [
    {
      href: appApiKeys(publicAppId),
      label: d.actionKeys,
      desc: d.actionKeysDesc,
      icon: KeyRound,
      variant: 'primary',
    },
    {
      href: appForms(publicAppId),
      label: d.actionForms,
      desc: d.actionFormsDesc,
      icon: FileText,
      variant: 'accent',
    },
    {
      href: appWhatsapp(publicAppId),
      label: d.actionIntegrations,
      desc: d.actionIntegrationsDesc,
      icon: Link2,
      variant: 'soft',
    },
    {
      href: appWallet(publicAppId),
      label: d.actionWallet,
      desc: d.actionWalletDesc,
      icon: Wallet,
      variant: 'accent',
    },
    {
      href: appWhatsappApi(publicAppId),
      label: d.actionDocs,
      desc: d.actionDocsDesc,
      icon: BookOpen,
      variant: 'soft',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <Link
        href={appApiKeys(publicAppId)}
        className="dashboard-card dashboard-card-interactive group flex items-center gap-3 rounded-2xl p-4 sm:gap-4 sm:rounded-3xl sm:p-5"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_12%,var(--background))] text-[var(--primary)]">
          <Sparkles size={18} strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)]">
            {d.quickStart}
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--muted-foreground)] sm:text-[13px]">
            {d.quickStartDesc}
          </p>
  
        </div>
        <Arrow
          size={16}
          className={cn(
            'shrink-0 text-[var(--muted-foreground)] transition-transform duration-200',
            isRtl ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5',
          )}
        />
      </Link>

      <section>
        <DashboardGrid>
          <DashboardMetricCard
            icon={Activity}
            label={d.apiRequests}
            value={isLoading ? statPlaceholder : apiRequests}
            comparisonPrimary={d.allTime}
          />
          <DashboardMetricCard
            icon={Link2}
            label={d.integrations}
            value={isLoading ? statPlaceholder : integrationCount}
            comparisonPrimary={d.connected}
          />
          <DashboardMetricCard
            icon={KeyRound}
            label={d.apiKeys}
            value={isLoading ? statPlaceholder : activeKeys}
            comparisonPrimary={d.active}
          />
          <DashboardMetricCard
            icon={Wallet}
            label={t.topbar.walletBalance}
            value={isLoading ? statPlaceholder : walletBalance}
            comparisonPrimary={d.iqd}
          />
        </DashboardGrid>
      </section>

      <section className="space-y-3 sm:space-y-4">
        <div className="px-0.5">
          <h2 className="text-sm font-semibold text-[var(--foreground)] sm:text-base">
            {d.quickActions}
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {quickActions.map((action) => (
            <QuickActionCard
              key={action.href}
              {...action}
              isRtl={isRtl}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
