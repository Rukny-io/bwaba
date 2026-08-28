"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@heroui/react";
import { mailBrand } from "@/lib/mail-marketing-theme";

const NAV = [
  { href: "/", label: "Overview", id: "overview" },
  { href: "/#features", label: "Features", id: "features" },
  { href: "/#pricing", label: "Pricing", id: "pricing" },
  { href: "/getting-started", label: "Getting Started", id: "getting-started" },
  { href: "/tutorials", label: "Tutorials", id: "tutorials" },
  { href: "/faqs", label: "FAQs", id: "faqs" },
] as const;

function isNavActive(
  id: (typeof NAV)[number]["id"],
  pathname: string,
  hash: string,
) {
  if (id === "getting-started") return pathname === "/getting-started";
  if (id === "tutorials") {
    return pathname === "/tutorials" || pathname.startsWith("/tutorials/");
  }
  if (id === "faqs") return pathname === "/faqs";
  if (pathname !== "/") return false;
  if (id === "features") return hash === "#features";
  if (id === "pricing") return hash === "#pricing";
  return hash !== "#features" && hash !== "#pricing";
}

export function MailHomeHeader({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hash, setHash] = useState("");
  const primaryHref = signedIn ? "/apps" : "/login";
  const primaryLabel = signedIn ? "Console" : "Get started";

  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="relative">
      <div className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-[#132327] transition-opacity hover:opacity-80"
            >
              <Image
                src="/rukny-logo.svg"
                alt=""
                width={28}
                height={28}
                priority
              />
              <span className="text-[15px] font-bold tracking-[-0.02em]">
                Rukny Mail
              </span>
            </Link>

            <nav
              className={cn(
                "relative isolate hidden items-center gap-0.5 rounded-full p-1 transition-all duration-500 md:flex",
                scrolled
                  ? "border border-[#132327]/[0.08] bg-white/88 shadow-[0_8px_32px_rgba(19,35,39,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl"
                  : "border border-[#132327]/[0.08] bg-white/62 shadow-[0_2px_20px_rgba(19,35,39,0.06),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-xl",
              )}
              aria-label="Product"
            >
              {NAV.map((item) => {
                const active = isNavActive(item.id, pathname, hash);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-full px-3.5 py-2 text-[13.5px] font-medium transition-colors",
                      active
                        ? "text-[#132327]"
                        : "text-[#132327]/70 hover:text-[#132327]",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center justify-end gap-2">
              {signedIn ? null : (
                <Link
                  href="/login"
                  className="hidden rounded-full px-3.5 py-2 text-[13px] font-medium text-[#132327]/55 transition hover:text-[#132327] xl:inline-flex"
                >
                  Sign in
                </Link>
              )}
              <Link
                href={primaryHref}
                className="hidden h-9 items-center rounded-full px-4 text-[13px] font-semibold text-white shadow-[0_2px_10px_rgba(6,44,48,0.22)] transition hover:opacity-90 md:inline-flex"
                style={{ backgroundColor: mailBrand.brand }}
              >
                {primaryLabel}
              </Link>
              <button
                type="button"
                className="inline-flex size-9 items-center justify-center rounded-xl border border-[#132327]/10 text-[#132327] md:hidden"
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
              >
                {open ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[#132327]/10 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 top-0 border-b border-[#E8ECF0] bg-white p-4 pt-16 shadow-[0_16px_40px_rgba(19,35,39,0.08)]">
            <nav className="flex flex-col gap-1" aria-label="Product">
              {NAV.map((item) => {
                const active = isNavActive(item.id, pathname, hash);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-xl px-3 py-2.5 text-sm font-medium",
                      active
                        ? "bg-[#F6F7F8] text-[#132327]"
                        : "text-[#132327]/65",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <Link
              href={primaryHref}
              className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: mailBrand.brand }}
            >
              {primaryLabel}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
