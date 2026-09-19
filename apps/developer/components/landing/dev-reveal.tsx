'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/** Scroll-triggered fade + lift for marketing sections. */
export function DevReveal({
  children,
  className,
  delay = 0,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <Tag
      ref={ref}
      className={cn('dev-reveal', visible && 'dev-reveal--visible', className)}
      style={{ '--dev-reveal-delay': `${delay}s` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

/** Staggered children — each child gets increasing --dev-stagger-index */
export function DevStagger({
  children,
  className,
  stagger = 0.08,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <Tag
      ref={ref}
      className={cn('dev-stagger', visible && 'dev-stagger--visible', className)}
      style={{ '--dev-stagger-step': `${stagger}s` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

export function DevStaggerItem({
  children,
  className,
  index = 0,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  index?: number;
  as?: ElementType;
}) {
  return (
    <Tag
      className={cn('dev-stagger-item', className)}
      style={{ '--dev-stagger-index': index } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

/** Word-by-word headline entrance on mount. */
export function DevSplitWords({
  text,
  className,
  as: Tag = 'h1',
  delay = 0,
}: {
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'p';
  delay?: number;
}) {
  const reduced = usePrefersReducedMotion();
  const words = text.split(' ');

  if (reduced) {
    return <Tag className={className}>{text}</Tag>;
  }

  return (
    <Tag className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="flex flex-wrap">
        {words.map((word, i) => (
          <span
            key={`${word}-${i}`}
            className="inline-block overflow-hidden pe-[0.28em]"
          >
            <span
              className="dev-split-word inline-block"
              style={
                {
                  '--dev-split-delay': `${delay + i * 0.045}s`,
                } as CSSProperties
              }
            >
              {word}
            </span>
          </span>
        ))}
      </span>
    </Tag>
  );
}
