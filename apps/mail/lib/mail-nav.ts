import type { LucideIcon } from "lucide-react";
import {
  AtSign,
  Code2,
  CreditCard,
  FileText,
  Forward,
  Globe,
  Inbox,
  KeyRound,
  LayoutGrid,
  Mails,
  ReplyAll,
  ScrollText,
  Settings,
  Shield,
  ShieldAlert,
  Smartphone,
  Users,
} from "lucide-react";

export type MailNavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  exact?: boolean;
};

/** Daily console destinations on the sidebar rail. */
export const MAIL_PRIMARY_NAV: MailNavItem[] = [
  { href: "/inbox", icon: Inbox, label: "Inbox", exact: true },
  { href: "/app", icon: LayoutGrid, label: "Mailboxes", exact: true },
  { href: "/forwarders", icon: Forward, label: "Forwarders", exact: true },
  { href: "/aliases", icon: AtSign, label: "Email Alias", exact: true },
  { href: "/catch-all", icon: Mails, label: "Catch-all email", exact: true },
  { href: "/auto-reply", icon: ReplyAll, label: "Automatic Reply", exact: true },
  { href: "/security", icon: Shield, label: "Security", exact: true },
];

/**
 * Least-used tools live in the avatar menu (desktop) and the mobile "+" menu.
 * Domain + Quarantine stay in the header Main pill.
 */
export const MAIL_SECONDARY_NAV: MailNavItem[] = [
  { href: "/devices", icon: Smartphone, label: "Connect apps & devices", exact: true },
  { href: "/logs", icon: ScrollText, label: "Email Logs", exact: true },
  { href: "/developers", icon: Code2, label: "Developers", exact: true },
];

/** Moved out of the sidebar into the header Main pill. */
export const MAIL_HEADER_TOOL_NAV: MailNavItem[] = [
  { href: "/domain", icon: Globe, label: "Domain", exact: true },
  { href: "/quarantine", icon: ShieldAlert, label: "Quarantine", exact: true },
];

/** Reserved for features not yet linked in the sidebar. */
export const MAIL_UNPUBLISHED_NAV: MailNavItem[] = [];

export const MAIL_HEADER_NAV: MailNavItem[] = [
  { href: "/settings", icon: Settings, label: "Settings", exact: true },
  { href: "/billing", icon: CreditCard, label: "Billing", exact: false },
  { href: "/apps", icon: LayoutGrid, label: "Workspaces", exact: true },
  { href: "/documents", icon: FileText, label: "Documents", exact: true },
  ...MAIL_HEADER_TOOL_NAV,
];

/** Team + SSO sit above the avatar in the bottom sidebar cluster. */
export const MAIL_SIDEBAR_FOOTER_NAV: MailNavItem[] = [
  { href: "/team", icon: Users, label: "Team", exact: true },
  { href: "/sso", icon: KeyRound, label: "SSO", exact: true },
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
