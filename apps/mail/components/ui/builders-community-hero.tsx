"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { animate, motion } from "framer-motion";
import { ArrowUp, ArrowUpRight, CircleCheck } from "lucide-react";

export type OrbitRing = "outer" | "inner";

interface OrbitBase {
  ring: OrbitRing;
  angle: number;
}

export interface OrbitAvatarItem extends OrbitBase {
  kind: "avatar";
  src: string;
  alt?: string;
  color: string;
  size?: number;
}

export interface OrbitPillItem extends OrbitBase {
  kind: "pill";
  icon: ReactNode;
  label: string;
}

export interface OrbitCardItem extends OrbitBase {
  kind: "card";
  emoji: string;
  badge?: string | number;
}

export interface OrbitStatusItem extends OrbitBase {
  kind: "status";
  label: string;
}

export interface OrbitCheckItem extends OrbitBase {
  kind: "check";
}

export type OrbitItem =
  | OrbitAvatarItem
  | OrbitPillItem
  | OrbitCardItem
  | OrbitStatusItem
  | OrbitCheckItem;

export interface OrbitStat {
  value: string;
  label: string;
}

export interface OrbitTag {
  icon: ReactNode;
  label: string;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  variant?: "default" | "primary";
}

export interface CommunityOrbitProps {
  items: OrbitItem[];
  stats: OrbitStat[];
  headline: ReactNode;
  tags?: OrbitTag[];
  minScale?: number;
  className?: string;
}

const STAGE_W = 1200;
const STAGE_H = 490;
const CENTER = { x: 600, y: 620 };
const RADIUS: Record<OrbitRing, number> = { outer: 492, inner: 404 };

function positionOnRing(ring: OrbitRing, angle: number): CSSProperties {
  const rad = (angle * Math.PI) / 180;
  const r = RADIUS[ring];
  // Fixed px strings avoid SSR/client float serialization mismatches (hydration).
  const left = Math.round((CENTER.x + r * Math.cos(rad)) * 100) / 100;
  const top = Math.round((CENTER.y - r * Math.sin(rad)) * 100) / 100;
  return {
    left: `${left}px`,
    top: `${top}px`,
  };
}

function arcPath(r: number) {
  const dy = CENTER.y - STAGE_H;
  const dx = Math.sqrt(r * r - dy * dy);
  return `M ${CENTER.x - dx} ${STAGE_H} A ${r} ${r} 0 0 1 ${CENTER.x + dx} ${STAGE_H}`;
}

function OrbitAvatar({ src, alt, color, size = 72 }: OrbitAvatarItem) {
  return (
    <div
      className="rounded-full border border-[#E8E8E8] bg-white p-[3px] shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
      style={{ width: size, height: size }}
    >
      <div
        className="h-full w-full overflow-hidden rounded-full"
        style={{ backgroundColor: color }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt ?? ""}
          draggable={false}
          className="h-full w-full translate-y-[8%] scale-[1.08] select-none object-cover object-top"
        />
      </div>
    </div>
  );
}

function OrbitPill({ icon, label }: OrbitPillItem) {
  return (
    <div className="flex min-h-[27px] items-center gap-2 whitespace-nowrap rounded-full border border-[#E8E8E8] bg-white py-[5px] px-2.5 text-[12.5px] font-medium text-[#6B6F76] shadow-[0_2px_6px_rgba(0,0,0,0.04)]">
      <span className="flex shrink-0 items-center text-[#1D1D1D]">{icon}</span>
      <span className="leading-none">{label}</span>
    </div>
  );
}

function OrbitCard({ emoji, badge }: OrbitCardItem) {
  return (
    <div className="relative flex h-[52px] w-[52px] items-center justify-center rounded-xl border border-[#E8E8E8] bg-[#FAFAFA] text-[22px] leading-none shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <span className="select-none" aria-hidden>{emoji}</span>
      {badge !== undefined ? (
        <span className="absolute -bottom-[5px] -right-2 flex h-[18px] items-center gap-0.5 rounded-[5px] border border-[#E8E8E8] bg-white px-1.5 text-[10px] font-medium leading-none text-[#6B6F76] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <ArrowUp size={9} strokeWidth={2.2} aria-hidden />
          {badge}
        </span>
      ) : null}
    </div>
  );
}

