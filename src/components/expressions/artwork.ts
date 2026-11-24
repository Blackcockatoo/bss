import { capturePhase, durationMs, getExpression, sampleExpression, type Settings } from "@/lib/expressions/studio";
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
  if (!take) return { ...art, frame: sampleExpression(expression, progress, settings, pet.personality, pet.seed, reducedMotion) };
  const position = reducedMotion ? artworkCapturePhase(art) : progress;
  const sample = sampleTake(take, artworkDuration(art) * position, pet.personality, pet.seed, reducedMotion);
  if (sample) return { ...art, expression: sample.expression, frame: weightedFrame(sample) };
  const frame = sampleExpression(expression, 0, settings, pet.personality, pet.seed);
  return { ...art, frame: { ...frame, angle: 0, lid: 1, mouth: 0, mouthOpen: 0, eyes: "normal", aura: 0, particles: [], props: [] } };
}


export function animationFramePlan(art: Artwork) {
  const duration = artworkDuration(art);
  if (art.reducedMotion) return [{ progress: artworkCapturePhase(art), delay: Math.round(duration) }];
  if (art.take) return takeFramePlan(art.take);
  const count = Math.max(10, Math.min(32, Math.round(duration / 85)));
  return Array.from({ length: count }, (_, index) => ({
    progress: index / (art.settings.loop ? count : count - 1),
    delay: Math.round(duration / count),
  }));
}
