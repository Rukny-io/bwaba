"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@heroui/react";
import {
  resolveDeveloperUrl,
  resolveFormsUrl,
} from "@rukny/auth/client/env-urls";
import { MailFrameLink } from "@/components/marketing/mail-frame-cta";

const ANNOUNCE_KEY = "rukny-mail-announce-dismissed-v1";

type NavLink = {
  href: string;
  title: string;
  description: string;
  external?: boolean;
};

function productLinks(): NavLink[] {
  const developer = resolveDeveloperUrl();
  const forms = resolveFormsUrl();
  return [
    {
      href: forms,
      title: "Forms",
      description: "Build and embed forms on your site",
      external: true,
    },
    {
      href: `${developer}/documentation/email-api`,
      title: "Email API",
      description: "Transactional email for developers",
      external: true,
    },
    {
      href: "/",
      title: "Mailboxes",
      description: "Business email on your domain",
    },
    {
      href: "/pricing/estimate",
      title: "Marketing emails",
      description: "Volume outbound and campaign send costs",
    },
  ];
}

const RESOURCE_LINKS: NavLink[] = [
  {
    href: "/tutorials",
    title: "Tutorials",
    description: "Step-by-step setup guides",
  },
  {
    href: "/faqs",
    title: "FAQs",
    description: "Short answers, no manual",
  },
  {
    href: "/getting-started",
    title: "Getting started",
    description: "Connect DNS and send",
  },
];

const PRICING_LINKS: NavLink[] = [
  {
    href: "/pricing",
    title: "Pricing",
    description: "Compare plans and pricing",
  },
  {
    href: "/pricing/estimate",
    title: "Calculator",
    description: "Estimate your costs",
  },
];

