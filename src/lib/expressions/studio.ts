import { PET_FORMS, type PetForm } from "@/lib/petForms";
import type { PersonalityTraits } from "@/genome/types";

export const FORMS = PET_FORMS;
export const PACKS = ["Everyday", "Feelings", "Meme Factory", "Learning", "Celebration", "Creature Life", "Cosmic Geometry", "Chaos"] as const;
type Pack = typeof PACKS[number];
export type Effect = "halo" | "stars" | "hearts" | "ripples" | "orbit" | "sparks";
type Pose = readonly [
  at: number, x: number, y: number, rotation: number, squash: number,
  eyelid: number, gazeX: number, gazeY: number, mouth: number, aura: number,
];
export type Expression = Readonly<{
  version: 1;
  id: string;
  label: string;
  category: Pack;
  tags: readonly string[];
  duration: number;
  keyframes: readonly Pose[];
  staticFrame: number;
  reducedMotionFrame: number;
  capabilities: Readonly<Record<PetForm, readonly string[]>>;
  effect: Effect;
  personality: "social" | "affection" | "curiosity" | "discipline" | "playfulness" | "energy";
}>;

const rest = (at: number): Pose => [at, 0, 0, 0, 0, 1, 0, 0, 0, 0];
const capabilities = {
  auralia: ["body", "eyes", "aura", "particles"],
  evolved: ["body", "eyes", "mouth", "wings", "aura", "particles"],
  geometry: ["body", "rotation", "resonance", "particles"],
} as const;

function expression(
  id: string, label: string, category: Pack, tags: string, duration: number,
  effect: Effect, personality: Expression["personality"], staticFrame: number,
  ...keyframes: Pose[]
): Expression {
  return { version: 1, id, label, category, tags: tags.split(" "), duration, effect, personality,
    staticFrame, reducedMotionFrame: staticFrame, capabilities, keyframes: [rest(0), ...keyframes, rest(1)] };
}

