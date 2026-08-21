import { Suspense, type ReactNode } from "react";
import { MailHeader } from "@/components/layout/mail-header";
import { MailMobileDock } from "@/components/layout/mail-mobile-dock";
import { MailPageFrame } from "@/components/layout/mail-page-frame";
import { MailSidebar } from "@/components/layout/mail-sidebar";
import { getCurrentMailUser } from "@/lib/current-user";

export async function MailChrome({
  children,
  layout = "fill",
}: {
  children: ReactNode;
  layout?: "fill" | "page";
}) {
  const user = await getCurrentMailUser();
  const page = layout === "page";

  return (
    <div className="flex h-dvh flex-col bg-[var(--background)]">
      <div className="flex min-h-0 flex-1">
        <MailSidebar avatarUrl={user?.avatar} userName={user?.name} />
        <div className="relative flex min-w-0 flex-1 flex-col sm:ml-[82px]">
          <Suspense fallback={null}>
            <MailHeader />
          </Suspense>
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
            <main
              className={
                page
                  ? "min-h-0 flex-1 overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  : "min-h-0 flex-1 overflow-hidden"
              }
            >
              {page ? (
                <MailPageFrame>{children}</MailPageFrame>
              ) : (
                <div className="relative flex h-full min-h-0 w-full flex-1 flex-col px-2 pb-20 pt-[3.5rem] sm:px-3 sm:pb-3 sm:pt-[4.25rem]">
                  {children}
                </div>
              )}
            </main>
          </div>
          <Suspense fallback={null}>
            <MailMobileDock />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
