import type { LucideIcon } from "lucide-react";
import {
  AtSign,
  CreditCard,
  Forward,
  Globe,
  Inbox,
  LayoutGrid,
  Mails,
  ReplyAll,
  ScrollText,
  Smartphone,
} from "lucide-react";

export type MailNavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  exact?: boolean;
};

export const MAIL_PRIMARY_NAV: MailNavItem[] = [
  { href: "/inbox", icon: Inbox, label: "Inbox", exact: true },
  { href: "/app", icon: LayoutGrid, label: "Mailboxes", exact: true },
  { href: "/forwarders", icon: Forward, label: "Forwarders", exact: true },
  { href: "/aliases", icon: AtSign, label: "Email Alias", exact: true },
  { href: "/catch-all", icon: Mails, label: "Catch-all email", exact: true },
  { href: "/auto-reply", icon: ReplyAll, label: "Automatic Reply", exact: true },
];

export const MAIL_SECONDARY_NAV: MailNavItem[] = [
  { href: "/domain", icon: Globe, label: "Domain settings", exact: true },
  { href: "/logs", icon: ScrollText, label: "Email Logs", exact: true },
];

/** Built, but hidden from the sidebar until IMAP/SMTP is ready to publish. */
export const MAIL_UNPUBLISHED_NAV: MailNavItem[] = [
  { href: "/devices", icon: Smartphone, label: "Connect apps & devices", exact: true },
];

export const MAIL_HEADER_NAV: { href: string; label: string; exact?: boolean }[] = [
  { href: "/app", label: "App", exact: true },
  { href: "/settings", label: "Settings", exact: true },
  { href: "/apps", label: "Apps", exact: true },
  { href: "/tutorials", label: "Tutorials", exact: true },
];

export const MAIL_SIDEBAR_FOOTER_NAV: MailNavItem[] = [
  { href: "/pricing", icon: CreditCard, label: "Pricing", exact: true },
];

export function isNavItemActive(
  pathname: string,
  href: string,
  exact?: boolean,
): boolean {
  const path = href.split("?")[0];
  if (exact) return pathname === path;
  return pathname === path || pathname.startsWith(`${path}/`);
}
