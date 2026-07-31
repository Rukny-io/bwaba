import type { LucideIcon } from "lucide-react";
import {
  User,
  ShieldCheck,
  CreditCard,
  Blocks,
  KeyRound,
  MonitorSmartphone,
  Link2,
  ScrollText,
  Home,
  BadgeCheck,
  LifeBuoy,
  Ticket,
  PlusCircle,
  Users,
} from "lucide-react";
import type { IconTone, SecurityNavItem } from "./types";

export type { IconTone };

export const SIDEBAR_NAV: {
  id: string;
  href: string;
  icon: LucideIcon;
  labelKey: string;
  tone: IconTone;
}[] = [
  { id: "overview", href: "/manage", icon: Home, labelKey: "nav.overview", tone: "blue" },
  {
    id: "personal-info",
    href: "/manage/personal-info",
    icon: User,
    labelKey: "nav.personal_info",
    tone: "green",
  },
  {
    id: "verified",
    href: "/manage/verified",
    icon: BadgeCheck,
    labelKey: "nav.verified",
    tone: "blue",
  },
  {
    id: "security",
    href: "/manage/security",
    icon: ShieldCheck,
    labelKey: "nav.security",
    tone: "blue",
  },
  {
    id: "billing",
    href: "/manage/billing",
    icon: CreditCard,
    labelKey: "nav.billing",
    tone: "purple",
  },
  {
    id: "team",
    href: "/manage/team",
    icon: Users,
    labelKey: "nav.team",
    tone: "blue",
  },
  {
    id: "linked-apps",
    href: "/manage/linked-apps",
    icon: Blocks,
    labelKey: "nav.linked_apps",
    tone: "orange",
  },
  {
    id: "support",
    href: "/manage/support",
    icon: LifeBuoy,
    labelKey: "nav.support",
    tone: "teal",
  },
];

export const MANAGE_NAV: {
  id: string;
  href: string;
  icon: LucideIcon;
  labelKey: string;
  descKey: string;
  tone: IconTone;
  group: "account" | "security" | "subscription" | "help";
}[] = [
  {
    id: "personal-info",
    href: "/manage/personal-info",
    icon: User,
    labelKey: "nav.personal_info",
    descKey: "nav.personal_info_desc",
    tone: "green",
    group: "account",
  },
  {
    id: "verified",
    href: "/manage/verified",
    icon: BadgeCheck,
    labelKey: "nav.verified",
    descKey: "nav.verified_desc",
    tone: "blue",
    group: "account",
  },
  {
    id: "security",
    href: "/manage/security",
    icon: ShieldCheck,
    labelKey: "nav.security",
    descKey: "nav.security_desc",
    tone: "blue",
    group: "security",
  },
  {
    id: "billing",
    href: "/manage/billing",
    icon: CreditCard,
    labelKey: "nav.billing",
    descKey: "nav.billing_desc",
    tone: "purple",
    group: "subscription",
  },
  {
    id: "team",
    href: "/manage/team",
    icon: Users,
    labelKey: "nav.team",
    descKey: "nav.team_desc",
    tone: "blue",
    group: "account",
  },
  {
    id: "linked-apps",
    href: "/manage/linked-apps",
    icon: Blocks,
    labelKey: "nav.linked_apps",
    descKey: "nav.linked_apps_desc",
    tone: "orange",
    group: "subscription",
  },
  {
    id: "support",
    href: "/manage/support",
    icon: LifeBuoy,
    labelKey: "nav.support",
    descKey: "nav.support_desc",
    tone: "teal",
    group: "help",
  },
];

export const HUB_GROUPS: { id: string; labelKey: string; itemIds: string[] }[] = [
  { id: "account", labelKey: "hub.group_account", itemIds: ["personal-info", "verified", "team"] },
  { id: "security", labelKey: "hub.group_security", itemIds: ["security"] },
  {
    id: "subscription",
    labelKey: "hub.group_subscription",
    itemIds: ["billing", "linked-apps"],
  },
  { id: "help", labelKey: "hub.group_help", itemIds: ["support"] },
];

export const SUPPORT_NAV: (SecurityNavItem & { icon: LucideIcon; tone: IconTone })[] = [
  {
    id: "tickets",
    href: "/manage/support/tickets",
    icon: Ticket,
    labelKey: "support.tickets",
    descKey: "support.tickets_desc",
    tone: "teal",
  },
  {
    id: "new-ticket",
    href: "/manage/support/tickets/new",
    icon: PlusCircle,
    labelKey: "support.new_ticket",
    descKey: "support.new_ticket_desc",
    tone: "blue",
  },
];

