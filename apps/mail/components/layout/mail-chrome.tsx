import { Suspense, type ReactNode } from "react";
import { MailChromeShell } from "@/components/layout/mail-chrome-shell";
import { MailSidebar } from "@/components/layout/mail-sidebar";
import { getCurrentMailUser } from "@/lib/current-user";

async function MailSidebarUser() {
  const user = await getCurrentMailUser();
  return <MailSidebar avatarUrl={user?.avatar} userName={user?.name} />;
}

export function MailChrome({
  children,
  layout = "fill",
}: {
  children: ReactNode;
  layout?: "fill" | "page";
}) {
  return (
    <MailChromeShell
      layout={layout}
      sidebar={
        <Suspense fallback={<MailSidebar />}>
          <MailSidebarUser />
        </Suspense>
      }
    >
      {children}
    </MailChromeShell>
  );
}
