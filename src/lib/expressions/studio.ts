import type { PersonalityTraits } from "@/genome/types";
import { EXPRESSIONS } from "./catalogue";
import {
  FORMS, PACKS, type Effect, type EyeMood, type Expression, type MouthShape, type Pose, type PropKind,
} from "./contract";
import { performanceProfile, type PerformanceProfile } from "./personality";

export { EXPRESSIONS, FORMS, PACKS };
export type { Effect, Expression };

export const DEFAULT_SETTINGS = {
  speed: 1, energy: 1, amplitude: 1, squash: 1, rotation: 1, aura: 1,
  frequency: 1, ridiculousness: 1, scale: 1, translation: 1, density: 1, velocity: 1, phase: 0, duration: 1, capture: -1,
  easing: "smooth", loop: true,
} as const;

export type Settings = {
  -readonly [K in keyof typeof DEFAULT_SETTINGS]: typeof DEFAULT_SETTINGS[K] extends number ? number :
    K extends "easing" ? "smooth" | "linear" | "spring" : boolean;
} & { timings?: number[] };

export const SETTINGS_LIMITS = {
  speed: [.5, 2], energy: [.45, 1.5], amplitude: [.45, 1.45], squash: [0, 1.5],
  rotation: [0, 1.5], aura: [0, 1.5], frequency: [.5, 2], ridiculousness: [0, 1.7],
  scale: [.8, 1.1], translation: [0, 1.45], density: [0, 1.5],
  velocity: [.4, 1.5], phase: [0, 1], duration: [.6, 1.5], capture: [-1, 1],
} as const;

export type Recipe = { version: 1; expressionId: string; settings: Settings };

export function parseRecipe(text: string): Recipe {
  if (text.length > 4096) throw new Error("Recipe files must be under 4 KB.");
  const data = JSON.parse(text);
  const expression = getExpression(data?.expressionId);
  if (data?.version !== 1 || !expression || !data.settings ||
    typeof data.settings !== "object" || Array.isArray(data.settings)) throw new Error("Invalid expression recipe.");
  const settings: Settings = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(SETTINGS_LIMITS) as (keyof typeof SETTINGS_LIMITS)[]) {
    const value = data.settings[key];
    const [min, max] = SETTINGS_LIMITS[key];
    if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) throw new Error("Recipe controls are out of range.");
    settings[key] = value;
  }
  if (!["smooth", "linear", "spring"].includes(data.settings.easing) ||
    typeof data.settings.loop !== "boolean") throw new Error("Invalid playback options.");
  settings.easing = data.settings.easing;
  settings.loop = data.settings.loop;
  const timings = data.settings.timings;
  if (timings !== undefined) {
    if (!Array.isArray(timings) || timings.length !== expression.keyframes.length ||
      timings[0] !== 0 || timings.at(-1) !== 1 ||
      timings.some((time, i) => typeof time !== "number" || !Number.isFinite(time) ||
        (i > 0 && time - timings[i - 1] < .0399))) throw new Error("Keyframe times must be ordered and evenly separated.");
    settings.timings = [...timings];
  }
  return { version: 1, expressionId: expression.id, settings };
}

export function getExpression(id: unknown): Expression | undefined {
  return EXPRESSIONS.find(item => item.id === id);
}

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
export const durationMs = (e: Expression, s: Settings, personality: PersonalityTraits) =>
  e.duration * s.duration / (s.speed * (.84 + .32 * trait(personality.energy)));
export const capturePhase = (e: Expression, s: Settings) => s.capture < 0 ? e.staticFrame : s.capture;
const trait = (value: number) => Number.isFinite(value) ? clamp(value / 100, 0, 1) : .5;

export function seedFor(value: string): number {
  let seed = 2166136261;
  for (let i = 0; i < value.length; i++) seed = Math.imul(seed ^ value.charCodeAt(i), 16777619);
  return seed >>> 0;
}

/** Small deterministic value noise in [-1, 1]. */
function noise(seed: number, value: number) {
  const i = Math.floor(value);
  const f = value - i;
  const at = (n: number) => ((seedFor(seed + ":" + n) % 2001) / 1000) - 1;
  const u = f * f * (3 - 2 * f);
  return at(i) * (1 - u) + at(i + 1) * u;
}

type BodyPose = { x: number; y: number; angle: number; squash: number; lid: number; gazeX: number; gazeY: number; mouth: number; aura: number };

/** How strongly an interpretation adds anticipation and overshoot. */
function snapFor(e: Expression, profile: PerformanceProfile, settings: Settings) {
  if (settings.easing === "linear") return 0;
  if (settings.easing === "spring") return 1;
  switch (e.interpretation) {
    case "explosive": return .3 + profile.boldness * .35 + profile.energy * .15;
    case "playful": return .25 + profile.playfulness * .5;
    case "inspect": return .18;
    case "tender": return .12 + (1 - profile.reserve) * .1;
    case "measured": return Math.max(0, .2 - profile.calm * .2);
  }
}

