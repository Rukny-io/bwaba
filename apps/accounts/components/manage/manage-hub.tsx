"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  BadgeCheck,
  ShieldAlert,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useManage } from "@/lib/manage/context";
import { getProfileCompletion } from "@/lib/manage/profile-completion";
import { MANAGE_NAV, HUB_GROUPS } from "@/lib/manage/nav";
import {
  ManageGroup,
  ManageIconCircle,
  ManageListItem,
  ManagePageHeader,
  ManagePageStack,
  ManageProfileStrip,
  ManageStat,
} from "./manage-ui";
import { cn } from "@/lib/utils";

type SecurityLevel = "strong" | "medium" | "weak";

function getSecurityLevel(summary: {
  twoFactorEnabled: boolean;
  sessionsCount: number;
}): SecurityLevel {
  if (summary.twoFactorEnabled && summary.sessionsCount <= 3) return "strong";
  if (summary.twoFactorEnabled) return "medium";
  return "weak";
}

export function ManageHub() {
  const router = useRouter();
  const t = useTranslations("Manage");
  const { user, profile, summary } = useManage();

  const isVerified = Boolean(profile?.isRuknyVerified);
  const displayName =
    (isVerified && profile?.verifiedDisplayName) ||
    profile?.profile?.name ||
    user.name ||
    t("default_name");
  const initials = displayName.charAt(0).toUpperCase();
  const avatar = profile?.profile?.avatar || user.avatar;
  const username = profile?.profile?.username || user.username;

  const profileCompletion = profile ? getProfileCompletion(profile) : null;
  const securityLevel = summary ? getSecurityLevel(summary) : null;

  const quickActions = useMemo(() => {
    const actions: {
      href: string;
      icon: typeof UserRound;
      tone: "green" | "blue" | "orange";
      title: string;
      subtitle: string;
    }[] = [];

    if (profileCompletion && !profileCompletion.isComplete) {
      actions.push({
        href: "/manage/personal-info",
        icon: UserRound,
        tone: "green",
        title: t("hub.complete_profile"),
        subtitle: t("hub.complete_profile_desc"),
      });
    }

    if (!isVerified) {
      actions.push({
        href: "/manage/verified",
        icon: BadgeCheck,
        tone: "blue",
        title: t("hub.get_verified"),
        subtitle: t("hub.get_verified_desc"),
      });
    }

    if (summary && !summary.twoFactorEnabled) {
      actions.push({
        href: "/manage/security/two-factor",
        icon: ShieldCheck,
        tone: "orange",
        title: t("hub.security_tip_title"),
        subtitle: t("hub.security_tip_desc"),
      });
    }

    return actions.slice(0, 3);
  }, [profileCompletion, isVerified, summary, t]);

  const subtitleFor = (id: string, defaultDesc: string) => {
    if (!summary) return defaultDesc;
    if (id === "security") {
      return summary.twoFactorEnabled
        ? `${defaultDesc} · ${t("stats.two_factor")} ${t("stats.on")}`
        : `${defaultDesc} · ${t("stats.two_factor")} ${t("stats.off")}`;
    }
    if (id === "billing") return `${defaultDesc} · ${summary.plan}`;
    return defaultDesc;
  };

  const securityLabel =
    securityLevel === "strong"
      ? t("hub.security_strong")
      : securityLevel === "medium"
        ? t("hub.security_medium")
        : t("hub.security_weak");

  const securityTone =
    securityLevel === "strong"
      ? "text-emerald-600 dark:text-emerald-400"
      : securityLevel === "medium"
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  return (
    <ManagePageStack>
      <ManageProfileStrip
        avatar={avatar}
        initials={initials}
        name={displayName}
        email={user.email}
        username={username}
        verified={isVerified}
        onAvatarClick={() => router.push("/manage/personal-info")}
      />

      <ManagePageHeader
        title={t("hub.title")}
        description={t("hub.description")}
        className="hidden lg:block"
      />

      {summary && securityLevel && (
        <Link
          href="/manage/security"
          className={cn(
            "flex items-center justify-between gap-3 rounded-[20px] border border-border/40 bg-card px-4 py-3 transition-colors hover:bg-muted/30",
          )}
        >
          <div className="flex items-center gap-3">
            <ManageIconCircle icon={ShieldCheck} tone="blue" />
            <div>
              <p className="text-sm font-medium text-foreground">{t("hub.security_score")}</p>
              <p className={cn("text-xs font-medium", securityTone)}>{securityLabel}</p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">{t("nav.security_short")}</span>
        </Link>
      )}

      {summary && !summary.twoFactorEnabled && (
        <Link
          href="/manage/security/two-factor"
          className={cn(
            "flex w-full items-center gap-3 rounded-[20px] border border-amber-500/25",
            "bg-amber-50/80 px-4 py-3 text-start transition-colors hover:bg-amber-50",
            "dark:bg-amber-950/20 dark:hover:bg-amber-950/30",
          )}
        >
          <ManageIconCircle icon={ShieldAlert} tone="orange" className="size-9" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{t("hub.security_tip_title")}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("hub.security_tip_desc")}</p>
          </div>
        </Link>
      )}

      {quickActions.length > 0 && (
        <div>
          <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">
            {t("hub.quick_actions")}
          </p>
          <ManageGroup>
            {quickActions.map((action) => (
              <ManageListItem
                key={action.href}
                icon={action.icon}
                tone={action.tone}
                title={action.title}
                subtitle={action.subtitle}
                href={action.href}
              />
            ))}
          </ManageGroup>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <ManageStat
            label={t("stats.plan")}
            value={summary.plan}
            href="/manage/billing"
          />
          <ManageStat
            label={t("stats.sessions")}
            value={String(summary.sessionsCount)}
            href="/manage/security/sessions"
          />
          <ManageStat
            label={t("stats.two_factor_short")}
            value={summary.twoFactorEnabled ? t("stats.on") : t("stats.off")}
            highlight={!summary.twoFactorEnabled}
            href="/manage/security/two-factor"
          />
          <ManageStat
            label={t("stats.sign_in_methods")}
            value={String(summary.linkedMethodsCount)}
            href="/manage/security/sign-in-methods"
          />
        </div>
      )}

      {HUB_GROUPS.map((group) => {
        const items = MANAGE_NAV.filter((item) => group.itemIds.includes(item.id));
        if (items.length === 0) return null;

        return (
          <div key={group.id}>
            <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">
              {t(group.labelKey)}
            </p>
            <ManageGroup>
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <ManageListItem
                    key={item.href}
                    icon={Icon}
                    tone={item.tone}
                    title={t(item.labelKey)}
                    subtitle={subtitleFor(item.id, t(item.descKey))}
                    href={item.href}
                  />
                );
              })}
            </ManageGroup>
          </div>
        );
      })}
    </ManagePageStack>
  );
}
