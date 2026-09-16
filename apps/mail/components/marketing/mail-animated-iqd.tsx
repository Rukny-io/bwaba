"use client";

import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";
import { cn } from "@heroui/react";
import { formatEstimateIqD } from "@/lib/mail-estimate-catalog";

type MailAnimatedIqDProps = {
  value: number;
  className?: string;
  suffix?: React.ReactNode;
  suffixClassName?: string;
  size?: "hero" | "line";
  delay?: number;
};

const EASE = [0.16, 1, 0.3, 1] as const;
const REST = "#111111";
const UP = "#666666";
const DOWN = "#78716c";

/**
 * Smooth IQD tween with a soft pop when the estimate rises or falls.
 */
export function MailAnimatedIqD({
  value,
  className,
  suffix,
  suffixClassName,
  size = "line",
  delay = 0,
}: MailAnimatedIqDProps) {
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(value);
  const prevRef = useRef(value);
  const [display, setDisplay] = useState(() => formatEstimateIqD(value));
  const [pulse, setPulse] = useState<{ id: number; dir: 1 | -1 } | null>(null);
  const isHero = size === "hero";

  useMotionValueEvent(motionValue, "change", (latest) => {
    setDisplay(formatEstimateIqD(latest));
  });

  useEffect(() => {
    const prev = prevRef.current;
    if (prev === value) return;

    const dir: 1 | -1 = value > prev ? 1 : -1;
    prevRef.current = value;

    if (reduceMotion) {
      motionValue.jump(value);
      setDisplay(formatEstimateIqD(value));
      setPulse(null);
      return;
    }

    setPulse({ id: Date.now(), dir });

    const controls = animate(motionValue, value, {
      type: "spring",
      stiffness: isHero ? 28 : 40,
      damping: isHero ? 14 : 16,
      mass: isHero ? 1.2 : 0.95,
      restDelta: 0.15,
      restSpeed: 0.15,
      delay,
    });

    return () => controls.stop();
  }, [value, reduceMotion, motionValue, isHero, delay]);

  const lift = isHero ? 7 : 4;
  const pop = isHero ? 1.045 : 1.025;

  return (
    <motion.span
      className={cn(
        "inline-flex items-baseline tabular-nums will-change-transform",
        className,
      )}
      animate={
        reduceMotion || !pulse
          ? { y: 0, scale: 1, color: REST }
          : {
              y: [0, pulse.dir > 0 ? -lift : lift, 0],
              scale: [1, pop, 1],
              color: [REST, pulse.dir > 0 ? UP : DOWN, REST],
            }
      }
      transition={
        reduceMotion || !pulse
          ? { duration: 0 }
          : {
              y: { duration: isHero ? 0.7 : 0.55, ease: EASE, delay },
              scale: {
                duration: isHero ? 0.7 : 0.55,
                ease: EASE,
                delay,
              },
              color: {
                duration: isHero ? 1.15 : 0.85,
                times: [0, 0.35, 1],
                ease: "easeOut",
                delay,
              },
            }
      }
    >
      <span aria-hidden>{display}</span>
      <span className="sr-only">{formatEstimateIqD(value)}</span>
      {suffix != null ? (
        <span className={cn("ms-0.5", suffixClassName)}>{suffix}</span>
      ) : null}
    </motion.span>
  );
}
