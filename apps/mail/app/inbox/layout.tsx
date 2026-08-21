import type { ReactNode } from "react";

/** Full-viewport webmail — no product chrome. */
export default function InboxLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-dvh max-h-dvh w-full overflow-hidden bg-white dark:bg-[var(--background)]">
      {children}
    </div>
  );
}
