"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@heroui/react";

const EASE = [0.22, 1, 0.36, 1] as const;

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
};

/** Scroll-triggered fade + lift for marketing sections. */
export function MailReveal({
  children,
  className,
  delay = 0,
  y = 22,
  once = true,
}: RevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.2, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

type StaggerProps = {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
  as?: "div" | "ul" | "ol";
};

/** Staggered children reveal — wrap items in MailRevealItem. */
export function MailStagger({
  children,
  className,
  stagger = 0.08,
  delay = 0,
  as = "div",
}: StaggerProps) {
  const reduceMotion = useReducedMotion();
  const Comp = motion[as];

  if (reduceMotion) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  return (
    <Comp
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -6% 0px" }}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: stagger, delayChildren: delay },
        },
      }}
    >
      {children}
    </Comp>
  );
}

export function MailRevealItem({
  children,
  className,
  y = 18,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  y?: number;
  as?: "div" | "li" | "article";
}) {
  const reduceMotion = useReducedMotion();
  const Comp = motion[as];

  if (reduceMotion) {
    const Static = as;
    return <Static className={cn(className)}>{children}</Static>;
  }

  return (
    <Comp
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.55, ease: EASE },
        },
      }}
    >
      {children}
    </Comp>
  );
}

/** Hero entrance — plays on mount, not scroll. */
export function MailHeroMotion({
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
