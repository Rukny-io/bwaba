"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@heroui/react";
import { optLayout } from "@/lib/mail-optimus-theme";

const HOME_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#process", label: "How it works" },
  { href: "#developers", label: "Developers" },
  { href: "/pricing", label: "Pricing" },
] as const;

export function MailOptimusHeader({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const primaryHref = signedIn ? "/apps" : "/login";
  const primaryLabel = signedIn ? "Open console" : "Start creating";

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition duration-200",
          scrolled || open
            ? "border-b border-[#E5E5E5] bg-white/85 backdrop-blur-md"
            : "bg-[#FAFAFA]/80 backdrop-blur-sm",
        )}
      >
        <div className={`${optLayout.container} flex h-16 items-center gap-6`}>
          <Link href="/" className="group flex shrink-0 items-center gap-2.5">
            <Image
              src="/rukny-logo.svg"
              alt=""
              width={22}
              height={22}
              priority
              className="transition-transform duration-200 group-hover:scale-[1.04]"
            />
            <span className="text-[15px] font-semibold tracking-[-0.03em]">
              Rukny<span className="font-normal text-[#737373]"> Mail</span>
            </span>
          </Link>

          <nav className="hidden flex-1 items-center gap-1 md:flex" aria-label="Primary">
            {HOME_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3.5 py-2 text-[14px] font-medium text-[#525252] transition-colors hover:bg-white hover:text-[#0A0A0A]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ms-auto hidden items-center gap-2 md:flex">
            {signedIn ? null : (
              <Link href="/login" className={optLayout.btnGhost}>
                Sign in
              </Link>
            )}
            <Link href={primaryHref} className={optLayout.btnPrimary}>
              {primaryLabel}
            </Link>
          </div>

          <button
            type="button"
            className="ms-auto inline-flex size-10 items-center justify-center rounded-full border border-[#E5E5E5] bg-white md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/20"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-4 top-20 rounded-2xl border border-[#E5E5E5] bg-white p-4 shadow-xl">
            <div className="flex flex-col gap-1">
              {HOME_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-3 text-[15px] font-medium text-[#0A0A0A] hover:bg-[#FAFAFA]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="mt-4 grid gap-2 border-t border-[#E5E5E5] pt-4">
              {signedIn ? null : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className={optLayout.btnSecondary}
                >
                  Sign in
                </Link>
              )}
              <Link
                href={primaryHref}
                onClick={() => setOpen(false)}
                className={optLayout.btnPrimary}
              >
                {primaryLabel}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