export const EXPRESSIONS = [
  expression("hello", "Hello", "Everyday", "hi greeting wave", 1680, "stars", "social", .32,
    [.14, -5, 6, -8, .12, .8, -.3, 0, .1, .2], [.32, 7, -17, 13, -.12, 1.12, .2, -.4, .7, .85], [.53, -5, -7, -8, .05, 1, -.2, 0, .7, .5], [.73, 4, -11, 9, -.07, 1, .1, 0, .4, .35]),
  expression("bye", "Goodbye", "Everyday", "farewell see you later", 1950, "ripples", "social", .57,
    [.2, 2, -8, -7, 0, 1, -.4, 0, .45, .4], [.4, -11, -5, 9, -.06, .8, .6, -.1, .4, .7], [.57, -19, 4, -14, .08, .65, .9, .1, .26, .52], [.81, -25, 12, -9, .1, .38, .6, .3, .07, .25]),
  expression("yes", "Yes", "Everyday", "agree nod okay", 1280, "halo", "social", .36,
    [.15, 0, -11, 0, -.09, 1.1, 0, -.75, .35, .3], [.36, 0, 14, 4, .18, .32, 0, .85, .8, .85], [.55, 0, -5, -2, -.06, 1.05, 0, -.6, .65, .4], [.71, 0, 9, 1, .12, .44, 0, .55, .4, .5]),
  expression("thanks", "Thank you", "Everyday", "gratitude grateful bow", 1980, "hearts", "affection", .51,
    [.18, 0, -8, -4, -.07, 1, 0, -.28, .55, .42], [.51, 3, 18, 11, .16, .06, 0, .86, .75, .76], [.69, 2, 15, 10, .14, .1, 0, .65, .6, .65], [.85, -1, -3, -3, -.04, .84, 0, -.1, .5, .33]),
  expression("happy", "Happy", "Feelings", "joy smile cheer", 1600, "stars", "playfulness", .38,
    [.14, 0, 8, 0, .13, .68, 0, 0, .45, .25], [.38, 0, -24, 7, -.13, .52, .2, -.45, 1, 1], [.62, -3, 8, -6, .17, .38, 0, .1, .85, .55], [.78, 0, -8, 4, -.07, .67, 0, -.2, .7, .4]),
  expression("love", "Love", "Feelings", "heart adore affection hug", 2200, "hearts", "affection", .58,
    [.18, 0, 8, -8, .12, .65, -.2, .15, .4, .35], [.39, 0, -13, 9, -.08, .78, .1, -.3, .85, .9], [.58, 0, -9, 6, .03, .56, 0, -.15, .95, 1], [.76, 0, -12, 3, -.04, .66, 0, -.3, .8, .8]),
  expression("sad", "Sad", "Feelings", "blue down disappointed", 2480, "ripples", "affection", .64,
    [.2, 0, 3, -3, .02, .7, -.25, .5, -.34, .18], [.43, -9, 18, -10, .13, .31, -.35, .75, -.9, .48], [.64, -10, 21, -12, .15, .25, -.3, 1, -1, .58], [.82, -5, 13, -7, .1, .42, 0, .6, -.6, .35]),
  expression("confused", "Confused", "Feelings", "uncertain what puzzled", 2300, "orbit", "curiosity", .65,
    [.18, -7, 4, -15, .05, .88, -.85, -.2, -.36, .35], [.39, 8, 2, 13, -.04, 1.13, .9, -.35, -.15, .5], [.65, -2, 8, -17, .09, .6, .45, -.65, -.5, .72], [.83, 2, -2, 6, 0, 1.1, -.45, 0, 0, .22]),
  expression("lol", "LOL", "Meme Factory", "laugh funny giggle", 1900, "stars", "playfulness", .57,
    [.13, 1, 8, 4, .17, .68, .2, 0, .6, .4], [.3, -2, -19, -13, -.13, .16, 0, -.4, 1, .95], [.43, 4, 7, 10, .2, .12, 0, .3, .92, .75], [.57, -5, -18, -15, -.12, .12, 0, -.35, 1, 1], [.72, 4, 6, 9, .15, .16, 0, .25, .85, .6], [.85, -2, -6, -5, -.08, .42, 0, 0, .76, .4]),
  expression("bruh", "Bruh", "Meme Factory", "deadpan unimpressed seriously", 2000, "halo", "discipline", .56,
    [.2, 1, -4, 5, -.02, 1.1, .2, 0, 0, .3], [.42, 4, 14, 2, .16, .33, .85, .1, -.22, .52], [.72, 4, 14, 2, .16, .33, .85, .1, -.22, .52], [.84, 2, 8, 0, .08, .05, .5, .1, -.12, .22]),
  expression("side-eye", "Side-eye", "Meme Factory", "suspicious stare glance", 2110, "orbit", "curiosity", .55,
    [.22, -4, 1, 7, 0, .95, -.6, 0, -.12, .3], [.42, -11, 4, -11, -.03, .51, 1, -.08, -.44, .58], [.72, -11, 4, -11, -.03, .51, 1, -.08, -.44, .58], [.87, 4, 0, 4, 0, .65, -.6, 0, -.21, .25]),
  expression("think", "Thinking", "Learning", "idea puzzle processing", 2300, "orbit", "curiosity", .63,
    [.22, -5, 5, -9, .07, .57, -.7, -.7, -.3, .28], [.44, -8, 5, -13, .06, .52, -.92, -.8, -.42, .48], [.63, 7, -4, 14, -.04, .86, .6, -.85, -.18, .65], [.83, 4, -1, 7, 0, .72, .4, -.72, -.22, .37]),
  expression("eureka", "Eureka!", "Learning", "aha idea discover", 1820, "sparks", "curiosity", .47,
    [.16, -5, 8, -12, .08, .6, -.5, -.5, -.3, .25], [.33, -7, 11, -13, .16, .48, -.8, -.55, -.3, .36], [.47, 0, -25, 2, -.24, 1.24, .05, -.75, .9, 1], [.7, 4, -7, 8, .05, 1, .25, -.2, .98, .6], [.83, 0, 4, -3, .09, .74, 0, 0, .7, .45]),
  expression("focus", "Focused", "Learning", "concentrate aim read", 2100, "halo", "discipline", .63,
    [.2, -7, -2, -6, -.05, 1.05, -.7, 0, -.25, .37], [.43, 9, 8, 10, .08, .45, .85, .28, -.34, .72], [.76, 9, 8, 10, .08, .45, .85, .28, -.34, .72], [.87, 1, 2, -2, .02, .6, 0, .16, -.12, .33]),
  expression("solved", "Solved it!", "Learning", "answer done success", 1800, "halo", "discipline", .61,
    [.17, -8, 4, -8, .09, .68, -.85, .25, -.25, .28], [.37, 2, 7, 7, .13, .44, .1, .55, -.24, .42], [.61, 9, -15, 12, -.13, .95, .32, -.3, .94, 1], [.78, 2, 5, -2, .06, .55, 0, .35, .8, .58]),
  expression("win", "Victory", "Celebration", "win champion celebrate", 1930, "sparks", "energy", .4,
    [.19, 0, 14, -6, .21, .7, 0, .45, .48, .34], [.4, 0, -28, 13, -.18, 1.13, 0, -.65, 1, 1], [.62, 2, 7, -9, .19, .46, 0, .2, .84, .7], [.79, 0, -14, 5, -.07, .7, 0, -.3, .8, .64]),
  expression("champion", "Champion", "Celebration", "proud heroic trophy", 2280, "halo", "social", .58,
    [.26, -6, 8, -11, .13, .55, -.4, .4, .46, .4], [.48, 0, -16, 8, -.16, 1.12, 0, -.65, .89, .88], [.69, 0, -14, 4, -.14, .92, 0, -.55, .92, 1], [.85, 3, -4, -4, -.05, .68, .15, 0, .61, .52]),
  expression("level", "Level up", "Celebration", "upgrade evolve rising", 2050, "orbit", "energy", .68,
    [.18, 0, 9, 0, .16, .4, 0, .1, .21, .31], [.35, 0, 4, 2, .1, .66, 0, -.25, .43, .55], [.68, 0, -26, -3, -.23, 1.18, 0, -.9, .92, 1], [.83, 0, -14, 3, -.12, .94, 0, -.62, .75, .72]),
  expression("party", "Party time", "Celebration", "birthday confetti bounce", 1810, "sparks", "social", .42,
    [.18, -15, -7, -19, .11, .63, -.8, 0, .8, .6], [.42, 15, -19, 20, -.15, .8, .7, -.25, .95, 1], [.63, -13, -13, -17, .1, .6, -.6, 0, .87, .84], [.83, 10, -10, 13, -.08, .75, .5, -.1, .7, .66]),
  expression("sleepy", "Sleepy", "Creature Life", "goodnight tired nap drowsy", 2750, "ripples", "energy", .67,
    [.2, 1, 5, 6, .04, .45, 0, .48, -.2, .26], [.39, 4, 15, 17, .14, .05, 0, .81, -.45, .43], [.51, 0, -5, -8, -.08, .87, 0, -.58, -.26, .52], [.67, 6, 19, 18, .17, .04, 0, .85, -.46, .38], [.85, 7, 20, 17, .17, .04, 0, .85, -.44, .28]),
  expression("dance", "Dancing", "Creature Life", "rhythm groove move", 1740, "stars", "playfulness", .42,
    [.17, -18, 0, -17, .13, .62, -.6, 0, .62, .57], [.42, 18, -11, 20, -.08, .8, .8, -.3, .88, .74], [.62, -16, -9, -20, -.07, .67, -.7, -.2, .83, .8], [.83, 16, 2, 15, .11, .62, .65, .2, .7, .58]),
  expression("lotus", "Meditation", "Cosmic Geometry", "lotus calm relax zen", 2650, "ripples", "discipline", .52,
    [.24, 0, -7, 0, -.03, .5, 0, .1, .35, .42], [.52, 0, -13, 0, -.06, .07, 0, .3, .55, .93], [.72, 0, -10, 0, -.04, .08, 0, .27, .5, .66], [.86, 0, -5, 0, -.01, .42, 0, .16, .31, .38]),
  expression("orbit", "Orbit", "Cosmic Geometry", "space circle levitation planet", 2340, "orbit", "curiosity", .54,
    [.23, 18, -9, 15, -.04, .93, .82, -.45, .5, .55], [.54, 0, -24, 0, -.13, .82, 0, -.85, .71, 1], [.77, -20, -9, -17, -.03, .88, -.88, -.4, .53, .69]),
  expression("chaos", "Glitch", "Chaos", "chaos wild ridiculous shake", 1430, "sparks", "playfulness", .54,
    [.14, 8, 6, 11, .16, .58, .83, -.5, -.46, .48], [.29, -18, -12, -22, -.14, 1.25, -.8, .6, -.8, .9], [.41, 15, 7, 22, .19, .4, .83, .25, .7, .85], [.54, -17, -17, -21, -.18, 1.2, -.85, -.3, -.8, 1], [.69, 14, 6, 19, .13, .42, .8, .1, .63, .7], [.84, -4, -3, -8, -.04, .74, -.4, 0, .25, .38]),
] as const satisfies readonly Expression[];

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

