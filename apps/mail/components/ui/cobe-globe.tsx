"use client";

import {
  useEffect,
  useRef,
  useCallback,
  type PointerEvent as ReactPointerEvent,
} from "react";
import createGlobe from "cobe";
import { cn } from "@/lib/utils";

export interface CobeMarker {
  id: string;
  location: [number, number];
  label: string;
}

export interface CobeArc {
  id: string;
  from: [number, number];
  to: [number, number];
  label?: string;
  color?: [number, number, number];
}

export interface GlobeProps {
  markers?: CobeMarker[];
  arcs?: CobeArc[];
  className?: string;
  markerColor?: [number, number, number];
  baseColor?: [number, number, number];
  arcColor?: [number, number, number];
  glowColor?: [number, number, number];
  dark?: number;
  mapBrightness?: number;
  markerSize?: number;
  markerElevation?: number;
  arcWidth?: number;
  arcHeight?: number;
  speed?: number;
  theta?: number;
  diffuse?: number;
  mapSamples?: number;
  /** Pause auto-spin (e.g. reduced motion) */
  paused?: boolean;
  /** City/arc HTML labels — hide on small screens */
  showLabels?: boolean;
  /** Cap canvas DPR (1 = lighter mobile) */
  maxDpr?: number;
}

export function Globe({
  markers = [],
  arcs = [],
  className = "",
  markerColor = [0.3, 0.45, 0.85],
  baseColor = [1, 1, 1],
  arcColor = [0.3, 0.45, 0.85],
  glowColor = [0.94, 0.93, 0.91],
  dark = 0,
  mapBrightness = 10,
  markerSize = 0.025,
  markerElevation = 0.01,
  arcWidth = 0.5,
  arcHeight = 0.25,
  speed = 0.003,
  theta = 0.2,
  diffuse = 1.5,
  mapSamples = 16000,
  paused = false,
  showLabels = true,
  maxDpr = 2,
}: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
  const lastPointer = useRef<{ x: number; y: number; t: number } | null>(null);
  const dragOffset = useRef({ phi: 0, theta: 0 });
  const velocity = useRef({ phi: 0, theta: 0 });
  const phiOffsetRef = useRef(0);
  const thetaOffsetRef = useRef(0);
  const isPausedRef = useRef(false);
  const pausedPropRef = useRef(paused);
  pausedPropRef.current = paused;

  const handlePointerDown = useCallback((e: ReactPointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY };
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
    isPausedRef.current = true;
  }, []);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (pointerInteracting.current === null) return;
    const deltaX = e.clientX - pointerInteracting.current.x;
    const deltaY = e.clientY - pointerInteracting.current.y;
    dragOffset.current = { phi: deltaX / 300, theta: deltaY / 1000 };
    const now = Date.now();
    if (lastPointer.current) {
      const dt = Math.max(now - lastPointer.current.t, 1);
      const maxVelocity = 0.15;
      velocity.current = {
        phi: Math.max(
          -maxVelocity,
          Math.min(
            maxVelocity,
            ((e.clientX - lastPointer.current.x) / dt) * 0.3,
          ),
        ),
        theta: Math.max(
          -maxVelocity,
          Math.min(
            maxVelocity,
            ((e.clientY - lastPointer.current.y) / dt) * 0.08,
          ),
        ),
      };
    }
    lastPointer.current = { x: e.clientX, y: e.clientY, t: now };
  }, []);

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffsetRef.current += dragOffset.current.phi;
      thetaOffsetRef.current += dragOffset.current.theta;
      dragOffset.current = { phi: 0, theta: 0 };
      lastPointer.current = null;
    }
    pointerInteracting.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";
    isPausedRef.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let globe: ReturnType<typeof createGlobe> | null = null;
    let animationId = 0;
    let phi = 0;
    let disposed = false;

    const markerPayload = () =>
      markers.map((m) => ({
        location: m.location,
        size: markerSize,
        id: m.id,
      }));

    const arcPayload = () =>
      arcs.map((a) => ({
        from: a.from,
        to: a.to,
        id: a.id,
        ...(a.color ? { color: a.color } : {}),
      }));

    function init() {
      if (disposed || !canvas || globe) return;
      const width = canvas.offsetWidth;
      if (width === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: width * dpr,
        height: width * dpr,
        phi: 0,
        theta,
        dark,
        diffuse,
        mapSamples,
        mapBrightness,
        baseColor,
        markerColor,
        glowColor,
        markerElevation,
        markers: markerPayload(),
        arcs: arcPayload(),
        arcColor,
        arcWidth,
        arcHeight,
        opacity: 0.85,
        scale: 1.05,
      });

      function animate() {
        if (disposed || !globe) return;

        const spinning = !isPausedRef.current && !pausedPropRef.current;
        if (spinning) {
          phi += speed;
          if (
            Math.abs(velocity.current.phi) > 0.0001 ||
            Math.abs(velocity.current.theta) > 0.0001
          ) {
            phiOffsetRef.current += velocity.current.phi;
            thetaOffsetRef.current += velocity.current.theta;
            velocity.current.phi *= 0.95;
            velocity.current.theta *= 0.95;
          }
          const thetaMin = -0.4;
          const thetaMax = 0.4;
          if (thetaOffsetRef.current < thetaMin) {
            thetaOffsetRef.current +=
              (thetaMin - thetaOffsetRef.current) * 0.1;
          } else if (thetaOffsetRef.current > thetaMax) {
            thetaOffsetRef.current +=
              (thetaMax - thetaOffsetRef.current) * 0.1;
          }
        }

        globe.update({
          phi: phi + phiOffsetRef.current + dragOffset.current.phi,
          theta: theta + thetaOffsetRef.current + dragOffset.current.theta,
          dark,
          mapBrightness,
          markerColor,
          baseColor,
          arcColor,
          markerElevation,
          markers: markerPayload(),
          arcs: arcPayload(),
        });
        animationId = requestAnimationFrame(animate);
      }

      animate();
      requestAnimationFrame(() => {
        if (canvas) canvas.style.opacity = "1";
      });
    }

    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w <= 0) return;
      if (!globe) {
        init();
        return;
      }
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      globe.update({
        width: w * dpr,
        height: w * dpr,
        devicePixelRatio: dpr,
      });
    });
    ro.observe(canvas);

    if (canvas.offsetWidth > 0) init();

    return () => {
      disposed = true;
      ro.disconnect();
      if (animationId) cancelAnimationFrame(animationId);
      if (globe) globe.destroy();
      globe = null;
    };
  }, [
    markers,
    arcs,
    markerColor,
    baseColor,
    arcColor,
    glowColor,
    dark,
    mapBrightness,
    markerSize,
    markerElevation,
    arcWidth,
    arcHeight,
    speed,
    theta,
    diffuse,
    mapSamples,
    maxDpr,
  ]);

  return (
    <div
      className={cn(
        "relative aspect-square w-full max-w-full select-none",
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        className="size-full rounded-full"
        style={{
          cursor: "grab",
          opacity: 0,
          transition: "opacity 1.2s ease",
          touchAction: "none",
          contain: "layout paint size",
        }}
      />

      {showLabels
        ? markers.map((m) => (
            <div
              key={m.id}
              style={{
                position: "absolute",
                positionAnchor: `--cobe-${m.id}`,
                bottom: "anchor(top)",
                left: "anchor(center)",
                translate: "-50% 0",
                marginBottom: 8,
                padding: "2px 6px",
                background: dark > 0.5 ? "#111111" : "#1a1a2e",
                color: "#fff",
                fontFamily: "ui-monospace, monospace",
                fontSize: "0.6rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                opacity: `var(--cobe-visible-${m.id}, 0)`,
                filter: `blur(calc((1 - var(--cobe-visible-${m.id}, 0)) * 8px))`,
                transition: "opacity 0.8s, filter 0.8s",
                border:
                  dark > 0.5 ? "1px solid rgba(255,255,255,0.12)" : undefined,
              }}
            >
              {m.label}
              <span
                style={{
                  position: "absolute",
                  top: "100%",
                  left: "50%",
                  transform: "translate3d(-50%, -1px, 0)",
                  border: "5px solid transparent",
                  borderTopColor: dark > 0.5 ? "#111111" : "#1a1a2e",
                }}
              />
            </div>
          ))
        : null}

      {showLabels
        ? arcs
            .filter((a) => a.label)
            .map((a) => (
              <div
                key={a.id}
                style={{
                  position: "absolute",
                  positionAnchor: `--cobe-arc-${a.id}`,
                  bottom: "anchor(top)",
                  left: "anchor(center)",
                  translate: "-50% 0",
                  marginBottom: 8,
                  padding: "2px 6px",
                  background: dark > 0.5 ? "rgba(255,255,255,0.92)" : "#fff",
                  color: "#111111",
                  fontFamily: "ui-monospace, monospace",
                  fontSize: "0.6rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                  opacity: `var(--cobe-visible-arc-${a.id}, 0)`,
                  filter: `blur(calc((1 - var(--cobe-visible-arc-${a.id}, 0)) * 8px))`,
                  transition: "opacity 0.8s, filter 0.8s",
                }}
              >
                {a.label}
                <span
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: "50%",
                    transform: "translate3d(-50%, -1px, 0)",
                    border: "5px solid transparent",
                    borderTopColor:
                      dark > 0.5 ? "rgba(255,255,255,0.92)" : "#fff",
                  }}
                />
              </div>
            ))
        : null}
    </div>
  );
}

export default Globe;
