'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useLocale } from '@/lib/i18n/locale';
import { cn } from '@/lib/utils';

const FILL = '#f4f4f5';
const RADIUS = 20;
const SCOOP = 14;
const TAB_MIN_W = 168;

export type TicketTabPlacement = 'top' | 'bottom';

/** L-shaped ticket path with a concave scoop at the inner corner. */
export function buildTicketPath(
  width: number,
  bodyHeight: number,
  tabWidth: number,
  tabHeight: number,
  rtl: boolean,
  placement: TicketTabPlacement = 'bottom',
): string {
  const w = Math.max(width, tabWidth + SCOOP + RADIUS);
  const bh = Math.max(bodyHeight, RADIUS * 2);
  const tw = Math.min(Math.max(tabWidth, TAB_MIN_W), w - SCOOP);
  const th = Math.max(tabHeight, 36);
  const r = Math.min(RADIUS, bh / 2, tw / 2);
  const s = Math.min(SCOOP, tw / 2, th);

  if (placement === 'top') {
    if (!rtl) {
      // Tab top-left; scoop at (tw, th)
      return [
        `M ${r} 0`,
        `H ${tw - r}`,
        `A ${r} ${r} 0 0 1 ${tw} ${r}`,
        `V ${th - s}`,
        `A ${s} ${s} 0 0 0 ${tw + s} ${th}`,
        `H ${w - r}`,
        `A ${r} ${r} 0 0 1 ${w} ${th + r}`,
        `V ${th + bh - r}`,
        `A ${r} ${r} 0 0 1 ${w - r} ${th + bh}`,
        `H ${r}`,
        `A ${r} ${r} 0 0 1 0 ${th + bh - r}`,
        `V ${r}`,
        `A ${r} ${r} 0 0 1 ${r} 0`,
        'Z',
      ].join(' ');
    }

    // Tab top-right; scoop at (w - tw, th)
    const tabLeft = w - tw;
    return [
      `M ${r} ${th}`,
      `H ${tabLeft - s}`,
      `A ${s} ${s} 0 0 0 ${tabLeft} ${th - s}`,
      `V ${r}`,
      `A ${r} ${r} 0 0 1 ${tabLeft + r} 0`,
      `H ${w - r}`,
      `A ${r} ${r} 0 0 1 ${w} ${r}`,
      `V ${th + bh - r}`,
      `A ${r} ${r} 0 0 1 ${w - r} ${th + bh}`,
      `H ${r}`,
      `A ${r} ${r} 0 0 1 0 ${th + bh - r}`,
      `V ${th + r}`,
      `A ${r} ${r} 0 0 1 ${r} ${th}`,
      'Z',
    ].join(' ');
  }

  if (!rtl) {
    // Tab bottom-left; scoop at (tw, bh)
    return [
      `M ${r} 0`,
      `H ${w - r}`,
      `A ${r} ${r} 0 0 1 ${w} ${r}`,
      `V ${bh - r}`,
      `A ${r} ${r} 0 0 1 ${w - r} ${bh}`,
      `H ${tw + s}`,
      `A ${s} ${s} 0 0 0 ${tw} ${bh + s}`,
      `V ${bh + th - r}`,
      `A ${r} ${r} 0 0 1 ${tw - r} ${bh + th}`,
      `H ${r}`,
      `A ${r} ${r} 0 0 1 0 ${bh + th - r}`,
      `V ${r}`,
      `A ${r} ${r} 0 0 1 ${r} 0`,
      'Z',
    ].join(' ');
  }

  // Tab bottom-right; scoop at (w - tw, bh)
  const tabLeft = w - tw;
  return [
    `M ${r} 0`,
    `H ${w - r}`,
    `A ${r} ${r} 0 0 1 ${w} ${r}`,
    `V ${bh + th - r}`,
    `A ${r} ${r} 0 0 1 ${w - r} ${bh + th}`,
    `H ${tabLeft + r}`,
    `A ${r} ${r} 0 0 1 ${tabLeft} ${bh + th - r}`,
    `V ${bh + s}`,
    `A ${s} ${s} 0 0 0 ${tabLeft - s} ${bh}`,
    `H ${r}`,
    `A ${r} ${r} 0 0 1 0 ${bh - r}`,
    `V ${r}`,
    `A ${r} ${r} 0 0 1 ${r} 0`,
    'Z',
  ].join(' ');
}

interface TicketShellProps {
  body: ReactNode;
  tab: ReactNode;
  className?: string;
  /** Remeasure when these change (content that affects height/width). */
  measureKey?: string | number;
  /** Where the protruding tab sits. Default bottom (invoice style). */
  tabPlacement?: TicketTabPlacement;
}

export function TicketShell({
  body,
  tab,
  className,
  measureKey,
  tabPlacement = 'bottom',
}: TicketShellProps) {
  const { dir } = useLocale();
  const isRtl = dir === 'rtl';
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const tabRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState({
    width: 320,
    bodyHeight: 72,
    tabWidth: TAB_MIN_W,
    tabHeight: 44,
  });

  useLayoutEffect(() => {
    const root = rootRef.current;
    const bodyEl = bodyRef.current;
    const tabEl = tabRef.current;
    if (!root || !bodyEl || !tabEl) return;

    const measure = () => {
      setMetrics({
        width: root.offsetWidth || 320,
        bodyHeight: bodyEl.offsetHeight || 72,
        tabWidth: Math.max(tabEl.offsetWidth, TAB_MIN_W),
        tabHeight: tabEl.offsetHeight || 44,
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    ro.observe(bodyEl);
    ro.observe(tabEl);
    return () => ro.disconnect();
  }, [measureKey, isRtl, tabPlacement]);

  const totalHeight = metrics.bodyHeight + metrics.tabHeight;
  const isTop = tabPlacement === 'top';
  // Top tab stays physically left (matches “top-left” channel switcher).
  const tabRtl = isTop ? false : isRtl;
  const path = buildTicketPath(
    metrics.width,
    metrics.bodyHeight,
    metrics.tabWidth,
    metrics.tabHeight,
    tabRtl,
    tabPlacement,
  );

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0"
        width={metrics.width}
        height={totalHeight}
        viewBox={`0 0 ${metrics.width} ${totalHeight}`}
        fill="none"
      >
        <path d={path} fill={FILL} />
      </svg>

      <div
        className="relative"
        style={
          isTop
            ? { paddingTop: metrics.tabHeight }
            : { paddingBottom: metrics.tabHeight }
        }
      >
        <div
          ref={tabRef}
          className={cn(
            'absolute flex min-w-[10.5rem] items-center gap-2 px-4 py-2.5',
            isTop ? 'top-0 left-0' : 'bottom-0 start-0',
          )}
        >
          {tab}
        </div>

        <div ref={bodyRef} className="relative px-4 py-3.5 sm:px-5 sm:py-4">
          {body}
        </div>
      </div>
    </div>
  );
}
