/**
 * Versioned genome -> Sri Yantra packet projection.
 *
 * The protected renderer samples ten positions from each 60-digit strand:
 * red at 3i, blue at 5i, and black at 7i. Passing the genome through
 * directly therefore leaves 150 loci visually silent. V2 keeps the sprite
 * unchanged and folds all twelve five-digit MOSS chambers into those ten
 * sampled positions.
 */

import type { Genome } from "@/lib/genome";
import { webGenomeCryptoAdapter } from "@/lib/genome/webCrypto";

export const SRI_YANTRA_PROJECTION_VERSION_V1 = "moss60-profile/v1";
export const SRI_YANTRA_PROJECTION_VERSION_V2 = "sri-yantra-chambers/v2";

export type SriYantraProjectionVersion =
  | typeof SRI_YANTRA_PROJECTION_VERSION_V1
  | typeof SRI_YANTRA_PROJECTION_VERSION_V2;

export interface SriYantraProjectedStrands {
  red: string;
  blue: string;
  black: string;
}

export interface SriYantraProjection {
  version: SriYantraProjectionVersion;
  strands: SriYantraProjectedStrands;
  /** Ten folded digits per strand, in protected-engine region order. */
  regionDigits: {
    red: number[];
    blue: number[];
    black: number[];
  };
}

/**
 * Protected engine region order:
 * bindu, inner, mid, outer, chest, spine, shoulders, hips, halo, orbit.
 *
 * Every chamber appears exactly once. The first/last chambers meet in the
 * bindu and the two outer machinery chambers share the final region. This
 * preserves all twelve canonical pentads without changing the ten-region
 * renderer contract.
 */
export const CHAMBERS_BY_REGION = [
  [0, 11],
  [1],
  [2],
  [3],
  [4],
  [5],
  [6],
  [7],
  [8],
  [9, 10],
] as const;

export const ENGINE_SAMPLE_POSITIONS = {
  red: Array.from({ length: 10 }, (_, index) => index * 3),
  blue: Array.from({ length: 10 }, (_, index) => index * 5),
  black: Array.from({ length: 10 }, (_, index) => (index * 7) % 60),
} as const;

const FOLD_COEFFICIENTS = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3] as const;

function digit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return ((Math.trunc(value) % 10) + 10) % 10;
}

function normalizedStrand(values: readonly number[]): number[] {
  return Array.from({ length: 60 }, (_, index) => digit(values[index] ?? 0));
}

/**
 * Every coefficient is coprime to 10. Changing any one source digit by a
 * non-zero decimal amount must therefore change its region digit modulo 10.
 */
function foldRegion(
  strand: readonly number[],
  chamberIndexes: readonly number[],
  regionIndex: number,
  laneSalt: number,
): number {
  let total = regionIndex * 3 + laneSalt;
  let position = 0;

  for (const chamberIndex of chamberIndexes) {
    const start = chamberIndex * 5;
    for (let offset = 0; offset < 5; offset += 1) {
      total +=
        digit(strand[start + offset] ?? 0) *
        FOLD_COEFFICIENTS[position % FOLD_COEFFICIENTS.length];
      position += 1;
    }
  }

  return ((total % 10) + 10) % 10;
}

function projectLane(
  values: readonly number[],
  samplePositions: readonly number[],
  laneSalt: number,
): { packet: string; regions: number[] } {
  const source = normalizedStrand(values);
  const packet = [...source];
  const regions = CHAMBERS_BY_REGION.map((chambers, regionIndex) =>
    foldRegion(source, chambers, regionIndex, laneSalt),
  );

  regions.forEach((value, regionIndex) => {
    packet[samplePositions[regionIndex]] = value;
  });

  return { packet: packet.join(""), regions };
}

function directProjection(genome: Genome): SriYantraProjection {
  const red = normalizedStrand(genome.red60);
  const blue = normalizedStrand(genome.blue60);
  const black = normalizedStrand(genome.black60);

  return {
    version: SRI_YANTRA_PROJECTION_VERSION_V1,
    strands: {
      red: red.join(""),
      blue: blue.join(""),
      black: black.join(""),
    },
    regionDigits: {
      red: ENGINE_SAMPLE_POSITIONS.red.map((index) => red[index]),
      blue: ENGINE_SAMPLE_POSITIONS.blue.map((index) => blue[index]),
      black: ENGINE_SAMPLE_POSITIONS.black.map((index) => black[index]),
    },
  };
}

export function deriveSriYantraProjectionV2(
  genome: Genome,
): SriYantraProjection {
  const red = projectLane(genome.red60, ENGINE_SAMPLE_POSITIONS.red, 1);
  const blue = projectLane(genome.blue60, ENGINE_SAMPLE_POSITIONS.blue, 3);
  const black = projectLane(genome.black60, ENGINE_SAMPLE_POSITIONS.black, 7);

  return {
    version: SRI_YANTRA_PROJECTION_VERSION_V2,
    strands: {
      red: red.packet,
      blue: blue.packet,
      black: black.packet,
    },
    regionDigits: {
      red: red.regions,
      blue: blue.regions,
      black: black.regions,
    },
  };
}

export function deriveSriYantraProjection(
  genome: Genome,
  version: string = SRI_YANTRA_PROJECTION_VERSION_V2,
): SriYantraProjection {
  return version === SRI_YANTRA_PROJECTION_VERSION_V1
    ? directProjection(genome)
    : deriveSriYantraProjectionV2(genome);
}

export async function fingerprintSriYantraProjection(
  projection: Pick<SriYantraProjection, "version" | "strands">,
): Promise<string> {
  const { red, blue, black } = projection.strands;
  return webGenomeCryptoAdapter.sha256(
    `${projection.version}|${red}|${blue}|${black}`,
  );
}
