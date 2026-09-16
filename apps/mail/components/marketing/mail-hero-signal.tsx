"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";
import { cn } from "@heroui/react";
import type { CobeArc, CobeMarker } from "@/components/ui/cobe-globe";

const Globe = dynamic(
  () => import("@/components/ui/cobe-globe").then((m) => m.Globe),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto aspect-square w-full rounded-full bg-white/[0.05]" />
    ),
  },
);

const HERO_MARKERS: CobeMarker[] = [
  { id: "bgd", location: [33.3152, 44.3661], label: "Baghdad" },
  { id: "ruh", location: [24.7136, 46.6753], label: "Riyadh" },
  { id: "dxb", location: [25.2048, 55.2708], label: "Dubai" },
  { id: "nyc", location: [40.7128, -74.006], label: "New York" },
  { id: "ber", location: [52.52, 13.405], label: "Berlin" },
];

const HERO_ARCS: CobeArc[] = [
  {
    id: "bgd-ruh",
    from: [33.3152, 44.3661],
    to: [24.7136, 46.6753],
    label: "Send → Riyadh",
    color: [1, 1, 1],
  },
  {
    id: "nyc-bgd",
    from: [40.7128, -74.006],
    to: [33.3152, 44.3661],
    label: "Receive ← New York",
    color: [0.55, 0.75, 1],
  },
  {
    id: "bgd-dxb",
    from: [33.3152, 44.3661],
    to: [25.2048, 55.2708],
    label: "Send → Dubai",
    color: [1, 1, 1],
  },
  {
    id: "ber-bgd",
    from: [52.52, 13.405],
    to: [33.3152, 44.3661],
    label: "Receive ← Berlin",
    color: [0.55, 0.75, 1],
  },
];

function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return desktop;
}

/** Mount WebGL only when visible + browser is idle. */
function useDeferredVisible(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setReady(false);
      return;
    }

    const el = ref.current;
    if (!el) return;

    let idleId = 0;
    let timeoutId = 0;
    let cancelled = false;
    let started = false;

    const start = () => {
      if (cancelled || started) return;
      started = true;
      const run = () => {
        if (!cancelled) setReady(true);
      };
      if ("requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(run, { timeout: 900 });
      } else {
        timeoutId = window.setTimeout(run, 180);
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          start();
          io.disconnect();
        }
      },
      { rootMargin: "80px", threshold: 0.05 },
    );
    io.observe(el);

    return () => {
      cancelled = true;
      io.disconnect();
      if (idleId && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [enabled]);

  return { ref, ready };
}

/**
 * Hero globe — lightweight on mobile, full quality on desktop.
 */
export function MailHeroSignal({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const desktop = useIsDesktop();
  const { ref, ready } = useDeferredVisible(true);
  const paused = Boolean(reduceMotion);

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex w-full items-center justify-center",
        "h-[220px] sm:h-[280px] md:h-[480px] lg:h-[520px]",
        className,
      )}
      aria-hidden
    >
      <div
        className={cn(
          "mail-globe-glow relative z-10 w-full",
          "max-w-[210px] sm:max-w-[260px] md:max-w-[440px] lg:max-w-[480px]",
          !desktop && "mail-globe-glow--mobile",
        )}
      >
        {ready ? (
          <Globe
            className="w-full"
            markers={HERO_MARKERS}
            arcs={paused ? [] : HERO_ARCS}
            paused={paused}
            showLabels={desktop}
            maxDpr={desktop ? 2 : 1}
            dark={1}
            baseColor={[0.14, 0.14, 0.16]}
            glowColor={desktop ? [0.62, 0.78, 1] : [0.45, 0.58, 0.85]}
            markerColor={[1, 1, 1]}
            arcColor={[0.75, 0.85, 1]}
            mapBrightness={desktop ? 5 : 4}
            mapSamples={desktop ? 16000 : 5500}
            markerSize={desktop ? 0.032 : 0.045}
            markerElevation={0.015}
            arcWidth={desktop ? 0.55 : 0.45}
            arcHeight={0.28}
            diffuse={desktop ? 1.55 : 1.25}
            speed={desktop ? 0.0032 : 0.004}
            theta={0.25}
          />
        ) : (
          <div className="aspect-square w-full rounded-full bg-white/[0.05]" />
        )}
      </div>
    </div>
  );
}
