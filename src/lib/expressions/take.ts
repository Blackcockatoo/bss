import type { PersonalityTraits } from "@/genome/types";
import { PET_FORMS, type PetForm } from "@/lib/petForms";
import { clamp, DEFAULT_SETTINGS, getExpression, sampleExpression, type Expression, type ExpressionFrame } from "./studio";

export const TAKE_LIMIT_MS = 12_000;
export const TAKE_LIMIT_CUES = 48;
export const TAKE_BLEND_MS = 140;
export type CueSource = "touch" | "directed" | "learned" | "music" | "ambient";
export type PerformanceCue = {
  at: number;
  duration: number;
  expressionId: string;
  intensity: number;
  exaggeration: number;
  direction: -1 | 1;
  source: CueSource;
};
export type PerformanceTake = { version: 1; form: PetForm; cues: PerformanceCue[] };

const sources: readonly CueSource[] = ["touch", "directed", "learned", "music", "ambient"];
const between = (value: unknown, low: number, high: number): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= low && value <= high;

export function parseTake(text: string): PerformanceTake {
  if (text.length > 12_000) throw new Error("Performance recording is too large.");
  const value = JSON.parse(text);
  if (value?.version !== 1 || !PET_FORMS.includes(value.form) || !Array.isArray(value.cues) ||
    value.cues.length < 1 || value.cues.length > TAKE_LIMIT_CUES) throw new Error("Invalid performance recording.");
  let previous = -1;
  const cues = (value.cues as PerformanceCue[]).map(cue => {
    if (!cue || !getExpression(cue.expressionId) || !sources.includes(cue.source) ||
      !between(cue.at, previous, TAKE_LIMIT_MS) || !between(cue.duration, 120, 5000) ||
      !between(cue.intensity, .45, 1.45) || !between(cue.exaggeration, 0, 1.7) ||
      (cue.direction !== -1 && cue.direction !== 1)) throw new Error("Invalid performance cue.");
    previous = cue.at;
    return { at: cue.at, expressionId: cue.expressionId, duration: cue.duration, intensity: cue.intensity,
      exaggeration: cue.exaggeration, direction: cue.direction, source: cue.source };
  });
  return { version: 1, form: value.form, cues };
}

const keyFor = (id: string) => `metapet:expressions:take:v1:${id}`;
export function readTake(id: string) {
  try { return parseTake(localStorage.getItem(keyFor(id)) ?? "null"); } catch { return null; }
}
export function saveTake(id: string, take: PerformanceTake) {
  localStorage.setItem(keyFor(id), JSON.stringify(parseTake(JSON.stringify(take))));
}
export function clearTake(id: string) {
  localStorage.removeItem(keyFor(id));
}
export function takeDuration(take: PerformanceTake) {
  const last = take.cues.at(-1);
  return last ? last.at + last.duration : 0;
}

export type PerformanceSample = {
  frame: ExpressionFrame; expression: Expression; weight: number; cue: PerformanceCue;
};
const smooth = (x: number) => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };

export function sampleCue(cue: PerformanceCue, elapsed: number, personality: PersonalityTraits, seed: number, reduced = false): PerformanceSample | null {
  const expression = getExpression(cue.expressionId);
  const offset = elapsed - cue.at;
  if (!expression || offset < 0 || offset >= cue.duration) return null;
  // Music and short gestures have shorter attack/recovery, preserving the downbeat.
  const fade = Math.min(TAKE_BLEND_MS, cue.duration * .23);
  const weight = reduced ? 1 : smooth(offset / fade) * smooth((cue.duration - offset) / fade);
  const frame = sampleExpression(expression, offset / cue.duration, {
    ...DEFAULT_SETTINGS, amplitude: cue.intensity, ridiculousness: cue.exaggeration, density: .55,
  }, personality, seed, reduced);
  return { expression, weight, cue, frame: cue.direction === 1 ? frame : {
    ...frame, x: -frame.x, gazeX: -frame.gazeX, angle: -frame.angle,
    lag: { ...frame.lag, x: -frame.lag.x, angle: -frame.lag.angle },
  } };
}

/** The latest cue owns the face. Carry the previous pose across the interruption. */
export function sampleTake(take: PerformanceTake, elapsed: number, personality: PersonalityTraits, seed: number, reduced = false) {
  const i = take.cues.findLastIndex(cue => cue.at <= elapsed);
  if (i < 0) return null;
  const current = sampleCue(take.cues[i], elapsed, personality, seed, reduced);
  if (!current || i < 1 || reduced || elapsed - current.cue.at >= TAKE_BLEND_MS) return current;
  const previous = sampleCue(take.cues[i - 1], elapsed, personality, seed);
  if (!previous) return current;
  const blend = smooth((elapsed - current.cue.at) / TAKE_BLEND_MS);
  const from = weightedFrame(previous);
  const to = weightedFrame(current);
  const lerp = (a: number, b: number) => a + (b - a) * blend;
  const chosen = blend < .5 ? previous : current;
  return { ...chosen, weight: 1, frame: {
    ...chosen.frame,
    x: lerp(from.x, to.x), y: lerp(from.y, to.y), angle: lerp(from.angle, to.angle),
    squash: lerp(from.squash, to.squash), scale: lerp(from.scale, to.scale),
    lid: lerp(from.lid, to.lid), gazeX: lerp(from.gazeX, to.gazeX), gazeY: lerp(from.gazeY, to.gazeY),
    mouth: lerp(from.mouth, to.mouth), mouthOpen: lerp(from.mouthOpen, to.mouthOpen),
    aura: lerp(from.aura, to.aura), lag: { x: lerp(from.lag.x, to.lag.x), y: lerp(from.lag.y, to.lag.y), angle: lerp(from.lag.angle, to.lag.angle) },
    particles: weightedFrame(chosen).particles, props: chosen.weight > .3 ? chosen.frame.props : [],
  } };
}

export function weightedFrame({frame, weight}: PerformanceSample): ExpressionFrame {
  return {
    ...frame,
    x: frame.x * weight, y: frame.y * weight, angle: frame.angle * weight,
    squash: frame.squash * weight, scale: 1 + (frame.scale - 1) * weight,
    lid: 1 + (frame.lid - 1) * weight, gazeX: frame.gazeX * weight, gazeY: frame.gazeY * weight,
    mouth: frame.mouth * weight, mouthOpen: frame.mouthOpen * weight,
    eyes: weight > .3 ? frame.eyes : "normal", aura: frame.aura * weight,
    lag: { x: frame.lag.x * weight, y: frame.lag.y * weight, angle: frame.lag.angle * weight },
    props: weight > .3 ? frame.props : [], particles: frame.particles.map(p => ({ ...p, opacity: p.opacity * weight })),
  };
}

/** Capture at least one pose inside every playable cue, even for short beats. */
export function takeFramePlan(take: PerformanceTake) {
  const duration = takeDuration(take);
  if (!duration) return [];
  const baselineFrames = Math.max(10, Math.min(48, Math.ceil(duration / 130)));
  const moments = new Set(Array.from({ length: baselineFrames }, (_, i) => Math.round(i * duration / baselineFrames)));
  take.cues.forEach((cue, i) => {
    const end = Math.min(cue.at + cue.duration, take.cues[i + 1]?.at ?? duration);
    if (end > cue.at) moments.add(Math.floor((cue.at + end) / 2));
  });
  const positions = [...moments].sort((a, b) => a - b);
  return positions.map((at, i) => ({
    progress: at / duration,
    delay: Math.max(10, (positions[i + 1] ?? duration) - at),
  }));
}
