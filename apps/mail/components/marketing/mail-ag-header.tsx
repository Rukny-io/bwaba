"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  CircleHelp,
  Code2,
  GraduationCap,
  Inbox,
  Menu,
  Monitor,
  Rocket,
  Terminal,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@heroui/react";
import { agLayout } from "@/lib/mail-antigravity-theme";
import {
  resolveDeveloperUrl,
  resolveFormsUrl,
} from "@rukny/auth/client/env-urls";

type DropdownId = "products" | "use-cases" | "resources" | null;

type NavItem = {
  href: string;
  title: string;
  description: string;
  external?: boolean;
  icon?: LucideIcon;
};

function productItems(): NavItem[] {
  const developer = resolveDeveloperUrl();
  const forms = resolveFormsUrl();
  return [
    {
      href: "/login",
      title: "Mailboxes",
      description: "Addresses on your domain",
      icon: Inbox,
    },
    {
      href: `${developer}/documentation/email-api`,
      title: "Email API",
      description: "Send from your apps",
      external: true,
      icon: Terminal,
    },
    {
      href: "/getting-started",
      title: "DNS setup",
      description: "Verify and authenticate",
      icon: Code2,
    },
    {
      href: "/login",
      title: "Webmail",
      description: "Inbox in the browser",
      icon: Monitor,
    },
    {
      href: forms,
      title: "Forms",
      description: "Collect signups and leads",
      external: true,
      icon: Rocket,
    },
  ];
}

const USE_CASE_ITEMS = [
  { href: "#use-cases", label: "Small business", description: "Look professional from day one" },
  { href: "#use-cases", label: "Teams", description: "Shared console and mailboxes" },
  { href: "#developers", label: "Developers", description: "API, logs, and webhooks" },
] as const;

const RESOURCE_ITEMS: NavItem[] = [
  {
    href: "/getting-started",
    title: "Getting started",
    description: "Connect your first domain",
    icon: Rocket,
  },
  {
    href: "/tutorials",
    title: "Tutorials",
    description: "Step-by-step setup guides",
    icon: GraduationCap,
  },
  {
    href: "/documents",
    title: "Documentation",
    description: "Setup guides and reference",
    icon: BookOpen,
  },
  {
    href: "/faqs",
    title: "FAQs",
    description: "Billing, DNS, and delivery",
    icon: CircleHelp,
  },
];

const MOBILE_LINKS = [
  { href: "#products", label: "Products" },
  { href: "#use-cases", label: "Use cases" },
  { href: "/pricing", label: "Pricing" },
  { href: "/documents", label: "Resources" },
] as const;

