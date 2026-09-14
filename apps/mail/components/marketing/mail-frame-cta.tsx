import Link from "next/link";
import { cn } from "@heroui/react";

type FrameCtaVariant = "primary" | "ghost";

const variantClass: Record<FrameCtaVariant, string> = {
  primary:
    "mail-frame-cta mail-frame-cta--primary border border-[#062c30] bg-[#062c30] text-white hover:border-[#1c1917] hover:bg-[#1c1917]",
  ghost:
    "mail-frame-cta mail-frame-cta--ghost border border-[#e7e5e4] bg-transparent text-[#57534e] hover:border-[#1c1917]/25 hover:text-[#1c1917]",
};

function CornerTicks() {
  return (
    <>
      <span className="mail-frame-tick mail-frame-tick--tl" aria-hidden />
      <span className="mail-frame-tick mail-frame-tick--tr" aria-hidden />
      <span className="mail-frame-tick mail-frame-tick--bl" aria-hidden />
      <span className="mail-frame-tick mail-frame-tick--br" aria-hidden />
    </>
  );
}

export function MailFrameLink({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: FrameCtaVariant;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 p-1.5",
        className,
      )}
    >
      <span
        className={cn(
          "relative inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[15px] font-medium leading-[1.4] transition-colors duration-200",
          variantClass[variant],
        )}
      >
        <CornerTicks />
        {children}
      </span>
    </Link>
  );
}

export function MailFrameButton({
  children,
  variant = "primary",
  className,
  type = "button",
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  variant?: FrameCtaVariant;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <span className={cn("group relative inline-flex p-1.5", className)}>
      <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={cn(
          "relative inline-flex w-full items-center justify-center gap-2 px-5 py-2.5 text-[15px] font-medium leading-[1.4] transition-colors duration-200 disabled:opacity-60",
          variantClass[variant],
        )}
      >
        <CornerTicks />
        {children}
      </button>
    </span>
  );
}
