"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MailDomainDashboard } from "@/components/app/mail-domain-dashboard";
import {
  readMailDomainSetup,
  writeMailDomainSetup,
} from "@/lib/mail-domain-storage";
import { readMailAppIdFromDocument } from "@/lib/mail-app-id";
import { parseMailSlot, withMailSlot } from "@/lib/mail-slot";
import { restoreDomainSetupRequest } from "@/lib/verify-domain-client";
import type { MailDomainSetup } from "@/lib/mail-domain";

export function MailDomainSettingsPage() {
  const pathname = usePathname();
  const slot = parseMailSlot(pathname);
  const appHref = withMailSlot("/app", slot);

  const [setup, setSetup] = useState<MailDomainSetup | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const appId = readMailAppIdFromDocument();
    if (!appId) {
      window.location.assign("/apps?error=app_required");
      return;
    }

    setSetup(readMailDomainSetup(appId));
    setHydrated(true);

    (async () => {
      try {
        const restored = await restoreDomainSetupRequest();
        if (cancelled) return;

        if (restored) {
          writeMailDomainSetup(restored, appId);
          setSetup(restored);
        } else {
          writeMailDomainSetup(null, appId);
          setSetup(null);
        }
      } catch {
        // Keep the local snapshot already shown.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!hydrated) {
    return <div className="min-h-[40vh] bg-[var(--background)]" />;
  }

  if (!setup) {
    return (
      <section className="mx-auto flex w-full max-w-lg flex-col gap-3 py-10 text-center">
        <h1 className="text-xl font-semibold text-[var(--foreground)]">Domain settings</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          No domain is linked to this workspace yet. Finish setup to publish DNS records.
        </p>
        <Link
          href={appHref}
          className="mx-auto mt-2 inline-flex h-10 items-center rounded-full bg-[var(--foreground)] px-5 text-sm font-semibold text-[var(--background)]"
        >
          Go to setup
        </Link>
      </section>
    );
  }

  return <MailDomainDashboard setup={setup} />;
}
