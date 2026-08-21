"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MailMailboxesOverview } from "@/components/app/mail-mailboxes-overview";
import { MailSetupWizard } from "@/components/app/mail-setup-wizard";
import {
  readMailDomainSetup,
  writeMailDomainSetup,
} from "@/lib/mail-domain-storage";
import { readMailAppIdFromDocument } from "@/lib/mail-app-id";
import { restoreDomainSetupRequest } from "@/lib/verify-domain-client";
import type { MailDomainSetup } from "@/lib/mail-domain";

export function MailAppPage() {
  const router = useRouter();
  const [setup, setSetup] = useState<MailDomainSetup | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const appId = readMailAppIdFromDocument();
      if (!appId) {
        window.location.assign("/apps?error=app_required");
        return;
      }

      // Server (Redis-backed) is source of truth — localStorage only mirrors after success.
      try {
        const restored = await restoreDomainSetupRequest();
        if (cancelled) return;

        if (restored) {
          writeMailDomainSetup(restored, appId);
          setSetup(restored);
          setHydrated(true);
          if (restored.status === "ACTIVE") router.refresh();
          return;
        }

        writeMailDomainSetup(null, appId);
        setSetup(null);
      } catch {
        // Offline/API failure: last known server-synced copy only.
        if (!cancelled) {
          setSetup(readMailDomainSetup(appId));
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!hydrated) {
    return <div className="min-h-dvh bg-[var(--background)]" />;
  }

  if (setup?.status === "ACTIVE") {
    return <MailMailboxesOverview setup={setup} />;
  }

  return <MailSetupWizard />;
}
