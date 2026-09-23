"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useReducedMotion } from "framer-motion";
import { agSpectrum } from "@/lib/mail-antigravity-theme";

const GEMINI = agSpectrum.map((hex) => new THREE.Color(hex));

type Particle = {
  home: THREE.Vector3;
  current: THREE.Vector3;
  color: THREE.Color;
  angleOffset: number;
  orbitSpeed: number;
  depthPhase: number;
};

type FieldConfig = {
  count: number;
  spread: number;
  size: number;
  opacity: number;
  magnetRadius: number;
  ringRadius: number;
  fieldStrength: number;
  waveSpeed: number;
  waveAmplitude: number;
  lerpSpeed: number;
  depthFactor: number;
  rotationSpeed: number;
  globalDrift: number;
};

const BACK_CONFIG: FieldConfig = {
  count: 2800,
  spread: 3.2,
  size: 0.022,
  opacity: 0.5,
  magnetRadius: 1.35,
  ringRadius: 0.55,
  fieldStrength: 2.2,
  waveSpeed: 1.4,
  waveAmplitude: 0.12,
  lerpSpeed: 0.035,
  depthFactor: 0.18,
  rotationSpeed: 0.35,
  globalDrift: 0.018,
};

const FRONT_CONFIG: FieldConfig = {
  count: 1200,
  spread: 2.8,
  size: 0.034,
  opacity: 0.82,
  magnetRadius: 1.85,
  ringRadius: 0.72,
  fieldStrength: 3.4,
  waveSpeed: 2.1,
  waveAmplitude: 0.18,
  lerpSpeed: 0.065,
  depthFactor: 0.28,
  rotationSpeed: 0.55,
  globalDrift: 0.028,
};

function buildParticles(count: number, spread: number): Particle[] {
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    const ring = Math.floor(Math.random() * 6);
    const t = Math.random() * Math.PI * 2;
    const rx = (0.6 + ring * 0.42 + Math.random() * 0.35) * spread;
    const ry = rx * (0.45 + Math.random() * 0.12);
    const rz = (Math.random() - 0.5) * spread * 0.22;

    const home = new THREE.Vector3(
      Math.cos(t) * rx,
      Math.sin(t) * ry,
      rz,
    );

    particles.push({
      home,
      current: home.clone(),
      color: GEMINI[ring % GEMINI.length].clone(),
      angleOffset: Math.random() * Math.PI * 2,
      orbitSpeed: 0.4 + Math.random() * 1.2,
      depthPhase: Math.random() * Math.PI * 2,
    });
  }

  return particles;
}

function pointerToWorld(
  nx: number,
  ny: number,
  camera: THREE.Camera,
  target: THREE.Vector3,
) {
  const vec = new THREE.Vector3(nx, ny, 0.5);
  vec.unproject(camera);
  const dir = vec.sub(camera.position).normalize();
  const dist = -camera.position.z / dir.z;
  target.copy(camera.position).add(dir.multiplyScalar(dist));
}