/** Personality-driven multipliers. All stay near 1 so the meaning survives. */
function interpretationScale(e: Expression, profile: PerformanceProfile) {
  const scale = { travel: 1, squash: 1, gaze: 1, aura: 1, particles: 1, lag: 1 };
  switch (e.interpretation) {
    case "explosive":
      scale.travel = .78 + profile.boldness * .32 + profile.energy * .2;
      scale.aura = .8 + profile.boldness * .35;
      scale.particles = .55 + (1 - profile.reserve) * .45 + profile.boldness * .25;
      break;
    case "playful":
      scale.squash = .8 + profile.playfulness * .55;
      scale.travel = .9 + profile.playfulness * .2;
      scale.lag = .9 + profile.playfulness * .5;
      break;
    case "inspect":
      scale.gaze = .75 + profile.curiosity * .4;
      scale.travel = .9 + profile.curiosity * .2;
      break;
    case "measured":
      scale.lag = 1 - profile.calm * .6;
      scale.squash = 1 - profile.calm * .3;
      break;
    case "tender":
      scale.travel = 1 - profile.reserve * .22;
      scale.particles = .7 + (1 - profile.reserve) * .45;
      break;
  }
  scale.lag *= .7 + profile.playfulness * .3 + (1 - profile.calm) * .3;
  return scale;
}

function mouthOpenFor(shape: MouthShape, curve: number, phase: number) {
  switch (shape) {
    case "laugh": return curve > .3 ? .55 + .4 * Math.abs(Math.sin(phase * Math.PI * 8)) : .25;
    case "o": return .85;
    case "yawn": {
      const u = clamp((phase - .12) / .42, 0, 1);
      return Math.sin(Math.PI * u);
    }
    case "chomp": return .5 + .5 * Math.sin(phase * Math.PI * 10);
    case "grin": return .25 + Math.max(0, curve - .7);
    default: return Math.max(0, curve - .75) * 2;
  }
}

function mouthCurveFor(shape: MouthShape, curve: number, phase: number) {
  switch (shape) {
    case "flat": return curve * .2;
    case "frown": return -Math.max(.25, Math.abs(curve));
    case "smile": return Math.max(.3, curve);
    case "grin": case "laugh": return Math.max(.6, curve);
    case "wobble": return clamp(curve + .28 * Math.sin(phase * Math.PI * 12), -1, 1);
    case "o": case "yawn": return curve * .3;
    default: return curve;
  }
}

export type ActiveProp = { kind: PropKind; t: number };
export type Particle = { x: number; y: number; size: number; opacity: number; rotate: number };

