import {
  DEFAULT_BODY_SPEC,
  type BodyFeature,
  type BodyPattern,
  type BodyShape,
  type BodySpec,
  type AuraMotion,
  type AuraStyle,
  type FaceExpression,
  type GenderFrame,
  type WingPurpose,
  type WingStyle,
} from "@/components/body-forge/PetBodyRenderer";
import { EVOLUTION_ORDER } from "@/evolution/types";
import type { Genome } from "@/genome/types";
import type { VisualPhenotype } from "@/visual-dna";

/** Canonical storage key for the versioned, validated forged-body packet. */
export const BODY_FORGE_STORAGE_KEY = "bss:meta-pet:body-spec:v3";
/** Previous rich-pipeline key. Migrated once, never written again. */
export const PREVIOUS_BODY_FORGE_STORAGE_KEY = "bss:meta-pet:body-spec:v2";
/** Pre-versioning key: a bare BodySpec with no envelope. Read-only migration source. */
export const LEGACY_BODY_FORGE_STORAGE_KEY = "bss:meta-pet:body-spec:v1";
const STORED_BODY_PACKET_VERSION = 3;

const GENE_COUNT = 30;
const DIGITS_PER_GENE = 6;
const GENE_MAX = 999_999;

const BODY_SHAPES: readonly BodyShape[] = [
  "round",
  "orb",
  "bean",
  "cubic",
  "block",
  "crystal",
  "toroid",
  "droplet",
  "bell",
  "seed",
  "manta",
  "lantern",
  "crown",
  "hourglass",
  "wisp",
];
const BODY_PATTERNS: readonly BodyPattern[] = [
  "solid",
  "gradient",
  "striped",
  "stripes",
  "spotted",
  "spots",
  "velvet",
  "pearl",
  "glass",
  "chrome",
  "scales",
  "moss",
  "stone",
  "ink",
];
const FACE_EXPRESSIONS: readonly FaceExpression[] = [
  "neutral",
  "smile",
  "frown",
  "focused",
  "sleepy",
  "mischief",
  "calm",
  "fierce",
];
const BODY_FEATURES: readonly BodyFeature[] = [
  "wings",
  "horns",
  "crown",
  "thirdEye",
  "tailFlame",
];
const GENDER_FRAMES: readonly GenderFrame[] = ["male", "neutral", "female"];
const WING_STYLES: readonly WingStyle[] = ["feather", "moth", "blade", "veil"];
const WING_PURPOSES: readonly WingPurpose[] = [
  "flight",
  "attack",
  "attract",
  "defend",
  "decorative",
];
const AURA_STYLES: readonly AuraStyle[] = [
  "mist",
  "sparkle",
  "fireworks",
  "fizz",
  "5d",
  "embers",
  "prism",
  "static",
  "ribbons",
  "void",
];
const AURA_MOTIONS: readonly AuraMotion[] = [
  "orbit",
  "implode",
  "explode",
  "breathe",
  "spiral",
  "drift",
];

const shapeMap: Record<string, BodyShape> = {
  Spherical: "round",
  Cubic: "cubic",
  Pyramidal: "crystal",
  Cylindrical: "bean",
  Toroidal: "toroid",
  Crystalline: "crystal",
};

const patternMap: Record<string, BodyPattern> = {
  Solid: "solid",
  Gradient: "gradient",
  Striped: "striped",
  Spotted: "spotted",
  Tessellated: "striped",
  Fractal: "spotted",
  Iridescent: "gradient",
};

const expressionMap: Record<
  VisualPhenotype["face"]["expression"],
  FaceExpression
> = {
  neutral: "neutral",
  smile: "smile",
  frown: "frown",
  sleepy: "sleepy",
  strained: "focused",
  focused: "focused",
};

const featureAliases: Record<string, BodyFeature> = {
  Wings: "wings",
  Fins: "wings",
  Horns: "horns",
  Antennae: "horns",
  Crown: "crown",
  Crest: "crown",
  "Third Eye": "thirdEye",
  "Tail Flame": "tailFlame",
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function lerp(min: number, max: number, unit: number): number {
  return min + (max - min) * clamp(unit, 0, 1);
}

function normaliseDigit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return clamp(Math.trunc(Math.abs(value)), 0, 9);
}

