"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@heroui/react";

const ROWS = [
  { from: "Noura", subject: "Q3 invoice", time: "9:14", unread: true },
  { from: "Studio", subject: "Brand files", time: "8:02", unread: false },
  { from: "Ops", subject: "Mailbox ready", time: "Yesterday", unread: false },
] as const;

const EASE = [0.22, 1, 0.36, 1] as const;

export function MailWebmailPreview({
  className,
  fullBleed = false,
}: {
  className?: string;
  fullBleed?: boolean;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(
        "overflow-hidden border border-[#e7e5e4] bg-white shadow-[0_24px_60px_-40px_rgba(6,44,48,0.35)]",
        fullBleed ? "border-x-0 sm:border-x" : "",
        className,
      )}
      aria-hidden
      initial={reduceMotion ? false : { opacity: 0, y: 24, rotateX: 6 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.85, ease: EASE }}
      style={{ transformPerspective: 1200 }}
    >
      <div className="flex items-center gap-2 border-b border-[#e7e5e4] bg-[#f2f3f6] px-4 py-3">
        <span className="size-2.5 rounded-full bg-[#e7e5e4]" />
        <span className="size-2.5 rounded-full bg-[#e7e5e4]" />
        <span className="size-2.5 rounded-full bg-[#e7e5e4]" />
        <p className="ml-2 truncate text-[11px] font-medium text-[#a8a29e]">
          you@yourdomain.com
        </p>
        {!reduceMotion ? (
          <motion.span
            className="ms-auto size-1.5 rounded-full bg-[#02797E]"
            animate={{ opacity: [0.35, 1, 0.35] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : null}
      </div>

      <div className="grid sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)]">
        <div className="border-b border-[#e7e5e4] p-3 sm:border-b-0 sm:border-r">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a8a29e]">
            Inbox
          </p>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.12, delayChildren: 0.15 },
              },
            }}
          >
            {ROWS.map((row, index) => (
              <motion.div
                key={row.subject}
                className={cn(
                  "px-2.5 py-2.5",
                  index === 0 ? "bg-[#eef2f2]" : "",
                )}
                variants={
                  reduceMotion
                    ? undefined
                    : {
                        hidden: { opacity: 0, x: -10 },
                        visible: {
                          opacity: 1,
                          x: 0,
                          transition: { duration: 0.45, ease: EASE },
                        },
                      }
                }
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[13px] font-semibold text-[#1c1917]">
                    {row.from}
                    {row.unread ? (
                      <span className="ms-1.5 inline-block size-1.5 rounded-full bg-[#02797E] align-middle" />
                    ) : null}
                  </p>
                  <p className="text-[10px] text-[#a8a29e]">{row.time}</p>
                </div>
                <p className="mt-0.5 truncate text-[12px] text-[#57534e]">
                  {row.subject}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-[11px] font-medium text-[#a8a29e]">From Noura</p>
          <p className="mt-1 text-[15px] font-semibold text-[#1c1917]">Q3 invoice</p>
          <TypeLine
            text="Please send the signed invoice today. I attached last month’s PDF for reference."
            reduceMotion={Boolean(reduceMotion)}
          />
          <motion.div
            className="mt-5 border border-[#e7e5e4] bg-[#f2f3f6] p-3"
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 1.1, duration: 0.55, ease: EASE }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#02797E]">
              Agentic Mail
            </p>
            <p className="mt-1.5 text-[13px] leading-snug text-[#57534e]">
              Here’s a clear reply with the invoice attached and a send time
              for this afternoon.
            </p>
            {!reduceMotion ? (
              <motion.div
                className="mt-3 h-1 overflow-hidden bg-[#e7e5e4]"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <motion.div
                  className="h-full origin-left bg-[#02797E]"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1.35, duration: 1.1, ease: EASE }}
                />
              </motion.div>
            ) : null}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function TypeLine({
  text,
  reduceMotion,
}: {
  text: string;
  reduceMotion: boolean;
}) {
  if (reduceMotion) {
    return (
      <p className="mt-3 text-[13px] leading-[1.7] text-[#57534e]">{text}</p>
    );
  }

  return (
    <p className="mt-3 min-h-[4.2em] text-[13px] leading-[1.7] text-[#57534e]">
      <motion.span
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        {text.split(" ").map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            className="inline"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.45 + i * 0.035, duration: 0.01 }}
          >
            {word}
            {i < text.split(" ").length - 1 ? " " : ""}
          </motion.span>
        ))}
      </motion.span>
      <motion.span
        aria-hidden
        className="ms-0.5 inline-block h-[0.95em] w-[2px] translate-y-[2px] bg-[#02797E] align-baseline"
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.9, repeat: Infinity }}
      />
    </p>
  );
}
