"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@heroui/react";
import { MailFrameLink } from "@/components/marketing/mail-frame-cta";
import {
  MailMagnetic,
  MailSplitWords,
} from "@/components/marketing/mail-motion-kit";
import {
  MailHeroMotion,
  MailReveal,
  MailRevealItem,
  MailStagger,
} from "@/components/marketing/mail-reveal";
import { mailMarketingLayout as L } from "@/lib/mail-marketing-theme";

const STEPS = [
  {
    id: 0,
    num: "01",
    title: "Sign in",
    line: "Rukny account, then a mail workspace.",
  },
  {
    id: 1,
    num: "02",
    title: "Own the domain",
    line: "Connect DNS. Send as you@yourdomain.",
  },
  {
    id: 2,
    num: "03",
    title: "Send",
    line: "Mailbox password or team SSO, then webmail.",
  },
] as const;

export function MailGettingStartedPage({ signedIn }: { signedIn: boolean }) {
  const [step, setStep] = useState(0);
  const primaryHref = signedIn ? "/apps" : "/login";
  const primaryLabel = signedIn ? "Open console" : "Start Building";

  return (
    <main className="overflow-x-clip">
      <section className="relative border-b border-[#e8e8e8]">
        <div className={L.container}>
          <div className="max-w-xl space-y-4 py-10 md:space-y-5 md:py-14">
            <MailHeroMotion>
              <p className="text-[12px] font-medium tracking-[0.14em] text-[#666666] uppercase">
                Getting started
              </p>
            </MailHeroMotion>
            <MailHeroMotion delay={0.06}>
              <h1 className="text-[2rem] font-bold leading-[1.02] tracking-[-0.04em] text-[#111111] sm:text-[2.5rem] md:text-[2.85rem]">
                Rukny Mail
              </h1>
            </MailHeroMotion>
            <MailSplitWords
              text="Three steps to you@yourdomain"
              className="text-balance text-[1.05rem] font-medium leading-snug tracking-[-0.02em] text-[#111111]/85 sm:text-lg"
              delay={0.1}
            />
            <MailHeroMotion delay={0.22}>
              <p className="max-w-md text-[14px] leading-relaxed text-[#666666]">
                A Rukny account. A domain you already own. Then webmail is live —
                never a shared @rukny.io address.
              </p>
            </MailHeroMotion>
            <MailHeroMotion delay={0.28}>
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <MailMagnetic strength={10}>
                  <MailFrameLink href={primaryHref}>{primaryLabel}</MailFrameLink>
                </MailMagnetic>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1 px-2 py-2 text-[13px] font-medium text-[#666666] transition-colors hover:text-[#111111]"
                >
                  Pricing
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </div>
            </MailHeroMotion>
          </div>
        </div>
      </section>

      <section className="border-b border-[#e8e8e8] bg-white/70" aria-label="Setup steps">
        <div className={L.container}>
          <div className="grid gap-8 py-10 md:gap-10 md:py-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center">
            <MailStagger as="ol" className="flex flex-col gap-1" stagger={0.06}>
              {STEPS.map((item) => {
                const active = step === item.id;
                return (
                  <MailRevealItem key={item.id} as="li">
                    <button
                      type="button"
                      onClick={() => setStep(item.id)}
                      aria-current={active ? "step" : undefined}
                      className={cn(
                        "flex w-full items-start gap-4 border-s-2 px-3 py-3.5 text-left transition-colors sm:px-4",
                        active
                          ? "border-[#666666] bg-[#fafafa]"
                          : "border-transparent hover:border-[#e8e8e8] hover:bg-[#fafafa]",
                      )}
                    >
                      <span
                        className={cn(
                          "font-mono text-[12px] tracking-[0.14em]",
                          active ? "text-[#666666]" : "text-[#999999]",
                        )}
                      >
                        {item.num}
                      </span>
                      <span className="min-w-0">
                        <span
                          className={cn(
                            "block text-[15px] font-semibold tracking-tight",
                            active ? "text-[#111111]" : "text-[#888888]",
                          )}
                        >
                          {item.title}
                        </span>
                        <span
                          className={cn(
                            "mt-0.5 block text-[13px] leading-relaxed",
                            active ? "text-[#666666]" : "text-[#999999]",
                          )}
                        >
                          {item.line}
                        </span>
                      </span>
                    </button>
                  </MailRevealItem>
                );
              })}
            </MailStagger>

            <MailReveal delay={0.08} y={20}>
              <div className="relative min-h-[20rem] overflow-hidden border border-[#e8e8e8] bg-[#fafafa] sm:min-h-[22rem]">
                <Stage step={step} />
              </div>
            </MailReveal>
          </div>
        </div>
      </section>

      <section className="bg-[#f5f5f5]">
        <div className={L.container}>
          <div className="flex flex-col items-start gap-5 py-10 sm:flex-row sm:items-center sm:justify-between md:py-12">
            <MailReveal>
              <p className="text-[1.1rem] font-bold tracking-[-0.02em] text-[#111111] sm:text-xl">
                The console is next
              </p>
              <p className="mt-1 max-w-md text-[13px] text-[#666666]">
                Sign in, add your domain, and send from webmail.
              </p>
            </MailReveal>
            <MailReveal delay={0.06}>
              <MailMagnetic>
                <MailFrameLink href={primaryHref}>
                  {primaryLabel}
                  <ArrowRight className="size-4" aria-hidden />
                </MailFrameLink>
              </MailMagnetic>
            </MailReveal>
          </div>
        </div>
      </section>
    </main>
  );
}

function Stage({ step }: { step: number }) {
  return (
    <div className="relative flex h-full min-h-[20rem] items-center justify-center p-5 sm:min-h-[22rem] sm:p-8">
      {step === 0 ? <SceneSignIn /> : null}
      {step === 1 ? <SceneDomain /> : null}
      {step === 2 ? <SceneSend /> : null}
    </div>
  );
}

function SceneSignIn() {
  return (
    <div className="mail-send-rise w-full max-w-sm">
      <div className="border border-[#e8e8e8] bg-white p-5 shadow-[0_20px_50px_-40px_rgba(17,17,17,0.4)]">
        <div className="flex items-center gap-2">
          <span className="size-2 bg-[#666666]" />
          <span className="text-[11px] font-semibold tracking-wide text-[#888888]">
            Workspaces
          </span>
        </div>
        <p className="mt-5 text-xl font-bold tracking-tight text-[#111111]">
          Rukny Mail
        </p>
        <p className="mt-1 text-[13px] text-[#666666]">
          One workspace. Your domain.
        </p>
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between border border-[#e8e8e8] bg-[#fafafa] px-3 py-2.5">
            <span className="text-[13px] font-medium text-[#111111]">
              studio.iq
            </span>
            <span className="text-[10px] font-semibold tracking-wider text-[#666666] uppercase">
              ready
            </span>
          </div>
          <div className="flex items-center justify-between border border-dashed border-[#e8e8e8] px-3 py-2.5 text-[#888888]">
            <span className="text-[13px]">New workspace</span>
            <span className="text-[12px]">+</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SceneDomain() {
  return (
    <div className="mail-send-rise w-full max-w-md text-center">
      <p className="font-mono text-xl tracking-tight text-[#111111] sm:text-2xl">
        you@
        <span className="text-[#666666]">yourdomain.com</span>
        <span className="mail-caret ml-0.5 inline-block h-5 w-[2px] translate-y-0.5 bg-[#111111] align-middle sm:h-6" />
      </p>
      <div className="mt-8 grid grid-cols-3 gap-px border border-[#e8e8e8] bg-[#e8e8e8]">
        {["SPF", "DKIM", "DMARC"].map((label, index) => (
          <div
            key={label}
            className="mail-auth-in bg-white px-2 py-4"
            style={{ animationDelay: `${index * 120}ms` }}
          >
            <p className="text-[10px] font-semibold tracking-[0.16em] text-[#888888] uppercase">
              {label}
            </p>
            <p className="mt-2 text-[13px] font-semibold text-[#666666]">Pass</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SceneSend() {
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setSent(true), 700);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="mail-send-rise w-full max-w-sm">
      <div className="border border-[#e8e8e8] bg-white p-5 text-left shadow-[0_20px_50px_-40px_rgba(17,17,17,0.4)]">
        <p className="text-[10px] font-semibold tracking-wider text-[#888888] uppercase">
          From
        </p>
        <p className="mt-1 text-[13px] font-medium text-[#111111]">
          you@yourdomain.com
        </p>
        <p className="mt-4 text-[10px] font-semibold tracking-wider text-[#888888] uppercase">
          Subject
        </p>
        <p className="mt-1 text-[13px] text-[#111111]">Invoice 1842</p>
        <div className="mt-5">
          <span className="inline-flex border border-[#111111] bg-[#111111] px-3.5 py-1.5 text-[11px] font-semibold text-white">
            Send
          </span>
        </div>
      </div>
      <p
        className={cn(
          "mt-3 text-center text-[13px] font-medium transition-colors",
          sent ? "text-[#666666]" : "text-[#888888]",
        )}
      >
        {sent ? "Delivered" : "Sending…"}
      </p>
    </div>
  );
}