function OrbitStatus({ label }: OrbitStatusItem) {
  return (
    <div className="flex h-[30px] items-center gap-1.5 whitespace-nowrap rounded-full border border-[#D6E4FC] bg-[#F3F7FE] px-2.5 text-[13px] font-medium text-[#1D1D1D] shadow-[0_2px_6px_rgba(0,0,0,0.04)]">
      <CircleCheck
        size={15}
        strokeWidth={2.2}
        className="fill-[#4285F4] text-[#F3F7FE]"
        aria-hidden
      />
      {label}
    </div>
  );
}

function OrbitCheck() {
  return (
    <div className="flex h-[50px] w-[50px] items-center justify-center rounded-full border border-[#D6E4FC] bg-[#F3F7FE] shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
      <CircleCheck
        size={17}
        strokeWidth={2.4}
        className="fill-[#4285F4] text-[#F3F7FE]"
        aria-hidden
      />
    </div>
  );
}

function renderItem(item: OrbitItem) {
  switch (item.kind) {
    case "avatar":
      return <OrbitAvatar {...item} />;
    case "pill":
      return <OrbitPill {...item} />;
    case "card":
      return <OrbitCard {...item} />;
    case "status":
      return <OrbitStatus {...item} />;
    case "check":
      return <OrbitCheck />;
  }
}

function splitValue(value: string) {
  const m = value.match(/^([^\d]*)([\d.,]+)(.*)$/);
  if (!m) return null;
  const raw = m[2].replace(/,/g, "");
  const decimals = (raw.split(".")[1] ?? "").length;
  return { prefix: m[1], target: parseFloat(raw), decimals, suffix: m[3] };
}

function CountUp({ value, delay }: { value: string; delay: number }) {
  const parts = splitValue(value);
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!parts) return;
    const controls = animate(0, parts.target, {
      delay,
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setN(v),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- parts derived from value
  }, [value, delay]);

  if (!parts) return <>{value}</>;
  return (
    <>
      {parts.prefix}
      {n.toFixed(parts.decimals)}
      {parts.suffix}
    </>
  );
}

