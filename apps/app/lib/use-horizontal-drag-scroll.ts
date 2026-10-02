'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type DragScrollState = {
  canScrollStart: boolean;
  canScrollEnd: boolean;
  isDragging: boolean;
};

const FRICTION = 0.92;
const MIN_VELOCITY = 0.08;
const CLICK_SUPPRESS_PX = 6;

/**
 * Pointer-driven horizontal drag scroll with momentum.
 * Works reliably in RTL (right → left) via scrollLeft deltas.
 */
export function useHorizontalDragScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [state, setState] = useState<DragScrollState>({
    canScrollStart: false,
    canScrollEnd: false,
    isDragging: false,
  });

  const dragRef = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startScroll: 0,
    lastX: 0,
    lastT: 0,
    velocity: 0,
    moved: false,
    suppressClick: false,
  });
  const rafRef = useRef<number | null>(null);

  const updateEdges = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 2) {
      setState((prev) =>
        prev.canScrollStart || prev.canScrollEnd
          ? { ...prev, canScrollStart: false, canScrollEnd: false }
          : prev,
      );
      return;
    }

    const absLeft = Math.abs(el.scrollLeft);
    // Origin (0) = visual start; scrolled when abs(scrollLeft) grows.
    const canScrollStart = absLeft > 2;
    const canScrollEnd = absLeft < max - 2;

    setState((prev) => {
      if (
        prev.canScrollStart === canScrollStart &&
        prev.canScrollEnd === canScrollEnd
      ) {
        return prev;
      }
      return { ...prev, canScrollStart, canScrollEnd };
    });
  }, []);

  const stopMomentum = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startMomentum = useCallback(() => {
    stopMomentum();
    const tick = () => {
      const el = ref.current;
      if (!el) return;
      const d = dragRef.current;
      if (Math.abs(d.velocity) < MIN_VELOCITY) {
        d.velocity = 0;
        updateEdges();
        return;
      }
      el.scrollLeft -= d.velocity;
      d.velocity *= FRICTION;
      updateEdges();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [stopMomentum, updateEdges]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    updateEdges();

    const onScroll = () => updateEdges();
    el.addEventListener('scroll', onScroll, { passive: true });

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateEdges) : null;
    ro?.observe(el);

    return () => {
      el.removeEventListener('scroll', onScroll);
      ro?.disconnect();
      stopMomentum();
    };
  }, [stopMomentum, updateEdges]);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<T>) => {
      if (event.button !== 0) return;
      const el = ref.current;
      if (!el) return;
      // Allow interactive controls (edit buttons) to work normally.
      const target = event.target as HTMLElement | null;
      if (target?.closest('button, a, input, textarea, select, [data-no-drag]')) {
        return;
      }

      stopMomentum();
      const d = dragRef.current;
      d.active = true;
      d.pointerId = event.pointerId;
      d.startX = event.clientX;
      d.startScroll = el.scrollLeft;
      d.lastX = event.clientX;
      d.lastT = performance.now();
      d.velocity = 0;
      d.moved = false;
      d.suppressClick = false;
      el.setPointerCapture(event.pointerId);
      setState((prev) => ({ ...prev, isDragging: true }));
    },
    [stopMomentum],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<T>) => {
      const d = dragRef.current;
      if (!d.active || event.pointerId !== d.pointerId) return;
      const el = ref.current;
      if (!el) return;

      const dx = event.clientX - d.startX;
      if (Math.abs(dx) > CLICK_SUPPRESS_PX) {
        d.moved = true;
        d.suppressClick = true;
      }

      el.scrollLeft = d.startScroll - dx;

      const now = performance.now();
      const dt = Math.max(1, now - d.lastT);
      const instant = (event.clientX - d.lastX) / dt;
      d.velocity = d.velocity * 0.7 + instant * 16 * 0.3;
      d.lastX = event.clientX;
      d.lastT = now;
      updateEdges();
    },
    [updateEdges],
  );

  const endDrag = useCallback(
    (event: React.PointerEvent<T>) => {
      const d = dragRef.current;
      if (!d.active || event.pointerId !== d.pointerId) return;
      d.active = false;
      try {
        ref.current?.releasePointerCapture(event.pointerId);
      } catch {
        /* already released */
      }
      setState((prev) => ({ ...prev, isDragging: false }));
      if (d.moved) {
        startMomentum();
      }
      // Keep suppressClick until the following click event cycle.
      if (d.suppressClick) {
        window.setTimeout(() => {
          d.suppressClick = false;
        }, 0);
      }
    },
    [startMomentum],
  );

  const onClickCapture = useCallback((event: React.MouseEvent<T>) => {
    if (dragRef.current.suppressClick || dragRef.current.moved) {
      event.preventDefault();
      event.stopPropagation();
      dragRef.current.moved = false;
      dragRef.current.suppressClick = false;
    }
  }, []);

  return {
    ref,
    isDragging: state.isDragging,
    canScrollStart: state.canScrollStart,
    canScrollEnd: state.canScrollEnd,
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onClickCapture,
    },
  };
}
