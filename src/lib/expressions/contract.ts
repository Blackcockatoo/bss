import { PET_FORMS, type PetForm } from "@/lib/petForms";

/**
 * The shared, typed expression contract.
 *
 * One definition drives all three creature forms. Adapters translate the
 * sampled frame into each renderer's native anatomy; they never receive the
 * canonical pet record, only a read-only creature snapshot.
 */
export const EXPRESSION_CONTRACT_VERSION = 2 as const;

export const PACKS = [
  "Everyday", "Feelings", "Meme Factory", "Attitude", "Learning", "Celebration",
  "Creature Life", "Cosmic Geometry", "Chaos", "Social", "Adventure", "Signature B$S",
] as const;
export type Pack = typeof PACKS[number];

/** Aura / particle families. */
export type Effect = "halo" | "stars" | "hearts" | "ripples" | "orbit" | "sparks" | "confetti" | "bubbles";
export const EFFECTS: readonly Effect[] = ["halo", "stars", "hearts", "ripples", "orbit", "sparks", "confetti", "bubbles"];

/** How particles travel during a performance. */
export type ParticleBehaviour = "orbit" | "burst" | "rise" | "fall" | "swirl" | "jitter";
export const PARTICLE_BEHAVIOURS: readonly ParticleBehaviour[] = ["orbit", "burst", "rise", "fall", "swirl", "jitter"];

/** Facial intent. Each adapter maps it onto the anatomy it actually has. */
export type EyeMood =
  | "normal" | "happy" | "sad" | "sleepy" | "surprised" | "confused" | "curious" | "focused"
  | "grumpy" | "love" | "playful" | "pleading" | "scared" | "closed" | "star";
export const EYE_MOODS: readonly EyeMood[] = [
  "normal", "happy", "sad", "sleepy", "surprised", "confused", "curious", "focused",
  "grumpy", "love", "playful", "pleading", "scared", "closed", "star",
];
export type MouthShape = "auto" | "smile" | "grin" | "laugh" | "frown" | "flat" | "o" | "wobble" | "yawn" | "chomp";
export const MOUTH_SHAPES: readonly MouthShape[] = ["auto", "smile", "grin", "laugh", "frown", "flat", "o", "wobble", "yawn", "chomp"];

/** Original, procedurally drawn props. No bitmaps, fonts or external files. */
export type PropKind =
  | "zzz" | "question" | "exclaim" | "sweat" | "tear" | "heart" | "bulb" | "notes" | "steam" | "dizzy"
  | "ellipsis" | "blush" | "motion" | "glitch" | "bolt" | "sun" | "moon" | "sparkle" | "lens" | "book"
  | "shield" | "flag" | "gem" | "check" | "cross" | "ring" | "shades";
export const PROP_KINDS: readonly PropKind[] = [
  "zzz", "question", "exclaim", "sweat", "tear", "heart", "bulb", "notes", "steam", "dizzy",
  "ellipsis", "blush", "motion", "glitch", "bolt", "sun", "moon", "sparkle", "lens", "book",
  "shield", "flag", "gem", "check", "cross", "ring", "shades",
];
export type PropCue = Readonly<{ kind: PropKind; from: number; to: number }>;

/** Additive movement instructions layered over the authored keyframes. */
export type OscillatorKind = "shake" | "bob" | "sway" | "spin" | "tremble" | "pulse";
export const OSCILLATOR_KINDS: readonly OscillatorKind[] = ["shake", "bob", "sway", "spin", "tremble", "pulse"];
export type Oscillator = Readonly<{ kind: OscillatorKind; amp: number; cycles: number; from: number; to: number }>;

/**
 * How inherited personality reshapes the performance:
 * - explosive: bold/energetic creatures go bigger, reserved ones smaller.
 * - inspect: curious creatures look further and longer.
 * - measured: calm creatures smooth the gesture and drop overshoot.
 * - playful: playful creatures exaggerate squash, stretch and overshoot.
 * - tender: affectionate creatures glow warmer; reserved ones stay close.
 */
export type Interpretation = "explosive" | "inspect" | "measured" | "playful" | "tender";
export const INTERPRETATIONS: readonly Interpretation[] = ["explosive", "inspect", "measured", "playful", "tender"];

export type PersonalityKey = "social" | "affection" | "curiosity" | "discipline" | "playfulness" | "energy";

/**
 * A pose keyframe: normalised time, body translation (x, y), rotation in
 * degrees, squash (+ wide/short, - tall/thin), eyelid opening, gaze x/y,
 * mouth curve (-1 frown .. 1 smile) and aura strength.
 */
export type Pose = readonly [
  at: number, x: number, y: number, rotation: number, squash: number,
  eyelid: number, gazeX: number, gazeY: number, mouth: number, aura: number,
];

export type Capability = "body" | "eyes" | "mouth" | "wings" | "aura" | "particles" | "rotation" | "resonance" | "props";
export const CAPABILITIES: Readonly<Record<PetForm, readonly Capability[]>> = {
  auralia: ["body", "eyes", "aura", "particles", "props"],
  evolved: ["body", "eyes", "mouth", "wings", "aura", "particles", "props"],
  geometry: ["body", "rotation", "resonance", "particles", "props"],
};

