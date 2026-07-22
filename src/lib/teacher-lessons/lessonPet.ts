/**
 * Meta-Pet Teacher Lesson System — lesson pet context (Pass 2).
 *
 * A small, pure, component-free description of the pet the lessons manipulate
 * (`LessonPetConfig`) plus deterministic demonstration data and controlled
 * mutation / emotion helpers. The component-side adapter
 * (`components/teacher-lessons/activities/petSpec.ts`) turns a config into a
 * real `BodySpec` for `PetBodyRenderer`, so the lib layer stays independent of
 * the rendering component while lessons still drive the real pet visual.
 */

/** Movement styles offered in the classroom interfaces. */
export type LessonMovementStyle = "float" | "bounce" | "glide" | "still";

/** The lesson-facing subset of pet configuration the activities control. */
export interface LessonPetConfig {
  alias: string;
  shape: string;
  pattern: string;
  expression: string;
  movement: LessonMovementStyle;
  feature: string | null;
  primaryColor: string;
  secondaryColor: string;
  highlightColor: string;
  /** 0 = sleepy/closed … 1 = wide awake. */
  eyeOpenness: number;
  /** -1 = slumped … 1 = upright (drives tilt/posture). */
  posture: number;
  /** 0.2 = dim … 1 = bright (drives glow/brightness). */
  brightness: number;
  /** 0 = shallow/tense … 1 = slow/calm breathing. */
  breathing: number;
}

// ---- Controlled option lists (kept small for classroom clarity) ----

export const LESSON_SHAPE_OPTIONS = [
  { id: "round", label: "Round" },
  { id: "bean", label: "Bean" },
  { id: "crystal", label: "Crystal" },
  { id: "droplet", label: "Droplet" },
  { id: "crown", label: "Crown" },
] as const;

export const LESSON_PATTERN_OPTIONS = [
  { id: "solid", label: "Solid" },
  { id: "gradient", label: "Gradient" },
  { id: "striped", label: "Striped" },
  { id: "spotted", label: "Spotted" },
  { id: "scales", label: "Scales" },
] as const;

export const LESSON_EXPRESSION_OPTIONS = [
  { id: "smile", label: "Smiling" },
  { id: "calm", label: "Calm" },
  { id: "focused", label: "Focused" },
  { id: "mischief", label: "Playful" },
  { id: "sleepy", label: "Sleepy" },
] as const;

export const LESSON_MOVEMENT_OPTIONS: {
  id: LessonMovementStyle;
  label: string;
}[] = [
  { id: "float", label: "Float" },
  { id: "bounce", label: "Bounce" },
  { id: "glide", label: "Glide" },
  { id: "still", label: "Stay still" },
];

export const LESSON_FEATURE_OPTIONS = [
  { id: "wings", label: "Wings" },
  { id: "horns", label: "Horns" },
  { id: "crown", label: "Crown" },
  { id: "thirdEye", label: "Third eye" },
  { id: "tailFlame", label: "Tail flame" },
] as const;

export const LESSON_PALETTE_OPTIONS = [
  {
    id: "ocean",
    label: "Ocean",
    primaryColor: "#1677ff",
    secondaryColor: "#08203a",
    highlightColor: "#5cd0ff",
  },
  {
    id: "sunset",
    label: "Sunset",
    primaryColor: "#ff7a45",
    secondaryColor: "#3a1408",
    highlightColor: "#ffd15c",
  },
  {
    id: "forest",
    label: "Forest",
    primaryColor: "#3fa34d",
    secondaryColor: "#0d2a12",
    highlightColor: "#b6f05c",
  },
  {
    id: "berry",
    label: "Berry",
    primaryColor: "#9c5cff",
    secondaryColor: "#26083a",
    highlightColor: "#ff8ad0",
  },
] as const;

/**
 * Deterministic demonstration pet. Every classroom sees the same starting
 * point, so teacher examples are predictable and reproducible.
 */
export const DEMO_PET_CONFIG: LessonPetConfig = {
  alias: "Pip",
  shape: "bean",
  pattern: "gradient",
  expression: "smile",
  movement: "float",
  feature: "wings",
  primaryColor: "#1677ff",
  secondaryColor: "#08203a",
  highlightColor: "#5cd0ff",
  eyeOpenness: 0.7,
  posture: 0.4,
  brightness: 0.7,
  breathing: 0.6,
};

/** Deep-copy a config so activities never mutate shared defaults. */
export function cloneLessonPetConfig(config: LessonPetConfig): LessonPetConfig {
  return { ...config };
}

// ---- Lesson 3: controlled single-gene mutation ----

export interface LessonGene {
  id: string;
  label: string;
  /** Human description of the "before" value for the current config. */
  describe: (config: LessonPetConfig) => string;
  /** Apply the mutation, guaranteed to produce a visible change. */
  mutate: (config: LessonPetConfig) => LessonPetConfig;
  /** Prediction options students can choose from. */
  predictionOptions: string[];
}

/**
 * A small set of genes, each mapped to a clearly visible trait so a mutation
 * always produces an obvious difference (never a near-invisible change).
 */
