"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { ManageAvatar } from "./manage-ui";

export function SupportChatAvatar({
  variant,
  avatar,
  initials,
  alt,
  className,
}: {
  variant: "user" | "staff";
  avatar?: string | null;
  initials?: string;
  alt?: string;
  className?: string;
}) {
  if (variant === "staff") {
    return (
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 ring-2 ring-primary/20",
          className,
        )}
      >
        <Image
          src="/rukny-logo.svg"
          alt={alt ?? "Rukny"}
          width={22}
          height={22}
          className="size-[22px] object-contain"
        />
      </div>
    );
  }

  return (
    <ManageAvatar
      avatar={avatar}
      initials={initials ?? "?"}
      alt={alt ?? ""}
      size="nav"
      className={cn("!size-9 shrink-0", className)}
    />
  );
}
