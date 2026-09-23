"use client";

import { MailAgIconBouncer } from "@/components/marketing/mail-ag-icon-bouncer";
import { MailAgTypedText } from "@/components/marketing/mail-ag-motion";
import { agLayout } from "@/lib/mail-antigravity-theme";

const TYPED =
  "Rukny Mail is our business email platform, allowing anyone to send and receive on a domain they own.";

export function MailAgAgentFirst() {
  return (
    <section
      data-agent-first-section=""
      className="overflow-hidden border-t border-[#E8E8E8] bg-white py-16 sm:py-20"
      aria-labelledby="agent-first-heading"
    >
      <div className="mb-12 -mx-5 sm:mb-14 sm:-mx-8">
        <MailAgIconBouncer />
      </div>

      <div className={`${agLayout.container}`}>
        <h2 id="agent-first-heading" className="sr-only">
          About Rukny Mail
        </h2>
        <MailAgTypedText
          as="p"
          text={TYPED}
          speed={18}
          className={`${agLayout.sectionTitle} block max-w-[28ch] text-[#1D1D1D] sm:max-w-none`}
        />
      </div>
    </section>
  );
}
