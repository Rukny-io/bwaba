"use client";

import { motion, useReducedMotion } from "framer-motion";

const DNS = [
  { type: "TXT", name: "SPF", ok: true },
  { type: "CNAME", name: "DKIM", ok: true },
  { type: "TXT", name: "DMARC", ok: true },
] as const;

const INBOX = [
  { from: "Noura", subject: "Q3 invoice", unread: true },
  { from: "Studio", subject: "Brand files", unread: false },
  { from: "Ops", subject: "Mailbox ready", unread: false },
] as const;

/**
 * Wide cinematic product band under the hero.
 */
export function MailHeroPanorama() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      className="relative bg-[#0a0a0a]"
      aria-label="Product preview"
    >
      <div className="relative mx-auto max-w-5xl px-5 pb-14 pt-2 sm:px-6 sm:pb-20 md:max-w-7xl md:px-8">
        {/* Desktop / tablet showcase */}
        <div className="relative hidden overflow-hidden bg-black sm:block sm:aspect-[377/90] md:aspect-[377/81]">
          <div className="absolute inset-0" aria-hidden role="presentation">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_85%_at_50%_18%,rgba(255,255,255,0.1),transparent_62%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,10,0.97)_0%,transparent_16%,transparent_84%,rgba(10,10,10,0.97)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black to-transparent" />

            {!reduceMotion ? (
              <motion.div
                className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent"
                initial={{ left: "-40%" }}
                animate={{ left: "110%" }}
                transition={{
                  duration: 7.5,
                  repeat: Infinity,
                  ease: "linear",
                  repeatDelay: 1.8,
                }}
              />
            ) : null}

            <div className="absolute inset-0 flex items-center justify-center gap-4 px-8 lg:gap-6 lg:px-14">
              <Panel className="w-[28%] max-w-[240px] -translate-y-1 -rotate-2 opacity-90">
                <p className="px-3 pb-2 pt-2.5 text-left text-[9px] font-semibold tracking-[0.16em] text-white/40 uppercase">
                  DNS auth
                </p>
                <div className="space-y-1.5 px-3 pb-3">
                  {DNS.map((row) => (
                    <div
                      key={row.name}
                      className="flex items-center justify-between gap-2 border border-white/10 bg-white/[0.03] px-2 py-1.5"
                    >
                      <span className="font-mono text-[10px] text-white/55">
                        {row.type}
                      </span>
                      <span className="text-[11px] font-medium text-white/85">
                        {row.name}
                      </span>
                      <span className="size-1.5 rounded-full bg-white/70" />
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel className="z-10 w-[36%] max-w-[320px] scale-105 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.85)]">
                <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/[0.04] px-3 py-2">
                  <span className="size-1.5 rounded-full bg-white/25" />
                  <span className="size-1.5 rounded-full bg-white/25" />
                  <span className="size-1.5 rounded-full bg-white/25" />
                  <span className="ms-2 truncate text-[10px] text-white/45">
                    you@yourdomain.com
                  </span>
                </div>
                <div className="px-2 py-2">
                  {INBOX.map((row) => (
                    <div
                      key={row.subject}
                      className="flex items-baseline justify-between gap-2 px-2 py-2"
                    >
                      <div className="min-w-0 text-left">
                        <p className="truncate text-[11px] font-semibold text-white/90">
                          {row.from}
                          {row.unread ? (
                            <span className="ms-1.5 inline-block size-1 rounded-full bg-white align-middle" />
                          ) : null}
                        </p>
                        <p className="truncate text-[10px] text-white/45">
                          {row.subject}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel className="w-[28%] max-w-[240px] translate-y-1 rotate-2 opacity-90">
                <p className="px-3 pb-1 pt-2.5 text-left text-[9px] font-semibold tracking-[0.16em] text-white/40 uppercase">
                  Compose
                </p>
                <div className="space-y-2 px-3 pb-3 text-left">
                  <p className="text-[10px] text-white/40">
                    To{" "}
                    <span className="text-white/75">noura@client.com</span>
                  </p>
                  <p className="text-[12px] font-medium text-white/90">
                    Signed invoice attached
                  </p>
                  <p className="line-clamp-2 text-[10px] leading-relaxed text-white/45">
                    Sending from your domain — authenticated via SES.
                  </p>
                  <div className="mt-1 flex h-7 items-center justify-center bg-white text-[10px] font-semibold text-black">
                    Send
                  </div>
                </div>
              </Panel>
            </div>
          </div>
        </div>

        {/* Mobile — single product strip */}
        <div className="relative aspect-[16/10] overflow-hidden bg-black sm:hidden">
          <div className="absolute inset-0" aria-hidden role="presentation">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_28%,rgba(255,255,255,0.09),transparent_55%)]" />
            <div className="absolute inset-4 border border-white/10 bg-white/[0.03]">
              <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2.5">
                <span className="size-1.5 rounded-full bg-white/25" />
                <span className="size-1.5 rounded-full bg-white/25" />
                <span className="size-1.5 rounded-full bg-white/25" />
                <span className="ms-2 text-[10px] text-white/45">
                  you@yourdomain.com
                </span>
              </div>
              <div className="space-y-0 px-2 py-1">
                {INBOX.map((row) => (
                  <div key={row.subject} className="px-2 py-2.5 text-left">
                    <p className="text-[12px] font-semibold text-white/90">
                      {row.from}
                      {row.unread ? (
                        <span className="ms-1.5 inline-block size-1 rounded-full bg-white align-middle" />
                      ) : null}
                    </p>
                    <p className="text-[11px] text-white/45">{row.subject}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden border border-white/10 bg-[#111111]/90 backdrop-blur-sm ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
