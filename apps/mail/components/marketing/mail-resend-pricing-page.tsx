import { MailMarketingShell } from "@/components/marketing/mail-marketing-shell";
import { MailPricingView } from "@/components/pricing/mail-pricing-view";
import { getCurrentMailUser } from "@/lib/current-user";

export async function MailResendPricingPage() {
  const user = await getCurrentMailUser();

  return (
    <MailMarketingShell signedIn={Boolean(user)} variant="antigravity" smoothScroll={false}>
      <main className="overflow-x-clip bg-white pt-14 text-[#1D1D1D]">
        <MailPricingView signedIn={Boolean(user)} />
      </main>
    </MailMarketingShell>
  );
}
