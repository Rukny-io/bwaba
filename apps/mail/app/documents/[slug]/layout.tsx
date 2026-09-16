import type { ReactNode } from "react";
import { MailDocsSidebar } from "@/components/documents/mail-docs-sidebar";

export default function DocumentSlugLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-start lg:gap-12 lg:py-12">
      <MailDocsSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
