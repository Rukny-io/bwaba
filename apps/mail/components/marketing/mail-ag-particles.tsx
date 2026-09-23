"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { agSpectrum } from "@/lib/mail-antigravity-theme";

type Particle = {
  x: number;
  y: number;
  angle: number;
  radius: number;
  speed: number;
  size: number;
  color: string;
  alpha: number;
  kind: "dot" | "dash";
  dashAngle: number;
  orbitCx: number;
  orbitCy: number;
  orbitR: number;
};

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function createParticles(
  w: number,
  h: number,
  count: number,
  mobile: boolean,
): Particle[] {
  const cx = w * 0.5;
  const cy = h * 0.42;
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    const color = agSpectrum[i % agSpectrum.length];
    const orbitR = mobile
      ? 80 + Math.random() * 180
      : 120 + Math.random() * 320;
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
    const kind = Math.random() > 0.72 ? "dash" : "dot";

    particles.push({
      x: cx + Math.cos(angle) * orbitR,
      y: cy + Math.sin(angle) * orbitR * 0.55,
      angle,
      radius: orbitR,
      speed: (0.00015 + Math.random() * 0.00035) * (Math.random() > 0.5 ? 1 : -1),
      size: kind === "dot" ? 1.2 + Math.random() * 2.2 : 2 + Math.random() * 4,
      color,
      alpha: 0.25 + Math.random() * 0.55,
      kind,
      dashAngle: Math.random() * Math.PI,
      orbitCx: cx,
      orbitCy: cy,
      orbitR,
    });
  }

  return particles;
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  const [r, g, b] = hexToRgb(p.color);
  ctx.save();
  ctx.globalAlpha = p.alpha;
  ctx.fillStyle = `rgb(${r},${g},${b})`;

  if (p.kind === "dot") {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.translate(p.x, p.y);
    ctx.rotate(p.dashAngle);
    ctx.fillRect(-p.size * 0.5, -0.6, p.size, 1.2);
  }

  ctx.restore();
}

function drawArcRings(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
) {
  const cx = w * 0.5;
  const cy = h * 0.42;
  const rings = [0.22, 0.32, 0.42];

  rings.forEach((ratio, ri) => {
    const radius = Math.min(w, h) * ratio;
    const color = agSpectrum[ri % agSpectrum.length];
    const [r, g, b] = hexToRgb(color);

    ctx.save();
    ctx.strokeStyle = `rgba(${r},${g},${b},0.14)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(
      cx,
      cy,
      radius,
      radius * 0.55,
      time * 0.00002 * (ri + 1),
      0,
      Math.PI * 2,
    );
    ctx.stroke();
    ctx.restore();
  });
}

export function MailAgParticles({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();
  const mouseRef = useRef({ x: 0.5, y: 0.4, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reduceMotion) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let particles: Particle[] = [];
    let time = 0;
    const mobile = window.matchMedia("(max-width: 768px)").matches;

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
        active: true,
      };
    };
    const onLeave = () => {
      mouseRef.current.active = false;
    };

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = mobile ? 140 : 280;
      particles = createParticles(rect.width, rect.height, count, mobile);
    };

    const tick = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const mouse = mouseRef.current;

      let cx = w * 0.5;
      let cy = h * 0.42;
      if (mouse.active) {
        cx = w * mouse.x;
        cy = h * mouse.y;
      }

      ctx.clearRect(0, 0, w, h);
      drawArcRings(ctx, w, h, time);

      for (const p of particles) {
        p.orbitCx += (cx - p.orbitCx) * 0.02;
        p.orbitCy += (cy - p.orbitCy) * 0.02;
        p.angle += p.speed;
        p.x = p.orbitCx + Math.cos(p.angle) * p.orbitR;
        p.y = p.orbitCy + Math.sin(p.angle) * p.orbitR * 0.55;
        p.dashAngle += 0.008;
        p.alpha = 0.35 + Math.sin(time * 0.002 + p.angle * 3) * 0.2 + 0.3;
        drawParticle(ctx, p);
      }

      time += 16;
      raf = requestAnimationFrame(tick);
    };

    resize();
    raf = requestAnimationFrame(tick);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, [reduceMotion]);

  if (reduceMotion) {
    return (
      <div
        aria-hidden
        className={className}
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 40%, rgba(66,133,244,0.06), transparent 60%), radial-gradient(ellipse 50% 40% at 60% 50%, rgba(234,67,53,0.04), transparent 55%)",
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className}
    />
  );
}
