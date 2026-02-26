export {
  decodeGenome,
  getTraitSummary,
  generateRandomGenome,
  ELEMENT_RESIDUES,
  getResidue,
  getResidueMeta,
  summarizeElementWeb,
  type Genome,
  type GenomeHash,
  type DerivedTraits,
  type ElementTraits,
  type PhysicalTraits,
  type PersonalityTraits,
  type LatentTraits,
  type ElementResidue,
  type ElementWebSummary,
  type GenomeCryptoAdapter,
  type GenomeHasher,
} from '@metapet/core/genome';

export { encodeGenome, hashGenome, verifyGenome } from './encoder';