function ProductMegaCard({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = item.icon;
  const className =
    "group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-[#FAFAFA]";
  const body = (
    <>
      {Icon ? (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#F0F0F0] bg-white text-[#1D1D1D]">
          <Icon className="size-4" strokeWidth={1.5} />
        </span>
      ) : null}
      <span className="min-w-0">
        <span className="flex items-center gap-1 text-[14px] font-medium text-[#1D1D1D]">
          {item.title}
          {item.external ? (
            <ArrowUpRight className="size-3.5 text-[#C4C4C4]" aria-hidden />
          ) : null}
        </span>
        <span className="mt-0.5 block text-[12px] leading-relaxed text-[#6B6F76]">
          {item.description}
        </span>
      </span>
    </>
  );

  if (item.external) {
    return (
      <a href={item.href} className={className} rel="noopener noreferrer" onClick={onNavigate}>
        {body}
      </a>
    );
  }
  return (
    <Link href={item.href} className={className} onClick={onNavigate}>
      {body}
    </Link>
  );
}

export function MailAgHeader({ signedIn }: { signedIn: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdown, setDropdown] = useState<DropdownId>(null);
  const primaryHref = signedIn ? "/apps" : "/login";
  const primaryLabel = signedIn ? "Open console" : "Get started";
  const products = productItems();

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDropdown(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const closeMenus = () => {
    setDropdown(null);
    setMobileOpen(false);
  };

  const navBtn = (id: DropdownId, label: string) => (
    <button
      type="button"
      aria-expanded={dropdown === id}
      onClick={() => setDropdown(dropdown === id ? null : id)}
      onMouseEnter={() => setDropdown(id)}
      className={cn(
        "inline-flex h-9 items-center gap-1 rounded-full px-3.5 text-[13px] font-medium transition-colors",
        dropdown === id
          ? "bg-[#F5F5F5] text-[#1D1D1D]"
          : "text-[#6B6F76] hover:bg-[#FAFAFA] hover:text-[#1D1D1D]",
      )}
    >
      {label}
      <ChevronDown
        className={cn(
          "size-3.5 opacity-40 transition-transform duration-200",
          dropdown === id && "rotate-180",
        )}
        aria-hidden
      />
    </button>
  );

  const headerActive = scrolled || mobileOpen || Boolean(dropdown);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 flex h-9 items-center justify-center border-b border-[#F0F0F0] bg-[#FAFAFA] px-4 text-center">
        <p className="truncate text-[11px] font-medium text-[#6B6F76] sm:text-[12px]">
          Agentic Mail drafts on every plan
          <Link
            href="/documents"
            className="ms-2 text-[#1D1D1D] underline-offset-2 hover:underline"
          >
            Learn more
          </Link>
        </p>
      </div>

      <header
        data-header=""
        className={cn(
          "header fixed inset-x-0 top-9 z-40 transition-[border-color,background-color,box-shadow] duration-200",
          headerActive && "dropdown-open",
          headerActive
            ? "border-b border-[#E8E8E8] bg-white/95 shadow-[0_1px_0_rgba(0,0,0,0.03)] backdrop-blur-md"
            : "border-b border-transparent bg-white/90 backdrop-blur-sm",
        )}
        onMouseLeave={() => setDropdown(null)}
      >
        <div className="grid-container">
          <div
            className={`${agLayout.container} main-content flex h-14 items-center gap-6`}
          >
            <Link href="/" className="group flex shrink-0 items-center gap-2">
              <Image
                src="/rukny-logo.svg"
                alt=""
                width={22}
                height={22}
                priority
                className="transition-transform duration-200 group-hover:scale-[1.03]"
              />
              <span className="text-[15px] font-medium tracking-[-0.02em] text-[#1D1D1D]">
                Rukny Mail
              </span>
            </Link>

            <nav className="hidden flex-1 items-center gap-0.5 md:flex" aria-label="Primary">
              {navBtn("products", "Products")}
              {navBtn("use-cases", "Use cases")}
              <Link
                href="/pricing"
                className="inline-flex h-9 items-center rounded-full px-3.5 text-[13px] font-medium text-[#6B6F76] transition-colors hover:bg-[#FAFAFA] hover:text-[#1D1D1D]"
              >
                Pricing
              </Link>
              {navBtn("resources", "Resources")}
            </nav>

            <div className="ms-auto hidden items-center gap-2 md:flex">
              {!signedIn ? (
                <Link
                  href="/login"
                  className="inline-flex h-9 items-center rounded-full px-3.5 text-[13px] font-medium text-[#6B6F76] transition-colors hover:text-[#1D1D1D]"
                >
                  Sign in
                </Link>
              ) : null}
              <Link href={primaryHref} className={agLayout.btnPrimary}>
                {primaryLabel}
              </Link>
            </div>

            <button
              type="button"
              className="ms-auto inline-flex size-10 items-center justify-center rounded-full border border-[#E8E8E8] bg-white text-[#1D1D1D] transition-colors hover:bg-[#FAFAFA] md:hidden"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>

          <AnimatePresence>
            {dropdown ? (
              <motion.div
                data-dropdowns-container=""
                className="dropdown hidden border-t border-[#F0F0F0] bg-white md:block"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className={`${agLayout.container} py-7`}>
                  {dropdown === "products" ? (
                    <>
                      <div className="mb-5 flex items-center justify-between gap-4">
                        <p className="text-[13px] text-[#6B6F76]">
                          Everything you need to run mail on your domain
                        </p>
                        <Link
                          href="#products"
                          className="shrink-0 text-[13px] font-medium text-[#1D1D1D] hover:underline"
                          onClick={closeMenus}
                        >
                          Overview
                        </Link>
                      </div>
                      <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                        {products.map((item) => (
                          <ProductMegaCard
                            key={item.title}
                            item={item}
                            onNavigate={closeMenus}
                          />
                        ))}
                      </div>
                    </>
                  ) : null}

                  {dropdown === "use-cases" ? (
                    <div className="grid gap-1 sm:grid-cols-3">
                      {USE_CASE_ITEMS.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          className="rounded-xl p-4 transition-colors hover:bg-[#FAFAFA]"
                          onClick={closeMenus}
                        >
                          <p className="text-[14px] font-medium text-[#1D1D1D]">
                            {item.label}
                          </p>
                          <p className="mt-1 text-[12px] leading-relaxed text-[#6B6F76]">
                            {item.description}
                          </p>
                        </Link>
                      ))}
                    </div>
                  ) : null}

                  {dropdown === "resources" ? (
                    <div className="grid gap-1 sm:grid-cols-3">
                      {RESOURCE_ITEMS.map((item) => (
                        <ProductMegaCard
                          key={item.title}
                          item={item}
                          onNavigate={closeMenus}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 top-[92px] overflow-y-auto bg-white">
            <div className="border-b border-[#F0F0F0] px-5 py-4">
              <Link
                href={primaryHref}
                className={`${agLayout.btnPrimary} w-full`}
                onClick={closeMenus}
              >
                {primaryLabel}
              </Link>
            </div>
            <nav className="px-3 py-2" aria-label="Mobile">
              {MOBILE_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex h-11 items-center rounded-lg px-3 text-[15px] font-medium text-[#1D1D1D] hover:bg-[#FAFAFA]"
                  onClick={closeMenus}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
