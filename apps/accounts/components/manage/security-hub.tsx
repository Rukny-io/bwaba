"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useManage } from "@/lib/manage/context";
import { SECURITY_NAV } from "@/lib/manage/nav";
import {
  ManageGroup,
  ManageListItem,
  ManagePageHeader,
  ManagePageStack,
} from "./manage-ui";

export function SecurityHub() {
  const router = useRouter();
  const t = useTranslations("Manage");
  const { summary } = useManage();

  const subtitleFor = (id: string, defaultDesc: string) => {
    if (!summary) return defaultDesc;
    if (id === "two-factor") {
      return summary.twoFactorEnabled
        ? `${defaultDesc} · ${t("badges.enabled")}`
        : `${defaultDesc} · ${t("badges.disabled")}`;
    }
    if (id === "sessions" && summary.sessionsCount > 0) {
      return `${defaultDesc} · ${summary.sessionsCount}`;
    }
    return defaultDesc;
  };

  return (
    <ManagePageStack>
      <ManagePageHeader
        title={t("security.title")}
        description={t("security.description")}
      />

      <ManageGroup>
        {SECURITY_NAV.map((item) => {
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
    </ManagePageStack>
  );
}