function flattenGenome(genome: Genome | null | undefined): number[] {
  if (!genome) return [];
  return [...genome.red60, ...genome.blue60, ...genome.black60]
    .slice(0, GENE_COUNT * DIGITS_PER_GENE)
    .map(normaliseDigit);
}

function fallbackGenes(seed: number): number[] {
  let state = seed >>> 0;
  return Array.from({ length: GENE_COUNT }, (_, index) => {
    state =
      (Math.imul(state ^ ((index + 1) * 0x45d9f3b), 1_664_525) +
        1_013_904_223) >>>
      0;
    return state % (GENE_MAX + 1);
  });
}

/**
 * Splits the complete 180-digit genome into thirty six-digit visual genes.
 * No digit is discarded: red, blue, and black each contribute ten genes.
 */
export function genomeToVisualGenes(
  genome: Genome | null | undefined,
  fallbackSeed = 0,
): number[] {
  const digits = flattenGenome(genome);
  if (digits.length !== GENE_COUNT * DIGITS_PER_GENE)
    return fallbackGenes(fallbackSeed);

  return Array.from({ length: GENE_COUNT }, (_, geneIndex) => {
    const start = geneIndex * DIGITS_PER_GENE;
    let value = 0;
    for (let offset = 0; offset < DIGITS_PER_GENE; offset += 1) {
      value = value * 10 + digits[start + offset];
    }
    return value;
  });
}

function geneUnit(genes: number[], index: number): number {
  return clamp((genes[index] ?? 0) / GENE_MAX, 0, 1);
}

