"use client";

import { usePathname } from "next/navigation";
import { ComingSoonPanel } from "@/components/app/coming-soon-panel";
import {
  MAIL_HEADER_TOOL_NAV,
  MAIL_PRIMARY_NAV,
  MAIL_SECONDARY_NAV,
  MAIL_UNPUBLISHED_NAV,
} from "@/lib/mail-nav";
import { stripMailSlotPrefix } from "@/lib/mail-slot";

export default function EmptyPage() {
  const pathname = usePathname();
  const path = stripMailSlotPrefix(pathname).replace(/\/$/, "") || "/";
  const label =
    [
      ...MAIL_PRIMARY_NAV,
      ...MAIL_SECONDARY_NAV,
      ...MAIL_HEADER_TOOL_NAV,
      ...MAIL_UNPUBLISHED_NAV,
    ].find((item) => item.href === path)?.label ?? "This tool";

  return (
    <ComingSoonPanel
      title={label}
      description="This section is not ready yet. Inbox and mailboxes are available from the sidebar; Domain and Quarantine from the top nav."
    />
  );
}
