"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@heroui/react";
import { mailMarketingLayout as L } from "@/lib/mail-marketing-theme";

const STEPS = [
  { id: 0, num: "01", title: "Sign in", line: "Rukny, then a workspace." },
  { id: 1, num: "02", title: "Own it", line: "Your domain. Your From." },
  { id: 2, num: "03", title: "Send", line: "Webmail, then deliver." },
] as const;

export function MailGettingStartedPage({ signedIn }: { signedIn: boolean }) {
  const [step, setStep] = useState(0);
  const primaryHref = signedIn ? "/apps" : "/login";
  const primaryLabel = signedIn ? "Open console" : "Get started";

  return (
    <main className="overflow-x-clip pt-14">
      <section className={L.heroPad}>
        <div className="mx-auto flex max-w-6xl flex-col items-center">
          <p className={`mail-hero-enter ${L.heroBadge}`}>Getting started</p>
          <h1 className={`mail-hero-enter-delayed mt-5 ${L.heroTitle}`}>
            Three steps
            <span className="mt-2 block text-[#02797E]">to you@yourdomain</span>
          </h1>
          <p className={`mail-hero-enter-delayed mt-5 ${L.heroLead}`}>
            A Rukny account. A domain you already own. Then webmail is live.
          </p>
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
                      "flex w-full items-baseline gap-4 rounded-2xl px-3 py-4 text-left transition-colors sm:gap-6 sm:px-4",
                      active ? "bg-white" : "hover:bg-white/70",
                    )}
                  >
                    <span
                      className={cn(
                        "font-bold tracking-tight transition-all",
                        active
                          ? "text-5xl text-[#062c30] sm:text-6xl"
                          : "text-3xl text-[#132327]/20 sm:text-4xl",
                      )}
                    >
                      {item.num}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "block text-xl font-semibold tracking-tight",
                          active ? "text-[#132327]" : "text-[#132327]/45",
                        )}
                      >
                        {item.title}
                      </span>
                      <span
                        className={cn(
                          "mt-1 block text-sm",
                          active ? "text-[#132327]/55" : "text-[#132327]/30",
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

          <div className="relative min-h-[22rem] overflow-hidden rounded-[1.75rem] border border-[#E8ECF0] bg-white shadow-[0_8px_32px_rgba(19,35,39,0.06)] sm:min-h-[26rem]">
            <Stage step={step} />
          </div>
        </div>
      </section>

      <section className="pb-12 sm:pb-16 md:pb-[72px]">
        <div className={L.container}>
          <div className="flex flex-col items-center gap-5 rounded-[34px] border border-[#E8ECF0] bg-white/80 px-6 py-12 text-center sm:px-12">
            <h2 className={L.sectionTitle}>The console is next</h2>
            <p className="max-w-md text-[15px] leading-[1.8] text-[#132327]/55">
              Sign in, add your domain, and send from webmail.
            </p>
            <Link href={primaryHref} className={L.btnPrimary}>
              {primaryLabel}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
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
      <div className="rounded-2xl border border-[#E8ECF0] bg-[#F6F7F8] p-5">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#062c30]" />
          <span className="text-xs font-semibold tracking-wide text-[#132327]/50">
            Rukny
          </span>
        </div>
        <p className="mt-6 text-2xl font-bold tracking-tight text-[#132327]">Mail</p>
        <p className="mt-1 text-sm text-[#132327]/45">One workspace. Your domain.</p>
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between rounded-xl bg-white px-3 py-3">
            <span className="text-sm text-[#132327]">studio.iq</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#02797E]">
              ready
            </span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white/60 px-3 py-3 text-[#132327]/35">
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
      <p className="font-mono text-2xl tracking-tight text-[#132327] sm:text-3xl">
        you@
        <span className="text-[#02797E]">yourdomain.com</span>
        <span className="mail-caret ml-0.5 inline-block h-6 w-[2px] translate-y-1 bg-[#062c30] align-middle sm:h-7" />
      </p>
      <div className="mt-10 grid grid-cols-3 gap-3">
        {["SPF", "DKIM", "DMARC"].map((label, index) => (
          <div
            key={label}
            className="mail-auth-in rounded-2xl border border-[#E8ECF0] bg-[#F6F7F8] px-2 py-4"
            style={{ animationDelay: `${index * 140}ms` }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#132327]/40">
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
      <div className="rounded-2xl border border-[#E8ECF0] bg-[#F6F7F8] p-5 text-left">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#132327]/40">
          From
        </p>
        <p className="mt-1 text-sm font-medium text-[#132327]">you@yourdomain.com</p>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-[#132327]/40">
          Subject
        </p>
        <p className="mt-1 text-sm text-[#132327]">Invoice 1842</p>
        <div className="mt-6">
          <span className="inline-flex rounded-full bg-[#062c30] px-4 py-2 text-xs font-semibold text-white">
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
