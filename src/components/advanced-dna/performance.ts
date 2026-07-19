import type { PerformanceMode, PerformanceProfile } from "./types";

export type DevicePerformanceTier = "low" | "balanced" | "high";

type NavigatorWithMemory = Navigator & { deviceMemory?: number };

export function detectDevicePerformance(
  nav: Navigator | undefined = typeof navigator === "undefined"
    ? undefined
    : navigator,
  viewportWidth = typeof window === "undefined" ? 1024 : window.innerWidth,
): DevicePerformanceTier {
  if (!nav) return "balanced";
  const memory = (nav as NavigatorWithMemory).deviceMemory;
  const cores = nav.hardwareConcurrency || 4;

  if (
    (memory !== undefined && memory <= 4) ||
    cores <= 4 ||
    viewportWidth < 480
  ) {
    return "low";
  }
  if (
    memory !== undefined &&
    memory >= 8 &&
    cores >= 8 &&
    viewportWidth >= 900
  ) {
    return "high";
  }
  return "balanced";
}

const PROFILES: Record<DevicePerformanceTier, PerformanceProfile> = {
  low: {
    dprCap: 1,
    densityScale: 0.45,
    blurScale: 0,
    trailAlpha: 0.24,
    recursion: 1,
    targetFps: 30,
  },
  balanced: {
    dprCap: 1.5,
    densityScale: 0.72,
    blurScale: 0.55,
    trailAlpha: 0.16,
    recursion: 2,
    targetFps: 45,
  },
  high: {
    dprCap: 2,
    densityScale: 1,
    blurScale: 1,
    trailAlpha: 0.1,
    recursion: 3,
    targetFps: 60,
  },
};

export function resolvePerformanceProfile(
  mode: PerformanceMode,
  detectedTier: DevicePerformanceTier,
  reducedMotion: boolean,
): PerformanceProfile {
  const tier =
    mode === "quality" ? "high" : mode === "performance" ? "low" : detectedTier;
  const profile = PROFILES[tier];

  if (!reducedMotion) return profile;
  return {
    ...profile,
    densityScale: Math.min(profile.densityScale, 0.55),
    blurScale: 0,
    recursion: 1,
    targetFps: 15,
  };
}
