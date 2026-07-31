"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, Check, ChevronDown, User } from "lucide-react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import {
  fetchAccessibleWorkspaces,
  type AccessibleWorkspaceDto,
} from "@/lib/manage/api";

const ACTIVE_WORKSPACE_COOKIE = "active_workspace_id";
const ID_RE = /^[A-Za-z0-9_-]+$/;

function isValidId(v: string | null | undefined): v is string {
  return typeof v === "string" && v.length > 0 && v.length <= 128 && ID_RE.test(v);
}

function readActiveId(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|; )active_workspace_id=([^;]*)/);
  if (!m) return null;
  const raw = decodeURIComponent(m[1] ?? "");
  return isValidId(raw) ? raw : null;
}

function writeActiveId(id: string | null): void {
  if (typeof document === "undefined") return;
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  if (!id) {
    document.cookie = [
      `${ACTIVE_WORKSPACE_COOKIE}=`,
      "Path=/",
      "Max-Age=0",
      "SameSite=Lax",
      isSecure ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; ");
    return;
  }
  if (!isValidId(id)) return;
  document.cookie = [
    `${ACTIVE_WORKSPACE_COOKIE}=${encodeURIComponent(id)}`,
    "Path=/",
    `Max-Age=${30 * 24 * 60 * 60}`,
    "SameSite=Lax",
    isSecure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function labelFor(ws: AccessibleWorkspaceDto): string {
  return (
    ws.owner.profile?.name ||
    ws.owner.profile?.username ||
    ws.owner.email ||
    ws.id
  );
}

interface WorkspaceSwitcherProps {
  currentUserId: string;
  className?: string;
}

export function WorkspaceSwitcher({
  currentUserId,
  className,
}: WorkspaceSwitcherProps) {
  const locale = useLocale();
  const ownerLabel = locale === "ar" ? "المالك" : "Owner";
  const [workspaces, setWorkspaces] = useState<AccessibleWorkspaceDto[]>([]);
  const [activeId, setActiveId] = useState<string>(currentUserId);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAccessibleWorkspaces()
      .then((data) => {
        if (cancelled) return;
        setWorkspaces(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setWorkspaces([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const stored = readActiveId();
    if (stored && workspaces.some((w) => w.id === stored)) {
      setActiveId(stored);
    } else {
      setActiveId(currentUserId);
      if (stored) writeActiveId(null);
    }
  }, [currentUserId, workspaces]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = useMemo(
    () => workspaces.find((w) => w.id === activeId) ?? workspaces[0],
    [workspaces, activeId],
  );

  if (!current || workspaces.length < 2) return null;

  const CurrentIcon = current.isOwner ? User : Building2;

  const handleSelect = (id: string) => {
    if (id === activeId) {
      setOpen(false);
      return;
    }
    const target = workspaces.find((w) => w.id === id);
    if (!target) return;
    writeActiveId(target.isOwner ? null : target.id);
    setActiveId(id);
    setOpen(false);
    if (typeof window !== "undefined") window.location.reload();
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-2xl border border-border/60 bg-muted/40 px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <CurrentIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-start">
          {labelFor(current)}
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute start-0 end-0 mt-1.5 rounded-2xl border border-border/60 bg-popover p-1.5 shadow-lg z-30"
        >
          {workspaces.map((ws) => {
            const isCurrent = ws.id === activeId;
            const Icon = ws.isOwner ? User : Building2;
            return (
              <button
                key={ws.id}
                type="button"
                role="option"
                aria-selected={isCurrent}
                onClick={() => handleSelect(ws.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-start transition-colors",
                  isCurrent ? "bg-muted" : "hover:bg-muted/70",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">
                    {labelFor(ws)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {ws.isOwner ? ownerLabel : ws.role}
                  </span>
                </div>
                {isCurrent && (
                  <Check className="size-4 shrink-0 text-primary" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
