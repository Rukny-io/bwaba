import type { ReactNode } from "react";

export function MailPageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl px-4 pt-4 pb-24 sm:px-5 sm:pt-16 sm:pb-6 md:px-6">
      {children}
    </div>
  );
}
