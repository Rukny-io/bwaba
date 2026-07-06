"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useManage } from "@/lib/manage/context";
import { MANAGE_NAV, HUB_GROUPS } from "@/lib/manage/nav";
import {
  ManageGroup,
  ManageListItem,
  ManagePageHeader,
  ManagePageStack,
  ManageProfileStrip,
} from "./manage-ui";

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

  const subtitleFor = (id: string, defaultDesc: string) => {
    if (!summary) return defaultDesc;
    if (id === "security") {
      return summary.twoFactorEnabled
        ? `${defaultDesc} · 2FA ${t("stats.on")}`
        : `${defaultDesc} · 2FA ${t("stats.off")}`;
    }
    if (id === "billing") return `${defaultDesc} · ${summary.plan}`;
    return defaultDesc;
  };

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

      {HUB_GROUPS.map((group) => {
        const items = MANAGE_NAV.filter((item) => group.itemIds.includes(item.id));
        if (items.length === 0) return null;

        return (
          <div key={group.id}>
            <p className="mb-2 px-1 text-xs font-medium text-muted-foreground lg:hidden">
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
                    onClick={() => router.push(item.href)}
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
