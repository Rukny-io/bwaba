"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@heroui/react";

type FrameCtaVariant = "primary" | "ghost";

const MotionLink = motion.create(Link);

const variantClass: Record<FrameCtaVariant, string> = {
  primary:
    "border border-[#111111] bg-[#111111] text-white group-hover:border-[#111111] group-hover:bg-[#111111] group-focus-visible:border-[#111111] group-focus-visible:bg-[#111111]",
  ghost:
    "border border-[#e8e8e8] bg-transparent text-[#666666] group-hover:border-[#111111]/30 group-hover:text-[#111111] group-focus-visible:border-[#111111]/30 group-focus-visible:text-[#111111]",
};

const TICK_EASE = [0.22, 1, 0.36, 1] as const;

const TICK_REST = {
  tl: { x: -1, y: -1 },
  tr: { x: 1, y: -1 },
  bl: { x: -1, y: 1 },
  br: { x: 1, y: 1 },
} as const;

const TICK_HOVER = {
  tl: { x: 5, y: 5 },
  tr: { x: -5, y: 5 },
  bl: { x: 5, y: -5 },
  br: { x: -5, y: -5 },
} as const;

const TICK_ACTIVE = {
  tl: { x: 6, y: 6 },
  tr: { x: -6, y: 6 },
  bl: { x: 6, y: -6 },
  br: { x: -6, y: -6 },
} as const;

function CornerTick({
  corner,
  reduceMotion,
}: {
  corner: keyof typeof TICK_REST;
  reduceMotion: boolean | null;
}) {
  if (reduceMotion) {
    return (
      <span
        className={`mail-frame-tick mail-frame-tick--${corner} mail-frame-tick--static`}
      />
    );
  }

  return (
    <motion.span
      className={`mail-frame-tick mail-frame-tick--${corner}`}
      initial={TICK_REST[corner]}
      variants={{
        rest: {
          ...TICK_REST[corner],
          opacity: 0.72,
          transition: { duration: 0.32, ease: TICK_EASE },
        },
        hover: {
          ...TICK_HOVER[corner],
          opacity: 1,
          transition: {
            duration: 0.38,
            ease: TICK_EASE,
            delay: corner === "tl" ? 0 : corner === "br" ? 0.08 : 0.04,
          },
        },
        active: {
          ...TICK_ACTIVE[corner],
          opacity: 1,
          transition: { duration: 0.12, ease: "easeOut" },
        },
      }}
    />
  );
}

function CornerTicks({ reduceMotion }: { reduceMotion: boolean | null }) {
  return (
    <span className="mail-frame-ticks" aria-hidden>
      <CornerTick corner="tl" reduceMotion={reduceMotion} />
      <CornerTick corner="tr" reduceMotion={reduceMotion} />
      <CornerTick corner="bl" reduceMotion={reduceMotion} />
      <CornerTick corner="br" reduceMotion={reduceMotion} />
    </span>
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
  const reduceMotion = useReducedMotion();

  return (
    <MotionLink
      href={href}
      className={cn(
        "mail-frame-cta group relative inline-flex items-center justify-center gap-2 p-1.5 focus-visible:outline-none",
        `mail-frame-cta--${variant}`,
        className,
      )}
      initial="rest"
      whileHover="hover"
      whileFocus="hover"
      whileTap="active"
    >
      <CornerTicks reduceMotion={reduceMotion} />
      <span
        className={cn(
          "relative inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[15px] font-medium leading-[1.4] transition-[color,background-color,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          variantClass[variant],
        )}
      >
        {children}
      </span>
    </MotionLink>
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
  const reduceMotion = useReducedMotion();

  return (
    <motion.span
      className={cn(
        "mail-frame-cta group relative inline-flex p-1.5",
        `mail-frame-cta--${variant}`,
        className,
      )}
      initial="rest"
      whileHover={disabled ? undefined : "hover"}
      whileFocus={disabled ? undefined : "hover"}
      whileTap={disabled ? undefined : "active"}
    >
      <CornerTicks reduceMotion={reduceMotion} />
      <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={cn(
          "relative inline-flex w-full items-center justify-center gap-2 px-5 py-2.5 text-[15px] font-medium leading-[1.4] transition-[color,background-color,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] disabled:opacity-60",
          variantClass[variant],
        )}
      >
        {children}
      </button>
    </motion.span>
  );
}
