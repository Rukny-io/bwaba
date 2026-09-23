import type { ReactNode } from "react";
import { MailChromeShell } from "@/components/layout/mail-chrome-shell";
import { MailSidebar } from "@/components/layout/mail-sidebar";

/**
 * Keep this layout tree free of async server data (e.g. auth/me).
 * Otherwise every soft navigation re-waits on the sidebar user fetch
 * before the clicked section can appear.
 */
export function MailChrome({
  children,
  layout = "fill",
}: {
  children: ReactNode;
  layout?: "fill" | "page";
}) {
  return (
    <MailChromeShell layout={layout} sidebar={<MailSidebar />}>
      {children}
    </MailChromeShell>
  );
}
