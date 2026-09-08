"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { KeyRound, Mail, WalletCards } from "lucide-react";
import { useCurrentApp } from "@/components/providers/app-context";
import { appApiKeysNew, appEmailApi, appWallet } from "@/lib/app-routes";
import { EmailApiNav } from "./email-api-nav";

export function EmailApiChrome({ children }: { children: ReactNode }) {
  const { app } = useCurrentApp();

  return (
    <div className="dashboard-section-stack text-start" dir="ltr" lang="en">
      <header className="mb-5 mt-5 overflow-hidden rounded-3xl bg-[var(--surface)] sm:mb-6 sm:mt-7">
        <div className="px-5 pb-5 pt-6 sm:px-7 sm:pb-6 sm:pt-7">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <Mail className="size-5 text-[var(--muted-foreground)]" />
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  Email API
                </h1>
              </div>
              <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[var(--muted-foreground)] sm:text-sm">
                Send OTPs, sign-in links, delivery updates, and transactional
                notifications from your verified domain.
              </p>
            </div>

            <div className="flex w-full flex-wrap gap-2 lg:w-auto lg:justify-end">
              <Link
                href={appWallet(app.appId)}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--surface-secondary)] px-4 text-[13px] font-medium transition hover:opacity-75 sm:flex-none"
              >
                <WalletCards className="size-4" />
                Usage & plan
              </Link>
              <Link
                href={appApiKeysNew(app.appId)}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--foreground)] px-4 text-[13px] font-medium text-[var(--background)] transition hover:opacity-90 sm:flex-none"
              >
                <KeyRound className="size-4" />
                Create API key
              </Link>
            </div>
          </div>
        </div>
        <div className="px-4 pb-4 sm:px-6 sm:pb-5">
          <EmailApiNav baseHref={appEmailApi(app.appId)} />
        </div>
      </header>
      {children}
    </div>
  );
}
