/**
 * HeptaProfile V2 — the seven inherited characteristic axes
 * (Phase 2 of docs/planning/metapet-pipeline-audit.md).
 *
 * Deliberately separate from the HeptaCode: the code
 * (src/lib/identity/hepta) is the portable 42-digit identity/error-correction
 * layer; this profile is the pet's inherited character, derived from the
 * genome alone. Birth character = genome + this profile. Current expression
 * (vitals, bond, evolution, memory) may suppress behavior at runtime but
 * never rewrites these axes.
 *
 * Derivation contract (versioned as hepta-profile/v2):
 * - Five 60-digit sequences: Red, Blue, Black, Union = (R+B) mod 10,
 *   Shadow = (R−B+10) mod 10.
 * - Each sequence splits into positional lanes by index mod 7, so WHERE a
 *   digit sits matters, not just how often it occurs.
 * - Digits map to the seven families 0 · 1/9 · 2/8 · 3 · 4/6 · 5 · 7.
 * - A 7×7 matrix counts (lane × family) occurrences, primary strands at
 *   double the weight of the derived Union/Shadow sequences.
 * - Axis a reads column a of the matrix with a 3× bonus on the aligned lane
 *   (lane === axis), then normalizes to a 0–100 intensity.
 */

import type { Genome } from '@/lib/genome';

export const HEPTA_PROFILE_VERSION = 'hepta-profile/v2';

export const HEPTA_AXES = [
  'void',
  'spark',
  'sense',
  'voice',
  'frame',
  'flux',
  'crown',
] as const;

export type HeptaAxis = (typeof HEPTA_AXES)[number];

export interface HeptaProfileV2 {
  version: typeof HEPTA_PROFILE_VERSION;
  /** Normalized 0–100 intensity per axis. */
  axes: Record<HeptaAxis, number>;
  dominantAxis: HeptaAxis;
  secondaryAxis: HeptaAxis;
  temperament: string;
  /** 0–1 weights the behavior layer (Phase 4) consumes directly. */
  behaviorWeights: {
    cadence: number;
    greeting: number;
    curiosity: number;
    steadiness: number;
    rest: number;
    confidence: number;
    variety: number;
  };
  /** The raw 7×7 (lane × family) matrix, kept for reproducibility. */
  matrix: number[][];
}

/** Digit → family index for the families 0 · 1/9 · 2/8 · 3 · 4/6 · 5 · 7. */
const DIGIT_FAMILY = [0, 1, 2, 3, 4, 5, 4, 6, 2, 1] as const;

const AXIS_WORD: Record<HeptaAxis, string> = {
  void: 'still',
  spark: 'fiery',
  sense: 'curious',
  voice: 'social',
  frame: 'steadfast',
  flux: 'restless',
  crown: 'radiant',
};

/** Primary strands count double against the derived Union/Shadow sequences. */
const PRIMARY_WEIGHT = 2;
const DERIVED_WEIGHT = 1;

/** Aligned-lane bonus: cell (lane a, family a) counts 3× toward axis a. */
const ALIGNED_LANE_WEIGHT = 3;

export function buildHeptaMatrix(genome: Genome): number[][] {
  const matrix = Array.from({ length: 7 }, () => new Array<number>(7).fill(0));

  const accumulate = (sequence: readonly number[], weight: number) => {
    for (let index = 0; index < sequence.length; index++) {
      const digit = ((sequence[index] % 10) + 10) % 10;
      matrix[index % 7][DIGIT_FAMILY[digit]] += weight;
    }
  };

  accumulate(genome.red60, PRIMARY_WEIGHT);
  accumulate(genome.blue60, PRIMARY_WEIGHT);
  accumulate(genome.black60, PRIMARY_WEIGHT);
  accumulate(
    genome.red60.map((digit, index) => (digit + genome.blue60[index]) % 10),
    DERIVED_WEIGHT,
  );
  accumulate(
    genome.red60.map(
      (digit, index) => (digit - genome.blue60[index] + 10) % 10,
    ),
    DERIVED_WEIGHT,
  );

  return matrix;
}

const round3 = (value: number): number => Math.round(value * 1000) / 1000;

export function deriveHeptaProfile(genome: Genome): HeptaProfileV2 {
  const matrix = buildHeptaMatrix(genome);

  const raw = HEPTA_AXES.map((_, axis) => {
    let score = 0;
    for (let lane = 0; lane < 7; lane++) {
      score += matrix[lane][axis] * (lane === axis ? ALIGNED_LANE_WEIGHT : 1);
    }
    return score;
  });
  const total = raw.reduce((sum, value) => sum + value, 0);

  const axes = {} as Record<HeptaAxis, number>;
  HEPTA_AXES.forEach((axis, index) => {
    axes[axis] = Math.round((raw[index] / total) * 100);
  });

  const ranked = [...HEPTA_AXES].sort((a, b) => {
    if (axes[b] !== axes[a]) return axes[b] - axes[a];
    // Deterministic tie-break in canonical axis order.
    return HEPTA_AXES.indexOf(a) - HEPTA_AXES.indexOf(b);
  });
  const dominantAxis = ranked[0];
  const secondaryAxis = ranked[1];

  return {
    version: HEPTA_PROFILE_VERSION,
    axes,
    dominantAxis,
    secondaryAxis,
    temperament: `${AXIS_WORD[dominantAxis]}-${AXIS_WORD[secondaryAxis]}`,
    behaviorWeights: {
      cadence: round3((axes.spark + axes.flux) / 200),
      greeting: round3(axes.voice / 100),
      curiosity: round3(axes.sense / 100),
      steadiness: round3(axes.frame / 100),
      rest: round3(axes.void / 100),
      confidence: round3(axes.crown / 100),
      variety: round3(axes.flux / 100),
    },
    matrix,
  };
}
