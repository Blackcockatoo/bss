import type { Genome } from './types';

export type ElementSelectionMode = 'low' | 'high' | 'frontier-preferred';

export interface FactorizationRelativeTo60 {
  alpha: number;
  beta: number;
  gamma: number;
  unit: number;
  coreCode: number;
}

export interface ElementProfile {
  z: number;
  residue: number;
  layer: number;
  factorization: FactorizationRelativeTo60;
  heptaTriple: readonly [number, number, number];
}

export interface ResidueEntry {
  residue: number;
  elements: ElementProfile[];
  low?: ElementProfile;
  high?: ElementProfile;
  delta: number;
  bridgeLevel: 0 | 1 | 2;
  averageLayer: number | null;
}

export interface ChargeVector {
  c2: number;
  c3: number;
  c5: number;
}

export interface HeptaSignature {
  total: readonly [number, number, number];
  mod7: readonly [number, number, number];
}

export interface ElementWaveOptions {
  lambda?: number;
  selectionMode?: ElementSelectionMode;
  frontierSelector?: (z: number) => boolean;
  table?: ResidueEntry[];
}

export interface ComplexValue {
  real: number;
  imag: number;
  magnitude: number;
  angle: number;
}

const UNITS_MOD_60 = [
  1, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 49, 53, 59,
] as const;

const DEFAULT_FRONTIER_SELECTOR = (z: number) => z >= 93;

function heptaTriple(z: number): readonly [number, number, number] {
  const d0 = z % 7;
  const d1 = Math.floor(z / 7) % 7;
  const d2 = Math.floor(z / 49) % 7;
  return [d0, d1, d2];
}

function factorizeRelativeTo60(z: number): FactorizationRelativeTo60 {
  let remaining = z;
  let alpha = 0;
  let beta = 0;
  let gamma = 0;

  while (remaining % 2 === 0) {
    alpha += 1;
    remaining /= 2;
  }

  while (remaining % 3 === 0) {
    beta += 1;
    remaining /= 3;
  }

  while (remaining % 5 === 0) {
    gamma += 1;
    remaining /= 5;
  }

  const unit = remaining % 60;
  const coreCode = UNITS_MOD_60.indexOf(unit as typeof UNITS_MOD_60[number]);

  if (coreCode === -1) {
    throw new Error(`Unit ${unit} (from Z=${z}) is not a member of (Z/60Z)^×`);
  }

  return { alpha, beta, gamma, unit, coreCode };
}

function buildElementProfile(z: number): ElementProfile {
  const residue = z % 60;
  const layer = Math.floor(z / 60);

  return {
    z,
    residue,
    layer,
    factorization: factorizeRelativeTo60(z),
    heptaTriple: heptaTriple(z),
  };
}

function buildResidueTable(maxZ: number): ResidueEntry[] {
  const table: ResidueEntry[] = Array.from({ length: 60 }, (_, residue) => ({
    residue,
    elements: [],
    delta: 0,
    bridgeLevel: 0,
    averageLayer: null,
  }));

  for (let z = 1; z <= maxZ; z++) {
    const profile = buildElementProfile(z);
    const entry = table[profile.residue];
    entry.elements.push(profile);
  }

  for (const entry of table) {
    if (entry.elements.length === 0) continue;

    entry.low = entry.elements[0];
    entry.high = entry.elements[entry.elements.length - 1];
    entry.delta = entry.high.z - entry.low.z;
    entry.bridgeLevel = entry.elements.length >= 2 ? 2 : 1;
    entry.averageLayer =
      entry.elements.reduce((sum, el) => sum + el.layer, 0) / entry.elements.length;
  }

  return table;
}

export const ELEMENT_RESIDUE_TABLE = buildResidueTable(118);

function getEntry(residue: number, table: ResidueEntry[]): ResidueEntry | undefined {
  if (!Number.isInteger(residue) || residue < 0 || residue >= 60) return undefined;
  return table[residue];
}

export function bridgeFunction(residue: number, table: ResidueEntry[] = ELEMENT_RESIDUE_TABLE): 0 | 1 | 2 {
  return getEntry(residue, table)?.bridgeLevel ?? 0;
}

export function bridgeScore(
  digits: Iterable<number>,
  table: ResidueEntry[] = ELEMENT_RESIDUE_TABLE,
): number {
  let total = 0;
  for (const digit of digits) {
    total += bridgeFunction(digit, table);
  }
  return total;
}

function pickElement(
  entry: ResidueEntry | undefined,
  selectionMode: ElementSelectionMode,
  frontierSelector: (z: number) => boolean,
): ElementProfile | undefined {
  if (!entry) return undefined;

  if (selectionMode === 'low') return entry.low ?? entry.high;
  if (selectionMode === 'high') return entry.high ?? entry.low;

  if (selectionMode === 'frontier-preferred') {
    if (entry.high && frontierSelector(entry.high.z)) return entry.high;
    if (entry.low && frontierSelector(entry.low.z)) return entry.low;
    return entry.high ?? entry.low;
  }

  return undefined;
}

