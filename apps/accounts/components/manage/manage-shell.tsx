"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { switchLocale } from "@/lib/switch-locale";
import { useManage } from "@/lib/manage/context";
import {
  SIDEBAR_NAV,
  getManageMobileBackHref,
  isManageHub,
  shouldShowMobileBack,
} from "@/lib/manage/nav";
import { ManageDashboardNav } from "./manage-dashboard-nav";
import { ManageMobileBack } from "./manage-mobile-back";
import { ManageMobileTabBar } from "./manage-mobile-tab-bar";
import { ManageSidebarItem, ManageSidebarCompletion, ui } from "./manage-ui";
import { ThemeToggle } from "@/components/theme-toggle";
import { WorkspaceSwitcher } from "./workspace-switcher";

interface ManageShellProps {
  children: React.ReactNode;
}

export function ManageShell({ children }: ManageShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Manage");
  const tCommon = useTranslations("Common");
  const { user, profile, signOut, incomingInvitationsCount } = useManage();
  const [loggingOut, setLoggingOut] = React.useState(false);

  const isVerified = Boolean(profile?.isRuknyVerified);
  const displayName =
    (isVerified && profile?.verifiedDisplayName) ||
    profile?.profile?.name ||
    user.name ||
    t("default_name");
  const initials = displayName.charAt(0).toUpperCase();
  const avatar = profile?.profile?.avatar || user.avatar;

  const toggleLocale = () => {
    switchLocale(locale, router);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
  };

  const navProps = {
    locale,
    onToggleLocale: toggleLocale,
    onLogout: handleLogout,
    loggingOut,
    logoutLabel: t("logout"),
    avatar,
    initials,
  };

  const mobileBackHref = getManageMobileBackHref(pathname);

  return (
    <div className={cn("min-h-dvh text-foreground", ui.canvas)}>
      <a
        href="#manage-main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        {tCommon("skip_to_content")}
      </a>
      <div className="mx-auto flex w-full max-w-5xl">
        <aside
          className={cn(
            "sticky top-0 z-30 hidden h-dvh w-[280px] shrink-0 flex-col ml-6 self-start overflow-y-auto border-s border-border/60 py-6 ps-6 lg:flex",
            "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
          )}
        >
          <div className="mb-6 px-3">
            <span className="text-lg font-normal text-foreground">{t("title")}</span>
          </div>

          <div className="mb-4 px-3">
            <WorkspaceSwitcher currentUserId={user.id} />
          </div>

          <nav className="flex flex-col gap-0.5">
            {SIDEBAR_NAV.map((item) => {
              const active =
                item.href === "/manage"
                  ? isManageHub(pathname)
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const badge =
                item.id === "team" && incomingInvitationsCount > 0
                  ? incomingInvitationsCount
                  : undefined;
              return (
                <ManageSidebarItem
                  key={item.id}
                  href={item.href}
                  icon={item.icon}
                  label={t(item.labelKey)}
                  active={active}
                  tone={item.tone}
                  badge={badge}
                />
              );
            })}
          </nav>

          <ManageSidebarCompletion />

          <div className="mt-auto flex flex-wrap items-center gap-2 px-3 pt-6">
            <ThemeToggle
              labelLight={t("theme_light")}
              labelDark={t("theme_dark")}
            />
            <button
              type="button"
              onClick={toggleLocale}
              className="rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/80"
            >
              {locale === "ar" ? "English" : "العربية"}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/80 disabled:opacity-50"
            >
              <LogOut className="size-3.5" />
              {loggingOut ? "…" : t("logout")}
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <ManageDashboardNav {...navProps} />

          <main id="manage-main" className="px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] lg:px-8 lg:py-6 lg:pb-12">
            <div className="mx-auto w-full max-w-[720px] space-y-1">
              {shouldShowMobileBack(pathname) && mobileBackHref && (
                <ManageMobileBack href={mobileBackHref} />
              )}
              {children}
            </div>
          </main>
        </div>
      </div>

      <ManageMobileTabBar
        locale={locale}
        onToggleLocale={toggleLocale}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />
    </div>
  );
}
