import type { LandingCopy } from '@/lib/landing-copy';
import { agLayout } from '@/lib/ag-theme';
import { DevReveal } from '@/components/landing/dev-reveal';

const SNIPPET = `curl -X POST https://api.rukny.io/api/v1/whatsapp/messages \\
  -H "X-API-Key: rk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+9647xxxxxxxxx",
    "type": "text",
    "text": { "body": "Hello from Rukny" }
  }'`;

export function QuickstartSnippet({ copy }: { copy: LandingCopy }) {
  return (
    <section className={`${agLayout.sectionMuted} py-20 sm:py-24 md:py-28`}>
      <div className={`${agLayout.container} grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center lg:gap-14`}>
        <DevReveal>
          <p className={agLayout.eyebrow}>{copy.quickstartEyebrow}</p>
          <h2 className={`${agLayout.sectionTitle} mt-4`}>
            {copy.quickstartTitle}
            <span className="text-[#9CA3AF]">{copy.quickstartTitleMuted}</span>
          </h2>
          <p className={`${agLayout.lead} mt-4 max-w-md`}>{copy.quickstartSupport}</p>
        </DevReveal>

        <DevReveal delay={0.08}>
          <div
            dir="ltr"
            className="overflow-hidden rounded-[2rem] bg-[#1D1D1D] p-5 sm:p-7"
          >
            <p className="font-mono text-[11px] text-white/40">curl</p>
            <pre className="mt-4 overflow-x-auto font-mono text-[12px] leading-[1.7] text-white/90 sm:text-[12.5px]">
              <code>{SNIPPET}</code>
            </pre>
          </div>
        </DevReveal>
      </div>
    </section>
  );
}
