"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MailMailboxesOverview } from "@/components/app/mail-mailboxes-overview";
import { MailSetupWizard } from "@/components/app/mail-setup-wizard";
import {
  isMailWizardDismissed,
  readMailDomainSetup,
  writeMailDomainSetup,
} from "@/lib/mail-domain-storage";
import { readMailAppIdFromDocument } from "@/lib/mail-app-id";
import { restoreDomainSetupRequest } from "@/lib/verify-domain-client";
import type { MailDomainSetup } from "@/lib/mail-domain";
import { MAIL_READY_COOKIE } from "@/lib/ses";

function hasReadyCookie() {
  return document.cookie
    .split(";")
    .some((part) => part.trim() === `${MAIL_READY_COOKIE}=1`);
}

export function MailAppPage() {
  const router = useRouter();
  const [setup, setSetup] = useState<MailDomainSetup | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [wizardDismissed, setWizardDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const appId = readMailAppIdFromDocument();
    if (!appId) {
      window.location.assign("/apps?error=app_required");
      return;
    }

    setWizardDismissed(isMailWizardDismissed(appId));
    setSetup(readMailDomainSetup(appId));
    setHydrated(true);

    (async () => {
      try {
        const restored = await restoreDomainSetupRequest();
        if (cancelled) return;

        if (restored) {
          writeMailDomainSetup(restored, appId);
          setSetup(restored);
          if (restored.status === "ACTIVE" && !hasReadyCookie()) {
            router.refresh();
          }
          return;
        }

        writeMailDomainSetup(null, appId);
        setSetup(null);
      } catch {
        // Keep the local snapshot already shown.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!hydrated) {
    return <div className="min-h-[40vh] bg-[var(--background)]" />;
  }

  // ACTIVE = fully verified. Dismissed = user skipped DNS wait (propagation can take hours).
  if (setup && (setup.status === "ACTIVE" || wizardDismissed)) {
    return <MailMailboxesOverview setup={setup} />;
  }

  return <MailSetupWizard />;
}