export type Expression = Readonly<{
  version: typeof EXPRESSION_CONTRACT_VERSION;
  id: string;
  label: string;
  category: Pack;
  tags: readonly string[];
  /** Base duration in ms before speed, energy and recipe multipliers. */
  duration: number;
  keyframes: readonly Pose[];
  face: Readonly<{ eyes: EyeMood; mouth: MouthShape }>;
  movement: readonly Oscillator[];
  effect: Effect;
  particles: Readonly<{ behaviour: ParticleBehaviour; count: number }>;
  props: readonly PropCue[];
  /** Short default caption, used only when the user turns captions on. */
  caption: string;
  personality: PersonalityKey;
  interpretation: Interpretation;
  /** Phase used for PNG export and thumbnails. */
  staticFrame: number;
  /** Phase shown instead of the animation when motion is reduced. */
  reducedMotionFrame: number;
  capabilities: Readonly<Record<PetForm, readonly Capability[]>>;
}>;

export type Beat = Partial<Record<"x" | "y" | "r" | "sq" | "lid" | "gx" | "gy" | "m" | "a", number>> & { t: number };

export type ExpressionSpec = {
  id: string; label: string; category: Pack; tags: string; duration: number;
  effect: Effect; personality: PersonalityKey; staticFrame: number;
  keyframes?: readonly Pose[];
  beats?: readonly Beat[];
  eyes?: EyeMood; mouth?: MouthShape;
  movement?: readonly Oscillator[];
  particles?: Partial<Expression["particles"]>;
  props?: readonly PropCue[];
  caption?: string;
  interpretation?: Interpretation;
  reducedMotionFrame?: number;
};

const REST = { x: 0, y: 0, r: 0, sq: 0, lid: 1, gx: 0, gy: 0, m: 0, a: 0 };

/** Authoring helper: each beat inherits unspecified values from the previous one. */
export function beatsToKeyframes(beats: readonly Beat[]): Pose[] {
  let last = { ...REST };
  return beats.map(beat => {
    last = { ...last, ...beat };
    return [beat.t, last.x, last.y, last.r, last.sq, last.lid, last.gx, last.gy, last.m, last.a] as const;
  });
}

const DEFAULT_INTERPRETATION: Record<Pack, Interpretation> = {
  "Everyday": "tender", "Feelings": "tender", "Meme Factory": "playful", "Attitude": "explosive",
  "Learning": "inspect", "Celebration": "explosive", "Creature Life": "playful", "Cosmic Geometry": "measured",
  "Chaos": "playful", "Social": "tender", "Adventure": "explosive", "Signature B$S": "playful",
};

const rest = (at: number): Pose => [at, 0, 0, 0, 0, 1, 0, 0, 0, 0];

const inside = (n: number) => Number.isFinite(n) && n > 0 && n < 1;

export function defineExpression(spec: ExpressionSpec): Expression {
  const authored = spec.keyframes ?? beatsToKeyframes(spec.beats ?? []);
  // Catalogue entries are authored data; fail loudly at module load if one is malformed.
  const fail = (why: string) => { throw new Error(`Invalid expression "${spec.id}": ${why}`); };
  if (!/^[a-z0-9-]+$/.test(spec.id)) fail("id must be kebab-case");
  if (!inside(spec.staticFrame)) fail("staticFrame must be inside (0, 1)");
  if (spec.reducedMotionFrame !== undefined && !inside(spec.reducedMotionFrame)) fail("reducedMotionFrame must be inside (0, 1)");
  authored.forEach((pose, i) => {
    if (!inside(pose[0])) fail("keyframe times must be inside (0, 1)");
    if (i > 0 && pose[0] <= authored[i - 1][0]) fail("keyframe times must increase");
  });
  for (const cue of spec.props ?? []) if (!(cue.from >= 0 && cue.to <= 1 && cue.to > cue.from)) fail("prop cue window is invalid");
  for (const osc of spec.movement ?? []) if (!(osc.from >= 0 && osc.to <= 1 && osc.to > osc.from)) fail("oscillator window is invalid");
  const count = spec.particles?.count ?? 10;
  if (!(Number.isInteger(count) && count >= 0 && count <= 16)) fail("particle count must be 0-16");
  return {
    version: EXPRESSION_CONTRACT_VERSION,
    id: spec.id,
    label: spec.label,
    category: spec.category,
    tags: spec.tags.split(" ").filter(Boolean),
    duration: spec.duration,
    keyframes: [rest(0), ...authored, rest(1)],
    face: { eyes: spec.eyes ?? "normal", mouth: spec.mouth ?? "auto" },
    movement: spec.movement ?? [],
    effect: spec.effect,
    particles: { behaviour: spec.particles?.behaviour ?? "orbit", count },
    props: spec.props ?? [],
    caption: spec.caption ?? spec.label,
    personality: spec.personality,
    interpretation: spec.interpretation ?? DEFAULT_INTERPRETATION[spec.category],
    staticFrame: spec.staticFrame,
    reducedMotionFrame: spec.reducedMotionFrame ?? spec.staticFrame,
    capabilities: CAPABILITIES,
  };
}

export const FORMS = PET_FORMS;
