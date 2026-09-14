"use client";

import { useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { cn } from "@heroui/react";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Word-by-word headline reveal */
export function MailSplitWords({
  text,
  className,
  delay = 0,
  as: Tag = "h1",
  mode = "mount",
}: {
  text: string;
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "p";
  mode?: "mount" | "scroll";
}) {
  const reduceMotion = useReducedMotion();
  const words = text.split(" ");

  if (reduceMotion) {
    return <Tag className={className}>{text}</Tag>;
  }

  const containerProps =
    mode === "scroll"
      ? {
          initial: "hidden" as const,
          whileInView: "visible" as const,
          viewport: { once: true, amount: 0.5 },
        }
      : {
          initial: "hidden" as const,
          animate: "visible" as const,
        };

  return (
    <Tag className={cn(className)}>
      <span className="sr-only">{text}</span>
      <motion.span
        aria-hidden
        className="flex flex-wrap"
        {...containerProps}
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.045, delayChildren: delay },
          },
        }}
      >
        {words.map((word, i) => (
          <span key={`${word}-${i}`} className="inline-block overflow-hidden pe-[0.28em]">
            <motion.span
              className="inline-block"
              variants={{
                hidden: { y: "110%", opacity: 0 },
                visible: {
                  y: "0%",
                  opacity: 1,
                  transition: { duration: 0.7, ease: EASE },
                },
              }}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}

/** Soft magnetic pull toward cursor for CTAs / cards */
export function MailMagnetic({
  children,
  className,
  strength = 12,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 260, damping: 20, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 260, damping: 20, mass: 0.4 });

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={cn("inline-flex", className)}
      style={{ x: springX, y: springY }}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        x.set((dx / rect.width) * strength);
        y.set((dy / rect.height) * strength);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/** Mouse spotlight that follows inside a framed card */
export function MailSpotlight({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const opacity = useMotionValue(0);
  const spotlight = useMotionTemplate`radial-gradient(420px circle at ${x}px ${y}px, rgba(2,121,126,0.14), transparent 55%)`;

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn("relative overflow-hidden", className)}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - rect.left);
        y.set(e.clientY - rect.top);
        opacity.set(1);
      }}
      onMouseLeave={() => opacity.set(0)}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{ background: spotlight, opacity }}
      />
      <div className="relative z-[1] h-full">{children}</div>
    </motion.div>
  );
}

/** Scroll-linked depth for product mockups */
export function MailParallaxFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [36, -36]);
  const rotate = useTransform(scrollYProgress, [0, 1], [1.2, -1.2]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.97, 1, 0.985]);

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <motion.div style={{ y, rotate, scale }} className="will-change-transform">
        {children}
      </motion.div>
    </div>
  );
}

/** Clip-path wipe reveal for section titles */
export function MailClipReveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ clipPath: "inset(0 0 100% 0)", opacity: 0.4 }}
      whileInView={{ clipPath: "inset(0 0 0% 0)", opacity: 1 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.85, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Number that counts up when scrolled into view */
export function MailCountUp({
  value,
  suffix = "",
  className,
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <span className={className}>
        {value}
        {suffix}
      </span>
    );
  }

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <CountInner value={value} />
      </motion.span>
      {suffix}
    </motion.span>
  );
}

function CountInner({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      onViewportEnter={() => {
        if (reduceMotion || !ref.current) {
          if (ref.current) ref.current.textContent = String(value);
          return;
        }
        const el = ref.current;
        const start = performance.now();
        const dur = 900;
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = String(Math.round(value * eased));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }}
    >
      0
    </motion.span>
  );
}
