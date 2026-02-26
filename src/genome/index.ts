export * from './types';
export { decodeGenome, getTraitSummary } from './decoder';
export {
  encodeGenome,
  hashGenome,
  verifyGenome,
  type GenomeCryptoAdapter,
  type GenomeHasher,
} from './encoder';
export { generateRandomGenome } from './random';
export {
  ELEMENT_RESIDUE_TABLE,
  bridgeFunction,
  bridgeScore,
  chargeVector,
  elementProfiles,
  elementWave,
  frontierWeight,
  genomeBridgeScore,
  genomeChargeVector,
  genomeHeptaSignature,
  heptaSignature,
  residueEntries,
  type ChargeVector,
  type ComplexValue,
  type ElementProfile,
  type ElementSelectionMode,
  type HeptaSignature,
  type ResidueEntry,
} from './elementMath';
export {
  ELEMENT_RESIDUES,
  getResidue,
  getResidueMeta,
  summarizeElementWeb,
} from './elementResidue';