export const SECURITY_NAV: (SecurityNavItem & { icon: LucideIcon; tone: IconTone })[] = [
  {
    id: "two-factor",
    href: "/manage/security/two-factor",
    icon: KeyRound,
    labelKey: "security.two_factor",
    descKey: "security.two_factor_desc",
    tone: "blue",
  },
  {
    id: "sign-in-methods",
    href: "/manage/security/sign-in-methods",
    icon: Link2,
    labelKey: "security.sign_in_methods",
    descKey: "security.sign_in_methods_desc",
    tone: "blue",
  },
  {
    id: "sessions",
    href: "/manage/security/sessions",
    icon: MonitorSmartphone,
    labelKey: "security.sessions",
    descKey: "security.sessions_desc",
    tone: "teal",
  },
  {
    id: "activity",
    href: "/manage/security/activity",
    icon: ScrollText,
    labelKey: "security.activity",
    descKey: "security.activity_desc",
    tone: "purple",
  },
];

export function getMobileTabId(pathname: string): string {
  if (isManageHub(pathname)) return "overview";
  if (pathname.startsWith("/manage/personal-info")) return "personal-info";
  if (pathname.startsWith("/manage/verified")) return "verified";
  if (pathname.startsWith("/manage/security")) return "security";
  if (pathname.startsWith("/manage/billing")) return "billing";
  if (pathname.startsWith("/manage/team")) return "more";
  if (pathname.startsWith("/manage/support") || pathname.startsWith("/manage/linked-apps")) {
    return "more";
  }
  return "overview";
}

export const MOBILE_TAB_NAV: {
  id: string;
  href?: string;
  labelKey: string;
}[] = [
  { id: "overview", href: "/manage", labelKey: "mobile_tabs.home" },
  { id: "personal-info", href: "/manage/personal-info", labelKey: "mobile_tabs.profile" },
  { id: "verified", href: "/manage/verified", labelKey: "nav.verified_short" },
  { id: "security", href: "/manage/security", labelKey: "mobile_tabs.security" },
  { id: "billing", href: "/manage/billing", labelKey: "mobile_tabs.billing" },
  { id: "more", labelKey: "mobile_tabs.more" },
];

export function getManageMobileBackHref(pathname: string): string | null {
  if (isManageHub(pathname)) return null;
  if (isSupportSection(pathname) && pathname !== "/manage/support") {
    if (pathname.startsWith("/manage/support/tickets/") && pathname !== "/manage/support/tickets/new") {
      return "/manage/support/tickets";
    }
    return "/manage/support";
  }
  if (isSecuritySection(pathname) && pathname !== "/manage/security") {
    return "/manage/security";
  }
  if (pathname.startsWith("/manage/team/") && pathname !== "/manage/team") {
    return "/manage/team";
  }
  if (
    pathname === "/manage/personal-info" ||
    pathname === "/manage/verified" ||
    pathname === "/manage/billing" ||
    pathname === "/manage/team" ||
    pathname === "/manage/linked-apps" ||
    pathname === "/manage/support" ||
    pathname === "/manage/security"
  ) {
    return "/manage";
  }
  return "/manage";
}

export function shouldShowMobileBack(pathname: string): boolean {
  return getManageMobileBackHref(pathname) !== null;
}

export function isManageHub(pathname: string): boolean {
  return pathname === "/manage" || pathname === "/manage/";
}

export function isSecuritySection(pathname: string): boolean {
  return pathname.startsWith("/manage/security");
}

export function isSupportSection(pathname: string): boolean {
  return pathname.startsWith("/manage/support");
}

export function isTeamSection(pathname: string): boolean {
  return pathname.startsWith("/manage/team");
}

export function getManagePageTitleKey(pathname: string): string | null {
  if (isManageHub(pathname)) return null;
  if (pathname === "/manage/team/invitations") return "team.incoming_short";
  const all = [
    ...MANAGE_NAV,
    ...SECURITY_NAV.map((s) => ({ href: s.href, labelKey: s.labelKey })),
    ...SUPPORT_NAV.map((s) => ({ href: s.href, labelKey: s.labelKey })),
  ];
  const match = all.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  return match?.labelKey ?? null;
}
