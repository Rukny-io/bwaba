"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Surface } from "@heroui/react";
import { Label } from "@/components/ui/label";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { IconTone, ProfileTaskId, UserProfile } from "@/lib/manage/types";
import { getProfileCompletion } from "@/lib/manage/profile-completion";
import { useManage } from "@/lib/manage/context";
import { resolveMediaUrl } from "@/lib/media-url";
import { VerifiedDisplayName } from "./verified-badge";

/** Google Account–style: flat canvas + grouped lists */
export const ui = {
  canvas: "bg-background",
  page: "flex flex-col gap-6",
  group: "manage-surface",
  chipSelected:
    "border-primary bg-primary/10 text-primary",
  chipIdle:
    "border-border bg-background text-muted-foreground hover:bg-muted/50",
  divider: "border-b border-border/50 last:border-b-0",
  profileAvatar:
    "h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-border/60",
  navAvatar:
    "h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border/60",
  sidebarActive: "border-s-2 border-primary bg-primary/10 ps-[10px] text-primary font-medium",
  sidebarIdle:
    "text-foreground/85 hover:bg-muted/70",
  sectionTitle: "px-0.5 text-sm font-medium text-foreground",
  sectionDesc: "mt-1.5 px-0.5 text-sm leading-relaxed text-muted-foreground",
  row: "flex items-center justify-between gap-4 px-5 py-4",
  rowHover: "hover:bg-muted/35 active:bg-muted/55",
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
  titleShort,
  description,
  className,
}: {
  title: string;
  titleShort?: string;
  description?: string;
  className?: string;
}) {
  const mobileTitle = titleShort ?? title;

  return (
    <header className={cn("px-0.5 pb-2", className)}>
      <h1 className="text-[22px] font-normal tracking-tight text-foreground lg:hidden">
        {mobileTitle}
      </h1>
      <h1 className="hidden text-[22px] font-normal tracking-tight text-foreground lg:block">
        {title}
      </h1>
      {description && (
        <p className={ui.sectionDesc}>
          {description}
        </p>
      )}
    </header>
  );
}

export function ManageSubheading({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <h2 className={ui.sectionTitle}>{title}</h2>
      {description && <p className={ui.sectionDesc}>{description}</p>}
    </div>
  );
}

export function ManageNotice({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("manage-notice", className)} role="note">
      <svg
        className="manage-notice-icon"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
        />
      </svg>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function ManageFormField({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2.5", className)}>
      <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      {children}
      {hint ? (
        <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function ManageFormBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-5 px-5 py-5 sm:px-6 sm:py-6", className)}>
      {children}
    </div>
  );
}

export function ManageFormFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 border-t border-border/50 px-5 py-4 sm:px-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ManageLinkButton({
  href,
  external = false,
  children,
  className,
  ...props
}: React.ComponentProps<"a"> & { external?: boolean }) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-full border border-border/60 bg-background px-4 text-sm font-medium text-foreground",
        "transition-colors hover:bg-muted/50 active:bg-muted/70",
        className,
      )}
      {...props}
    >
      {children}
    </a>
  );
}

export function ManageGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Surface
      variant="default"
      className={cn(ui.group, "min-w-0", className)}
    >
      {children}
    </Surface>
  );
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
    "flex w-full items-center gap-3.5 px-5 py-4 text-start transition-colors",
    ui.divider,
    ui.rowHover,
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
    <div className={cn("flex gap-4 px-5 py-4", ui.divider, className)}>
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
    <div className="flex items-center gap-4 rounded-[20px] border border-border/50 bg-card px-5 py-5">
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
  badge,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  tone: IconTone;
  badge?: number;
}) {
  const showBadge = typeof badge === "number" && badge > 0;
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-full py-2 text-sm transition-colors",
        active
          ? cn(ui.sidebarActive, "px-3")
          : cn(ui.sidebarIdle, "px-3"),
      )}
    >
      <ManageIconCircle icon={Icon} tone={tone} className="size-8 [&_svg]:size-4" />
      <span className="flex-1 truncate">{label}</span>
      {showBadge && (
        <span
          className="ms-auto inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary-foreground"
          aria-label={`${badge} pending`}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

export function ManageSection({
  title,
  children,
  variant = "default",
  className,
}: {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  variant?: "default" | "danger";
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", variant === "danger" ? "pt-2" : "pt-1", className)}>
      {title && (
        <h2
          className={cn(
            ui.sectionTitle,
            variant === "danger" && "text-destructive",
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
  const t = useTranslations("Common");
  return (
    <div className={cn("flex justify-center py-16", className)}>
      <div
        className="size-7 animate-spin rounded-full border-2 border-border border-t-primary"
        role="status"
        aria-label={t("loading")}
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
    <div className={cn(ui.row, ui.divider, className)}>
      {children}
    </div>
  );
}

export function ManageIconBox({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground", className)}>
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

export function ManageStat({
  label,
  value,
  highlight,
  href,
  onClick,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  href?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-sm font-medium",
          highlight && "text-amber-600 dark:text-amber-400",
        )}
      >
        {value}
      </p>
    </>
  );

  const shellClass =
    "rounded-[20px] bg-card px-3 py-3 text-start transition-colors hover:bg-muted/40";

  if (href) {
    return (
      <Link href={href} className={cn(shellClass, "block")}>
        {inner}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(shellClass, "w-full")}>
        {inner}
      </button>
    );
  }

  return <div className={shellClass}>{inner}</div>;
}


export function ManageProfileTaskSlider({
  profile,
  onTaskAction,
  variant = "inline",
  className,
}: {
  profile: UserProfile;
  onTaskAction: (taskId: ProfileTaskId) => void;
  variant?: "inline" | "sidebar";
  className?: string;
}) {
  const t = useTranslations("Manage");
  const { tasks, completed, total, isComplete } = getProfileCompletion(profile);
  const isSidebar = variant === "sidebar";

  if (isComplete && isSidebar) return null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/40 bg-card",
        isSidebar && "mx-1",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="truncate text-[11px] font-medium text-foreground">
            {t("personal_info.completion_title")}
          </p>
        </div>
        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
          {completed}/{total}
        </span>
      </div>

      <ul className="border-t border-border/40 px-1.5 py-1">
        {tasks.map((task) => {
          const label = t(`personal_info.tasks.${task.id}.short`);
          return (
            <li key={task.id}>
              {task.completed ? (
                <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <Check className="size-2.5" strokeWidth={2.5} />
                  </span>
                  <span className="truncate text-[11px] text-muted-foreground line-through decoration-muted-foreground/40">
                    {label}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onTaskAction(task.id)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-start transition-colors hover:bg-muted/50"
                >
                  <span className="size-4 shrink-0 rounded-full border border-border" />
                  <span className="truncate text-[11px] text-foreground">
                    {label}
                  </span>
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {isComplete && !isSidebar && (
        <p className="border-t border-border/40 px-3 py-2 text-center text-[10px] text-emerald-600 dark:text-emerald-400">
          {t("personal_info.completion_done_title")}
        </p>
      )}
    </div>
  );
}

export function ManageSidebarCompletion() {
  const router = useRouter();
  const { profile } = useManage();

  if (!profile) return null;

  const handleTaskAction = (taskId: ProfileTaskId) => {
    router.push(`/manage/personal-info?focus=${taskId}`);
  };

  return (
    <div className="mt-5 px-1">
      <ManageProfileTaskSlider
        profile={profile}
        onTaskAction={handleTaskAction}
        variant="sidebar"
      />
    </div>
  );
}
