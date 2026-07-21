/**
 * Meta-Pet Teacher Lesson System — feature availability (Pass 2).
 *
 * Lessons declare `requiredFeatureFlags`. Before mounting a real system the
 * Runner checks availability so an unsupported device (e.g. no canvas for the
 * advanced visualiser) gets a clear teacher-friendly fallback instead of a
 * blank area or a raw technical error.
 *
 * Availability is intentionally simple and dependency-free. A test/override
 * hook lets us force states without a real browser.
 */

import type { LessonDefinition, LessonFeatureFlag } from "./types";

export interface FeatureAvailability {
  available: boolean;
  /** Teacher-friendly reason when unavailable. */
  reason?: string;
}

let overrides: Partial<Record<LessonFeatureFlag, boolean>> = {};

/** Test/host override for feature availability. Pass {} to clear. */
export function setFeatureAvailabilityOverrides(
  next: Partial<Record<LessonFeatureFlag, boolean>>,
): void {
  overrides = { ...next };
}

function canUseCanvas(): boolean {
  if (typeof document === "undefined") return true; // SSR: assume available
  try {
    const canvas = document.createElement("canvas");
    return typeof canvas.getContext === "function";
  } catch {
    return false;
  }
}

/** Resolve availability for a single feature flag. */
export function isFeatureAvailable(
  flag: LessonFeatureFlag,
): FeatureAvailability {
  if (flag in overrides) {
    const available = overrides[flag] === true;
    return available
      ? { available: true }
      : {
          available: false,
          reason:
            "This tool has been turned off for this session. A simplified classroom example is used instead.",
        };
  }

  switch (flag) {
    case "advanced-visualisation":
      return canUseCanvas()
        ? { available: true }
        : {
            available: false,
            reason:
              "The full DNA visualiser is unavailable on this device. A simplified classroom example has been loaded instead.",
          };
    // Body Forge, DNA Lab, vitals and emotions run as self-contained
    // classroom emulations in Pass 2, so they are always available.
    case "body-forge":
    case "dna-lab":
    case "vitals":
    case "emotions":
    default:
      return { available: true };
  }
}

/**
 * Resolve availability for a whole lesson. A lesson is unavailable only if a
 * required flag is unavailable; the reason from the first blocking flag is
 * surfaced.
 */
export function resolveLessonAvailability(
  lesson: Pick<LessonDefinition, "requiredFeatureFlags">,
): FeatureAvailability {
  for (const flag of lesson.requiredFeatureFlags) {
    const result = isFeatureAvailable(flag);
    if (!result.available) {
      return result;
    }
  }
  return { available: true };
}
