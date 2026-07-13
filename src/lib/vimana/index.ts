/**
 * Vimana Integration - Field Scanning & Anomaly Detection
 *
 * The canonical Vimana model (VimanaNode, VimanaState, migration, routes)
 * lives in `@metapet/core/progression`; this module re-exports it so feature
 * code can keep importing from '@/lib/vimana'. The previous duplicate grid
 * model that lived here was removed in the state consolidation.
 */

export {
  SCAN_QUALITY_CLEAN_MIN,
  SCAN_QUALITY_PERFECT_MIN,
  SCAN_TIER_SCORES,
  VIMANA_ESSENCE_REWARDS,
  VIMANA_STATE_VERSION,
  computeVimanaGenomeSeed,
  createDefaultVimanaState,
  createVimanaNode,
  deriveVimanaConnections,
  discoveryStageRank,
  findVimanaRoute,
  getVimanaFieldRewardDelta,
  isCanonicalVimanaState,
  isVimanaNodeDiscovered,
  migrateVimanaState,
  revealVimanaNeighbors,
  scanVimanaNode,
  vimanaInfoLevel,
} from '@metapet/core/progression';

export type {
  VimanaAnomaly,
  VimanaAnomalySeverity,
  VimanaAnomalyState,
  VimanaAnomalyType,
  VimanaCoordinates,
  VimanaDiscoveryStage,
  VimanaFieldType,
  VimanaNode,
  VimanaScanOutcome,
  VimanaScanTier,
  VimanaState,
} from '@metapet/core/progression';

export type ExplorationRewardPayload = {
  essenceDelta: number;
  source: 'exploration';
};

export function createExplorationRewardPayload(
  essenceDelta: number
): ExplorationRewardPayload {
  return { essenceDelta, source: 'exploration' };
}
