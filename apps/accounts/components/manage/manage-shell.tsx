"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useManage } from "@/lib/manage/context";
import {
  SIDEBAR_NAV,
  getManagePageTitleKey,
  isManageHub,
  isSecuritySection,
} from "@/lib/manage/nav";
import { ManageDashboardNav } from "./manage-dashboard-nav";
import { ManageMobileNav } from "./manage-mobile-nav";
import { ManageSidebarItem, ui } from "./manage-ui";

interface ManageShellProps {
  children: React.ReactNode;
}

export function ManageShell({ children }: ManageShellProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("Manage");
  const { user, profile, signOut } = useManage();
  const [loggingOut, setLoggingOut] = React.useState(false);

  const isVerified = Boolean(profile?.isRuknyVerified);
  const displayName =
    (isVerified && profile?.verifiedDisplayName) ||
    profile?.profile?.name ||
    user.name ||
    t("default_name");
  const initials = displayName.charAt(0).toUpperCase();
  const avatar = profile?.profile?.avatar || user.avatar;
  const isRtl = locale === "ar";
  const pageTitleKey = getManagePageTitleKey(pathname);
  const pageTitle = pageTitleKey ? t(pageTitleKey) : t("title");

  const toggleLocale = () => {
    const nextLocale = locale === "ar" ? "en" : "ar";
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000`;
    window.location.reload();
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
  };

  const backHref = isSecuritySection(pathname) && pathname !== "/manage/security"
    ? "/manage/security"
    : "/manage";

  const navProps = {
    pageTitle,
    locale,
    onToggleLocale: toggleLocale,
    onLogout: handleLogout,
    loggingOut,
    logoutLabel: t("logout"),
    avatar,
    initials,
  };

  return (
    <div className={cn("min-h-dvh text-foreground", ui.canvas)}>
      <ManageMobileNav
        {...navProps}
        showBack={!isManageHub(pathname)}
        backHref={backHref}
        backLabel={t("back")}
        isRtl={isRtl}
      />

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

          <nav className="flex flex-col gap-0.5">
            {SIDEBAR_NAV.map((item) => {
              const active =
                item.href === "/manage"
                  ? isManageHub(pathname)
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <ManageSidebarItem
                  key={item.id}
                  href={item.href}
                  icon={item.icon}
                  label={t(item.labelKey)}
                  active={active}
                  tone={item.tone}
                />
              );
            })}
          </nav>

          <div className="mt-auto flex items-center gap-2 px-3 pt-8">
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

          <main className="px-4 py-3 lg:px-6 lg:py-4 lg:pb-10">
            <div className="mx-auto w-full max-w-[720px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
