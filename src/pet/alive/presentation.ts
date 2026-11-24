import { clamp, type ExpressionFrame } from "@/lib/expressions/studio";
import type { EyeMood } from "@/lib/expressions/contract";
import { clampPerformance, type MovementPerformance } from "@/pet/performance";
import type { EyeState } from "@/components/auralia/EyeSystem";

const eyes: Record<EyeMood, Pick<EyeState, "emotion" | "shape"> & { pupil?: number; sparkles?: boolean; wink?: boolean }> = {
  normal: { emotion: "normal", shape: "round" },
  happy: { emotion: "content", shape: "squinted" },
  sad: { emotion: "sleepy", shape: "half-lidded", pupil: 8 },
  sleepy: { emotion: "sleepy", shape: "half-lidded" },
  surprised: { emotion: "surprised", shape: "wide", pupil: 5 },
  confused: { emotion: "confused", shape: "spiral" },
  curious: { emotion: "curious", shape: "round", pupil: 9 },
  focused: { emotion: "focused", shape: "slit" },
  grumpy: { emotion: "grumpy", shape: "half-lidded" },
  love: { emotion: "content", shape: "heart" },
  playful: { emotion: "playful", shape: "round", wink: true },
  pleading: { emotion: "normal", shape: "wide", pupil: 11, sparkles: true },
  scared: { emotion: "scared", shape: "wide", pupil: 4 },
  closed: { emotion: "blinking", shape: "round" },
  star: { emotion: "normal", shape: "star", sparkles: true },
};

export function expressionEyes(frame: ExpressionFrame, base: EyeState, weight = 1): EyeState {
  const mood = eyes[frame.eyes];
  const closed = frame.lid < .15 || mood.emotion === "blinking";
  const target = frame.lid > 1.1 && mood.emotion === "normal" ? "surprised" : mood.emotion;
  return {
    ...base,
    emotion: weight > .35 ? (closed ? "blinking" : target) : base.emotion,
    shape: weight > .35 ? (frame.lid > 1.1 && mood.shape === "round" ? "wide" : mood.shape) : base.shape,
    pupilSize: base.pupilSize + ((mood.pupil ?? 7) + frame.mouthOpen - base.pupilSize) * weight,
    verticalScale: clamp(base.verticalScale * frame.lid, .08, 1.2),
    glowIntensity: Math.min(1, base.glowIntensity + frame.aura * .2),
    sparkles: weight > .5 && (mood.sparkles ?? false), wink: weight > .55 && (mood.wink ?? false), jitter: false,
  };
}

const pupils: Partial<Record<EyeMood, number>> = {
  surprised: 1.28, scared: .68, love: 1.22, pleading: 1.3, focused: .82, grumpy: .9, star: 1.15, curious: 1.12,
};
export function expressionBody(frame: ExpressionFrame, base: MovementPerformance, weight = 1, move = true): MovementPerformance {
  const eyelid = frame.eyes === "closed" ? Math.min(frame.lid, 1 - .95 * weight) :
    ["happy", "sleepy", "grumpy"].includes(frame.eyes) ? Math.min(frame.lid, 1 - .45 * weight) : frame.lid;
  return clampPerformance({
    ...base,
    bodyX: base.bodyX + (move ? frame.x * .64 : 0),
    bodyY: base.bodyY + (move ? frame.y * .64 : 0),
    rotation: base.rotation + (move ? clamp(frame.angle, -32, 32) : 0),
    scaleX: base.scaleX * (move ? frame.scale * (1 + frame.squash) : 1),
    scaleY: base.scaleY * (move ? frame.scale * (1 - frame.squash) : 1),
    eyelidOpen: base.eyelidOpen * eyelid,
    gazeX: base.gazeX + frame.gazeX, gazeY: base.gazeY + frame.gazeY,
    pupilScale: base.pupilScale * (1 + ((pupils[frame.eyes] ?? 1) - 1) * weight),
    wingSpread: base.wingSpread + frame.aura * .22 - frame.lag.y * .025,
    wingFold: base.wingFold + (1 - Math.min(1, frame.lid)) * .18 + Math.max(0, frame.lag.y) * .02,
    headTilt: base.headTilt + clamp(frame.angle, -36, 36) * .33 + frame.lag.angle * .5,
    featureIntensity: Math.max(base.featureIntensity, frame.aura),
    auraScale: base.auraScale + frame.aura * .14,
    auraPulse: Math.max(base.auraPulse, frame.aura),
  });
}
