"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { MailReveal } from "@/components/marketing/mail-reveal";
import { agLayout } from "@/lib/mail-antigravity-theme";
import { resolveDeveloperUrl } from "@rukny/auth/client/env-urls";

const CODE_LINES = [
  "import { RuknyMail } from '@rukny/mail'",
  "",
  "await RuknyMail.send({",
  "  to: 'user@example.com',",
  "  from: 'hello@yourbrand.com',",
  "  subject: 'Welcome aboard',",
  "})",
] as const;

const FEATURES = [
  { title: "REST Email API", body: "Send transactional mail from your apps." },
  { title: "Zero guesswork DNS", body: "Copy-paste records from the console." },
  { title: "Webhooks & logs", body: "Track delivery events in one place." },
  { title: "Typed SDK docs", body: "Clear examples in the developer portal." },
] as const;

export function MailAgDevelopers() {
  const [visible, setVisible] = useState(0);
  const reduceMotion = useReducedMotion();
  const developerUrl = resolveDeveloperUrl();

  useEffect(() => {
    if (reduceMotion) {
      setVisible(CODE_LINES.length);
      return;
    }
    setVisible(0);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setVisible(i);
      if (i >= CODE_LINES.length) window.clearInterval(id);
    }, 420);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  return (
    <section
      id="developers"
      className="border-t border-[#E8E8E8] bg-white"
      aria-labelledby="ag-dev-heading"
    >
      <div className={`${agLayout.container} ${agLayout.section}`}>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <MailReveal>
            <p className="text-[13px] font-medium text-[#6B6F76]">Developers</p>
            <h2
              id="ag-dev-heading"
              className={`${agLayout.sectionTitle} mt-3 max-w-[16ch]`}
            >
              Ship mail from your code
            </h2>
            <p className={`${agLayout.lead} mt-4 max-w-md`}>
              REST endpoints, delivery logs, and documentation that gets you
              sending in minutes — not days.
            </p>

            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <li key={f.title}>
                  <p className="text-[14px] font-medium text-[#1D1D1D]">
                    {f.title}
                  </p>
                  <p className="mt-1 text-[13px] text-[#6B6F76]">{f.body}</p>
                </li>
              ))}
            </ul>

            <a
              href={`${developerUrl}/documentation/email-api`}
              rel="noopener noreferrer"
              className={`${agLayout.btnPrimary} mt-8`}
            >
              Read API docs
            </a>
          </MailReveal>

          <MailReveal>
            <div className="overflow-hidden rounded-2xl border border-[#E8E8E8] bg-[#1D1D1D] shadow-[0_8px_40px_-16px_rgba(0,0,0,0.2)]">
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                <span className="size-2.5 rounded-full bg-[#EA4335]" />
                <span className="size-2.5 rounded-full bg-[#FBBC04]" />
                <span className="size-2.5 rounded-full bg-[#34A853]" />
                <span className="ms-2 text-[12px] text-white/40">terminal</span>
              </div>
              <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed text-white/85 sm:text-[14px]">
                {CODE_LINES.map((line, i) => (
                  <div
                    key={i}
                    className="transition-opacity duration-200"
                    style={{ opacity: i < visible ? 1 : 0 }}
                  >
                    {line || "\u00A0"}
                  </div>
                ))}
              </pre>
            </div>
          </MailReveal>
        </div>
      </div>
    </section>
  );
}
