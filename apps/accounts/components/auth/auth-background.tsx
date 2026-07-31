"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import Grainient, { type GrainientProps } from "@/components/ui/grainient/grainient"

const LIGHT_GRAINIENT: GrainientProps = {
  color1: "#ffffff",
  color2: "#dbeafe",
  color3: "#f1f5f9",
  timeSpeed: 0.1,
  colorBalance: 0.18,
  warpStrength: 0.32,
  warpFrequency: 4.2,
  warpSpeed: 0.9,
  warpAmplitude: 92,
  blendAngle: 12,
  blendSoftness: 0.14,
  rotationAmount: 220,
  noiseScale: 1.4,
  grainAmount: 0.035,
  grainScale: 2.8,
  grainAnimated: false,
  contrast: 1.04,
  gamma: 1.02,
  saturation: 0.72,
  centerX: 0,
  centerY: -0.06,
  zoom: 1.05,
}

const DARK_GRAINIENT: GrainientProps = {
  color1: "#0a0a0a",
  color2: "#1e3a5f",
  color3: "#111111",
  timeSpeed: 0.08,
  colorBalance: -0.08,
  warpStrength: 0.28,
  warpFrequency: 3.8,
  warpSpeed: 0.75,
  warpAmplitude: 100,
  blendAngle: 8,
  blendSoftness: 0.16,
  rotationAmount: 180,
  noiseScale: 1.2,
  grainAmount: 0.045,
  grainScale: 2.6,
  grainAnimated: false,
  contrast: 1.08,
  gamma: 1.04,
  saturation: 0.62,
  centerX: 0,
  centerY: -0.04,
  zoom: 1.02,
}

function useResolvedDarkMode() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return false
  return resolvedTheme === "dark"
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduced(media.matches)
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [])

  return reduced
}

/** Static CSS gradient — avoids full-screen WebGL cost in local dev. */
function AuthStaticBackground({ isDark }: { isDark: boolean }) {
  return (
    <div
      className={
        isDark
          ? "absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1e3a5f_0%,#0a0a0a_55%)]"
          : "absolute inset-0 bg-[radial-gradient(ellipse_at_top,#dbeafe_0%,#fafbfc_58%)]"
      }
    />
  )
}

const useAnimatedAuthBackground =
  process.env.NEXT_PUBLIC_AUTH_ANIMATED_BG === "1" ||
  process.env.NODE_ENV === "production"

export function AuthBackground() {
  const isDark = useResolvedDarkMode()
  const reducedMotion = usePrefersReducedMotion()
  const props = isDark ? DARK_GRAINIENT : LIGHT_GRAINIENT
  const useStatic = reducedMotion || !useAnimatedAuthBackground

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {useStatic ? (
        <AuthStaticBackground isDark={isDark} />
      ) : (
        <Grainient className="auth-grainient" {...props} />
      )}
      <div
        className={
          isDark
            ? "absolute inset-0 bg-background/55"
            : "absolute inset-0 bg-background/45"
        }
      />
    </div>
  )
}
