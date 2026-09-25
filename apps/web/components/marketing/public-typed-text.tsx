'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function PublicTypedText({
  text,
  className,
  speed = 22,
  as: Tag = 'span',
  id,
}: {
  text: string;
  className?: string;
  speed?: number;
  as?: 'span' | 'h1' | 'h2' | 'p';
  id?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [count, setCount] = useState(text.length);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (reduceMotion) {
      setCount(text.length);
      return;
    }

    setCount(0);
    let i = 0;
    const timer = window.setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= text.length) window.clearInterval(timer);
    }, speed);

    return () => window.clearInterval(timer);
  }, [mounted, reduceMotion, speed, text]);

  const visible = text.slice(0, count);
  const showCursor = mounted && !reduceMotion && count < text.length;

  return (
    <Tag id={id} className={cn('text-start', className)}>
      <span aria-hidden="true" translate="no" className="inline-block text-start">
        {visible}
        {showCursor ? (
          <span className="ms-px inline-block h-[1em] w-px animate-pulse bg-[#1D1D1D]" />
        ) : null}
      </span>
      {count < text.length ? <span className="sr-only">{text}</span> : null}
    </Tag>
  );
}
