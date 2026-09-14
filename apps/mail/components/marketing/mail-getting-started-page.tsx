"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@heroui/react";
import { MailFrameLink } from "@/components/marketing/mail-frame-cta";
import { mailMarketingLayout as L } from "@/lib/mail-marketing-theme";

const STEPS = [
  { id: 0, num: "01", title: "Sign in", line: "Rukny, then a workspace." },
  { id: 1, num: "02", title: "Own it", line: "Your domain. Your From." },
  { id: 2, num: "03", title: "Send", line: "Webmail, then deliver." },
] as const;

export function MailGettingStartedPage({ signedIn }: { signedIn: boolean }) {
  const [step, setStep] = useState(0);
  const primaryHref = signedIn ? "/apps" : "/login";
  const primaryLabel = signedIn ? "Open console" : "Start Building";

  return (
    <main className="overflow-x-clip">
      <section className="border-b border-[#e7e5e4]">
        <div className={L.container}>
          <div className="max-w-screen-sm space-y-6 py-12 md:py-16">
            <p className={`mail-hero-enter ${L.heroBadge}`}>Getting started</p>
            <h1 className={`mail-hero-enter-delayed ${L.heroTitle}`}>
              Three steps to you@yourdomain
            </h1>
            <p className={`mail-hero-enter-delayed ${L.heroLead}`}>
              A Rukny account. A domain you already own. Then webmail is live.
            </p>
          </div>
        </div>
      </section>

      <section className={L.section}>
        <div className={`${L.container} grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-stretch`}>
          <ol className="flex flex-col justify-center gap-1">
            {STEPS.map((item) => {
              const active = step === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setStep(item.id)}
                    aria-current={active ? "step" : undefined}
                    className={cn(
                      "flex w-full items-baseline gap-4 border px-3 py-4 text-left transition-colors sm:gap-6 sm:px-4",
                      active
                        ? "border-[#e7e5e4] bg-white"
                        : "border-transparent hover:border-[#e7e5e4] hover:bg-white/70",
                    )}
                  >
                    <span
                      className={cn(
                        "font-bold tracking-tight transition-all",
                        active
                          ? "text-5xl text-[#062c30] sm:text-6xl"
                          : "text-3xl text-[#e7e5e4] sm:text-4xl",
                      )}
                    >
                      {item.num}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "block text-xl font-semibold tracking-tight",
                          active ? "text-[#1c1917]" : "text-[#a8a29e]",
                        )}
                      >
                        {item.title}
                      </span>
                      <span
                        className={cn(
                          "mt-1 block text-sm",
                          active ? "text-[#57534e]" : "text-[#a8a29e]",
                        )}
                      >
                        {item.line}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="relative min-h-[22rem] overflow-hidden border border-[#e7e5e4] bg-white sm:min-h-[26rem]">
            <Stage step={step} />
          </div>
        </div>
      </section>

      <section className="border-t border-[#e7e5e4] pb-12 sm:pb-16 md:pb-[72px]">
        <div className={L.container}>
          <div className="flex flex-col items-center gap-5 border border-[#e7e5e4] bg-white px-6 py-12 text-center sm:px-12">
            <h2 className={L.sectionTitle}>The console is next</h2>
            <p className="max-w-md text-[15px] leading-[1.8] text-[#57534e]">
              Sign in, add your domain, and send from webmail.
            </p>
            <MailFrameLink href={primaryHref}>
              {primaryLabel}
              <ArrowRight className="size-4" aria-hidden />
            </MailFrameLink>
          </div>
        </div>
      </section>
    </main>
  );
}

function Stage({ step }: { step: number }) {
  return (
    <div className="relative flex h-full min-h-[22rem] items-center justify-center p-6 sm:min-h-[26rem] sm:p-10">
      {step === 0 ? <SceneSignIn /> : null}
      {step === 1 ? <SceneDomain /> : null}
      {step === 2 ? <SceneSend /> : null}
    </div>
  );
}

function SceneSignIn() {
  return (
    <div className="mail-send-rise w-full max-w-sm">
      <div className="border border-[#e7e5e4] bg-[#f2f3f6] p-5">
        <div className="flex items-center gap-2">
          <span className="size-2 bg-[#062c30]" />
          <span className="text-xs font-semibold tracking-wide text-[#a8a29e]">
            Rukny
          </span>
        </div>
        <p className="mt-6 text-2xl font-bold tracking-tight text-[#1c1917]">Mail</p>
        <p className="mt-1 text-sm text-[#57534e]">One workspace. Your domain.</p>
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between border border-[#e7e5e4] bg-white px-3 py-3">
            <span className="text-sm text-[#1c1917]">studio.iq</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#02797E]">
              ready
            </span>
          </div>
          <div className="flex items-center justify-between border border-[#e7e5e4] bg-white/60 px-3 py-3 text-[#a8a29e]">
            <span className="text-sm">New workspace</span>
            <span className="text-[11px]">+</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SceneDomain() {
  return (
    <div className="mail-send-rise w-full max-w-md text-center">
      <p className="font-mono text-2xl tracking-tight text-[#1c1917] sm:text-3xl">
        you@
        <span className="text-[#02797E]">yourdomain.com</span>
        <span className="mail-caret ml-0.5 inline-block h-6 w-[2px] translate-y-1 bg-[#062c30] align-middle sm:h-7" />
      </p>
      <div className="mt-10 grid grid-cols-3 gap-px border border-[#e7e5e4] bg-[#e7e5e4]">
        {["SPF", "DKIM", "DMARC"].map((label, index) => (
          <div
            key={label}
            className="mail-auth-in bg-[#fbfbfc] px-2 py-4"
            style={{ animationDelay: `${index * 140}ms` }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a8a29e]">
              {label}
            </p>
            <p className="mt-2 text-sm font-semibold text-[#062c30]">Pass</p>
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
      <div className="border border-[#e7e5e4] bg-[#f2f3f6] p-5 text-left">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#a8a29e]">
          From
        </p>
        <p className="mt-1 text-sm font-medium text-[#1c1917]">you@yourdomain.com</p>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-[#a8a29e]">
          Subject
        </p>
        <p className="mt-1 text-sm text-[#1c1917]">Invoice 1842</p>
        <div className="mt-6">
          <span className="inline-flex border border-[#062c30] bg-[#062c30] px-4 py-2 text-xs font-semibold text-white">
            Send
          </span>
        </div>
      </div>
      <p className="mt-4 text-center text-sm font-medium text-[#062c30]">
        {sent ? "Delivered" : "Sending…"}
      </p>
    </div>
  );
}
