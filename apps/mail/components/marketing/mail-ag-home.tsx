"use client";

import { MailAgHero } from "@/components/marketing/mail-ag-hero";
import { MailAgAgentFirst } from "@/components/marketing/mail-ag-agent-first";
import { MailAgCommunityOrbit } from "@/components/marketing/mail-ag-community-orbit";
import { MailAgLogoCloud } from "@/components/marketing/mail-ag-logo-cloud";
import { MailAgFeatureExplorer } from "@/components/marketing/mail-ag-feature-explorer";
import { MailAgUseCases } from "@/components/marketing/mail-ag-use-cases";
import { MailAgPricingBand } from "@/components/marketing/mail-ag-pricing-band";
import { MailAgResourcesBand } from "@/components/marketing/mail-ag-resources-band";

export function MailAgHome({
  signedIn,
}: {
  signedIn: boolean;
  emailsSent?: number;
}) {
  const primaryHref = signedIn ? "/apps" : "/login";
  const primaryLabel = signedIn ? "Open console" : "Get started";

  return (
    <main className="main overflow-x-clip bg-white text-[#1D1D1D]">
      <MailAgHero
        signedIn={signedIn}
        primaryHref={primaryHref}
        primaryLabel={primaryLabel}
      />
      <MailAgAgentFirst />
      <MailAgLogoCloud />
      <MailAgCommunityOrbit />
      <MailAgFeatureExplorer />
      <MailAgUseCases />
      <MailAgPricingBand
        primaryHref={primaryHref}
        primaryLabel={primaryLabel}
      />
      <MailAgResourcesBand />
    </main>
  );
}
