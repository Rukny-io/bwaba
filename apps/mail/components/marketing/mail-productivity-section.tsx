import { Check } from "lucide-react";
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
            <h2
              id="productivity-heading"
              className={L.sectionTitle}
            >
              Productive to the core
            </h2>
            <ul className="mt-6 flex flex-col gap-4 sm:mt-8">
              {POINTS.map((point) => (
                <li key={point} className="flex gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#EEF2F2] text-[#062c30]">
                    <Check className="size-3.5" strokeWidth={2.4} aria-hidden />
                  </span>
                  <p className="text-[15px] leading-[1.75] text-[#132327]/70 sm:text-base">
                    {point}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:order-1">
            <WebmailPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

function WebmailPreview() {
  return (
    <div
      className="overflow-hidden rounded-[1.75rem] border border-[#E8ECF0] bg-white shadow-[0_8px_32px_rgba(19,35,39,0.06)]"
      aria-hidden
    >
      <div className="flex items-center gap-2 border-b border-[#E8ECF0] bg-[#F6F7F8] px-4 py-3">
        <span className="size-2.5 rounded-full bg-[#E8ECF0]" />
        <span className="size-2.5 rounded-full bg-[#E8ECF0]" />
        <span className="size-2.5 rounded-full bg-[#E8ECF0]" />
        <p className="ml-2 truncate text-[11px] font-medium text-[#132327]/45">
          you@yourdomain.com
        </p>
      </div>

      <div className="grid sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)]">
        <div className="border-b border-[#E8ECF0] p-3 sm:border-b-0 sm:border-r">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#132327]/35">
            Inbox
          </p>
          {[
            { from: "Noura", subject: "Q3 invoice", time: "9:14" },
            { from: "Studio", subject: "Brand files", time: "8:02" },
            { from: "Ops", subject: "Mailbox ready", time: "Yesterday" },
          ].map((row, index) => (
            <div
              key={row.subject}
              className={`rounded-xl px-2.5 py-2.5 ${index === 0 ? "bg-[#EEF2F2]" : ""}`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[13px] font-semibold text-[#132327]">{row.from}</p>
                <p className="text-[10px] text-[#132327]/40">{row.time}</p>
              </div>
              <p className="mt-0.5 truncate text-[12px] text-[#132327]/55">
                {row.subject}
              </p>
            </div>
          ))}
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-[11px] font-medium text-[#132327]/40">From Noura</p>
          <p className="mt-1 text-[15px] font-semibold text-[#132327]">Q3 invoice</p>
          <p className="mt-3 text-[13px] leading-[1.7] text-[#132327]/60">
            Please send the signed invoice today. I attached last month’s PDF
            for reference.
          </p>
          <div className="mt-5 rounded-2xl border border-[#E8ECF0] bg-[#F6F7F8] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#02797E]">
              Agentic Mail
            </p>
            <p className="mt-1.5 text-[13px] leading-snug text-[#132327]/70">
              Here’s a clear reply with the invoice attached and a send time
              for this afternoon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
