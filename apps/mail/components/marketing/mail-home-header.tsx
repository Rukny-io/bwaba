"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  ChevronDown,
  FileText,
  HelpCircle,
  Mail,
  Menu,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@heroui/react";
import {
  resolveDeveloperUrl,
  resolveFormsUrl,
} from "@rukny/auth/client/env-urls";

type NavItem = {
  href: string;
  title: string;
  description: string;
  external?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
};

function productItems(): NavItem[] {
  const developer = resolveDeveloperUrl();
  const forms = resolveFormsUrl();
  return [
    {
      href: "/",
      title: "Mailboxes",
      description: "Business email on your domain",
      icon: Mail,
    },
    {
      href: forms,
      title: "Forms",
      description: "Build and embed forms",
      external: true,
      icon: FileText,
    },
    {
      href: `${developer}/documentation/email-api`,
      title: "Email API",
      description: "Transactional send for apps",
      external: true,
      icon: Sparkles,
    },
  ];
}

const RESOURCE_ITEMS: NavItem[] = [
  {
    href: "/getting-started",
    title: "Getting started",
    description: "Connect DNS and send",
    icon: Sparkles,
  },
  {
    href: "/documents",
    title: "Documents",
    description: "Guides and setup docs",
    icon: FileText,
  },
  {
    href: "/faqs",
    title: "FAQs",
    description: "Short answers",
    icon: HelpCircle,
  },
];

