import type { Genome, GenomeHash } from './types';

export interface GenomeCryptoAdapter {
  hmacSHA256(data: string, key: string): Promise<string>;
  sha256(data: string): Promise<string>;
}

export type GenomeHasher = Pick<GenomeCryptoAdapter, 'sha256'>;

export async function encodeGenome(
  primeDNA: string,
  tailDNA: string,
  crypto: GenomeCryptoAdapter
): Promise<Genome> {
  const redSeed = await crypto.hmacSHA256(primeDNA, 'RED_GENOME_V1');
  const blueSeed = await crypto.hmacSHA256(tailDNA, 'BLUE_GENOME_V1');
  const blackSeed = await crypto.hmacSHA256(primeDNA + tailDNA, 'BLACK_GENOME_V1');

  const red60 = await expandToBase7Array(redSeed, 60, crypto);
  const blue60 = await expandToBase7Array(blueSeed, 60, crypto);
  const black60 = await expandToBase7Array(blackSeed, 60, crypto);

  return { red60, blue60, black60 };
}

export async function hashGenome(genome: Genome, crypto: GenomeHasher): Promise<GenomeHash> {
  const redHash = await crypto.sha256(genome.red60.join(''));
  const blueHash = await crypto.sha256(genome.blue60.join(''));
  const blackHash = await crypto.sha256(genome.black60.join(''));

  return { redHash, blueHash, blackHash };
}

export async function verifyGenome(
  genome: Genome,
  hashes: GenomeHash,
  crypto: GenomeHasher
): Promise<boolean> {
  const computed = await hashGenome(genome, crypto);
  return (
    computed.redHash === hashes.redHash &&
    computed.blueHash === hashes.blueHash &&
    computed.blackHash === hashes.blackHash
  );
}

async function expandToBase7Array(seed: string, length: number, crypto: GenomeHasher): Promise<number[]> {
  const result: number[] = [];
  let currentSeed = seed;

  while (result.length < length) {
    const hash = await crypto.sha256(currentSeed);

    for (let i = 0; i < hash.length && result.length < length; i += 2) {
      const byte = parseInt(hash.substring(i, i + 2), 16);
      if (Number.isNaN(byte)) {
        continue;
      }
      result.push(byte % 7);
    }

    currentSeed = hash;
  }

  return result.slice(0, length);
}