function MagneticField({ config }: { config: FieldConfig }) {
  const group = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const { camera, size } = useThree();

  const particles = useMemo(
    () => buildParticles(config.count, config.spread),
    [config.count, config.spread],
  );

  const positions = useMemo(
    () => new Float32Array(config.count * 3),
    [config.count],
  );
  const colors = useMemo(() => {
    const arr = new Float32Array(config.count * 3);
    particles.forEach((p, i) => {
      arr[i * 3] = p.color.r;
      arr[i * 3 + 1] = p.color.g;
      arr[i * 3 + 2] = p.color.b;
    });
    return arr;
  }, [particles, config.count]);

  const pointer = useRef({ nx: 0, ny: 0, active: false, idle: 0 });
  const cursorWorld = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const idleTarget = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.nx = (e.clientX / size.width) * 2 - 1;
      pointer.current.ny = -(e.clientY / size.height) * 2 + 1;
      pointer.current.active = true;
      pointer.current.idle = 0;
    };
    const onLeave = () => {
      pointer.current.active = false;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [size.width, size.height]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const ptr = pointer.current;

    ptr.idle += 0.016;

    if (ptr.active) {
      pointerToWorld(ptr.nx, ptr.ny, camera, cursorWorld);
    } else {
      idleTarget.set(
        Math.sin(t * 0.45) * 0.9,
        Math.cos(t * 0.38) * 0.55,
        0,
      );
      cursorWorld.copy(idleTarget);
    }

    if (group.current) {
      group.current.rotation.z = Math.sin(t * config.globalDrift) * 0.04;
    }

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const dx = cursorWorld.x - p.current.x;
      const dy = cursorWorld.y - p.current.y;
      const dist = Math.hypot(dx, dy);

      if (dist < config.magnetRadius) {
        const pull = 1 - dist / config.magnetRadius;
        const strength = pull * config.fieldStrength;
        const globalRot = t * config.rotationSpeed * p.orbitSpeed;
        const angle = Math.atan2(dy, dx) + globalRot + p.angleOffset;
        const wave =
          Math.sin(t * config.waveSpeed + angle) * config.waveAmplitude;
        const orbitR = config.ringRadius + wave + (1 - pull) * 0.15;

        target.set(
          cursorWorld.x + Math.cos(angle) * orbitR,
          cursorWorld.y + Math.sin(angle) * orbitR,
          p.home.z +
            Math.sin(t * 1.2 + p.depthPhase) * config.depthFactor * strength,
        );
      } else {
        target.copy(p.home);
        target.z =
          p.home.z + Math.sin(t * 0.8 + p.depthPhase) * config.depthFactor * 0.25;
      }

      p.current.lerp(target, config.lerpSpeed);

      positions[i * 3] = p.current.x;
      positions[i * 3 + 1] = p.current.y;
      positions[i * 3 + 2] = p.current.z;
    }

    const geo = pointsRef.current?.geometry;
    const attr = geo?.attributes.position as THREE.BufferAttribute | undefined;
    if (attr) {
      attr.needsUpdate = true;
    }
  });

  return (
    <group ref={group}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
            count={config.count}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
            count={config.count}
          />
        </bufferGeometry>
        <pointsMaterial
          size={config.size}
          vertexColors
          transparent
          opacity={config.opacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
    </group>
  );
}

function ArcRings({ spread }: { spread: number }) {
  const group = useRef<THREE.Group>(null);

  const lines = useMemo(() => {
    return [0, 1, 2, 3].map((ring) => {
      const pts: THREE.Vector3[] = [];
      const rx = (1.4 + ring * 0.55) * spread;
      const ry = rx * 0.5;
      for (let i = 0; i <= 128; i++) {
        const a = (i / 128) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * rx, Math.sin(a) * ry, 0));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: GEMINI[ring % GEMINI.length],
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      return new THREE.Line(geo, mat);
    });
  }, [spread]);

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.z = state.clock.elapsedTime * 0.02;
  });

  return (
    <group ref={group}>
      {lines.map((line, i) => (
        <primitive key={i} object={line} />
      ))}
    </group>
  );
}

function Scene({ layer }: { layer: "back" | "front" }) {
  const isBack = layer === "back";
  const config = isBack ? BACK_CONFIG : FRONT_CONFIG;

  return (
    <>
      <MagneticField config={config} />
      {isBack ? <ArcRings spread={1.05} /> : null}
    </>
  );
}

function WebglCanvas({
  layer,
  className,
}: {
  layer: "back" | "front";
  className?: string;
}) {
  return (
    <Canvas
      className={className}
      data-engine="three.js"
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 6], fov: 50 }}
      dpr={[1, 2]}
      style={{ width: "100%", height: "100%" }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <Suspense fallback={null}>
        <Scene layer={layer} />
      </Suspense>
    </Canvas>
  );
}

/** Dual Three.js canvases with magnetic cursor orbit — Antigravity-style. */
export function MailAgParticlesWebgl({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div
        aria-hidden
        className={className}
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 40%, rgba(66,133,244,0.08), transparent 60%), radial-gradient(ellipse 50% 40% at 60% 50%, rgba(234,67,53,0.05), transparent 55%)",
        }}
      />
    );
  }

  return (
    <div aria-hidden className={className}>
      <WebglCanvas
        layer="back"
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      <WebglCanvas
        layer="front"
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
    </div>
  );
}
