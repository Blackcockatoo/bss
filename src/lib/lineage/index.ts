/**
 * Lineage System - Main exports
 */

export type {
  CoatOfArms,
  HeraldDivision,
  HeraldTincture,
  HeraldCharge,
  PositionedCharge,
  LineageMarker,
  LineageRecord,
  LineageAnalysis,
  BreedingCoatOfArms,
} from './types';

export {
  generateFounderCoatOfArms,
  breedCoatsOfArms,
  getBlason,
  analyzeLineage,
} from './generator';
