import { Check } from "lucide-react";
import { MailWebmailPreview } from "@/components/marketing/mail-webmail-preview";
import { mailMarketingLayout as L } from "@/lib/mail-marketing-theme";

const POINTS = [
  "Manage mail from any device with secure webmail — send as you@yourdomain.",
  "Multiply your output with Agentic Mail for faster, smarter drafts.",
  "Fix routing before it costs you: aliases, forwarders, and catch-all in one console.",
] as const;

export function MailProductivitySection() {
  return (
    <section
      id="benefits"
      className={L.section}
      aria-labelledby="productivity-heading"
    >
      <div className={L.container}>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="lg:order-2">
            <p className={L.eyebrow}>Productive</p>
            <h2 id="productivity-heading" className={L.sectionTitle}>
              Productive to the core
            </h2>
            <ul className="mt-6 flex flex-col gap-4 sm:mt-8">
              {POINTS.map((point) => (
                <li key={point} className="flex gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center border border-[#e7e5e4] bg-white text-[#062c30]">
                    <Check className="size-3.5" strokeWidth={2.4} aria-hidden />
                  </span>
                  <p className="text-[15px] leading-[1.75] text-[#57534e] sm:text-base">
                    {point}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:order-1">
            <MailWebmailPreview />
          </div>
        </div>
      </div>
    </section>
  );
}
