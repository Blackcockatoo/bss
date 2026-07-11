import type { BodyFeature, BodyPattern, BodyShape, BodySpec, FaceExpression } from '@/components/body-forge/PetBodyRenderer';
import type { VisualPhenotype } from '@/visual-dna';

export const BODY_FORGE_STORAGE_KEY = 'bss:meta-pet:body-spec:v1';

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
};

const expressionMap: Record<VisualPhenotype['face']['expression'], FaceExpression> = {
  neutral: 'neutral',
  smile: 'smile',
  frown: 'frown',
  sleepy: 'sleepy',
  strained: 'focused',
  focused: 'focused',
};

function mapFeatures(features: string[]): BodyFeature[] {
  const result: BodyFeature[] = [];
  if (features.includes('Wings')) result.push('wings');
  if (features.includes('Horns')) result.push('horns');
  if (features.includes('Crown')) result.push('crown');
  if (features.includes('Third Eye')) result.push('thirdEye');
  if (features.includes('Tail Flame')) result.push('tailFlame');
  return result;
}

export function phenotypeToBodySpec(phenotype: VisualPhenotype): BodySpec {
  return {
    name: `${phenotype.evolution.state} ${phenotype.identity.bodyType}`,
    shape: shapeMap[phenotype.identity.bodyType] ?? 'round',
    pattern: patternMap[phenotype.identity.pattern] ?? 'gradient',
    expression: expressionMap[phenotype.face.expression],
    primaryColor: phenotype.identity.baseColor,
    secondaryColor: phenotype.identity.accentColor,
    highlightColor: phenotype.identity.highlightColor,
    bodyWidth: 92 * phenotype.identity.headRatio,
    bodyHeight: 105 * phenotype.body.squashY,
    bodyScale: phenotype.body.scale,
    cornerRoundness: 28,
    eyeSize: 12 * phenotype.face.eyeOpen,
    eyeSpacing: 40,
    eyeHeight: 104,
    pupilSize: 5 * phenotype.face.pupilScale,
    gazeX: phenotype.face.gazeX * 7,
    gazeY: phenotype.face.gazeY * 6,
    mouthWidth: phenotype.face.expression === 'focused' ? 22 : 30,
    mouthHeight: phenotype.face.expression === 'smile' ? 12 : 8,
    wingSpread: phenotype.identity.limbRatio,
    hornLength: 24 + phenotype.evolution.complexity * 22,
    outlineWidth: phenotype.aura.thickness,
    glow: phenotype.aura.opacity,
    tilt: phenotype.body.tiltDegrees,
    bob: phenotype.body.bobPixels,
    breathe: Math.max(0.01, (1 - phenotype.body.squashY) * 0.4),
    animationSpeed: Math.max(0.35, 3 / Math.max(0.8, phenotype.body.bobSeconds)),
    features: mapFeatures(phenotype.identity.features),
  };
}

export function loadForgedBody(): BodySpec | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(BODY_FORGE_STORAGE_KEY);
    return raw ? JSON.parse(raw) as BodySpec : null;
  } catch {
    return null;
  }
}

export function saveForgedBody(spec: BodySpec): void {
  window.localStorage.setItem(BODY_FORGE_STORAGE_KEY, JSON.stringify(spec));
  window.dispatchEvent(new CustomEvent('bss:body-forge:updated', { detail: spec }));
}

export function clearForgedBody(): void {
  window.localStorage.removeItem(BODY_FORGE_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('bss:body-forge:updated', { detail: null }));
}

export interface DNAReadyBodyPacket {
  version: 1;
  kind: 'bss.body-phenotype';
  createdAt: string;
  source: 'body-forge';
  body: BodySpec;
}

export function createDNAReadyBodyPacket(spec: BodySpec): DNAReadyBodyPacket {
  return {
    version: 1,
    kind: 'bss.body-phenotype',
    createdAt: new Date().toISOString(),
    source: 'body-forge',
    body: spec,
  };
}
