"use client";

import { useEffect, useRef, useState } from "react";

type DragScrollOptions = {
  /** Momentum decay per frame (0–1). */
  friction?: number;
  /** Min px movement before treating interaction as a drag (blocks link clicks). */
  dragThreshold?: number;
};

export function useDragScroll<T extends HTMLElement>({
  friction = 0.94,
  dragThreshold = 4,
}: DragScrollOptions = {}) {
  const ref = useRef<T>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    scrollLeft: 0,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
    moved: false,
    raf: 0,
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const stopMomentum = () => {
      if (dragState.current.raf) {
        cancelAnimationFrame(dragState.current.raf);
        dragState.current.raf = 0;
      }
    };

    const runMomentum = () => {
      stopMomentum();
      let velocity = dragState.current.velocity;

      const tick = () => {
        if (Math.abs(velocity) < 0.35) {
          dragState.current.raf = 0;
          return;
        }
        el.scrollLeft -= velocity;
        velocity *= friction;
        dragState.current.raf = requestAnimationFrame(tick);
      };

      dragState.current.raf = requestAnimationFrame(tick);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      stopMomentum();
      dragState.current = {
        ...dragState.current,
        active: true,
        pointerId: e.pointerId,
        startX: e.clientX,
        lastX: e.clientX,
        lastTime: performance.now(),
        scrollLeft: el.scrollLeft,
        velocity: 0,
        moved: false,
      };
      setIsDragging(true);
      el.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragState.current.active || e.pointerId !== dragState.current.pointerId) {
        return;
      }

      const dx = e.clientX - dragState.current.startX;
      if (Math.abs(dx) > dragThreshold) {
        dragState.current.moved = true;
      }

      el.scrollLeft = dragState.current.scrollLeft - dx;

      const now = performance.now();
      const dt = now - dragState.current.lastTime;
      if (dt > 0) {
        const instant = ((e.clientX - dragState.current.lastX) / dt) * 16;
        dragState.current.velocity =
          dragState.current.velocity * 0.65 + instant * 0.35;
      }
      dragState.current.lastX = e.clientX;
      dragState.current.lastTime = now;
    };

    const endDrag = (e: PointerEvent) => {
      if (!dragState.current.active || e.pointerId !== dragState.current.pointerId) {
        return;
      }

      dragState.current.active = false;
      setIsDragging(false);
      if (el.hasPointerCapture(e.pointerId)) {
        el.releasePointerCapture(e.pointerId);
      }
      runMomentum();
    };

    const onClickCapture = (e: MouseEvent) => {
      if (dragState.current.moved) {
        e.preventDefault();
        e.stopPropagation();
        dragState.current.moved = false;
      }
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);
    el.addEventListener("click", onClickCapture, true);

    return () => {
      stopMomentum();
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", endDrag);
      el.removeEventListener("pointercancel", endDrag);
      el.removeEventListener("click", onClickCapture, true);
    };
  }, [dragThreshold, friction]);

  return { ref, isDragging };
}
