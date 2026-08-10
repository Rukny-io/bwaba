'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

function easeOutCubic(progress: number) {
  return 1 - (1 - progress) ** 3;
}

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export interface AnimatedNumberProps {
  value: number;
  format?: (value: number) => string;
  duration?: number;
  delay?: number;
  className?: string;
  /** When true, the first render animates from 0. Otherwise from the previous value. */
  animateFromZeroOnMount?: boolean;
}

export function AnimatedNumber({
  value,
  format = (n) => String(Math.round(n)),
  duration = 900,
  delay = 0,
  className,
  animateFromZeroOnMount = true,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const displayRef = useRef(value);
  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isFirstMountRef = useRef(true);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplay(value);
      displayRef.current = value;
      isFirstMountRef.current = false;
      return;
    }

    const from =
      isFirstMountRef.current && animateFromZeroOnMount ? 0 : displayRef.current;
    isFirstMountRef.current = false;

    if (from === value) {
      setDisplay(value);
      displayRef.current = value;
      return;
    }

    startTimeRef.current = null;

    const tick = (now: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = now + delay;
      }

      if (now < startTimeRef.current) {
        frameRef.current = requestAnimationFrame(tick);
        return;
      }

      const elapsed = now - startTimeRef.current;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(progress);
      const current = from + (value - from) * eased;

      setDisplay(current);
      displayRef.current = current;

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
        displayRef.current = value;
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [value, duration, delay, animateFromZeroOnMount]);

  return (
    <span className={cn('metric-value-animate inline-block tabular-nums', className)}>
      {format(display)}
    </span>
  );
}