function MegaItem({
  item,
  onNavigate,
}: {
  item: NavLink;
  onNavigate?: () => void;
}) {
  const className =
    "block p-4 transition-colors hover:bg-[#fbfbfc] focus:bg-[#fbfbfc] focus:outline-none";
  const body = (
    <>
      <span className="block text-sm font-semibold text-[#1c1917]">
        {item.title}
      </span>
      <span className="mt-0.5 block text-xs leading-snug text-[#57534e]">
        {item.description}
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

function DesktopDropdown({
  label,
  items,
  active,
}: {
  label: string;
  items: NavLink[];
  active: boolean;
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
      className="group relative flex h-full"
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
          "inline-flex h-full items-center gap-1 px-3 text-[13.5px] font-medium transition-colors",
          active || open
            ? "text-[#1c1917]"
            : "text-[#57534e] hover:text-[#1c1917]",
        )}
      >
        {label}
        <ChevronDown
          className={cn(
            "size-3.5 opacity-60 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute left-1/2 top-full z-50 w-[16.25rem] -translate-x-1/2 border border-t-0 border-[#e7e5e4] bg-white"
        >
          <div className="flex flex-col divide-y divide-[#e7e5e4]">
            {items.map((item) => (
              <MegaItem
                key={item.href + item.title}
                item={item}
                onNavigate={() => setOpen(false)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function MailHomeHeader({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [announce, setAnnounce] = useState(true);
  const primaryHref = signedIn ? "/apps" : "/login";
  const primaryLabel = signedIn ? "Open console" : "Start for free";

  useEffect(() => {
    try {
      if (localStorage.getItem(ANNOUNCE_KEY) === "1") setAnnounce(false);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const dismissAnnounce = () => {
    setAnnounce(false);
    try {
      localStorage.setItem(ANNOUNCE_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const productLinksList = productLinks();
  const pricingActive =
    pathname === "/pricing" || pathname.startsWith("/pricing/");
  const resourcesActive =
    pathname === "/tutorials" ||
    pathname.startsWith("/tutorials/") ||
    pathname === "/faqs" ||
    pathname === "/getting-started";
  const productActive = pathname === "/" && !pricingActive;

  const headerOffset = announce ? "6.625rem" : "4.5625rem";

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50">
        {announce ? (
          <div className="bg-[#062c30] text-white">
            <div className="mx-auto flex max-w-6xl items-center justify-center gap-3 px-4 py-2 sm:px-8">
              <p className="text-center text-[12px] leading-snug sm:text-[13px]">
                Cost calculator is live — estimate seats and outbound volume.{" "}
                <Link
                  href="/pricing/estimate"
                  className="font-semibold underline underline-offset-2"
                >
                  Read the announcement
                </Link>
              </p>
              <button
                type="button"
                onClick={dismissAnnounce}
                className="shrink-0 text-[12px] font-medium opacity-80 transition hover:opacity-100"
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : null}

        <header className="w-full border-y border-[#e7e5e4] bg-white">
          <div className="mx-auto max-w-6xl">
            <div className="relative flex h-[4.5625rem] w-full items-center justify-between border-x border-[#e7e5e4] px-4 sm:px-8">
              <Link
                href="/"
                className="flex shrink-0 items-center gap-2.5 text-[#1c1917] transition-opacity hover:opacity-80"
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
                className="ml-4 hidden h-full flex-1 select-none items-stretch leading-none lg:flex"
                aria-label="Product"
              >
                <div className="hidden gap-1 lg:flex">
                  <DesktopDropdown
                    label="Product"
                    items={productLinksList}
                    active={productActive && !pricingActive && !resourcesActive}
                  />
                  <DesktopDropdown
                    label="Resources"
                    items={RESOURCE_LINKS}
                    active={resourcesActive}
                  />
                  <DesktopDropdown
                    label="Pricing"
                    items={PRICING_LINKS}
                    active={pricingActive}
                  />
                  <a
                    href="mailto:support@rukny.io"
                    className="inline-flex h-full items-center px-3 text-[13.5px] font-medium text-[#57534e] transition-colors hover:text-[#1c1917]"
                  >
                    Contact
                  </a>
                </div>

                <div className="ml-auto flex items-center gap-1 whitespace-nowrap">
                  {signedIn ? null : (
                    <Link
                      href="/login"
                      className="inline-flex h-9 items-center px-3 text-[13px] font-medium text-[#57534e] transition hover:text-[#1c1917]"
                    >
                      Log in
                    </Link>
                  )}
                  <MailFrameLink
                    href={primaryHref}
                    className="[&_span.relative]:px-4 [&_span.relative]:py-1.5 [&_span.relative]:text-[13px]"
                  >
                    {primaryLabel}
                  </MailFrameLink>
                </div>
              </nav>

              <div className="flex items-center gap-2 lg:hidden">
                <MailFrameLink
                  href={primaryHref}
                  className="hidden sm:inline-flex [&_span.relative]:px-3 [&_span.relative]:py-1.5 [&_span.relative]:text-[12px]"
                >
                  {primaryLabel}
                </MailFrameLink>
                <button
                  type="button"
                  className="inline-flex size-9 items-center justify-center border border-[#e7e5e4] text-[#1c1917]"
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
      </div>

      <div style={{ height: headerOffset }} aria-hidden />

      {mobileOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[#1c1917]/20 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="absolute inset-x-0 border-b border-[#e7e5e4] bg-white p-4 shadow-lg"
            style={{ top: headerOffset }}
          >
            <div className="space-y-4">
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[1.2px] text-[#a8a29e]">
                  Product
                </p>
                <div className="divide-y divide-[#e7e5e4] border border-[#e7e5e4]">
                  {productLinksList.map((item) => (
                    <MegaItem
                      key={item.href + item.title}
                      item={item}
                      onNavigate={() => setMobileOpen(false)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[1.2px] text-[#a8a29e]">
                  Resources
                </p>
                <div className="divide-y divide-[#e7e5e4] border border-[#e7e5e4]">
                  {RESOURCE_LINKS.map((item) => (
                    <MegaItem
                      key={item.href + item.title}
                      item={item}
                      onNavigate={() => setMobileOpen(false)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[1.2px] text-[#a8a29e]">
                  Pricing
                </p>
                <div className="divide-y divide-[#e7e5e4] border border-[#e7e5e4]">
                  {PRICING_LINKS.map((item) => (
                    <MegaItem
                      key={item.href + item.title}
                      item={item}
                      onNavigate={() => setMobileOpen(false)}
                    />
                  ))}
                </div>
              </div>
              <a
                href="mailto:support@rukny.io"
                className="block px-1 py-2 text-sm font-medium text-[#57534e]"
              >
                Contact
              </a>
              {signedIn ? null : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block px-1 py-2 text-sm font-medium text-[#57534e]"
                >
                  Log in
                </Link>
              )}
              <MailFrameLink
                href={primaryHref}
                className="w-full [&_span.relative]:w-full"
              >
                {primaryLabel}
              </MailFrameLink>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
