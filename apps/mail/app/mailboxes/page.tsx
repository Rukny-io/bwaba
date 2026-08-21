"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { parseMailSlot, withMailSlot } from "@/lib/mail-slot";

/** Sidebar "Mailboxes" lands on the /app overview. */
export default function MailboxesPage() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const slot = parseMailSlot(pathname);
    router.replace(withMailSlot("/app", slot));
  }, [pathname, router]);

  return <div className="min-h-[40vh] bg-[var(--background)]" />;
}
