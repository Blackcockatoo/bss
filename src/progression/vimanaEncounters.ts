/**
 * Vimana anomaly encounters and Living Ruin selection.
 *
 * Deliberately four polished, reusable encounter kinds rather than many
 * shallow ones. Both the encounter kind and Living Ruin status are derived
 * purely from the node id, so nothing new needs to be stored on VimanaNode
 * or migrated — the same node always gets the same encounter.
 */

import { hashString } from './vimana';

export const VIMANA_ENCOUNTER_KINDS = [
  'echo-loop',
  'gravity-fold',
  'prism-storm',
  'guardian-signal',
] as const;

export type VimanaEncounterKind = (typeof VIMANA_ENCOUNTER_KINDS)[number];

/** Which of the four reusable encounters resolves this node's anomaly. */
export function getVimanaEncounterKind(nodeId: string): VimanaEncounterKind {
  const index = hashString(`encounter:${nodeId}`) % VIMANA_ENCOUNTER_KINDS.length;
  return VIMANA_ENCOUNTER_KINDS[index];
}

/**
 * Roughly one in four discovered nodes doubles as a Living Ruin, offering an
 * optional short Vimana Stack repair run independent of any anomaly. This is
 * a bonus activity, not a gate — a node with no Living Ruin still fully
 * functions without one.
 */
export function isVimanaLivingRuin(nodeId: string): boolean {
  return hashString(`ruin:${nodeId}`) % 4 === 0;
}