export function frontierWeight(
  digits: Iterable<number>,
  options: {
    frontierSelector?: (z: number) => boolean;
    selectionMode?: ElementSelectionMode;
    table?: ResidueEntry[];
  } = {},
): number {
  const table = options.table ?? ELEMENT_RESIDUE_TABLE;
  const frontierSelector = options.frontierSelector ?? DEFAULT_FRONTIER_SELECTOR;
  const selectionMode = options.selectionMode ?? 'high';

  let weight = 0;
  for (const digit of digits) {
    const entry = getEntry(digit, table);
    const element = pickElement(entry, selectionMode, frontierSelector);
    if (element && frontierSelector(element.z)) {
      weight += 1;
    }
  }

  return weight;
}

export function chargeVector(
  digits: Iterable<number>,
  options: {
    selectionMode?: ElementSelectionMode;
    frontierSelector?: (z: number) => boolean;
    table?: ResidueEntry[];
  } = {},
): ChargeVector {
  const table = options.table ?? ELEMENT_RESIDUE_TABLE;
  const selectionMode = options.selectionMode ?? 'low';
  const frontierSelector = options.frontierSelector ?? DEFAULT_FRONTIER_SELECTOR;

  let c2 = 0;
  let c3 = 0;
  let c5 = 0;

  for (const digit of digits) {
    const entry = getEntry(digit, table);
    const element = pickElement(entry, selectionMode, frontierSelector);
    if (!element) continue;

    c2 += element.factorization.alpha;
    c3 += element.factorization.beta;
    c5 += element.factorization.gamma;
  }

  return { c2, c3, c5 };
}

export function heptaSignature(
  digits: Iterable<number>,
  options: {
    selectionMode?: ElementSelectionMode;
    frontierSelector?: (z: number) => boolean;
    table?: ResidueEntry[];
  } = {},
): HeptaSignature {
  const table = options.table ?? ELEMENT_RESIDUE_TABLE;
  const selectionMode = options.selectionMode ?? 'frontier-preferred';
  const frontierSelector = options.frontierSelector ?? DEFAULT_FRONTIER_SELECTOR;

  let x = 0;
  let y = 0;
  let z = 0;

  for (const digit of digits) {
    const entry = getEntry(digit, table);
    const element = pickElement(entry, selectionMode, frontierSelector);
    if (!element) continue;

    x += element.heptaTriple[0];
    y += element.heptaTriple[1];
    z += element.heptaTriple[2];
  }

  const mod7: [number, number, number] = [x % 7, y % 7, z % 7];
  return { total: [x, y, z], mod7 };
}

export function elementWave(
  digits: Iterable<number>,
  options: ElementWaveOptions = {},
): ComplexValue {
  const table = options.table ?? ELEMENT_RESIDUE_TABLE;
  const lambda = options.lambda ?? 0.5;
  const selectionMode = options.selectionMode ?? 'frontier-preferred';
  const frontierSelector = options.frontierSelector ?? DEFAULT_FRONTIER_SELECTOR;

  let real = 0;
  let imag = 0;

  for (const digit of digits) {
    const entry = getEntry(digit, table);
    const element = pickElement(entry, selectionMode, frontierSelector);
    const averageLayer = entry?.averageLayer ?? 0;

    if (!element) continue;

    const weight =
      Math.pow(2, element.factorization.alpha) *
      Math.pow(3, element.factorization.beta) *
      Math.pow(5, element.factorization.gamma);

    const baseAngle = (2 * Math.PI * element.residue) / 60;
    const totalAngle = baseAngle + lambda * averageLayer;

    real += weight * Math.cos(totalAngle);
    imag += weight * Math.sin(totalAngle);
  }

  const magnitude = Math.hypot(real, imag);
  const angle = Math.atan2(imag, real);

  return { real, imag, magnitude, angle };
}

export function elementProfiles(): ElementProfile[] {
  return ELEMENT_RESIDUE_TABLE.flatMap((entry) => entry.elements);
}

export function residueEntries(): ResidueEntry[] {
  return ELEMENT_RESIDUE_TABLE;
}

export function genomeBridgeScore(genome: Genome): number {
  return bridgeScore([...genome.red60, ...genome.blue60, ...genome.black60]);
}

export function genomeChargeVector(genome: Genome, options?: Parameters<typeof chargeVector>[1]): ChargeVector {
  return chargeVector([...genome.red60, ...genome.blue60, ...genome.black60], options);
}

export function genomeHeptaSignature(
  genome: Genome,
  options?: Parameters<typeof heptaSignature>[1],
): HeptaSignature {
  return heptaSignature([...genome.red60, ...genome.blue60, ...genome.black60], options);
}
