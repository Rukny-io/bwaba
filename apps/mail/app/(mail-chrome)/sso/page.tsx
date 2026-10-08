"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MailSsoPage } from "@/components/app/mail-sso-page";
import { ComingSoonPanel } from "@/components/app/coming-soon-panel";
import { parseMailSlot, withMailSlot } from "@/lib/mail-slot";
import {
  fetchMailSubscription,
  workspaceActiveLimits,
} from "@/lib/mail-subscription-client";

export default function SsoPage() {
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
        const consoleSeats =
          workspaceActiveLimits(snap)?.limits?.consoleMembersIncluded ?? 0;
        if (consoleSeats <= 0) {
          setState("blocked");
          router.replace(withMailSlot("/billing", parseMailSlot(pathname)));
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

  if (state !== "allowed") {
    return (
      <ComingSoonPanel
        title="SSO"
        description={
          state === "blocked"
            ? "Your current plan does not include team sign-in. Redirecting to Billing…"
            : "Checking your plan…"
        }
      />
    );
  }

  return <MailSsoPage />;
}
