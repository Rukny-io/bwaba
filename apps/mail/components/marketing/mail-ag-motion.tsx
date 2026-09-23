"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** Typewriter reveal — matches Antigravity `typed-content`. */
export function MailAgTypedText({
  text,
  className,
  speed = 24,
  as: Tag = "span",
  id,
}: {
  text: string;
  className?: string;
  speed?: number;
  as?: "span" | "h1" | "h2" | "p";
  id?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [count, setCount] = useState(reduceMotion ? text.length : 0);

  useEffect(() => {
    if (reduceMotion) {
      setCount(text.length);
      return;
    }
    setCount(0);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= text.length) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, [text, speed, reduceMotion]);

  const visible = text.slice(0, count);

  return (
    <Tag id={id} className={className} data-typed-container="">
      <span
        aria-hidden="true"
        className="typed-content"
        data-nosnippet=""
        translate="no"
        aria-label={text}
      >
        {visible}
        {!reduceMotion && count < text.length ? (
          <span className="ms-px inline-block h-[1em] w-px animate-pulse bg-[#1D1D1D]" />
        ) : null}
      </span>
      <span className="sr-only">{text}</span>
    </Tag>
  );
}
