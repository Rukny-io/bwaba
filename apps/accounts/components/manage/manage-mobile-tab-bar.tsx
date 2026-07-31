"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Home,
  User,
  ShieldCheck,
  CreditCard,
  MoreHorizontal,
  BadgeCheck,
  Blocks,
  LogOut,
  Languages,
  LifeBuoy,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getMobileTabId, MOBILE_TAB_NAV } from "@/lib/manage/nav";
import { ManageGroup, ManageListItem } from "./manage-ui";
import { ThemeToggle } from "@/components/theme-toggle";

interface ManageMobileTabBarProps {
  locale: string;
  onToggleLocale: () => void;
  onLogout: () => void;
  loggingOut: boolean;
}

export function ManageMobileTabBar({
  locale,
  onToggleLocale,
  onLogout,
  loggingOut,
}: ManageMobileTabBarProps) {
  const pathname = usePathname();
  const t = useTranslations("Manage");
  const [moreOpen, setMoreOpen] = useState(false);
  const activeTab = getMobileTabId(pathname);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const iconFor = (id: string) => {
    switch (id) {
      case "overview":
        return Home;
      case "personal-info":
        return User;
      case "verified":
        return BadgeCheck;
      case "security":
        return ShieldCheck;
      case "billing":
        return CreditCard;
      case "support":
        return LifeBuoy;
      default:
        return MoreHorizontal;
    }
  };

  return (
    <>
      {moreOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          aria-label={t("cancel")}
          onClick={() => setMoreOpen(false)}
        />
      )}

      {moreOpen && (
        <div className="fixed inset-x-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-50 lg:hidden">
          <ManageGroup>
            <ManageListItem
              icon={Users}
              tone="blue"
              title={t("nav.team")}
              href="/manage/team"
            />
            <ManageListItem
              icon={Blocks}
              tone="orange"
              title={t("nav.linked_apps")}
              href="/manage/linked-apps"
            />
            <ManageListItem
              icon={LifeBuoy}
              tone="teal"
              title={t("nav.support")}
              href="/manage/support"
            />
            <div className="flex w-full items-center gap-3 border-b border-border/80 px-4 py-3.5 last:border-b-0">
              <ThemeToggle
                labelLight={t("theme_light")}
                labelDark={t("theme_dark")}
              />
              <span className="text-sm font-medium text-foreground">
                {t("theme_appearance")}
              </span>
            </div>
            <button
              type="button"
              onClick={onToggleLocale}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-start transition-colors hover:bg-muted/40 border-b border-border/80 last:border-b-0"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Languages className="size-[18px]" strokeWidth={1.75} />
              </div>
              <span className="text-sm font-medium">
                {locale === "ar" ? t("mobile_tabs.switch_en") : t("mobile_tabs.switch_ar")}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                onLogout();
              }}
              disabled={loggingOut}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-start text-destructive transition-colors hover:bg-destructive/5 disabled:opacity-50"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-400">
                <LogOut className="size-[18px]" strokeWidth={1.75} />
              </div>
              <span className="text-sm font-medium">
                {loggingOut ? t("logging_out") : t("logout")}
              </span>
            </button>
          </ManageGroup>
        </div>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-card/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label={t("mobile_tabs.label")}
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around overflow-x-auto px-1 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {MOBILE_TAB_NAV.map((tab) => {
            const Icon = iconFor(tab.id);
            const isMore = tab.id === "more";
            const active = isMore ? moreOpen || activeTab === "more" : activeTab === tab.id;

            if (isMore) {
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMoreOpen((open) => !open)}
                  className={cn(
                    "flex min-h-11 min-w-[3.25rem] shrink-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                  <span className="truncate">{t(tab.labelKey)}</span>
                </button>
              );
            }

            return (
              <Link
                key={tab.id}
                href={tab.href!}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  "flex min-h-11 min-w-[3.25rem] shrink-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" strokeWidth={1.75} />
                <span className="truncate">{t(tab.labelKey)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
