"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MailTeamPage } from "@/components/app/mail-team-page";
import { ComingSoonPanel } from "@/components/app/coming-soon-panel";
import { parseMailSlot, withMailSlot } from "@/lib/mail-slot";
import { fetchMailSubscription } from "@/lib/mail-subscription-client";

export default function TeamPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<"loading" | "allowed" | "blocked">(
    "loading",
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const snap = await fetchMailSubscription();
        if (cancelled) return;
        const planId = snap.subscription?.planId;
        const consoleSeats =
          snap.subscription?.limits?.consoleMembersIncluded ?? 0;
        const teamOk = planId !== "starter" && consoleSeats > 0;
        if (!teamOk) {
          setState("blocked");
          const slot = parseMailSlot(pathname);
          router.replace(withMailSlot("/billing", slot));
          return;
        }
        setState("allowed");
      } catch {
        if (!cancelled) setState("allowed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (state === "loading" || state === "blocked") {
    return (
      <ComingSoonPanel
        title="Team"
        description={
          state === "blocked"
            ? "Starter does not include Team. Redirecting to Billing…"
            : "Checking your plan…"
        }
      />
    );
  }

  return <MailTeamPage />;
}
