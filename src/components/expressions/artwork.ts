import { capturePhase, durationMs, getExpression, sampleExpression, variedSeed, type Settings } from "@/lib/expressions/studio";
import { MIN_FRAME_DELAY_MS, planAnimation } from "@/lib/expressions/exportPlan";
import { sampleTake, takeDuration, takeFramePlan, weightedFrame, type PerformanceTake } from "@/lib/expressions/take";
import type { ArtProps } from "./ExpressionArt";

export type Artwork = Omit<ArtProps, "frame"> & { settings: Settings; reducedMotion?: boolean; take?: PerformanceTake };

export function artworkDuration(art: Artwork) {
  return art.take ? takeDuration(art.take) : durationMs(art.expression, art.settings, art.pet.personality);
}

export function artworkCapturePhase(art: Artwork) {
  if (!art.take) return capturePhase(art.expression, art.settings);
  if (art.settings.capture >= 0) return art.settings.capture;
  const first = art.take.cues[0];
  return (first.at + first.duration * (getExpression(first.expressionId)?.staticFrame ?? .5)) / takeDuration(art.take);
}

export function sampleArtwork(art: Artwork, progress: number): ArtProps {
  const { expression, settings, pet, reducedMotion, take } = art;
  // The user's variation reseeds particles and secondary motion; 0 is the creature's own seed.
  const seed = variedSeed(pet.seed, settings.variation);
  if (!take) return { ...art, frame: sampleExpression(expression, progress, settings, pet.personality, seed, reducedMotion) };
  const position = reducedMotion ? artworkCapturePhase(art) : progress;
  const sample = sampleTake(take, artworkDuration(art) * position, pet.personality, seed, reducedMotion);
  if (sample) return { ...art, expression: sample.expression, frame: weightedFrame(sample) };
  const frame = sampleExpression(expression, 0, settings, pet.personality, seed);
  return { ...art, frame: { ...frame, angle: 0, lid: 1, mouth: 0, mouthOpen: 0, eyes: "normal", aura: 0, particles: [], props: [] } };
}


export function animationFramePlan(art: Artwork) {
  const duration = artworkDuration(art);
  if (art.reducedMotion) return [{ progress: artworkCapturePhase(art), delay: Math.round(duration) }];
  if (art.take) {
    // Recorded takes have their own cue-aligned plan (at most 48 baseline frames plus one per cue).
    // Browsers stretch GIF delays under 20 ms to 100 ms, so keep each frame at least that long.
    return takeFramePlan(art.take)
      .map(frame => ({ ...frame, delay: Math.max(MIN_FRAME_DELAY_MS, Math.round(frame.delay)) }));
  }
  const plan = planAnimation(duration, art.settings.loop);
  return plan.phases.map(progress => ({ progress, delay: plan.delay }));
}