export const LESSON_GENES: LessonGene[] = [
  {
    id: "gene-eye",
    label: "Eye gene",
    describe: (c) =>
      c.eyeOpenness >= 0.6 ? "wide, round eyes" : "narrow eyes",
    mutate: (c) => ({
      ...c,
      eyeOpenness: c.eyeOpenness >= 0.6 ? 0.25 : 0.95,
      expression: c.eyeOpenness >= 0.6 ? "focused" : "smile",
    }),
    predictionOptions: [
      "The eyes will change",
      "The colour will change",
      "The shape will change",
    ],
  },
  {
    id: "gene-pattern",
    label: "Pattern gene",
    describe: (c) => `a ${c.pattern} surface`,
    mutate: (c) => ({
      ...c,
      pattern: c.pattern === "spotted" ? "striped" : "spotted",
    }),
    predictionOptions: [
      "The surface pattern will change",
      "The eyes will change",
      "The movement will change",
    ],
  },
  {
    id: "gene-shape",
    label: "Shape gene",
    describe: (c) => `a ${c.shape} body`,
    mutate: (c) => ({
      ...c,
      shape: c.shape === "crystal" ? "round" : "crystal",
    }),
    predictionOptions: [
      "The body shape will change",
      "The colour will change",
      "Nothing will change",
    ],
  },
  {
    id: "gene-colour",
    label: "Colour gene",
    describe: () => "its main colour",
    mutate: (c) => {
      const next =
        LESSON_PALETTE_OPTIONS.find((p) => p.primaryColor !== c.primaryColor) ??
        LESSON_PALETTE_OPTIONS[0];
      return {
        ...c,
        primaryColor: next.primaryColor,
        secondaryColor: next.secondaryColor,
        highlightColor: next.highlightColor,
      };
    },
    predictionOptions: [
      "The colour will change",
      "The shape will change",
      "The eyes will change",
    ],
  },
];

export function getLessonGene(id: string): LessonGene | undefined {
  return LESSON_GENES.find((g) => g.id === id);
}

/**
 * Build a deterministic DNA strip (bases + one highlighted position) from a
 * seed string. Pure and stable so the same pet always shows the same strip.
 */
export function buildDnaStrip(
  seed: string,
  length = 12,
  highlightIndex = 4,
): { base: "A" | "T" | "C" | "G"; highlighted: boolean }[] {
  const bases: ("A" | "T" | "C" | "G")[] = ["A", "T", "C", "G"];
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const strip: { base: "A" | "T" | "C" | "G"; highlighted: boolean }[] = [];
  for (let i = 0; i < length; i += 1) {
    hash = Math.imul(hash ^ (i + 1), 16777619);
    const index = Math.abs(hash) % 4;
    strip.push({
      base: bases[index],
      highlighted: i === ((highlightIndex % length) + length) % length,
    });
  }
  return strip;
}

// ---- Lesson 5: emotion presets ----

export interface LessonEmotionPreset {
  id: string;
  label: string;
  /** Partial config applied over the base to express the emotion. */
  config: Partial<LessonPetConfig>;
  /** Visible clues a student might select. */
  clues: string[];
  /** Gentle, non-absolute helper text. */
  mayBeFeeling: string;
}

export const LESSON_EMOTION_PRESETS: LessonEmotionPreset[] = [
  {
    id: "curious",
    label: "Curious",
    config: {
      expression: "focused",
      eyeOpenness: 0.9,
      posture: 0.6,
      brightness: 0.8,
      breathing: 0.5,
      movement: "glide",
    },
    clues: ["Wide eyes", "Leaning forward", "Quick little movements"],
    mayBeFeeling: "The pet may be feeling curious.",
  },
  {
    id: "excited",
    label: "Excited",
    config: {
      expression: "smile",
      eyeOpenness: 1,
      posture: 0.8,
      brightness: 1,
      breathing: 0.3,
      movement: "bounce",
    },
    clues: ["Bright colour", "Bouncy movement", "Big open eyes"],
    mayBeFeeling: "The pet may be feeling excited.",
  },
  {
    id: "worried",
    label: "Worried",
    config: {
      expression: "focused",
      eyeOpenness: 0.55,
      posture: -0.4,
      brightness: 0.4,
      breathing: 0.25,
      movement: "still",
    },
    clues: ["Dimmer colour", "Pulled back posture", "Fast, shallow breathing"],
    mayBeFeeling: "The pet may be feeling worried.",
  },
  {
    id: "tired",
    label: "Tired",
    config: {
      expression: "sleepy",
      eyeOpenness: 0.2,
      posture: -0.6,
      brightness: 0.35,
      breathing: 0.9,
      movement: "still",
    },
    clues: ["Half-closed eyes", "Slumped posture", "Slow movement"],
    mayBeFeeling: "The pet may be feeling tired.",
  },
  {
    id: "calm",
    label: "Calm",
    config: {
      expression: "calm",
      eyeOpenness: 0.6,
      posture: 0.2,
      brightness: 0.6,
      breathing: 1,
      movement: "float",
    },
    clues: ["Steady colour", "Relaxed posture", "Slow, even breathing"],
    mayBeFeeling: "The pet may be feeling calm.",
  },
];

export function getEmotionPreset(id: string): LessonEmotionPreset | undefined {
  return LESSON_EMOTION_PRESETS.find((e) => e.id === id);
}

/** Apply an emotion preset onto a base config, returning a new config. */
export function applyEmotionPreset(
  base: LessonPetConfig,
  presetId: string,
): LessonPetConfig {
  const preset = getEmotionPreset(presetId);
  if (!preset) return { ...base };
  return { ...base, ...preset.config };
}

/** A gentle "toward calm" adjustment used by Lesson 5 step 4. */
export function nudgeTowardCalm(config: LessonPetConfig): LessonPetConfig {
  return {
    ...config,
    brightness: clamp01(config.brightness * 0.6 + 0.6 * 0.4),
    breathing: clamp01(config.breathing * 0.4 + 1 * 0.6),
    posture: config.posture * 0.4 + 0.2 * 0.6,
    eyeOpenness: clamp01(config.eyeOpenness * 0.5 + 0.6 * 0.5),
    expression: "calm",
    movement: "float",
  };
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