const reveal = {
  hidden: { opacity: 0, y: 14, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export default function CommunityOrbit({
  items,
  stats,
  headline,
  tags = [],
  minScale = 0.6,
  className,
}: CommunityOrbitProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const measure = () =>
      setScale(Math.min(1, Math.max(minScale, frame.clientWidth / STAGE_W)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(frame);
    return () => ro.disconnect();
  }, [minScale]);

  return (
    <section
      className={`w-full bg-white px-4 pb-14 text-[#1D1D1D] ${className ?? ""}`}
    >
      <div
        ref={frameRef}
        className="relative mx-auto w-full max-w-[1200px] overflow-hidden"
        style={{ height: STAGE_H * scale }}
      >
        <div
          className="absolute left-1/2 top-0"
          style={{
            width: STAGE_W,
            height: STAGE_H,
            transform: `translateX(-50%) scale(${scale})`,
            transformOrigin: "top center",
          }}
        >
          <svg
            className="pointer-events-none absolute inset-0"
            width={STAGE_W}
            height={STAGE_H}
            viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
            fill="none"
            aria-hidden
            style={{
              maskImage:
                "linear-gradient(to bottom, #000 62%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, #000 62%, transparent 100%)",
            }}
          >
            {mounted ? (
              <>
                <motion.path
                  d={arcPath(RADIUS.outer)}
                  className="stroke-[#E8E8E8]"
                  strokeWidth={2}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.4, ease: "easeOut" }}
                />
                <motion.path
                  d={arcPath(RADIUS.inner)}
                  className="stroke-[#F0F0F0]"
                  strokeWidth={3}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.4, ease: "easeOut", delay: 0.1 }}
                />
              </>
            ) : (
              <>
                <path
                  d={arcPath(RADIUS.outer)}
                  className="stroke-[#E8E8E8]"
                  strokeWidth={2}
                />
                <path
                  d={arcPath(RADIUS.inner)}
                  className="stroke-[#F0F0F0]"
                  strokeWidth={3}
                />
              </>
            )}
          </svg>

          {items.map((item, i) => {
            const pos = positionOnRing(item.ring, item.angle);
            if (!mounted) {
              return (
                <div
                  key={i}
                  className="absolute -translate-x-1/2 -translate-y-1/2 opacity-0"
                  style={pos}
                >
                  {renderItem(item)}
                </div>
              );
            }
            return (
              <motion.div
                key={i}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={pos}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.5,
                  delay: 0.5 + i * 0.07,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{
                    duration: 4 + (i % 4) * 0.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: (i * 0.4) % 2,
                  }}
                  whileHover={{ scale: 1.06 }}
                >
                  {renderItem(item)}
                </motion.div>
              </motion.div>
            );
          })}

          <div className="absolute left-1/2 top-[393px] grid -translate-x-1/2 auto-cols-fr grid-flow-col gap-7">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                className="flex flex-col items-center"
                variants={reveal}
                initial={mounted ? "hidden" : false}
                animate="show"
                transition={{
                  duration: 0.6,
                  delay: 0.9 + i * 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <span className="text-[42px] font-medium leading-none tracking-[-0.02em] text-[#1D1D1D] tabular-nums sm:text-[48px]">
                  <CountUp value={s.value} delay={0.9 + i * 0.12} />
                </span>
                <span className="mt-[15px] text-[14px] leading-none text-[#6B6F76]">
                  {s.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <motion.h2
        className="mx-auto mt-2 max-w-[600px] text-balance text-center text-[clamp(1.5rem,4vw,2.125rem)] font-medium leading-[1.18] tracking-[-0.02em] text-[#1D1D1D]"
        variants={reveal}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.7, delay: 1.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {headline}
      </motion.h2>

      {tags.length > 0 ? (
        <div className="mx-auto mt-9 flex max-w-[820px] flex-wrap items-center justify-center gap-2.5 sm:mt-10 sm:gap-3">
          {tags.map((t, i) => {
            const Tag = (t.href ? motion.a : motion.button) as typeof motion.a;
            const isPrimary = t.variant === "primary";
            return (
              <Tag
                key={t.label}
                {...(t.href
                  ? {
                      href: t.href,
                      ...(t.external
                        ? { rel: "noopener noreferrer", target: "_blank" }
                        : {}),
                    }
                  : { type: "button" as const })}
                onClick={t.onClick}
                variants={reveal}
                initial="hidden"
                animate="show"
                transition={{
                  duration: 0.5,
                  delay: 1.6 + i * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className={
                  isPrimary
                    ? "group inline-flex h-11 items-center gap-2 rounded-full bg-[#1D1D1D] px-5 text-[14px] font-medium text-white transition-colors hover:bg-[#0A0A0A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D1D1D]/30"
                    : "group inline-flex h-11 items-center gap-2 rounded-full border border-[#E8E8E8] bg-white px-5 text-[14px] font-medium text-[#1D1D1D] transition-colors hover:border-[#D8D8D8] hover:bg-[#FAFAFA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D1D1D]/15"
                }
              >
                <span
                  className={
                    isPrimary
                      ? "flex shrink-0 text-white/90 [&>svg]:size-[15px]"
                      : "flex shrink-0 text-[#6B6F76] transition-colors group-hover:text-[#1D1D1D] [&>svg]:size-[15px]"
                  }
                >
                  {t.icon}
                </span>
                <span className="leading-none">{t.label}</span>
                {t.external ? (
                  <ArrowUpRight
                    className={
                      isPrimary
                        ? "size-3.5 shrink-0 text-white/70"
                        : "size-3.5 shrink-0 text-[#9CA3AF] transition-colors group-hover:text-[#6B6F76]"
                    }
                    aria-hidden
                  />
                ) : null}
              </Tag>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

export { CommunityOrbit as Component };
