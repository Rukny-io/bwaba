"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@heroui/react";
import { MAIL_DOC_CATEGORY_ICONS } from "@/lib/mail-documents-icons";
import {
  DOCUMENTS_BASE,
  getMailDocumentsNavGroups,
  isMailDocNavActive,
} from "@/lib/mail-documents-nav";

export function MailDocsSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const groups = getMailDocumentsNavGroups();
  const navRef = useRef<HTMLElement>(null);

  const activeGroupId = useMemo(() => {
    for (const group of groups) {
      if (group.items.some((item) => isMailDocNavActive(pathname, item.href))) {
        return group.id;
      }
    }
    return groups[0]?.id ?? null;
  }, [groups, pathname]);

  const [openGroupId, setOpenGroupId] = useState<string | null>(activeGroupId);

  useEffect(() => {
    setOpenGroupId(activeGroupId);
  }, [activeGroupId]);

  useEffect(() => {
    const active = navRef.current?.querySelector<HTMLElement>("[aria-current='page']");
    active?.scrollIntoView({ block: "nearest" });
  }, [pathname]);

  if (groups.length === 0) return null;

  return (
    <>
      <div className="lg:hidden">
        <div className="relative">
          <select
            aria-label="Jump to guide"
            className="h-11 w-full appearance-none border border-[var(--border)] bg-white pe-10 ps-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--foreground)]"
            value={pathname.startsWith(`${DOCUMENTS_BASE}/`) ? pathname : ""}
            onChange={(event) => {
              const next = event.target.value;
              if (next && next !== pathname) router.push(next);
            }}
          >
            <option value="" disabled>
              Jump to guide…
            </option>
            {groups.map((group) => (
              <optgroup key={group.id} label={group.label}>
                {group.items.map((item) => (
                  <option key={item.href} value={item.href}>
                    {item.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]"
            aria-hidden
          />
        </div>
      </div>

      <aside
        className="sticky top-20 hidden max-h-[calc(100dvh-6rem)] w-[15.5rem] shrink-0 self-start overflow-y-auto overscroll-contain pe-2 xl:w-64 lg:block [scrollbar-width:thin]"
      >
        <Link
          href={DOCUMENTS_BASE}
          className="mb-4 block text-[13px] font-medium tracking-[0.1em] text-[var(--muted-foreground)] uppercase transition-colors hover:text-[var(--foreground)]"
        >
          All documents
        </Link>

        <nav ref={navRef} className="flex flex-col gap-1" aria-label="Mail documents">
          {groups.map((group) => {
            const Icon = MAIL_DOC_CATEGORY_ICONS[group.id];
            const isOpen = openGroupId === group.id;
            const isActiveGroup = group.id === activeGroupId;

            return (
              <div key={group.id} className="min-w-0">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() =>
                    setOpenGroupId((current) =>
                      current === group.id ? null : group.id,
                    )
                  }
                  className={cn(
                    "flex w-full items-center gap-2 px-1 py-2 text-start text-[12px] font-semibold tracking-[0.08em] uppercase transition-colors",
                    isActiveGroup || isOpen
                      ? "text-[var(--foreground)]"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
                  )}
                >
                  <Icon className="size-3 shrink-0 opacity-70" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{group.label}</span>
                  <ChevronDown
                    className={cn(
                      "size-3.5 shrink-0 text-[var(--muted-foreground)] transition-transform",
                      isOpen && "rotate-180",
                    )}
                    aria-hidden
                  />
                </button>

                {isOpen ? (
                  <div className="mb-2 flex flex-col border-s border-[var(--border)]">
                    {group.items.map((item) => {
                      const active = isMailDocNavActive(pathname, item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          prefetch
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "-ms-px border-s-2 py-2 ps-3 text-sm leading-snug transition-colors",
                            active
                              ? "border-[var(--foreground)] font-medium text-[var(--foreground)]"
                              : "border-transparent text-[var(--muted-foreground)] hover:border-[var(--border)] hover:text-[var(--foreground)]",
                          )}
                        >
                          <span className="line-clamp-2">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
