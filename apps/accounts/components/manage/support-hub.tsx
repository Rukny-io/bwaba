"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { fetchSupportOpenCount } from "@/lib/manage/api";
import { SUPPORT_NAV } from "@/lib/manage/nav";
import {
  ManageGroup,
  ManageListItem,
  ManagePageHeader,
  ManagePageStack,
} from "./manage-ui";

export function SupportHub() {
  const router = useRouter();
  const t = useTranslations("Manage");
  const [openCount, setOpenCount] = useState<number | null>(null);

  useEffect(() => {
    fetchSupportOpenCount()
      .then((data) => setOpenCount(data.openCount))
      .catch(() => setOpenCount(null));
  }, []);

  const subtitleFor = (id: string, defaultDesc: string) => {
    if (id === "tickets" && openCount !== null && openCount > 0) {
      return `${defaultDesc} · ${openCount}`;
    }
    return defaultDesc;
  };

  return (
    <ManagePageStack>
      <ManagePageHeader
        title={t("support.title")}
        titleShort={t("nav.support_short")}
        description={t("support.description")}
      />

      <ManageGroup>
        {SUPPORT_NAV.map((item) => {
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

      <ManageGroup className="space-y-2 p-4">
        <p className="text-sm font-medium text-foreground">{t("support.contact_title")}</p>
        <p className="text-pretty text-sm text-muted-foreground">
          {t("support.contact_desc")}
        </p>
        <a
          href="mailto:support@rukny.io"
          className="inline-block text-sm font-medium text-primary hover:underline"
          dir="ltr"
        >
          support@rukny.io
        </a>
      </ManageGroup>
    </ManagePageStack>
  );
}
