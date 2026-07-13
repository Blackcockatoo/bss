import {
  DEFAULT_BODY_SPEC,
  type BodyFeature,
  type BodyPattern,
  type BodyShape,
  type BodySpec,
  type FaceExpression,
} from '@/components/body-forge/PetBodyRenderer';
import type { Genome } from '@/genome/types';
import type { VisualPhenotype } from '@/visual-dna';

export const BODY_FORGE_STORAGE_KEY = 'bss:meta-pet:body-spec:v1';

const GENE_COUNT = 30;
const DIGITS_PER_GENE = 6;
const GENE_MAX = 999_999;

const shapeMap: Record<string, BodyShape> = {
  Spherical: 'round',
  Cubic: 'cubic',
  Pyramidal: 'crystal',
  Cylindrical: 'bean',
  Toroidal: 'toroid',
  Crystalline: 'crystal',
};

const patternMap: Record<string, BodyPattern> = {
  Solid: 'solid',
  Gradient: 'gradient',
  Striped: 'striped',
  Spotted: 'spotted',
  Tessellated: 'striped',
  Fractal: 'spotted',
  Iridescent: 'gradient',
};

const expressionMap: Record<VisualPhenotype['face']['expression'], FaceExpression> = {
  neutral: 'neutral',
  smile: 'smile',
  frown: 'frown',
  sleepy: 'sleepy',
  strained: 'focused',
  focused: 'focused',
};

const featureAliases: Record<string, BodyFeature> = {
  Wings: 'wings',
  Fins: 'wings',
  Horns: 'horns',
  Antennae: 'horns',
  Crown: 'crown',
  Crest: 'crown',
  'Third Eye': 'thirdEye',
  'Tail Flame': 'tailFlame',
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
    state = (Math.imul(state ^ ((index + 1) * 0x45d9f3b), 1_664_525) + 1_013_904_223) >>> 0;
    return state % (GENE_MAX + 1);
  });
}

/**
 * Splits the complete 180-digit genome into thirty six-digit visual genes.
 * No digit is discarded: red, blue, and black each contribute ten genes.
 */
export function genomeToVisualGenes(genome: Genome | null | undefined, fallbackSeed = 0): number[] {
  const digits = flattenGenome(genome);
  if (digits.length !== GENE_COUNT * DIGITS_PER_GENE) return fallbackGenes(fallbackSeed);

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
  return (hash >>> 0).toString(16).padStart(8, '0').slice(0, 6).toUpperCase();
}

export function getGenomeVisualFingerprint(genome: Genome | null | undefined, fallbackSeed = 0): string {
  if (!genome) return `SEED-${(fallbackSeed >>> 0).toString(16).padStart(8, '0').toUpperCase()}`;
  return [laneHash(genome.red60), laneHash(genome.blue60), laneHash(genome.black60)].join('-');
}

function geneColor(gene: number, bias: number): string {
  const scrambled = (Math.imul((gene + 1) >>> 0, 0x45d9f3b) ^ bias) & 0x00ff_ffff;
  return `#${scrambled.toString(16).padStart(6, '0')}`;
}

