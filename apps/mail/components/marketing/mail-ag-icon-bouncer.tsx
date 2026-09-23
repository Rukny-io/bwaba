"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useReducedMotion } from "framer-motion";
import {
  AtSign,
  BadgeCheck,
  Globe,
  Inbox,
  Lock,
  Mail,
  MailCheck,
  Network,
  Send,
  Shield,
  type LucideIcon,
} from "lucide-react";

const BOUNCER_ICONS: { id: string; Icon: LucideIcon }[] = [
  { id: "mail", Icon: Mail },
  { id: "inbox", Icon: Inbox },
  { id: "send", Icon: Send },
  { id: "alternate_email", Icon: AtSign },
  { id: "domain", Icon: Globe },
  { id: "dns", Icon: Network },
  { id: "mark_email_read", Icon: MailCheck },
  { id: "shield", Icon: Shield },
  { id: "verified_user", Icon: BadgeCheck },
  { id: "lock", Icon: Lock },
];

const AMPLITUDE = 30;
const SCROLL_SPEED = 22;
const WAVE_FREQ = 0.012;
const Y_SMOOTHING = 0.09;

function BouncerList({
  items,
  listRef,
  copyIndex,
}: {
  items: { id: string; Icon: LucideIcon }[];
  listRef?: RefObject<HTMLUListElement | null>;
  copyIndex: number;
}) {
  return (
    <ul
      ref={listRef}
      className="icon-list"
      data-bouncer-list=""
      aria-hidden={copyIndex > 0 ? true : undefined}
    >
      {items.map(({ id, Icon }, i) => (
        <li key={`${copyIndex}-${id}-${i}`} className="grid-col" data-bouncer="">
          <div className="bouncer" translate="no" aria-label={id}>
            <Icon
              className="size-7 sm:size-8"
              strokeWidth={1.35}
              aria-hidden
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Antigravity-style horizontal bouncer with seamless loop + vertical wave. */
export function MailAgIconBouncer() {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const segmentRef = useRef<HTMLUListElement>(null);
  const offsetRef = useRef(0);
  const segmentWidthRef = useRef(0);
  const yMapRef = useRef(new WeakMap<HTMLElement, number>());
  const rafRef = useRef(0);
  const [copyCount, setCopyCount] = useState(3);

  useEffect(() => {
    if (reduceMotion) return;

    const container = containerRef.current;
    const segment = segmentRef.current;
    if (!container || !segment) return;

    const measure = () => {
      segmentWidthRef.current = segment.offsetWidth;
      const seg = segmentWidthRef.current;
      if (seg > 0) {
        const next = Math.max(3, Math.ceil(container.clientWidth / seg) + 2);
        setCopyCount((prev) => (prev === next ? prev : next));
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    ro.observe(segment);

    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const track = trackRef.current;
      const containerEl = containerRef.current;
      if (!track || !containerEl) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const segmentWidth = segmentWidthRef.current;
      if (segmentWidth <= 0) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      offsetRef.current += SCROLL_SPEED * dt;
      if (offsetRef.current >= segmentWidth) {
        offsetRef.current %= segmentWidth;
      }

      track.style.transform = `translate3d(${-offsetRef.current}px, 0px, 0px)`;

      const containerRect = containerEl.getBoundingClientRect();
      const centerX = containerRect.left + containerRect.width / 2;
      const items = track.querySelectorAll<HTMLElement>("[data-bouncer]");

      items.forEach((li) => {
        const rect = li.getBoundingClientRect();
        const itemCenterX = rect.left + rect.width / 2;
        const dist = itemCenterX - centerX;
        const targetY = AMPLITUDE * Math.cos(dist * WAVE_FREQ);
        const prevY = yMapRef.current.get(li) ?? 0;
        const nextY = prevY + (targetY - prevY) * Y_SMOOTHING;
        yMapRef.current.set(li, nextY);
        li.style.transform = `translate3d(0px, ${nextY}px, 0px)`;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [reduceMotion]);

  return (
    <div
      ref={containerRef}
      className="ag-icon-bouncer relative overflow-hidden"
    >
      {reduceMotion ? (
        <BouncerList items={BOUNCER_ICONS.slice(0, 6)} copyIndex={0} />
      ) : (
        <div ref={trackRef} className="flex w-max will-change-transform">
          {Array.from({ length: copyCount }, (_, copyIndex) => (
            <BouncerList
              key={copyIndex}
              copyIndex={copyIndex}
              items={BOUNCER_ICONS}
              listRef={copyIndex === 0 ? segmentRef : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
