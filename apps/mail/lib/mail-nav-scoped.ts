import {
  isNavItemActive as isPathActive,
  MAIL_HEADER_NAV as RAW_HEADER_NAV,
  MAIL_PRIMARY_NAV as RAW_PRIMARY_NAV,
  MAIL_SECONDARY_NAV as RAW_SECONDARY_NAV,
  MAIL_SIDEBAR_FOOTER_NAV as RAW_FOOTER_NAV,
  type MailNavItem,
} from "@/lib/mail-nav";
import { parseMailSlot, stripMailSlotPrefix, withMailSlot } from "@/lib/mail-slot";

export type { MailNavItem };

function prefixNav(items: MailNavItem[], slot: number | null): MailNavItem[] {
  if (slot === null) return items;
  return items.map((item) => ({
    ...item,
    href: withMailSlot(item.href, slot),
  }));
}

export function mailNavForPathname(pathname: string) {
  const slot = parseMailSlot(pathname);
  return {
    slot,
    primary: prefixNav(RAW_PRIMARY_NAV, slot),
    secondary: prefixNav(RAW_SECONDARY_NAV, slot),
    footer: prefixNav(RAW_FOOTER_NAV, slot),
    header: RAW_HEADER_NAV.map((item) => ({
      ...item,
      href: withMailSlot(item.href, slot),
    })),
  };
}

export function isNavItemActive(
  pathname: string,
  href: string,
  exact?: boolean,
): boolean {
  return isPathActive(stripMailSlotPrefix(pathname), stripMailSlotPrefix(href), exact);
}
