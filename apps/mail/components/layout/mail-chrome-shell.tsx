"use client";

import type { ReactNode } from "react";
import { MailHeader } from "@/components/layout/mail-header";
import { MailMobileDock } from "@/components/layout/mail-mobile-dock";
import { MailNavPendingProvider } from "@/components/layout/mail-nav-pending";
import { MailPageFrame } from "@/components/layout/mail-page-frame";

export function MailChromeShell({
  children,
  layout = "fill",
  sidebar,
}: {
  children: ReactNode;
  layout?: "fill" | "page";
  sidebar: ReactNode;
}) {
  const page = layout === "page";

  return (
    <MailNavPendingProvider>
      <div className="flex h-dvh flex-col bg-[var(--background)]">
        <div className="flex min-h-0 flex-1">
          {sidebar}
          <div className="relative flex min-w-0 flex-1 flex-col sm:ml-[82px]">
            <MailHeader />
            <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
              <main
                className={
                  page
                    ? "min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
            <MailMobileDock />
          </div>
        </div>
      </div>
    </MailNavPendingProvider>
  );
}
