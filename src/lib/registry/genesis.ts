/**
 * Genome V2 genesis — decimal (0–9) strands, three 60-digit sequences.
 *
 * The legacy generator (`generateRandomGenome` in @metapet/core/genome) rolls
 * base-7 digits; those genomes stay valid forever with `genomeRadix: 7`.
 * New pets are minted here in decimal so every digit family the Hepta and
 * projection maths expect (0–9) actually occurs.
 */

import type { Genome } from '@/lib/genome';

/** Unbiased 0–9 digits from the platform CSPRNG. */
function secureDecimalDigits(count: number): number[] {
  const digits: number[] = [];
  const buffer = new Uint8Array(count * 2);
  while (digits.length < count) {
    crypto.getRandomValues(buffer);
    for (const byte of buffer) {
      // Rejection-sample so 256 % 10 never skews the low digits.
      if (byte < 250) {
        digits.push(byte % 10);
        if (digits.length === count) break;
      }
    }
  }
  return digits;
}

export function generateGenomeV2(random?: () => number): Genome {
  const strand = (): number[] => {
    if (random) {
      return Array.from({ length: 60 }, () =>
        Math.min(9, Math.floor(random() * 10)),
      );
    }
    return secureDecimalDigits(60);
  };

  return { red60: strand(), blue60: strand(), black60: strand() };
}

/** Canonical DNA string for hashing/crest-minting: strands joined in fixed order. */
export function genomeDnaString(genome: Genome): string {
  return `${genome.red60.join('')}|${genome.blue60.join('')}|${genome.black60.join('')}`;
}
