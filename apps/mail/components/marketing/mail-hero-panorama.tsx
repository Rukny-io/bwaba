"use client";

import { motion, useReducedMotion } from "framer-motion";

const FOLDERS = [
  { label: "Inbox", count: 3, active: true },
  { label: "Starred", count: 1, active: false },
  { label: "Sent", count: null, active: false },
] as const;

const ROWS = [
  {
    from: "Noura Al-Otaibi",
    email: "noura@client.com",
    subject: "Invoice for Q3",
    preview: "Please send the signed copy when you can.",
    time: "9:14",
    unread: true,
    active: true,
  },
  {
    from: "Studio North",
    email: "hello@studionorth.co",
    subject: "Brand files ready",
    preview: "Updated logos are in the shared folder.",
    time: "8:02",
    unread: false,
    active: false,
  },
  {
    from: "Ops",
    email: "ops@yourdomain.com",
    subject: "Mailbox is live",
    preview: "sara@yourdomain.com can send and receive.",
    time: "Yesterday",
    unread: false,
    active: false,
  },
] as const;

/**
 * Full-bleed product shot — one webmail window, not three tilted cards.
 */
export function MailHeroPanorama() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative bg-[#0a0a0a]" aria-label="Product preview">
      <div className="relative mx-auto max-w-5xl px-5 pb-14 pt-2 sm:px-6 sm:pb-20 md:max-w-7xl md:px-8">
        <div className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(255,255,255,0.08),transparent_55%)]"
          />

          {!reduceMotion ? (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 z-10 w-1/4 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent"
              initial={{ left: "-30%" }}
              animate={{ left: "110%" }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear",
                repeatDelay: 2.4,
              }}
            />
          ) : null}

          {/* Desktop window */}
          <div className="relative hidden overflow-hidden border border-white/10 bg-[#111111] sm:block">
            <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
              <span className="size-2 rounded-full bg-white/20" />
              <span className="size-2 rounded-full bg-white/20" />
              <span className="size-2 rounded-full bg-white/20" />
              <p className="ms-3 truncate text-[11px] text-white/40">
                you@yourdomain.com
              </p>
              <span className="ms-auto hidden text-[10px] font-medium tracking-[0.12em] text-white/30 uppercase md:inline">
                Rukny Mail
              </span>
            </div>

            <div className="grid min-h-[280px] md:min-h-[320px] md:grid-cols-[7.5rem_minmax(0,0.95fr)_minmax(0,1.15fr)] lg:grid-cols-[8.5rem_minmax(0,1fr)_minmax(0,1.2fr)]">
              {/* Folders */}
              <div className="hidden border-r border-white/10 p-3 md:block">
                <p className="px-2 pb-2 text-[9px] font-semibold tracking-[0.16em] text-white/30 uppercase">
                  Mail
                </p>
                <div className="space-y-0.5">
                  {FOLDERS.map((folder) => (
                    <div
                      key={folder.label}
                      className={
                        folder.active
                          ? "flex items-center justify-between rounded-lg bg-white/10 px-2.5 py-2"
                          : "flex items-center justify-between rounded-lg px-2.5 py-2"
                      }
                    >
                      <span
                        className={
                          folder.active
                            ? "text-[12px] font-medium text-white"
                            : "text-[12px] text-white/45"
                        }
                      >
                        {folder.label}
                      </span>
                      {folder.count != null ? (
                        <span className="text-[10px] tabular-nums text-white/35">
                          {folder.count}
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              {/* List */}
              <div className="border-r border-white/10">
                <div className="border-b border-white/10 px-4 py-2.5">
                  <p className="text-[11px] font-semibold text-white/80">
                    Inbox
                  </p>
                </div>
                <div>
                  {ROWS.map((row) => (
                    <div
                      key={row.subject}
                      className={
                        row.active
                          ? "border-b border-white/10 bg-white/[0.06] px-4 py-3"
                          : "border-b border-white/10 px-4 py-3 last:border-b-0"
                      }
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="flex min-w-0 items-center gap-1.5 truncate text-[12px] font-semibold text-white/90">
                          {row.unread ? (
                            <span className="size-1.5 shrink-0 rounded-full bg-white" />
                          ) : null}
                          <span className="truncate">{row.from}</span>
                        </p>
                        <span className="shrink-0 text-[10px] tabular-nums text-white/35">
                          {row.time}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[12px] text-white/70">
                        {row.subject}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-white/35">
                        {row.preview}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reading pane */}
              <div className="hidden flex-col p-5 lg:flex">
                <p className="text-[11px] text-white/40">From Noura Al-Otaibi</p>
                <h3 className="mt-1 text-[15px] font-semibold tracking-[-0.02em] text-white">
                  Invoice for Q3
                </h3>
                <p className="mt-4 text-[12px] leading-relaxed text-white/55">
                  Hi Sara — please send the signed invoice when you can. I
                  attached last month’s PDF for reference.
                </p>
                <div className="mt-5 flex gap-2">
                  <span className="inline-flex h-8 items-center rounded-full bg-white px-3.5 text-[11px] font-semibold text-black">
                    Reply
                  </span>
                  <span className="inline-flex h-8 items-center rounded-full border border-white/15 px-3.5 text-[11px] font-medium text-white/60">
                    Forward
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile — compact inbox */}
          <div className="relative overflow-hidden border border-white/10 bg-[#111111] sm:hidden">
            <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
              <span className="size-1.5 rounded-full bg-white/20" />
              <span className="size-1.5 rounded-full bg-white/20" />
              <span className="size-1.5 rounded-full bg-white/20" />
              <span className="ms-2 text-[10px] text-white/40">
                you@yourdomain.com
              </span>
            </div>
            <div className="px-1 py-1">
              {ROWS.map((row) => (
                <div key={row.subject} className="px-3 py-2.5 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[13px] font-semibold text-white/90">
                      {row.from}
                    </p>
                    <span className="text-[10px] text-white/35">{row.time}</span>
                  </div>
                  <p className="truncate text-[12px] text-white/65">
                    {row.subject}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0a0a0a] to-transparent sm:h-20"
          />
        </div>
      </div>
    </section>
  );
}
