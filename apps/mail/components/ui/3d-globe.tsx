"use client";

import React, {
  useRef,
  useMemo,
  useState,
  useCallback,
  Suspense,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface GlobeMarker {
  lat: number;
  lng: number;
  src?: string;
  label?: string;
  size?: number;
}

/** Animated email path between two points on the globe. */
export interface GlobeMailRoute {
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  /** Outbound (send) vs inbound (receive) — different colors/direction cue */
  kind?: "send" | "receive";
  /** Stagger start of the packet loop (seconds) */
  delay?: number;
  /** Loop duration in seconds */
  duration?: number;
}

export interface Globe3DConfig {
  radius?: number;
  globeColor?: string;
  textureUrl?: string;
  bumpMapUrl?: string;
  showAtmosphere?: boolean;
  atmosphereColor?: string;
  atmosphereIntensity?: number;
  atmosphereBlur?: number;
  bumpScale?: number;
  autoRotateSpeed?: number;
  enableZoom?: boolean;
  enablePan?: boolean;
  minDistance?: number;
  maxDistance?: number;
  initialRotation?: { x: number; y: number };
  markerSize?: number;
  showWireframe?: boolean;
  wireframeColor?: string;
  ambientIntensity?: number;
  pointLightIntensity?: number;
  backgroundColor?: string | null;
}

interface Globe3DProps {
  markers?: GlobeMarker[];
  /** Email send/receive arcs */
  routes?: GlobeMailRoute[];
  config?: Globe3DConfig;
  className?: string;
  onMarkerClick?: (marker: GlobeMarker) => void;
  onMarkerHover?: (marker: GlobeMarker | null) => void;
}

// ============================================================================
// Constants — NASA Blue Marble (21st.dev CDN)
// ============================================================================

const DEFAULT_EARTH_TEXTURE = "/textures/earth-day.jpg";
const DEFAULT_BUMP_TEXTURE = "/textures/earth-bump.png";

// ============================================================================
// Utils
// ============================================================================

function latLngToVector3(
  lat: number,
  lng: number,
  radius: number,
): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

function createArcCurve(
  from: THREE.Vector3,
  to: THREE.Vector3,
  altitude = 0.35,
): THREE.QuadraticBezierCurve3 {
  const mid = from.clone().add(to).multiplyScalar(0.5);
  const midLen = mid.length() || 1;
  mid.normalize().multiplyScalar(midLen + altitude);
  return new THREE.QuadraticBezierCurve3(from, mid, to);
}

// ============================================================================
// Mail route arc + traveling packet
// ============================================================================

function MailRouteArc({
  route,
  radius,
}: {
  route: GlobeMailRoute;
  radius: number;
}) {
  const packetRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Mesh>(null);
  const kind = route.kind ?? "send";
  const duration = route.duration ?? 3.2;
  const delay = route.delay ?? 0;
  const color = kind === "send" ? "#ffffff" : "#93c5fd";

  const { curve, tube } = useMemo(() => {
    const from = latLngToVector3(route.from.lat, route.from.lng, radius * 1.01);
    const to = latLngToVector3(route.to.lat, route.to.lng, radius * 1.01);
    const c = createArcCurve(from, to, radius * 0.42);
    const geometry = new THREE.TubeGeometry(c, 48, 0.008, 8, false);
    return { curve: c, tube: geometry };
  }, [route.from.lat, route.from.lng, route.to.lat, route.to.lng, radius]);

  useFrame(({ clock }) => {
    const t = ((clock.elapsedTime + delay) % duration) / duration;
    const point = curve.getPoint(t);
    if (packetRef.current) {
      packetRef.current.position.copy(point);
      const scale = 0.55 + Math.sin(t * Math.PI) * 0.55;
      packetRef.current.scale.setScalar(scale);
    }
    if (trailRef.current) {
      const mat = trailRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.12 + Math.sin(t * Math.PI) * 0.18;
    }
  });

  return (
    <group>
      <mesh ref={trailRef} geometry={tube}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.22}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={packetRef}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

// ============================================================================
// Marker
// ============================================================================

interface MarkerProps {
  marker: GlobeMarker;
  radius: number;
  defaultSize: number;
  onClick?: (marker: GlobeMarker) => void;
  onHover?: (marker: GlobeMarker | null) => void;
}

function Marker({
  marker,
  radius,
  defaultSize,
  onClick,
  onHover,
}: MarkerProps) {
  const [hovered, setHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const imageGroupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  const surfacePosition = useMemo(
    () => latLngToVector3(marker.lat, marker.lng, radius * 1.001),
    [marker.lat, marker.lng, radius],
  );

  const topPosition = useMemo(
    () => latLngToVector3(marker.lat, marker.lng, radius * 1.14),
    [marker.lat, marker.lng, radius],
  );

  const lineHeight = topPosition.distanceTo(surfacePosition);
  const size = marker.size ?? defaultSize;

  useFrame(() => {
    if (!imageGroupRef.current) return;
    const worldPos = new THREE.Vector3();
    imageGroupRef.current.getWorldPosition(worldPos);
    const markerDirection = worldPos.clone().normalize();
    const cameraDirection = camera.position.clone().normalize();
    setIsVisible(markerDirection.dot(cameraDirection) > 0.08);
  });

  const handlePointerEnter = useCallback(() => {
    setHovered(true);
    onHover?.(marker);
  }, [marker, onHover]);

  const handlePointerLeave = useCallback(() => {
    setHovered(false);
    onHover?.(null);
  }, [onHover]);

  const handleClick = useCallback(() => {
    onClick?.(marker);
  }, [marker, onClick]);

  const { lineCenter, lineQuaternion } = useMemo(() => {
    const center = surfacePosition.clone().lerp(topPosition, 0.5);
    const direction = topPosition.clone().sub(surfacePosition).normalize();
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    return { lineCenter: center, lineQuaternion: quaternion };
  }, [surfacePosition, topPosition]);

  return (
    <group visible={isVisible}>
      <mesh position={lineCenter} quaternion={lineQuaternion}>
        <cylinderGeometry args={[0.003, 0.003, lineHeight, 8]} />
        <meshBasicMaterial
          color={hovered ? "#ffffff" : "#94a3b8"}
          transparent
          opacity={hovered ? 0.9 : 0.55}
        />
      </mesh>

      <mesh position={surfacePosition}>
        <sphereGeometry args={[size * 0.55, 12, 12]} />
        <meshBasicMaterial color={hovered ? "#ffffff" : "#e5e5e5"} />
      </mesh>

      <group ref={imageGroupRef} position={topPosition}>
        {marker.src ? (
          <Html
            transform
            center
            sprite
            distanceFactor={10}
            style={{
              pointerEvents: isVisible ? "auto" : "none",
              opacity: isVisible ? 1 : 0,
              transition: "opacity 0.15s ease-out",
            }}
          >
            <div
              className={cn(
                "cursor-pointer overflow-hidden rounded-full bg-neutral-900 shadow-lg transition-transform duration-200",
                hovered && "scale-125 shadow-xl ring-1 ring-white/50",
              )}
              style={{ width: 18, height: 18 }}
              onMouseEnter={handlePointerEnter}
              onMouseLeave={handlePointerLeave}
              onClick={handleClick}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={marker.src}
                alt={marker.label || "Marker"}
                className="h-full w-full object-cover"
                draggable={false}
              />
            </div>
          </Html>
        ) : (
          <mesh
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            onClick={handleClick}
          >
            <sphereGeometry args={[size, 12, 12]} />
            <meshBasicMaterial color={hovered ? "#ffffff" : "#fafafa"} />
          </mesh>
        )}
      </group>
    </group>
  );
}

// ============================================================================
// Rotating globe
// ============================================================================

interface RotatingGlobeProps {
  config: Required<Globe3DConfig>;
  markers: GlobeMarker[];
  routes: GlobeMailRoute[];
  onMarkerClick?: (marker: GlobeMarker) => void;
  onMarkerHover?: (marker: GlobeMarker | null) => void;
}

function RotatingGlobe({
  config,
  markers,
  routes,
  onMarkerClick,
  onMarkerHover,
}: RotatingGlobeProps) {
  const [earthTexture, bumpTexture] = useTexture([
    config.textureUrl,
    config.bumpMapUrl,
  ]);

  useMemo(() => {
    if (earthTexture) {
      earthTexture.colorSpace = THREE.SRGBColorSpace;
      earthTexture.anisotropy = 16;
    }
    if (bumpTexture) {
      bumpTexture.anisotropy = 8;
    }
  }, [earthTexture, bumpTexture]);

  const geometry = useMemo(
    () => new THREE.SphereGeometry(config.radius, 64, 64),
    [config.radius],
  );

  const wireframeGeometry = useMemo(
    () => new THREE.SphereGeometry(config.radius * 1.002, 32, 16),
    [config.radius],
  );

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          map={earthTexture}
          bumpMap={bumpTexture}
          bumpScale={config.bumpScale * 0.05}
          roughness={0.7}
          metalness={0.0}
        />
      </mesh>

      {config.showWireframe ? (
        <mesh geometry={wireframeGeometry}>
          <meshBasicMaterial
            color={config.wireframeColor}
            wireframe
            transparent
            opacity={0.08}
          />
        </mesh>
      ) : null}

      {markers.map((marker, index) => (
        <Marker
          key={`marker-${index}-${marker.lat}-${marker.lng}`}
          marker={marker}
          radius={config.radius}
          defaultSize={config.markerSize}
          onClick={onMarkerClick}
          onHover={onMarkerHover}
        />
      ))}

      {routes.map((route, index) => (
        <MailRouteArc
          key={`route-${index}-${route.from.lat}-${route.to.lng}`}
          route={route}
          radius={config.radius}
        />
      ))}
    </group>
  );
}

// ============================================================================
// Atmosphere
// ============================================================================

function Atmosphere({
  radius,
  color,
  intensity,
  blur,
}: {
  radius: number;
  color: string;
  intensity: number;
  blur: number;
}) {
  const fresnelPower = Math.max(0.5, 5 - blur);

  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        atmosphereColor: { value: new THREE.Color(color) },
        intensity: { value: intensity },
        fresnelPower: { value: fresnelPower },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 atmosphereColor;
        uniform float intensity;
        uniform float fresnelPower;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          float fresnel = pow(1.0 - abs(dot(vNormal, normalize(-vPosition))), fresnelPower);
          gl_FragColor = vec4(atmosphereColor, fresnel * intensity);
        }
      `,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
  }, [color, intensity, fresnelPower]);

  return (
    <mesh scale={[1.12, 1.12, 1.12]}>
      <sphereGeometry args={[radius, 64, 32]} />
      <primitive object={atmosphereMaterial} attach="material" />
    </mesh>
  );
}

// ============================================================================
// Scene
// ============================================================================

function Scene({
  markers,
  routes,
  config,
  onMarkerClick,
  onMarkerHover,
}: {
  markers: GlobeMarker[];
  routes: GlobeMailRoute[];
  config: Required<Globe3DConfig>;
  onMarkerClick?: (marker: GlobeMarker) => void;
  onMarkerHover?: (marker: GlobeMarker | null) => void;
}) {
  const { camera } = useThree();

  React.useEffect(() => {
    camera.position.set(0, 0.15, config.radius * 3.35);
    camera.lookAt(0, 0, 0);
  }, [camera, config.radius]);

  return (
    <>
      <ambientLight intensity={config.ambientIntensity} />
      <directionalLight
        position={[config.radius * 5, config.radius * 2, config.radius * 5]}
        intensity={config.pointLightIntensity}
        color="#ffffff"
      />
      <directionalLight
        position={[-config.radius * 3, config.radius, -config.radius * 2]}
        intensity={config.pointLightIntensity * 0.3}
        color="#88ccff"
      />

      <RotatingGlobe
        config={config}
        markers={markers}
        routes={routes}
        onMarkerClick={onMarkerClick}
        onMarkerHover={onMarkerHover}
      />

      {config.showAtmosphere ? (
        <Atmosphere
          radius={config.radius}
          color={config.atmosphereColor}
          intensity={config.atmosphereIntensity}
          blur={config.atmosphereBlur}
        />
      ) : null}

      <OrbitControls
        makeDefault
        enablePan={config.enablePan}
        enableZoom={config.enableZoom}
        minDistance={config.minDistance}
        maxDistance={config.maxDistance}
        rotateSpeed={0.4}
        autoRotate={config.autoRotateSpeed > 0}
        autoRotateSpeed={config.autoRotateSpeed}
        enableDamping
        dampingFactor={0.1}
      />
    </>
  );
}

function LoadingFallback() {
  return (
    <Html center>
      <div className="flex shrink-0 flex-col items-center gap-3">
        <span className="inline-block shrink-0 text-sm text-neutral-400">
          Loading globe...
        </span>
      </div>
    </Html>
  );
}

const defaultConfig: Required<Globe3DConfig> = {
  radius: 2,
  globeColor: "#1a1a2e",
  textureUrl: DEFAULT_EARTH_TEXTURE,
  bumpMapUrl: DEFAULT_BUMP_TEXTURE,
  showAtmosphere: true,
  atmosphereColor: "#4da6ff",
  atmosphereIntensity: 0.55,
  atmosphereBlur: 2,
  bumpScale: 1.2,
  autoRotateSpeed: 0.35,
  enableZoom: false,
  enablePan: false,
  minDistance: 5,
  maxDistance: 15,
  initialRotation: { x: 0, y: 0 },
  markerSize: 0.05,
  showWireframe: false,
  wireframeColor: "#4a9eff",
  ambientIntensity: 0.65,
  pointLightIntensity: 1.45,
  backgroundColor: null,
};

export function Globe3D({
  markers = [],
  routes = [],
  config = {},
  className,
  onMarkerClick,
  onMarkerHover,
}: Globe3DProps) {
  const mergedConfig = useMemo(
    () => ({ ...defaultConfig, ...config }),
    [config],
  );

  return (
    <div className={cn("relative h-[500px] w-full", className)}>
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 1.75]}
        camera={{
          fov: 42,
          near: 0.1,
          far: 1000,
          position: [0, 0.15, mergedConfig.radius * 3.35],
        }}
        style={{
          background: mergedConfig.backgroundColor || "transparent",
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Scene
            markers={markers}
            routes={routes}
            config={mergedConfig}
            onMarkerClick={onMarkerClick}
            onMarkerHover={onMarkerHover}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default Globe3D;
