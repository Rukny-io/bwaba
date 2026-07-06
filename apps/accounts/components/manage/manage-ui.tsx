"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IconTone } from "@/lib/manage/types";
import { resolveMediaUrl } from "@/lib/media-url";
import { VerifiedDisplayName } from "./verified-badge";

/** Google Account–style: flat canvas + white grouped lists, no shadows */
export const ui = {
  canvas: "bg-background",
  page: "flex flex-col gap-4",
  group: "overflow-hidden rounded-[20px] bg-card",
  divider: "border-b border-border/80 last:border-b-0",
  profileAvatar:
    "h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-border/80",
  navAvatar:
    "h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border/80",
  sidebarActive: "bg-primary/10 text-primary font-medium",
  sidebarIdle:
    "text-foreground/80 hover:bg-muted/80",
} as const;

export const toneStyles: Record<
  IconTone,
  string
> = {
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-400",
  purple: "bg-violet-100 text-violet-700 dark:bg-violet-950/80 dark:text-violet-400",
  orange: "bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400",
  teal: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/80 dark:text-cyan-400",
  red: "bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-400",
};

export const toneStylesMuted =
  "bg-muted text-muted-foreground dark:bg-muted/80";

export function ManagePageStack({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(ui.page, className)}>{children}</div>;
}

export function ManagePageHeader({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <header className={cn("px-0.5 pb-1", className)}>
      <h1 className="text-[22px] font-normal tracking-tight text-foreground">
        {title}
      </h1>
      {description && (
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </header>
  );
}

export function ManageGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(ui.group, className)}>{children}</div>;
}

export function ManageIconCircle({
  icon: Icon,
  tone = "blue",
  muted = false,
  className,
}: {
  icon: LucideIcon;
  tone?: IconTone;
  muted?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full",
        muted ? toneStylesMuted : toneStyles[tone],
        className,
      )}
    >
      <Icon className="size-[18px]" strokeWidth={1.75} />
    </div>
  );
}

export function ManageListItem({
  icon,
  tone = "blue",
  title,
  subtitle,
  onClick,
  href,
  trailing,
  mutedIcon,
  className,
}: {
  icon: LucideIcon;
  tone?: IconTone;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  href?: string;
  trailing?: React.ReactNode;
  mutedIcon?: boolean;
  className?: string;
}) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const Chevron = isRtl ? ChevronLeft : ChevronRight;

  const inner = (
    <>
      <ManageIconCircle icon={icon} tone={tone} muted={mutedIcon} />
      <div className="min-w-0 flex-1 py-0.5">
        <p className="text-sm font-medium leading-snug text-foreground">{title}</p>
        {subtitle && (
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {trailing ?? (
        <Chevron className="size-[18px] shrink-0 text-muted-foreground/45" />
      )}
    </>
  );

  const rowClass = cn(
    "flex w-full items-center gap-3 px-4 py-3.5 text-start transition-colors",
    ui.divider,
    "hover:bg-muted/40 active:bg-muted/60",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={rowClass}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={rowClass}>
      {inner}
    </button>
  );
}

/** Detail page row: gray icon + label + value (Google personal info style) */
export function ManageInfoRow({
  icon: Icon,
  label,
  value,
  children,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-4 px-4 py-4", ui.divider, className)}>
      <ManageIconCircle icon={Icon} muted />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        {value !== undefined && (
          <div className="mt-1 text-sm text-foreground">{value}</div>
        )}
        {children}
      </div>
    </div>
  );
}

export function ManageAvatar({
  avatar,
  initials,
  alt = "",
  size = "profile",
  className,
}: {
  avatar?: string | null;
  initials: string;
  alt?: string;
  size?: "profile" | "nav";
  className?: string;
}) {
  const avatarSrc = resolveMediaUrl(avatar);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [avatarSrc]);

  const shellClass =
    size === "profile" ? ui.profileAvatar : ui.navAvatar;
  const textClass =
    size === "profile" ? "text-2xl font-normal" : "text-xs font-medium";
  const showImage = Boolean(avatarSrc) && !failed;

  return (
    <div className={cn(shellClass, className)}>
      {showImage ? (
        <img
          src={avatarSrc!}
          alt={alt}
          className="block h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center text-foreground",
            textClass,
          )}
        >
          {initials}
        </div>
      )}
    </div>
  );
}

export function ManageProfileStrip({
  avatar,
  initials,
  name,
  email,
  username,
  verified = false,
  onAvatarClick,
}: {
  avatar?: string | null;
  initials: string;
  name: string;
  email: string;
  username?: string | null;
  verified?: boolean;
  onAvatarClick?: () => void;
}) {
  const avatarEl = (
    <ManageAvatar avatar={avatar} initials={initials} alt={name} size="profile" />
  );

  const avatarWrap = <div className="relative shrink-0">{avatarEl}</div>;

  return (
    <div className="flex items-center gap-4 px-0.5 py-2">
      {onAvatarClick ? (
        <button type="button" onClick={onAvatarClick} className="relative shrink-0">
          {avatarWrap}
        </button>
      ) : (
        avatarWrap
      )}
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-xl font-normal leading-tight text-foreground">
          <VerifiedDisplayName name={name} verified={verified} badgeSize={18} />
        </h2>
        <p className="mt-0.5 truncate text-sm text-muted-foreground" dir="ltr">
          {email}
        </p>
        {username && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground" dir="ltr">
            @{username}
          </p>
        )}
      </div>
    </div>
  );
}

export function ManageSidebarItem({
  href,
  icon: Icon,
  label,
  active,
  tone,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  tone: IconTone;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-full px-3 py-2 text-sm transition-colors",
        active ? ui.sidebarActive : ui.sidebarIdle,
      )}
    >
      <ManageIconCircle icon={Icon} tone={tone} className="size-8 [&_svg]:size-4" />
      <span>{label}</span>
    </Link>
  );
}

export function ManageSection({
  title,
  children,
  variant = "default",
}: {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  variant?: "default" | "danger";
}) {
  return (
    <section className={cn("pt-6", variant === "danger" && "pt-8")}>
      {title && (
        <h2
          className={cn(
            "mb-3 px-0.5 text-sm font-medium",
            variant === "danger" ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

export function ManageSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex justify-center py-16", className)}>
      <div
        className="size-7 animate-spin rounded-full border-2 border-border border-t-primary"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

export function ManageEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <ManageGroup className="px-6 py-14 text-center">
      <ManageIconCircle icon={Icon} muted className="mx-auto mb-4 size-12" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </ManageGroup>
  );
}

export function ManageSuccessBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[20px] border border-emerald-500/20 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
      {children}
    </div>
  );
}

/** @deprecated use ManageGroup */
export function ManageCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return <ManageGroup className={cn("p-4", className)}>{children}</ManageGroup>;
}

export function ManageRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3 px-4 py-3.5", ui.divider, className)}>
      {children}
    </div>
  );
}

export function ManageIconBox({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground", className)}>
      {children}
    </div>
  );
}

export function ManageProfileHero(props: {
  avatar?: string | null;
  initials: string;
  name: string;
  email: string;
  username?: string | null;
}) {
  return <ManageProfileStrip {...props} />;
}

export function ManageFieldGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return <ManageGroup className={className}>{children}</ManageGroup>;
}

export function ManageStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-[20px] bg-card px-3 py-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-sm font-medium", highlight && "text-amber-600")}>{value}</p>
    </div>
  );
}
