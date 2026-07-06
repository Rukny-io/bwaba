"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export function VerifiedDisplayName({
  name,
  verified = false,
  badgeSize = 18,
  className,
}: {
  name: string;
  verified?: boolean;
  badgeSize?: number;
  className?: string;
}) {
  return (
    <span
      dir="ltr"
      className={cn("inline-flex max-w-full items-center gap-1.5", className)}
    >
      <span className="truncate">{name}</span>
      {verified && (
        <VerifiedBadge size={badgeSize} className="shrink-0 self-center" />
      )}
    </span>
  );
}

export function VerifiedBadge({
  className,
  size = 18,
  title = "Rukny Verified",
}: {
  className?: string;
  size?: number;
  title?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const gradientId = `verified-gradient-${uid}`;

  return (
    <svg
      aria-label={title}
      role="img"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
    >
      <title>{title}</title>
      <path
        d="M13.9844 3.40625L14.2471 3.65625L14.6055 3.60645L18.0098 3.13281L18.5977 6.48145L18.6611 6.84375L18.9873 7.01562L22.0059 8.60156L20.4941 11.6963L20.332 12.0283L20.4961 12.3594L22.002 15.3994L18.9873 16.9844L18.6611 17.1562L18.5977 17.5186L18.0098 20.8662L14.6055 20.3936L14.2471 20.3438L13.9844 20.5938L11.5 22.9629L9.01562 20.5938L8.75293 20.3438L8.39453 20.3936L4.98926 20.8662L4.40234 17.5186L4.33887 17.1562L4.0127 16.9844L0.99707 15.3994L2.50391 12.3594L2.66797 12.0283L2.50586 11.6963L0.993164 8.60156L4.0127 7.01562L4.33887 6.84375L4.40234 6.48145L4.98926 3.13281L8.39453 3.60645L8.75293 3.65625L9.01562 3.40625L11.5 1.03613L13.9844 3.40625Z"
        fill={`url(#${gradientId})`}
      />
      <path
        d="M6 12.3279L9.76623 16L16 9.35519L14.5281 8L9.67965 13.1585L7.42857 10.929L6 12.3279Z"
        fill="#F4F4F5"
      />
      <defs>
        <linearGradient id={gradientId} x1="11.5" y1="1" x2="11.5" y2="23" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
    </svg>
  );
}
