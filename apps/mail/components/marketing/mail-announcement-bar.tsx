"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@heroui/react";

export function MailAnnouncementBar({
  className,
  ink = false,
}: {
  className?: string;
  ink?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative z-50 flex h-9 items-center justify-center px-4 text-center",
        ink
          ? "border-b border-white/10 bg-[#0B0D0E]/90 text-white/75 backdrop-blur-sm"
          : "border-b border-[#E4E4E7] bg-[#F6F6F4] text-[#6B6F76]",
        className,
      )}
    >
      <p className="truncate text-[11px] font-medium sm:text-[12px]">
        <span className={ink ? "text-[#F6821F]" : "text-[#F6821F]"}>
          Connect 2026
        </span>
        <span className="mx-2 hidden opacity-40 sm:inline" aria-hidden>
          ·
        </span>
        <span className="hidden sm:inline">
          Agentic Mail drafts included on every plan
        </span>
        <span className="sm:hidden">Agentic Mail on every plan</span>
        <Link
          href="/documents"
          className="ms-2 inline-flex items-center gap-0.5 font-semibold text-[#F6821F] transition-opacity hover:opacity-80"
        >
          Learn more
          <ArrowRight className="size-3" aria-hidden />
        </Link>
      </p>
    </div>
  );
}
