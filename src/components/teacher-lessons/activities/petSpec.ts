/**
 * Adapter: turn a lib-layer {@link LessonPetConfig} into a real Body Forge
 * {@link BodySpec} so lessons render through the genuine `PetBodyRenderer`.
 * Kept on the component side so the lib layer stays free of rendering imports.
 */

import {
  DEFAULT_BODY_SPEC,
  type BodySpec,
} from "@/components/body-forge/PetBodyRenderer";
import type { LessonPetConfig } from "@/lib/teacher-lessons";

const MOVEMENT_MOTION: Record<
  LessonPetConfig["movement"],
  Pick<BodySpec, "bob" | "breathe" | "animationSpeed" | "tilt">
> = {
  float: { bob: 8, breathe: 0.04, animationSpeed: 1, tilt: 0 },
  bounce: { bob: 16, breathe: 0.05, animationSpeed: 1.6, tilt: 0 },
  glide: { bob: 4, breathe: 0.03, animationSpeed: 1.2, tilt: 6 },
  still: { bob: 0, breathe: 0.012, animationSpeed: 0.2, tilt: 0 },
};

/** Deterministically merge a lesson config onto the default body spec. */
export function configToBodySpec(config: LessonPetConfig): BodySpec {
  const motion = MOVEMENT_MOTION[config.movement] ?? MOVEMENT_MOTION.float;
  const features = config.feature
    ? ([config.feature] as BodySpec["features"])
    : ([] as BodySpec["features"]);

  return {
    ...DEFAULT_BODY_SPEC,
    name: config.alias || DEFAULT_BODY_SPEC.name,
    shape: config.shape as BodySpec["shape"],
    pattern: config.pattern as BodySpec["pattern"],
    expression: config.expression as BodySpec["expression"],
    primaryColor: config.primaryColor,
    secondaryColor: config.secondaryColor,
    highlightColor: config.highlightColor,
    eyeSize: 8 + config.eyeOpenness * 10,
    pupilSize: 3 + config.eyeOpenness * 5,
    glow: 0.2 + config.brightness * 0.6,
    tilt: motion.tilt + config.posture * 8,
    bob: motion.bob,
    breathe: 0.012 + config.breathing * 0.05,
    animationSpeed: motion.animationSpeed,
    features,
  };
}

/** A short, plain-language description of a pet for screen readers / captions. */
export function describePetConfig(config: LessonPetConfig): string {
  const feature = config.feature ? ` with ${config.feature}` : "";
  return `A ${config.pattern} ${config.shape}-shaped Meta-Pet${feature}, looking ${config.expression}.`;
}
