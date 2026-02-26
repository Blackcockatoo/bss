/**
 * Element Number Theory Module
 *
 * Fuses chemical elements into Jewble's mathematical engine:
 * - 60-adic coordinates (a,b): position on circle + tier
 * - Factorization relative to 60: Z = 2^α × 3^β × 5^γ × u
 * - HeptaMath: base-7 triples for rhythmic encoding
 * - Element waves: complex-valued functions on the 60-circle
 * - Charge vectors and Hepta signatures for Jewble genomes
 *
 * Elements are not decorative labels - they ARE the number theory.
 */

// Types
export type {
  SixtyAdicCoord,
  SixtyRelativeFactors,
  UnitCode,
  HeptaTriple,
  ElementProfile,
  ResidueNode,
  BridgeType,
  ChargeVector,
  HeptaSignature,
  ElementWave,
  JewbleElementAnalysis,
  ElementData,
  UnitMod60,
} from './types';

export { UNITS_MOD_60 } from './types';

// Data
export { ELEMENT_DATA, ELEMENT_BY_Z, ELEMENT_BY_SYMBOL } from './data';

// Core engine functions
export {
  to60Adic,
  from60Adic,
  factorRelativeTo60,
  encodeUnit,
  decodeUnit,
  toHeptaTriple,
  fromHeptaTriple,
  generateElementProfile,
  generateAllElementProfiles,
  buildResidueNodes,
  bridgeScore,
  calculateChargeVector,
  calculateHeptaSignature,
  calculateElementWave,
  analyzeJewbleElements,
  sampleElementWave,
  formatElementProfile,
} from './engine';

// Examples and demonstrations
export {
  workedExampleResidue1,
  exampleJewbleAnalysis,
  runAllExamples,
} from './examples';

// Reaction algebra
export {
  addElementsMod60,
  addManyElementsMod60,
  multiplyElementsMod60,
  combineCharges,
  combineManyCharges,
  chargeVectorFromFactors,
  addChargeVectors,
  composeHeptaTriples,
  composeManyHeptaTriples,
  scaleHeptaTriple,
  heptaTriplesEqual,
  inverseHeptaTriple,
  reactElements,
  elementPathway,
  findCycle,
  tensorProduct,
} from './reactions';

export type { ReactionProduct, ElementTensorProduct } from './reactions';

// Computational invariants
export {
  totalBridgeScore,
  chargeMagnitude,
  chargeManhattan,
  chargeMax,
  frontierWeight,
  frontierCount,
  syntheticCount,
  superheavyCount,
  heptaMagnitude,
  heptaToSeed,
  chargeToSeed,
  calculateInvariants,
  formatInvariants,
  compareGenomes,
} from './invariants';

export type { GenomeInvariants, GenomeComparison } from './invariants';

// Bridge analysis
export {
  getBridgePositions,
  getPureBridges,
  getChargedBridges,
  getMaximumChargeBridge,
  getBridgeAtResidue,
  formatBridge,
  generateBridgeTable,
  analyzeBridgeConnectivity,
  verifyBridgePreservation,
} from './bridges';

export type { BridgePosition, BridgeConnectivity } from './bridges';

// Jewble generation applications
export {
  generatePrimesFromCharge,
  primeWalk,
  chargeToFrequency,
  generateFrequencySet,
  generateHarmonicSeries,
  createApertureModulation,
  sampleApertureModulation,
  generateSacredGeometryVertices,
  generateModulatedPolygon,
  generateRadialEnvelope,
  generateVisualizationData,
  verticesToSVGPath,
  exportRadialEnvelope,
} from './applications';

export type {
  ApertureModulation,
  GeometricVertex,
  JewbleVisualizationData,
} from './applications';