export function sampleExpression(e: Expression, progress: number, settings: Settings, personality: PersonalityTraits, seed: number, reducedMotion = false) {
  const time = clamp(progress, 0, 1);
  const phase = reducedMotion ? e.reducedMotionFrame :
    settings.phase === 0 ? time : (time + settings.phase) % 1;
  const timing = (i: number) => settings.timings?.[i] ?? e.keyframes[i][0];
  const right = e.keyframes.findIndex((_, i) => i > 0 && timing(i) >= phase);
  const a = e.keyframes[right - 1];
  const b = e.keyframes[right];
  const local = (phase - timing(right - 1)) / (timing(right) - timing(right - 1));
  const smooth = local * local * (3 - 2 * local);
  const eased = settings.easing === "linear" ? local :
    settings.easing === "spring" ? smooth - .22 * Math.sin(2 * Math.PI * local) * Math.sin(Math.PI * local) : smooth;
  const read = (i: Exclude<keyof Pose & number, 0>) => a[i] + (b[i] - a[i]) * eased;
  const emphasis = trait(personality[e.personality]);
  const punch = settings.energy * (.72 + emphasis * .47);
  const travel = punch * settings.amplitude * settings.translation;
  const over = reducedMotion ? 0 :
    Math.sin(phase * Math.PI * 2 * (1 + settings.frequency * 2) + seed % 9) *
    Math.sin(phase * Math.PI) * punch * settings.ridiculousness;
  const aura = clamp(read(9) * settings.aura * (.75 + emphasis * .5), 0, 1);
  return {
    x: clamp(read(1) * travel, -34, 34),
    y: clamp(read(2) * travel + over * 2, -39, 30),
    angle: clamp(read(3) * settings.rotation * punch + over * 2, -31, 31),
    scale: settings.scale,
    squash: clamp(read(4) * settings.squash * punch, -.25, .25),
    lid: clamp(read(5), .04, 1.2),
    gazeX: clamp(read(6) * (.77 + trait(personality.curiosity) * .38), -1, 1),
    gazeY: clamp(read(7), -1, 1),
    mouth: clamp(read(8), -1, 1),
    aura,
    phase,
    particles: Array.from({ length: Math.round(aura * settings.density * 10) }, (_, i) => {
      const angle = ((seedFor(seed + ":" + i) % 360) + phase * 160 * settings.velocity) * Math.PI / 180;
      const r = 96 + (i % 4) * 16 + aura * 35;
      return { x: 256 + Math.cos(angle) * r, y: 247 + Math.sin(angle) * r, size: 2 + (i % 3) * 1.3 };
    }),
  };
}

export type ExpressionFrame = ReturnType<typeof sampleExpression>;