function laneHash(values: number[]): string {
  let hash = 2_166_136_261;
  for (const value of values) {
    hash ^= normaliseDigit(value);
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0").slice(0, 6).toUpperCase();
}

export function getGenomeVisualFingerprint(
  genome: Genome | null | undefined,
  fallbackSeed = 0,
): string {
  if (!genome)
    return `SEED-${(fallbackSeed >>> 0).toString(16).padStart(8, "0").toUpperCase()}`;
  return [
    laneHash(genome.red60),
    laneHash(genome.blue60),
    laneHash(genome.black60),
  ].join("-");
}

function geneColor(gene: number, bias: number): string {
  const scrambled =
    (Math.imul((gene + 1) >>> 0, 0x45d9f3b) ^ bias) & 0x00ff_ffff;
  return `#${scrambled.toString(16).padStart(6, "0")}`;
}

function parseHex(color: string): [number, number, number] | null {
  const match = /^#([0-9a-f]{6})$/i.exec(color);
  if (!match) return null;
  const value = Number.parseInt(match[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function toHex(channels: readonly number[]): string {
  return `#${channels
    .map((channel) =>
      clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0"),
    )
    .join("")}`;
}

function blendHex(base: string, accent: string, weight: number): string {
  const baseRgb = parseHex(base);
  const accentRgb = parseHex(accent);
  if (!baseRgb || !accentRgb) return base;
  const mix = clamp(weight, 0, 1);
  return toHex(
    baseRgb.map(
      (channel, index) => channel * (1 - mix) + accentRgb[index] * mix,
    ),
  );
}

function modulateHex(
  color: string,
  saturation: number,
  brightness: number,
): string {
  const rgb = parseHex(color);
  if (!rgb) return color;
  const grey = rgb.reduce((sum, channel) => sum + channel, 0) / 3;
  return toHex(
    rgb.map((channel) => (grey + (channel - grey) * saturation) * brightness),
  );
}

function mapFeatures(features: string[]): BodyFeature[] {
  const result = new Set<BodyFeature>();
  for (const feature of features) {
    const mapped = featureAliases[feature];
    if (mapped) result.add(mapped);
  }
  return [...result];
}

function featuresFromGenes(
  genes: number[],
  inherited: BodyFeature[],
): BodyFeature[] {
  const result = new Set(inherited);
  const featureGenes: Array<[BodyFeature, number, number]> = [
    ["wings", 23, 0.57],
    ["horns", 24, 0.69],
    ["crown", 26, 0.77],
    ["thirdEye", 27, 0.63],
    ["tailFlame", 28, 0.72],
  ];

  for (const [feature, geneIndex, threshold] of featureGenes) {
    if (geneUnit(genes, geneIndex) >= threshold) result.add(feature);
  }
  return [...result];
}

/** Permanent identity frame. It uses all 180 genome digits without live mood/vital deformation. */
export function createGenomeBodySpec(
  phenotype: VisualPhenotype,
  genome: Genome | null | undefined,
): BodySpec {
  const genes = genomeToVisualGenes(genome, phenotype.identity.seed);
  const shape =
    phenotype.identity.bodyType === "Amorphous"
      ? (["round", "bean", "cubic", "crystal", "toroid"] as const)[
          Math.floor(geneUnit(genes, 24) * 5) % 5
        ]
      : (shapeMap[phenotype.identity.bodyType] ?? "round");
  const pattern =
    patternMap[phenotype.identity.pattern] ??
    (
      [
        "solid",
        "gradient",
        "stripes",
        "spots",
        "velvet",
        "pearl",
        "glass",
        "chrome",
        "scales",
        "moss",
        "stone",
        "ink",
      ] as const
    )[Math.floor(geneUnit(genes, 25) * 12) % 12];
  const colorWeight =
    phenotype.identity.pattern === "Iridescent"
      ? 0.48
      : phenotype.identity.texture === "Metallic"
        ? 0.36
        : 0.24;
  const inheritedFeatures = mapFeatures(phenotype.identity.features);

  return {
    name: `${phenotype.evolution.state} ${phenotype.identity.bodyType} · ${getGenomeVisualFingerprint(genome, phenotype.identity.seed)}`,
    shape,
    pattern,
    expression: "neutral",
    primaryColor: blendHex(
      phenotype.identity.baseColor,
      geneColor(genes[20], 0x5a5a5a),
      colorWeight,
    ),
    secondaryColor: blendHex(
      phenotype.identity.accentColor,
      geneColor(genes[21], 0xa35a7c),
      colorWeight,
    ),
    highlightColor: blendHex(
      phenotype.identity.highlightColor,
      geneColor(genes[22], 0xf0c451),
      colorWeight,
    ),
    bodyWidth:
      lerp(72, 146, geneUnit(genes, 0)) * lerp(0.9, 1.1, geneUnit(genes, 26)),
    bodyHeight:
      lerp(78, 158, geneUnit(genes, 1)) * lerp(0.9, 1.1, geneUnit(genes, 27)),
    bodyScale: clamp(
      phenotype.identity.bodyScale * lerp(0.86, 1.14, geneUnit(genes, 2)),
      0.58,
      1.45,
    ),
    cornerRoundness:
      lerp(2, 50, geneUnit(genes, 3)) * lerp(0.94, 1.06, geneUnit(genes, 25)),
    genderFrame: (["male", "neutral", "female"] as const)[
      Math.floor(geneUnit(genes, 2) * 3) % 3
    ],
    shoulders: lerp(28, 82, geneUnit(genes, 0)),
    waist: lerp(28, 76, geneUnit(genes, 1)),
    hips: lerp(28, 82, geneUnit(genes, 2)),
    textureScale: lerp(5, 100, geneUnit(genes, 3)),
    textureDepth: lerp(0, 100, geneUnit(genes, 14)),
    textureRoughness: lerp(0, 100, geneUnit(genes, 15)),
    eyeSize:
      lerp(6.5, 19, geneUnit(genes, 4)) * lerp(0.94, 1.06, geneUnit(genes, 28)),
    eyeSpacing: lerp(22, 70, geneUnit(genes, 5)),
    eyeHeight: lerp(86, 120, geneUnit(genes, 6)),
    pupilSize: lerp(2.5, 9.5, geneUnit(genes, 7)),
    gazeX: lerp(-2.6, 2.6, geneUnit(genes, 8)),
    gazeY: lerp(-2, 2, geneUnit(genes, 9)),
    mouthWidth:
      lerp(12, 56, geneUnit(genes, 10)) * lerp(0.95, 1.05, geneUnit(genes, 28)),
    mouthHeight: lerp(3, 22, geneUnit(genes, 11)),
    wingSpread:
      lerp(0.3, 1.4, geneUnit(genes, 12)) *
      clamp(phenotype.identity.limbRatio, 0.7, 1.35) *
      lerp(0.94, 1.06, geneUnit(genes, 23)),
    wingStyle: (["feather", "moth", "blade", "veil"] as const)[
      Math.floor(geneUnit(genes, 12) * 4) % 4
    ],
    wingPurpose: (
      ["flight", "attack", "attract", "defend", "decorative"] as const
    )[Math.floor(geneUnit(genes, 13) * 5) % 5],
    hornLength:
      lerp(11, 54, geneUnit(genes, 13)) * lerp(0.94, 1.06, geneUnit(genes, 24)),
    outlineWidth:
      lerp(1.2, 7.5, geneUnit(genes, 14)) *
      lerp(0.96, 1.04, geneUnit(genes, 23)),
    glow: clamp(
      lerp(0.04, 0.86, geneUnit(genes, 15)) +
        (phenotype.identity.texture === "Glowing" ? 0.14 : 0),
      0,
      1,
    ),
    tilt:
      lerp(-8, 8, geneUnit(genes, 16)) + lerp(-1.5, 1.5, geneUnit(genes, 24)),
    bob:
      lerp(1, 14, geneUnit(genes, 17)) * lerp(0.92, 1.08, geneUnit(genes, 29)),
    breathe: lerp(0.012, 0.095, geneUnit(genes, 18)),
    animationSpeed:
      lerp(0.45, 2.25, geneUnit(genes, 19)) *
      lerp(0.94, 1.06, geneUnit(genes, 29)),
    auraStyle: (
      [
        "mist",
        "sparkle",
        "fireworks",
        "fizz",
        "5d",
        "embers",
        "prism",
        "static",
        "ribbons",
        "void",
      ] as const
    )[Math.floor(geneUnit(genes, 20) * 10) % 10],
    auraMotion: (
      ["orbit", "implode", "explode", "breathe", "spiral", "drift"] as const
    )[Math.floor(geneUnit(genes, 21) * 6) % 6],
    auraDensity: lerp(10, 100, geneUnit(genes, 22)),
    auraRadius: lerp(20, 100, geneUnit(genes, 23)),
    auraSpeed: lerp(5, 100, geneUnit(genes, 24)),
    auraTurbulence: lerp(0, 100, geneUnit(genes, 25)),
    auraDimension: 3 + Math.floor(geneUnit(genes, 26) * 7),
    auraColor: blendHex(
      phenotype.aura.colors[1],
      geneColor(genes[27], 0x42dfff),
      0.28,
    ),
    auraSecondary: blendHex(
      phenotype.aura.colors[2],
      geneColor(genes[28], 0x9c5cff),
      0.28,
    ),
    emotionIndex: lerp(-100, 100, geneUnit(genes, 29)),
    features: featuresFromGenes(genes, inheritedFeatures),
  };
}

/**
 * Anatomical structures evolution permanently grants once a stage is
 * reached, mirroring that stage's own aura topology (phase-torus insight at
 * QUANTUM, the speciation crown at SPECIATION — see EVOLUTION_STAGE_INFO).
 * Earned once, kept forever after: a later stage's grants stack on top of
 * every earlier stage's.
 */
const EVOLUTION_GRANTED_FEATURES: Partial<
  Record<VisualPhenotype["evolution"]["state"], BodyFeature>
> = {
  QUANTUM: "thirdEye",
  SPECIATION: "crown",
};

/**
 * Evolution owns earned permanent additions. As the pet matures it gains
 * durable anatomical structures on top of whatever the genome or Body Forge
 * already established. It only ever adds to the feature set — it must
 * never remove a feature the genome or forge chose, and it never touches
 * silhouette, colour, or proportions.
 */
export function applyEvolutionGrowth(
  base: BodySpec,
  phenotype: VisualPhenotype,
): BodySpec {
  const reachedIndex = EVOLUTION_ORDER.indexOf(phenotype.evolution.state);
  const merged = new Set(base.features);
  let changed = false;
  for (let index = 0; index <= reachedIndex; index += 1) {
    const granted = EVOLUTION_GRANTED_FEATURES[EVOLUTION_ORDER[index]];
    if (granted && !merged.has(granted)) {
      merged.add(granted);
      changed = true;
    }
  }
  return changed ? { ...base, features: [...merged] } : base;
}

/** Applies mood, care, dosha, evolution and vitals without replacing inherited anatomy. */
export function applyLivePhenotype(
  base: BodySpec,
  phenotype: VisualPhenotype,
): BodySpec {
  const identityScale = Math.max(0.01, phenotype.identity.bodyScale);
  const liveScaleRatio = phenotype.body.scale / identityScale;
  const features = [...base.features];
  const reducedMotion =
    phenotype.body.bobPixels === 0 && phenotype.aura.pulseSeconds === 0;

  return {
    ...base,
    expression: expressionMap[phenotype.face.expression],
    primaryColor: modulateHex(
      base.primaryColor,
      phenotype.body.saturation,
      phenotype.body.brightness,
    ),
    secondaryColor: modulateHex(
      base.secondaryColor,
      phenotype.body.saturation,
      phenotype.body.brightness,
    ),
    highlightColor: modulateHex(
      base.highlightColor,
      Math.max(0.72, phenotype.body.saturation),
      Math.max(0.8, phenotype.body.brightness),
    ),
    bodyWidth: clamp(base.bodyWidth * phenotype.body.squashX, 58, 170),
    bodyHeight: clamp(base.bodyHeight * phenotype.body.squashY, 62, 180),
    bodyScale: clamp(base.bodyScale * liveScaleRatio, 0.48, 1.65),
    eyeSize: clamp(
      base.eyeSize * clamp(phenotype.face.eyeOpen, 0.12, 1.12),
      2,
      24,
    ),
    pupilSize: clamp(base.pupilSize * phenotype.face.pupilScale, 1.5, 12),
    gazeX: clamp(base.gazeX + phenotype.face.gazeX * 7, -9, 9),
    gazeY: clamp(base.gazeY + phenotype.face.gazeY * 6, -8, 8),
    mouthWidth: clamp(
      base.mouthWidth * (phenotype.face.expression === "focused" ? 0.78 : 1),
      8,
      62,
    ),
    mouthHeight: clamp(
      base.mouthHeight * (phenotype.face.expression === "smile" ? 1.15 : 0.92),
      2,
      26,
    ),
    wingSpread: clamp(
      base.wingSpread * (0.88 + phenotype.evolution.complexity * 0.22),
      0.2,
      1.65,
    ),
    hornLength: clamp(
      base.hornLength * (0.9 + phenotype.evolution.complexity * 0.18),
      8,
      64,
    ),
    outlineWidth: clamp(
      base.outlineWidth + phenotype.aura.turbulence * 1.3,
      0.8,
      10,
    ),
    glow: clamp(
      base.glow * 0.62 +
        phenotype.aura.opacity * 0.54 -
        phenotype.needs.sickness * 0.18,
      0,
      1,
    ),
    tilt: clamp(base.tilt + phenotype.body.tiltDegrees, -24, 24),
    bob: reducedMotion
      ? 0
      : clamp(base.bob * 0.4 + phenotype.body.bobPixels, 0, 24),
    breathe: reducedMotion
      ? 0
      : clamp(
          base.breathe + Math.max(0, 1 - phenotype.body.squashY) * 0.18,
          0,
          0.15,
        ),
    animationSpeed:
      reducedMotion || phenotype.body.bobSeconds <= 0
        ? base.animationSpeed
        : clamp(
            base.animationSpeed * 0.35 + (3 / phenotype.body.bobSeconds) * 0.65,
            0.2,
            3,
          ),
    auraDensity: clamp(
      base.auraDensity * 0.55 + phenotype.particles.count * 4.5,
      10,
      100,
    ),
    auraRadius: clamp(
      base.auraRadius * 0.55 + phenotype.aura.radius * 0.55,
      20,
      100,
    ),
    auraSpeed: reducedMotion
      ? 0
      : clamp(
          base.auraSpeed * 0.5 +
            (phenotype.aura.rotationSeconds > 0
              ? 180 / phenotype.aura.rotationSeconds
              : 0),
          0,
          100,
        ),
    auraTurbulence: clamp(
      base.auraTurbulence * 0.5 + phenotype.aura.turbulence * 50,
      0,
      100,
    ),
    auraColor: blendHex(base.auraColor, phenotype.aura.colors[1], 0.45),
    auraSecondary: blendHex(base.auraSecondary, phenotype.aura.colors[2], 0.45),
    emotionIndex: clamp(
      base.emotionIndex * 0.35 + (phenotype.behavior.urgency - 0.5) * 130,
      -100,
      100,
    ),
    features,
  };
}

export function phenotypeToBodySpec(
  phenotype: VisualPhenotype,
  genome?: Genome | null,
): BodySpec {
  const inherited = applyEvolutionGrowth(
    createGenomeBodySpec(phenotype, genome),
    phenotype,
  );
  return applyLivePhenotype(inherited, phenotype);
}

/**
 * The one authoritative body resolution pipeline:
 * genome (or an explicit Body Forge override) → evolution growth → live
 * vitals/dosha/action deformation. Each stage only owns what it is allowed
 * to own; none of them replace the creature with a different body.
 */
export function resolveBodySpec(
  phenotype: VisualPhenotype,
  genome: Genome | null | undefined,
  forgedBody: BodySpec | null | undefined,
): BodySpec {
  const inheritedAnatomy =
    forgedBody ?? createGenomeBodySpec(phenotype, genome);
  const grownAnatomy = applyEvolutionGrowth(inheritedAnatomy, phenotype);
  return applyLivePhenotype(grownAnatomy, phenotype);
}

export interface StoredBodyPacket {
  version: 3;
  savedAt: number;
  genomeFingerprint: string;
  body: BodySpec;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

function sanitizeNumber(value: unknown, fallback: number): number {
  return isFiniteNumber(value) ? value : fallback;
}

function sanitizeColor(value: unknown, fallback: string): string {
  return isHexColor(value) ? value : fallback;
}

function sanitizeEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return typeof value === "string" &&
    (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function sanitizeFeatures(value: unknown): BodyFeature[] | null {
  if (!Array.isArray(value)) return null;
  const filtered = value.filter(
    (item): item is BodyFeature =>
      typeof item === "string" &&
      (BODY_FEATURES as readonly string[]).includes(item),
  );
  return [...new Set(filtered)];
}

/**
 * Validates an arbitrary value (old save shape, hand-edited JSON, or plain
 * corruption) into a safe BodySpec. Every field falls back independently to
 * `DEFAULT_BODY_SPEC` so a single bad field cannot invalidate an otherwise
 * good save.
 */
export function sanitizeBodySpec(value: unknown): BodySpec {
  const candidate: Partial<Record<keyof BodySpec, unknown>> = isPlainObject(
    value,
  )
    ? value
    : {};
  return {
    name:
      typeof candidate.name === "string" && candidate.name.trim().length > 0
        ? candidate.name.slice(0, 80)
        : DEFAULT_BODY_SPEC.name,
    shape: sanitizeEnum(candidate.shape, BODY_SHAPES, DEFAULT_BODY_SPEC.shape),
    pattern: sanitizeEnum(
      candidate.pattern,
      BODY_PATTERNS,
      DEFAULT_BODY_SPEC.pattern,
    ),
    expression: sanitizeEnum(
      candidate.expression,
      FACE_EXPRESSIONS,
      DEFAULT_BODY_SPEC.expression,
    ),
    primaryColor: sanitizeColor(
      candidate.primaryColor,
      DEFAULT_BODY_SPEC.primaryColor,
    ),
    secondaryColor: sanitizeColor(
      candidate.secondaryColor,
      DEFAULT_BODY_SPEC.secondaryColor,
    ),
    highlightColor: sanitizeColor(
      candidate.highlightColor,
      DEFAULT_BODY_SPEC.highlightColor,
    ),
    bodyWidth: sanitizeNumber(candidate.bodyWidth, DEFAULT_BODY_SPEC.bodyWidth),
    bodyHeight: sanitizeNumber(
      candidate.bodyHeight,
      DEFAULT_BODY_SPEC.bodyHeight,
    ),
    bodyScale: sanitizeNumber(candidate.bodyScale, DEFAULT_BODY_SPEC.bodyScale),
    cornerRoundness: sanitizeNumber(
      candidate.cornerRoundness,
      DEFAULT_BODY_SPEC.cornerRoundness,
    ),
    genderFrame: sanitizeEnum(
      candidate.genderFrame,
      GENDER_FRAMES,
      DEFAULT_BODY_SPEC.genderFrame,
    ),
    shoulders: sanitizeNumber(candidate.shoulders, DEFAULT_BODY_SPEC.shoulders),
    waist: sanitizeNumber(candidate.waist, DEFAULT_BODY_SPEC.waist),
    hips: sanitizeNumber(candidate.hips, DEFAULT_BODY_SPEC.hips),
    textureScale: sanitizeNumber(
      candidate.textureScale,
      DEFAULT_BODY_SPEC.textureScale,
    ),
    textureDepth: sanitizeNumber(
      candidate.textureDepth,
      DEFAULT_BODY_SPEC.textureDepth,
    ),
    textureRoughness: sanitizeNumber(
      candidate.textureRoughness,
      DEFAULT_BODY_SPEC.textureRoughness,
    ),
    eyeSize: sanitizeNumber(candidate.eyeSize, DEFAULT_BODY_SPEC.eyeSize),
    eyeSpacing: sanitizeNumber(
      candidate.eyeSpacing,
      DEFAULT_BODY_SPEC.eyeSpacing,
    ),
    eyeHeight: sanitizeNumber(candidate.eyeHeight, DEFAULT_BODY_SPEC.eyeHeight),
    pupilSize: sanitizeNumber(candidate.pupilSize, DEFAULT_BODY_SPEC.pupilSize),
    gazeX: sanitizeNumber(candidate.gazeX, DEFAULT_BODY_SPEC.gazeX),
    gazeY: sanitizeNumber(candidate.gazeY, DEFAULT_BODY_SPEC.gazeY),
    mouthWidth: sanitizeNumber(
      candidate.mouthWidth,
      DEFAULT_BODY_SPEC.mouthWidth,
    ),
    mouthHeight: sanitizeNumber(
      candidate.mouthHeight,
      DEFAULT_BODY_SPEC.mouthHeight,
    ),
    wingSpread: sanitizeNumber(
      candidate.wingSpread,
      DEFAULT_BODY_SPEC.wingSpread,
    ),
    wingStyle: sanitizeEnum(
      candidate.wingStyle,
      WING_STYLES,
      DEFAULT_BODY_SPEC.wingStyle,
    ),
    wingPurpose: sanitizeEnum(
      candidate.wingPurpose,
      WING_PURPOSES,
      DEFAULT_BODY_SPEC.wingPurpose,
    ),
    hornLength: sanitizeNumber(
      candidate.hornLength,
      DEFAULT_BODY_SPEC.hornLength,
    ),
    outlineWidth: sanitizeNumber(
      candidate.outlineWidth,
      DEFAULT_BODY_SPEC.outlineWidth,
    ),
    glow: sanitizeNumber(candidate.glow, DEFAULT_BODY_SPEC.glow),
    tilt: sanitizeNumber(candidate.tilt, DEFAULT_BODY_SPEC.tilt),
    bob: sanitizeNumber(candidate.bob, DEFAULT_BODY_SPEC.bob),
    breathe: sanitizeNumber(candidate.breathe, DEFAULT_BODY_SPEC.breathe),
    animationSpeed: sanitizeNumber(
      candidate.animationSpeed,
      DEFAULT_BODY_SPEC.animationSpeed,
    ),
    auraStyle: sanitizeEnum(
      candidate.auraStyle,
      AURA_STYLES,
      DEFAULT_BODY_SPEC.auraStyle,
    ),
    auraMotion: sanitizeEnum(
      candidate.auraMotion,
      AURA_MOTIONS,
      DEFAULT_BODY_SPEC.auraMotion,
    ),
    auraDensity: sanitizeNumber(
      candidate.auraDensity,
      DEFAULT_BODY_SPEC.auraDensity,
    ),
    auraRadius: sanitizeNumber(
      candidate.auraRadius,
      DEFAULT_BODY_SPEC.auraRadius,
    ),
    auraSpeed: sanitizeNumber(candidate.auraSpeed, DEFAULT_BODY_SPEC.auraSpeed),
    auraTurbulence: sanitizeNumber(
      candidate.auraTurbulence,
      DEFAULT_BODY_SPEC.auraTurbulence,
    ),
    auraDimension: sanitizeNumber(
      candidate.auraDimension,
      DEFAULT_BODY_SPEC.auraDimension,
    ),
    auraColor: sanitizeColor(candidate.auraColor, DEFAULT_BODY_SPEC.auraColor),
    auraSecondary: sanitizeColor(
      candidate.auraSecondary,
      DEFAULT_BODY_SPEC.auraSecondary,
    ),
    emotionIndex: sanitizeNumber(
      candidate.emotionIndex,
      DEFAULT_BODY_SPEC.emotionIndex,
    ),
    features:
      sanitizeFeatures(candidate.features) ?? DEFAULT_BODY_SPEC.features,
  };
}

/**
 * Loads the saved forged body, validating and migrating as needed.
 * - Unparseable JSON or a non-object payload is treated as no save at all
 *   (the caller falls back to the pure DNA body) rather than manufacturing
 *   a spec nobody actually saved.
 * - A recognisable object (current envelope or a pre-versioning bare
 *   BodySpec) is sanitised field-by-field so partial corruption cannot
 *   destroy an otherwise valid save.
 * - A legacy (`v1`) save with no current-key data is migrated forward and
 *   re-saved under the current key.
 */
export function loadForgedBody(): BodySpec | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(BODY_FORGE_STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (!isPlainObject(parsed)) return null;
      const body = isPlainObject(parsed.body) ? parsed.body : parsed;
      return sanitizeBodySpec(body);
    }

    for (const legacyKey of [
      PREVIOUS_BODY_FORGE_STORAGE_KEY,
      LEGACY_BODY_FORGE_STORAGE_KEY,
    ]) {
      const legacyRaw = window.localStorage.getItem(legacyKey);
      if (!legacyRaw) continue;
      const legacyParsed: unknown = JSON.parse(legacyRaw);
      if (!isPlainObject(legacyParsed)) continue;
      const legacyBody = isPlainObject(legacyParsed.body)
        ? legacyParsed.body
        : legacyParsed;
      const migrated = sanitizeBodySpec(legacyBody);
      saveForgedBody(migrated);
      window.localStorage.removeItem(legacyKey);
      return migrated;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveForgedBody(
  spec: BodySpec,
  genome?: Genome | null,
  fallbackSeed = 0,
): void {
  if (typeof window === "undefined") return;
  const packet: StoredBodyPacket = {
    version: STORED_BODY_PACKET_VERSION,
    savedAt: Date.now(),
    genomeFingerprint: getGenomeVisualFingerprint(genome, fallbackSeed),
    body: spec,
  };
  window.localStorage.setItem(BODY_FORGE_STORAGE_KEY, JSON.stringify(packet));
  window.dispatchEvent(
    new CustomEvent("bss:body-forge:updated", { detail: spec }),
  );
}

export function clearForgedBody(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(BODY_FORGE_STORAGE_KEY);
  window.localStorage.removeItem(PREVIOUS_BODY_FORGE_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_BODY_FORGE_STORAGE_KEY);
  window.dispatchEvent(
    new CustomEvent("bss:body-forge:updated", { detail: null }),
  );
}

export interface DNAReadyBodyPacket {
  version: 3;
  kind: "bss.body-phenotype";
  createdAt: string;
  source: "body-forge";
  genomeFingerprint: string;
  body: BodySpec;
}

export function createDNAReadyBodyPacket(
  spec: BodySpec,
  genome?: Genome | null,
  fallbackSeed = 0,
): DNAReadyBodyPacket {
  return {
    version: 3,
    kind: "bss.body-phenotype",
    createdAt: new Date().toISOString(),
    source: "body-forge",
    genomeFingerprint: getGenomeVisualFingerprint(genome, fallbackSeed),
    body: spec,
  };
}