export function sampleExpression(e: Expression, progress: number, settings: Settings, personality: PersonalityTraits, seed: number, reducedMotion = false) {
  const time = clamp(progress, 0, 1);
  const phase = reducedMotion ? e.reducedMotionFrame :
    settings.phase === 0 ? time : (time + settings.phase) % 1;
  const profile = performanceProfile(personality);
  const interp = interpretationScale(e, profile);
  const snap = snapFor(e, profile, settings);
  const timing = (i: number) => settings.timings?.[i] ?? e.keyframes[i][0];
  const emphasis = trait(personality[e.personality]);
  const punch = settings.energy * (.72 + emphasis * .47);
  const travel = punch * settings.amplitude * settings.translation * interp.travel;

  const poseAt = (at: number): BodyPose => {
    const p = clamp(at, 0, 1);
    let right = e.keyframes.findIndex((_, i) => i > 0 && timing(i) >= p);
    if (right < 1) right = e.keyframes.length - 1;
    const a: Pose = e.keyframes[right - 1];
    const b: Pose = e.keyframes[right];
    const span = timing(right) - timing(right - 1);
    const local = span > 0 ? clamp((p - timing(right - 1)) / span, 0, 1) : 1;
    const smooth = settings.easing === "linear" ? local : local * local * (3 - 2 * local);
    // Anticipation (dip before) and overshoot (past the target) in one curve.
    const eased = smooth - snap * .22 * Math.sin(2 * Math.PI * local) * Math.sin(Math.PI * local);
    const read = (i: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9) => a[i] + (b[i] - a[i]) * eased;
    return {
      x: read(1), y: read(2), angle: read(3), squash: read(4), lid: read(5),
      gazeX: read(6), gazeY: read(7), mouth: read(8), aura: read(9),
    };
  };

  const base = poseAt(phase);
  // Secondary motion / follow-through: loose parts trail the body's velocity.
  let lag = { x: 0, y: 0, angle: 0 };
  if (!reducedMotion) {
    const before = poseAt(phase - .035);
    const k = .14 * interp.lag * settings.amplitude;
    lag = {
      x: clamp(-(base.x - before.x) * travel * k * 4, -10, 10),
      y: clamp(-(base.y - before.y) * travel * k * 4, -10, 10),
      angle: clamp(-(base.angle - before.angle) * k * 4, -12, 12),
    };
  }

  const over = reducedMotion ? 0 :
    Math.sin(phase * Math.PI * 2 * (1 + settings.frequency * 2) + seed % 9) *
    Math.sin(phase * Math.PI) * punch * settings.ridiculousness * .6;

  let x = base.x * travel;
  let y = base.y * travel + over * 2;
  let angle = base.angle * settings.rotation * punch * (e.interpretation === "inspect" ? interp.gaze : 1) + over * 2;
  let squash = base.squash * settings.squash * punch * interp.squash;
  let spin = 0;

  const movement = [...e.movement];
  if (profile.dances && (e.id === "happy" || e.id === "dance" || e.id === "party")) movement.push({ kind: "sway", amp: 5, cycles: 2, from: .1, to: .9 });
  if (profile.spins && (e.id === "win" || e.id === "party" || e.id === "dance")) movement.push({ kind: "spin", amp: 1, cycles: 1, from: .45, to: .75 });
  if (!reducedMotion) {
    for (const m of movement) {
      if (phase < m.from || phase > m.to) continue;
      const u = (phase - m.from) / (m.to - m.from);
      const envelope = Math.sin(Math.PI * u);
      const wave = Math.sin(2 * Math.PI * m.cycles * u) * envelope * settings.amplitude;
      switch (m.kind) {
        case "shake": x += m.amp * wave; break;
        case "bob": y += m.amp * wave; break;
        case "sway": angle += m.amp * wave; break;
        case "pulse": squash += (m.amp / 100) * wave; break;
        case "tremble": x += m.amp * envelope * settings.amplitude * noise(seed, u * m.cycles * 4); break;
        case "spin": {
          const s = u * u * (3 - 2 * u);
          spin += 360 * m.amp * s;
          break;
        }
      }
    }
  }

  const aura = clamp(base.aura * settings.aura * (.75 + emphasis * .5) * interp.aura, 0, 1);
  const behaviour = e.particles.behaviour;
  const count = Math.min(16, Math.round(aura * settings.density * e.particles.count * interp.particles));
  const velocity = settings.velocity;
  const particles: Particle[] = Array.from({ length: count }, (_, i) => {
    const r0 = seedFor(seed + ":" + e.id + ":" + i);
    const rand = (r0 % 1000) / 1000;
    const rand2 = ((r0 >>> 10) % 1000) / 1000;
    const size = 2 + (i % 3) * 1.3;
    let px = 256, py = 247, opacity = 1;
    switch (behaviour) {
      case "orbit": {
        const a = ((r0 % 360) + phase * 160 * velocity) * Math.PI / 180;
        const r = 96 + (i % 4) * 16 + aura * 35;
        px = 256 + Math.cos(a) * r; py = 247 + Math.sin(a) * r;
        break;
      }
      case "burst": {
        const local = (phase * 1.6 * velocity + rand) % 1;
        const a = rand2 * Math.PI * 2;
        const r = 70 + local * 150;
        px = 256 + Math.cos(a) * r; py = 240 + Math.sin(a) * r * .9; opacity = 1 - local * .85;
        break;
      }
      case "rise": case "fall": {
        const local = (phase * velocity + i / Math.max(1, count) + rand * .3) % 1;
        px = 256 + (rand2 - .5) * 330;
        py = behaviour === "rise" ? 410 - local * 330 : 80 + local * 330;
        opacity = Math.sin(Math.PI * local);
        break;
      }
      case "swirl": {
        const local = (phase * velocity * .8 + i / Math.max(1, count)) % 1;
        const a = local * Math.PI * 4 + rand * Math.PI * 2;
        const r = 50 + local * 150;
        px = 256 + Math.cos(a) * r; py = 247 + Math.sin(a) * r * .85; opacity = .4 + .6 * Math.sin(Math.PI * local);
        break;
      }
      case "jitter": {
        const step = Math.floor(phase * 14);
        const rr = seedFor(seed + ":" + e.id + ":" + i + ":" + step);
        px = 256 + (((rr % 1000) / 1000) - .5) * 330;
        py = 247 + ((((rr >>> 10) % 1000) / 1000) - .5) * 300;
        break;
      }
    }
    return {
      x: clamp(px, 34, 478), y: clamp(py, 34, 478), size,
      opacity: clamp(opacity, 0, 1), rotate: phase * 85 + i * 23,
    };
  });

  const props: ActiveProp[] = e.props
    .filter(cue => phase >= cue.from && phase <= cue.to)
    .map(cue => ({ kind: cue.kind, t: (phase - cue.from) / Math.max(.001, cue.to - cue.from) }));

  const curve = mouthCurveFor(e.face.mouth, clamp(base.mouth, -1, 1), phase);
  return {
    x: clamp(x, -40, 40),
    y: clamp(y, -45, 34),
    angle: clamp(angle, -35, 35) + spin,
    scale: settings.scale,
    squash: clamp(squash, -.25, .25),
    lid: clamp(base.lid, .04, 1.2),
    gazeX: clamp(base.gazeX * (.77 + profile.curiosity * .38) * (e.interpretation === "inspect" ? interp.gaze : 1), -1, 1),
    gazeY: clamp(base.gazeY, -1, 1),
    mouth: curve,
    mouthOpen: clamp(mouthOpenFor(e.face.mouth, curve, phase), 0, 1),
    eyes: e.face.eyes as EyeMood,
    aura,
    phase,
    lag,
    particles,
    props,
  };
}

export type ExpressionFrame = ReturnType<typeof sampleExpression>;
