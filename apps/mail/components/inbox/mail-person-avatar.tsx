"use client";

import { useEffect, useState } from "react";
import { cn } from "@heroui/react";
import { resolveAvatarUrl } from "@/lib/media-url";

type Props = {
  name: string;
  email?: string | null;
  avatarUrl?: string | null;
  className?: string;
  textClassName?: string;
};

function initials(name: string) {
  return name
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

export function MailPersonAvatar({
  name,
  email,
  avatarUrl,
  className,
  textClassName,
}: Props) {
  const resolved = resolveAvatarUrl(avatarUrl);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolved]);

  if (resolved && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolved}
        alt=""
        className={cn("size-10 shrink-0 rounded-full object-cover", className)}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-blue-soft)] text-xs font-semibold text-[var(--secondary-foreground)]",
        className,
        textClassName,
      )}
      title={email ?? name}
    >
      {initials(name)}
    </span>
  );
}
