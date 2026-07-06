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
    id: "linked-apps",
    href: "/manage/linked-apps",
    icon: Blocks,
    labelKey: "nav.linked_apps",
    tone: "orange",
  },
];

export const MANAGE_NAV: {
  id: string;
  href: string;
  icon: LucideIcon;
  labelKey: string;
  descKey: string;
  tone: IconTone;
  group: "account" | "security" | "subscription";
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
    id: "linked-apps",
    href: "/manage/linked-apps",
    icon: Blocks,
    labelKey: "nav.linked_apps",
    descKey: "nav.linked_apps_desc",
    tone: "orange",
    group: "subscription",
  },
];

export const HUB_GROUPS: { id: string; labelKey: string; itemIds: string[] }[] = [
  { id: "account", labelKey: "hub.group_account", itemIds: ["personal-info", "verified"] },
  { id: "security", labelKey: "hub.group_security", itemIds: ["security"] },
  {
    id: "subscription",
    labelKey: "hub.group_subscription",
    itemIds: ["billing", "linked-apps"],
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

export function isManageHub(pathname: string): boolean {
  return pathname === "/manage" || pathname === "/manage/";
}

export function isSecuritySection(pathname: string): boolean {
  return pathname.startsWith("/manage/security");
}

export function getManagePageTitleKey(pathname: string): string | null {
  if (isManageHub(pathname)) return null;
  const all = [...MANAGE_NAV, ...SECURITY_NAV.map((s) => ({ href: s.href, labelKey: s.labelKey }))];
  const match = all.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  return match?.labelKey ?? null;
}