function NavCard({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const className =
    "group/item flex gap-3 px-3.5 py-3 transition-colors hover:bg-[#f5f5f5] focus:bg-[#f5f5f5] focus:outline-none";
  const body = (
    <>
      {Icon ? (
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center border border-[#e8e8e8] bg-white text-[#111111] transition-colors group-hover/item:border-[#111111]">
          <Icon className="size-3.5" />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[14px] font-semibold text-[#111111]">
          {item.title}
          {item.external ? (
            <ArrowUpRight className="size-3.5 text-[#999999]" aria-hidden />
          ) : null}
        </span>
        <span className="mt-0.5 block text-[12.5px] leading-snug text-[#666666]">
          {item.description}
        </span>
      </span>
    </>
  );

  if (item.external) {
    return (
      <a
        href={item.href}
        className={className}
        onClick={onNavigate}
        rel="noopener noreferrer"
      >
        {body}
      </a>
    );
  }

  return (
    <Link href={item.href} onClick={onNavigate} className={className}>
      {body}
    </Link>
  );
}

function DesktopMenu({
  label,
  items,
  active,
  ink = false,
}: {
  label: string;
  items: NavItem[];
  active: boolean;
  /** Light text for dark hero overlay */
  ink?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative flex h-full items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex h-9 items-center gap-1 px-3 text-[14px] font-medium transition-colors",
          ink
            ? active || open
              ? "text-white"
              : "text-white/70 hover:text-white"
            : active || open
              ? "text-[#111111]"
              : "text-[#555555] hover:text-[#111111]",
        )}
      >
        {label}
        <ChevronDown
          className={cn(
            "size-3.5 opacity-60 transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      <div
        id={menuId}
        role="menu"
        className={cn(
          "absolute left-0 top-full z-50 w-[20rem] pt-2 transition-[opacity,transform] duration-150",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0",
        )}
      >
        <div className="overflow-hidden border border-[#e8e8e8] bg-white shadow-[0_20px_50px_-28px_rgba(17,17,17,0.45)]">
          <div className="border-b border-[#e8e8e8] px-3.5 py-2.5">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-[#888888] uppercase">
              {label}
            </p>
          </div>
          <div className="flex flex-col py-1">
            {items.map((item) => (
              <NavCard
                key={item.href + item.title}
                item={item}
                onNavigate={() => setOpen(false)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MailHomeHeader({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const primaryHref = signedIn ? "/apps" : "/login";
  const primaryLabel = signedIn ? "Open console" : "Get started";
  const isHome = pathname === "/";
  const overDark = isHome && !scrolled && !mobileOpen;

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onScroll = () => {
      // Home keeps a dark hero + panorama — stay ink until light canvas.
      const threshold = isHome
        ? Math.min(window.innerHeight * 1.15, 980)
        : 8;
      setScrolled(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [isHome]);

  const products = productItems();
  const pricingActive =
    pathname === "/pricing" || pathname.startsWith("/pricing/");
  const documentsActive =
    pathname === "/documents" || pathname.startsWith("/documents/");
  const resourcesActive =
    documentsActive ||
    pathname === "/faqs" ||
    pathname === "/getting-started" ||
    pathname === "/tutorials" ||
    pathname.startsWith("/tutorials/");
  const productActive = pathname === "/";

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition duration-200 ease-in-out",
          overDark
            ? "bg-transparent"
            : scrolled || mobileOpen
              ? "border-b border-[#e8e8e8] bg-white/90 shadow-[0_1px_0_rgba(17,17,17,0.04)] backdrop-blur-md"
              : "border-b border-transparent bg-white/80 backdrop-blur-md",
        )}
      >
        <div className="relative z-10 mx-auto w-full max-w-5xl px-6 md:max-w-7xl">
          <div className="mx-auto flex h-[58px] w-full items-center gap-6">
            <Link
              href="/"
              className={cn(
                "group flex shrink-0 items-center gap-2.5",
                overDark ? "text-white" : "text-[#111111]",
              )}
            >
              <Image
                src="/rukny-logo.svg"
                alt=""
                width={24}
                height={24}
                priority
                className={cn(
                  "transition-transform duration-200 group-hover:scale-[1.04]",
                  overDark && "brightness-0 invert",
                )}
              />
              <span className="flex items-baseline gap-1.5">
                <span className="text-[15px] font-bold tracking-[-0.03em]">
                  Rukny
                </span>
                <span
                  className={cn(
                    "text-[15px] font-medium tracking-[-0.02em]",
                    overDark ? "text-white/65" : "text-[#666666]",
                  )}
                >
                  Mail
                </span>
              </span>
            </Link>

            <nav
              className="hidden flex-1 items-center gap-0.5 md:flex"
              aria-label="Primary"
            >
              <DesktopMenu
                label="Product"
                items={products}
                active={productActive && !pricingActive && !resourcesActive}
                ink={overDark}
              />
              <DesktopMenu
                label="Resources"
                items={RESOURCE_ITEMS}
                active={resourcesActive}
                ink={overDark}
              />
              <Link
                href="/pricing"
                className={cn(
                  "inline-flex h-9 items-center px-3 text-[14px] font-medium transition-colors",
                  overDark
                    ? pricingActive
                      ? "text-white"
                      : "text-white/70 hover:text-white"
                    : pricingActive
                      ? "text-[#111111]"
                      : "text-[#555555] hover:text-[#111111]",
                )}
              >
                Pricing
              </Link>
              <Link
                href="/documents"
                className={cn(
                  "inline-flex h-9 items-center px-3 text-[14px] font-medium transition-colors",
                  overDark
                    ? documentsActive
                      ? "text-white"
                      : "text-white/70 hover:text-white"
                    : documentsActive
                      ? "text-[#111111]"
                      : "text-[#555555] hover:text-[#111111]",
                )}
              >
                Documents
              </Link>
            </nav>

            <div className="ml-auto hidden items-center gap-2 md:flex">
              {signedIn ? null : (
                <Link
                  href="/login"
                  className={cn(
                    "inline-flex h-9 items-center px-3 text-[14px] font-medium transition-colors",
                    overDark
                      ? "text-white/70 hover:text-white"
                      : "text-[#555555] hover:text-[#111111]",
                  )}
                >
                  Log in
                </Link>
              )}
              <Link
                href={primaryHref}
                className={cn(
                  "inline-flex h-9 items-center px-4 text-[13px] font-semibold transition-colors",
                  overDark
                    ? "bg-white text-[#0a0a0a] hover:bg-[#e8e8e8]"
                    : "bg-[#111111] text-white hover:bg-black",
                )}
              >
                {primaryLabel}
              </Link>
            </div>

            <div className="ml-auto flex items-center gap-2 md:hidden">
              <Link
                href={primaryHref}
                className={cn(
                  "hidden h-9 items-center px-3.5 text-[13px] font-semibold sm:inline-flex",
                  overDark
                    ? "bg-white text-[#0a0a0a]"
                    : "bg-[#111111] text-white",
                )}
              >
                {primaryLabel}
              </Link>
              <button
                type="button"
                className={cn(
                  "inline-flex size-10 items-center justify-center transition-colors",
                  overDark
                    ? "border border-white/20 text-white hover:bg-white/10"
                    : "border border-[#e8e8e8] bg-white text-[#111111] hover:border-[#111111]",
                )}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen((value) => !value)}
              >
                {mobileOpen ? (
                  <X className="size-5" />
                ) : (
                  <Menu className="size-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {isHome ? null : <div className="h-[58px]" aria-hidden />}

      {mobileOpen ? (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[#111111]/30"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-x-0 top-[58px] bottom-0 overflow-y-auto border-t border-[#e8e8e8] bg-white">
            <div className="mx-auto flex max-w-lg flex-col gap-8 px-4 py-6 sm:px-6">
              {(
                [
                  ["Product", products],
                  ["Resources", RESOURCE_ITEMS],
                ] as const
              ).map(([label, items]) => (
                <section key={label}>
                  <p className="mb-3 text-[12px] font-semibold tracking-[0.12em] text-[#888888] uppercase">
                    {label}
                  </p>
                  <div className="overflow-hidden border border-[#e8e8e8]">
                    {items.map((item) => (
                      <div
                        key={item.href + item.title}
                        className="border-b border-[#e8e8e8] last:border-b-0"
                      >
                        <NavCard
                          item={item}
                          onNavigate={() => setMobileOpen(false)}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              ))}

              <section className="grid gap-2">
                <Link
                  href="/pricing"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-12 items-center border border-[#e8e8e8] px-4 text-[15px] font-semibold text-[#111111]"
                >
                  Pricing
                </Link>
                <Link
                  href="/documents"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-12 items-center border border-[#e8e8e8] px-4 text-[15px] font-semibold text-[#111111]"
                >
                  Documents
                </Link>
                {signedIn ? null : (
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex h-12 items-center px-1 text-[15px] font-medium text-[#555555]"
                  >
                    Log in
                  </Link>
                )}
                <Link
                  href={primaryHref}
                  onClick={() => setMobileOpen(false)}
                  className="flex h-12 items-center justify-center bg-[#111111] text-[15px] font-semibold text-white"
                >
                  {primaryLabel}
                </Link>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
