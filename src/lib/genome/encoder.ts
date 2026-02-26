import {
  encodeGenome as coreEncodeGenome,
  hashGenome as coreHashGenome,
  verifyGenome as coreVerifyGenome,
  type Genome,
  type GenomeHash,
} from '@metapet/core/genome';

import { webGenomeCryptoAdapter } from './webCrypto';

export function encodeGenome(primeDNA: string, tailDNA: string) {
  return coreEncodeGenome(primeDNA, tailDNA, webGenomeCryptoAdapter);
}

export function hashGenome(genome: Genome) {
  return coreHashGenome(genome, webGenomeCryptoAdapter);
}

export function verifyGenome(genome: Genome, hashes: GenomeHash) {
  return coreVerifyGenome(genome, hashes, webGenomeCryptoAdapter);
}
