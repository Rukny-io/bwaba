'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Receipt,
  ChevronDown,
  PlusCircle,
  BookOpen,
  ClipboardList,
  Mail,
  MessageCircle,
  Wallet,
  Check,
  LifeBuoy,
} from 'lucide-react';
import { SupportCreateTicketDialog } from '@/components/support/support-create-ticket-dialog';
import { Dropdown } from '@heroui/react';
import { useCurrentApp } from '@/components/providers/app-context';
import { useTranslations } from '@/components/providers/translations-provider';
import { cn } from '@/lib/utils';
import { WorkspaceSwitcher } from '@/components/workspace/workspace-switcher';
import type { AccessibleWorkspace } from '@/lib/workspace';
import {
  dashboardTopTabsChipClass,
  dashboardTopTabsGlassClass,
} from '@/components/app/nav-glass';
import { useMasterWallet } from '@/hooks/use-wallet';
import { formatIqd } from '@/lib/wallet-format';
import {
  appTools,
  appWallet,
  appWalletInvoices,
  appWalletTopUp,
} from '@/lib/app-routes';
import { DOCUMENTATION_BASE } from '@/lib/documentation-nav';
import { usesBottomIslandNav } from '@/lib/portal-island-nav';

export function HeaderTopBar({
  workspaces,
  currentUserId,
}: {
  avatarUrl?: string | null;
  userName?: string | null;
  workspaces?: AccessibleWorkspace[];
  currentUserId?: string;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const { appId } = useCurrentApp();
  const walletHref = appWallet(appId);
  const walletTopUpHref = appWalletTopUp(appId);
  const walletInvoicesHref = appWalletInvoices(appId);
  const toolsHref = appTools(appId);
  const appsActive =
    pathname === '/apps' ||
    pathname === '/apps/creation' ||
    pathname.startsWith('/apps/creation/');
  const toolsActive =
    pathname === toolsHref || pathname.startsWith(`${toolsHref}/`);
  const walletActive =
    pathname === walletHref || pathname.startsWith(`${walletHref}/`);
  const { data: wallet } = useMasterWallet();
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [supportMenuOpen, setSupportMenuOpen] = useState(false);
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);

  const balanceLabel = formatIqd(wallet?.balance ?? 0, t.dashboard.iqd);

  const chipTriggerClass = cn(dashboardTopTabsChipClass, 'gap-1 outline-none');

  if (usesBottomIslandNav(pathname)) {
    return null;
  }

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 hidden justify-center bg-transparent px-3 pt-3 pb-2 sm:flex sm:px-5 sm:pt-4">
      <nav
        aria-label={t.topbar.myApps}
        className={cn(
          'pointer-events-auto inline-flex w-auto max-w-full cursor-pointer items-center gap-0.5 p-1 sm:gap-1 sm:p-1.5',
          dashboardTopTabsGlassClass,
          '![overflow:visible]',
        )}
      >
        {workspaces && workspaces.length > 1 && currentUserId ? (
          <WorkspaceSwitcher
            workspaces={workspaces}
            currentUserId={currentUserId}
            triggerClassName={chipTriggerClass}
          />
        ) : null}

        <Link
          href="/apps"
          aria-current={appsActive ? 'page' : undefined}
          className={cn(dashboardTopTabsChipClass, 'hidden sm:inline-flex')}
        >
          {t.topbar.myApps}
        </Link>

        <Link
          href={toolsHref}
          aria-current={toolsActive ? 'page' : undefined}
          className={cn(dashboardTopTabsChipClass, 'hidden lg:inline-flex')}
        >
          {t.topbar.tools}
        </Link>

        <Link
          href={walletHref}
          aria-current={walletActive ? 'page' : undefined}
          className={cn(dashboardTopTabsChipClass, 'hidden sm:inline-flex')}
        >
          {t.topbar.wallet}
        </Link>

        <Dropdown>
          <Dropdown.Trigger className={cn(chipTriggerClass, 'hidden lg:inline-flex')}>
            {t.topbar.docs}
            <ChevronDown size={14} className="opacity-70" />
          </Dropdown.Trigger>
          <Dropdown.Popover
            placement="bottom start"
            offset={8}
            className="dashboard-top-tabs-popover min-w-[14rem]"
          >
            <Dropdown.Menu>
              <Dropdown.Item
                id="doc-email"
                textValue={t.topbar.docEmailApi}
                href={`${DOCUMENTATION_BASE}/email-api`}
                className="gap-2"
              >
                <Mail className="size-4 shrink-0" />
                {t.topbar.docEmailApi}
              </Dropdown.Item>
              <Dropdown.Item
                id="doc-forms"
                textValue={t.topbar.docForms}
                href={`${DOCUMENTATION_BASE}/forms`}
                className="gap-2"
              >
                <ClipboardList className="size-4 shrink-0" />
                {t.topbar.docForms}
              </Dropdown.Item>
              <Dropdown.Item
                id="doc-whatsapp"
                textValue={t.topbar.docWhatsappApi}
                href={`${DOCUMENTATION_BASE}/whatsapp-api`}
                className="gap-2"
              >
                <MessageCircle className="size-4 shrink-0" />
                {t.topbar.docWhatsappApi}
              </Dropdown.Item>
              <Dropdown.Item
                id="doc-all"
                textValue={t.topbar.docAll}
                href={DOCUMENTATION_BASE}
                className="gap-2"
              >
                <BookOpen className="size-4 shrink-0" />
                {t.topbar.docAll}
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>

        <Dropdown isOpen={supportMenuOpen} onOpenChange={setSupportMenuOpen}>
          <Dropdown.Trigger className={cn(chipTriggerClass, 'hidden lg:inline-flex')}>
            {t.topbar.support}
            <ChevronDown size={14} className="opacity-70" />
          </Dropdown.Trigger>
          <Dropdown.Popover
            placement="bottom start"
            offset={8}
            className="dashboard-top-tabs-popover min-w-[14rem]"
          >
            <Dropdown.Menu
              onAction={(key) => {
                if (key === 'create-ticket') {
                  setSupportMenuOpen(false);
                  setSupportDialogOpen(true);
                }
              }}
            >
              <Dropdown.Item
                id="create-ticket"
                textValue={t.topbar.createSupportTicket}
                className="gap-2"
              >
                <LifeBuoy className="size-4 shrink-0" />
                {t.topbar.createSupportTicket}
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>

        <SupportCreateTicketDialog
          open={supportDialogOpen}
          onOpenChange={setSupportDialogOpen}
          appId={appId}
        />

        <Dropdown isOpen={walletMenuOpen} onOpenChange={setWalletMenuOpen}>
          <Dropdown.Trigger
            className={cn(chipTriggerClass, 'max-w-[11rem] sm:max-w-none')}
          >
            <span
              className="truncate sm:hidden"
              dir="ltr"
              lang="en"
            >
              {balanceLabel}
            </span>
            <span className="hidden min-w-0 max-w-full items-center gap-1 truncate sm:inline-flex">
              <span className="truncate">{t.topbar.walletBalance}:</span>
              <span
                className="shrink-0 whitespace-nowrap tabular-nums [unicode-bidi:isolate]"
                dir="ltr"
                lang="en"
              >
                {balanceLabel}
              </span>
            </span>
            <ChevronDown size={14} className="shrink-0 opacity-70" />
          </Dropdown.Trigger>
          <Dropdown.Popover
            placement="bottom end"
            offset={8}
            className="dashboard-top-tabs-popover min-w-[13rem]"
          >
            <Dropdown.Menu
              onAction={(key) => {
                if (key === 'open-wallet') {
                  setWalletMenuOpen(false);
                  if (!walletActive) {
                    router.push(walletHref);
                  }
                  return;
                }
                if (key === 'top-up') {
                  setWalletMenuOpen(false);
                  router.push(walletTopUpHref);
                }
              }}
            >
              <Dropdown.Item
                id="open-wallet"
                textValue={walletActive ? t.topbar.wallet : t.topbar.openWallet}
                className="gap-2"
              >
                <Wallet className="size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">
                  {walletActive ? t.topbar.wallet : t.topbar.openWallet}
                </span>
                {walletActive ? (
                  <Check className="size-4 shrink-0 text-[var(--primary)]" aria-hidden />
                ) : null}
              </Dropdown.Item>
              <Dropdown.Item
                id="top-up"
                textValue={t.topbar.topUp}
                className="gap-2"
              >
                <PlusCircle className="size-4 shrink-0" />
                {t.topbar.topUp}
              </Dropdown.Item>
              <Dropdown.Item
                id="invoices"
                textValue={t.topbar.viewInvoices}
                href={walletInvoicesHref}
                className="gap-2"
              >
                <Receipt className="size-4 shrink-0" />
                {t.topbar.viewInvoices}
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </nav>
    </header>
  );
}