function parseHex(color: string): [number, number, number] | null {
  const match = /^#([0-9a-f]{6})$/i.exec(color);
  if (!match) return null;
  const value = Number.parseInt(match[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function toHex(channels: readonly number[]): string {
  return `#${channels
    .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`;
}

function blendHex(base: string, accent: string, weight: number): string {
  const baseRgb = parseHex(base);
  const accentRgb = parseHex(accent);
  if (!baseRgb || !accentRgb) return base;
  const mix = clamp(weight, 0, 1);
  return toHex(baseRgb.map((channel, index) => channel * (1 - mix) + accentRgb[index] * mix));
}

function modulateHex(color: string, saturation: number, brightness: number): string {
  const rgb = parseHex(color);
  if (!rgb) return color;
  const grey = rgb.reduce((sum, channel) => sum + channel, 0) / 3;
  return toHex(rgb.map((channel) => (grey + (channel - grey) * saturation) * brightness));
}

function mapFeatures(features: string[]): BodyFeature[] {
  const result = new Set<BodyFeature>();
  for (const feature of features) {
    const mapped = featureAliases[feature];
    if (mapped) result.add(mapped);
  }
  return [...result];
}

function featuresFromGenes(genes: number[], inherited: BodyFeature[]): BodyFeature[] {
  const result = new Set(inherited);
  const featureGenes: Array<[BodyFeature, number, number]> = [
    ['wings', 23, 0.57],
    ['horns', 24, 0.69],
    ['crown', 26, 0.77],
    ['thirdEye', 27, 0.63],
    ['tailFlame', 28, 0.72],
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
  const shape = phenotype.identity.bodyType === 'Amorphous'
    ? (['round', 'bean', 'cubic', 'crystal', 'toroid'] as const)[Math.floor(geneUnit(genes, 24) * 5) % 5]
    : (shapeMap[phenotype.identity.bodyType] ?? 'round');
  const pattern = patternMap[phenotype.identity.pattern]
    ?? (['solid', 'gradient', 'striped', 'spotted'] as const)[Math.floor(geneUnit(genes, 25) * 4) % 4];
  const colorWeight = phenotype.identity.pattern === 'Iridescent' ? 0.48 : phenotype.identity.texture === 'Metallic' ? 0.36 : 0.24;
  const inheritedFeatures = mapFeatures(phenotype.identity.features);

  return {
    name: `${phenotype.evolution.state} ${phenotype.identity.bodyType} · ${getGenomeVisualFingerprint(genome, phenotype.identity.seed)}`,
    shape,
    pattern,
    expression: 'neutral',
    primaryColor: blendHex(phenotype.identity.baseColor, geneColor(genes[20], 0x5a5a5a), colorWeight),
    secondaryColor: blendHex(phenotype.identity.accentColor, geneColor(genes[21], 0xa35a7c), colorWeight),
    highlightColor: blendHex(phenotype.identity.highlightColor, geneColor(genes[22], 0xf0c451), colorWeight),
    bodyWidth: lerp(72, 146, geneUnit(genes, 0)) * lerp(0.9, 1.1, geneUnit(genes, 26)),
    bodyHeight: lerp(78, 158, geneUnit(genes, 1)) * lerp(0.9, 1.1, geneUnit(genes, 27)),
    bodyScale: clamp(phenotype.identity.bodyScale * lerp(0.86, 1.14, geneUnit(genes, 2)), 0.58, 1.45),
    cornerRoundness: lerp(2, 50, geneUnit(genes, 3)) * lerp(0.94, 1.06, geneUnit(genes, 25)),
    eyeSize: lerp(6.5, 19, geneUnit(genes, 4)) * lerp(0.94, 1.06, geneUnit(genes, 28)),
    eyeSpacing: lerp(22, 70, geneUnit(genes, 5)),
    eyeHeight: lerp(86, 120, geneUnit(genes, 6)),
    pupilSize: lerp(2.5, 9.5, geneUnit(genes, 7)),
    gazeX: lerp(-2.6, 2.6, geneUnit(genes, 8)),
    gazeY: lerp(-2, 2, geneUnit(genes, 9)),
    mouthWidth: lerp(12, 56, geneUnit(genes, 10)) * lerp(0.95, 1.05, geneUnit(genes, 28)),
    mouthHeight: lerp(3, 22, geneUnit(genes, 11)),
    wingSpread: lerp(0.3, 1.4, geneUnit(genes, 12)) * clamp(phenotype.identity.limbRatio, 0.7, 1.35) * lerp(0.94, 1.06, geneUnit(genes, 23)),
    hornLength: lerp(11, 54, geneUnit(genes, 13)) * lerp(0.94, 1.06, geneUnit(genes, 24)),
    outlineWidth: lerp(1.2, 7.5, geneUnit(genes, 14)) * lerp(0.96, 1.04, geneUnit(genes, 23)),
    glow: clamp(lerp(0.04, 0.86, geneUnit(genes, 15)) + (phenotype.identity.texture === 'Glowing' ? 0.14 : 0), 0, 1),
    tilt: lerp(-8, 8, geneUnit(genes, 16)) + lerp(-1.5, 1.5, geneUnit(genes, 24)),
    bob: lerp(1, 14, geneUnit(genes, 17)) * lerp(0.92, 1.08, geneUnit(genes, 29)),
    breathe: lerp(0.012, 0.095, geneUnit(genes, 18)),
    animationSpeed: lerp(0.45, 2.25, geneUnit(genes, 19)) * lerp(0.94, 1.06, geneUnit(genes, 29)),
    features: featuresFromGenes(genes, inheritedFeatures),
  };
}

/** Applies mood, care, dosha, evolution and vitals without replacing inherited anatomy. */
export function applyLivePhenotype(base: BodySpec, phenotype: VisualPhenotype): BodySpec {
  const identityScale = Math.max(0.01, phenotype.identity.bodyScale);
  const liveScaleRatio = phenotype.body.scale / identityScale;
  const features = [...base.features];
  const reducedMotion = phenotype.body.bobPixels === 0 && phenotype.aura.pulseSeconds === 0;

  return {
    ...base,
    expression: expressionMap[phenotype.face.expression],
    primaryColor: modulateHex(base.primaryColor, phenotype.body.saturation, phenotype.body.brightness),
    secondaryColor: modulateHex(base.secondaryColor, phenotype.body.saturation, phenotype.body.brightness),
    highlightColor: modulateHex(base.highlightColor, Math.max(0.72, phenotype.body.saturation), Math.max(0.8, phenotype.body.brightness)),
    bodyWidth: clamp(base.bodyWidth * phenotype.body.squashX, 58, 170),
    bodyHeight: clamp(base.bodyHeight * phenotype.body.squashY, 62, 180),
    bodyScale: clamp(base.bodyScale * liveScaleRatio, 0.48, 1.65),
    eyeSize: clamp(base.eyeSize * clamp(phenotype.face.eyeOpen, 0.12, 1.12), 2, 24),
    pupilSize: clamp(base.pupilSize * phenotype.face.pupilScale, 1.5, 12),
    gazeX: clamp(base.gazeX + phenotype.face.gazeX * 7, -9, 9),
    gazeY: clamp(base.gazeY + phenotype.face.gazeY * 6, -8, 8),
    mouthWidth: clamp(base.mouthWidth * (phenotype.face.expression === 'focused' ? 0.78 : 1), 8, 62),
    mouthHeight: clamp(base.mouthHeight * (phenotype.face.expression === 'smile' ? 1.15 : 0.92), 2, 26),
    wingSpread: clamp(base.wingSpread * (0.88 + phenotype.evolution.complexity * 0.22), 0.2, 1.65),
    hornLength: clamp(base.hornLength * (0.9 + phenotype.evolution.complexity * 0.18), 8, 64),
    outlineWidth: clamp(base.outlineWidth + phenotype.aura.turbulence * 1.3, 0.8, 10),
    glow: clamp(base.glow * 0.62 + phenotype.aura.opacity * 0.54 - phenotype.needs.sickness * 0.18, 0, 1),
    tilt: clamp(base.tilt + phenotype.body.tiltDegrees, -24, 24),
    bob: reducedMotion ? 0 : clamp(base.bob * 0.4 + phenotype.body.bobPixels, 0, 24),
    breathe: reducedMotion ? 0 : clamp(base.breathe + Math.max(0, 1 - phenotype.body.squashY) * 0.18, 0, 0.15),
    animationSpeed: reducedMotion || phenotype.body.bobSeconds <= 0
      ? base.animationSpeed
      : clamp(base.animationSpeed * 0.35 + (3 / phenotype.body.bobSeconds) * 0.65, 0.2, 3),
    features,
  };
}

export function phenotypeToBodySpec(
  phenotype: VisualPhenotype,
  genome?: Genome | null,
): BodySpec {
  return applyLivePhenotype(createGenomeBodySpec(phenotype, genome), phenotype);
}

export function resolveBodySpec(
  phenotype: VisualPhenotype,
  genome: Genome | null | undefined,
  forgedBody: BodySpec | null | undefined,
): BodySpec {
  return applyLivePhenotype(forgedBody ?? createGenomeBodySpec(phenotype, genome), phenotype);
}

export function loadForgedBody(): BodySpec | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(BODY_FORGE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BodySpec>;
    return {
      ...DEFAULT_BODY_SPEC,
      ...parsed,
      features: Array.isArray(parsed.features)
        ? parsed.features.filter((feature): feature is BodyFeature => ['wings', 'horns', 'crown', 'thirdEye', 'tailFlame'].includes(feature))
        : DEFAULT_BODY_SPEC.features,
    };
  } catch {
    return null;
  }
}

export function saveForgedBody(spec: BodySpec): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(BODY_FORGE_STORAGE_KEY, JSON.stringify(spec));
  window.dispatchEvent(new CustomEvent('bss:body-forge:updated', { detail: spec }));
}

export function clearForgedBody(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(BODY_FORGE_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('bss:body-forge:updated', { detail: null }));
}

export interface DNAReadyBodyPacket {
  version: 2;
  kind: 'bss.body-phenotype';
  createdAt: string;
  source: 'body-forge';
  genomeFingerprint: string;
  body: BodySpec;
}

export function createDNAReadyBodyPacket(
  spec: BodySpec,
  genome?: Genome | null,
  fallbackSeed = 0,
): DNAReadyBodyPacket {
  return {
    version: 2,
    kind: 'bss.body-phenotype',
    createdAt: new Date().toISOString(),
    source: 'body-forge',
    genomeFingerprint: getGenomeVisualFingerprint(genome, fallbackSeed),
    body: spec,
  };
}
