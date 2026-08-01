import { describe, expect, it } from 'vitest';

import { EVOLUTION_ORDER, type EvolutionState } from './types';
import {
  EVOLUTION_STAGE_UPGRADES,
  describeEvolutionUpgrade,
  getCumulativeEvolutionUpgrade,
  getEvolutionStageUpgrade,
  getNewlyGrantedFeatures,
} from './stageUpgrades';

describe('evolution stage upgrades', () => {
  it('gives every stage in the ladder a defined upgrade', () => {
    for (const state of EVOLUTION_ORDER) {
      expect(EVOLUTION_STAGE_UPGRADES[state], state).toBeDefined();
      expect(EVOLUTION_STAGE_UPGRADES[state].state).toBe(state);
    }
  });

  it('makes every stage past the first visibly change something', () => {
    for (let index = 1; index < EVOLUTION_ORDER.length; index += 1) {
      const previous = getCumulativeEvolutionUpgrade(EVOLUTION_ORDER[index - 1]);
      const current = getCumulativeEvolutionUpgrade(EVOLUTION_ORDER[index]);

      const grewFeatures = current.features.length > previous.features.length;
      const grewFrame =
        current.bodyScale > previous.bodyScale ||
        current.outlineBonus > previous.outlineBonus ||
        current.glowBonus > previous.glowBonus;
      const changedSigil = current.mark !== previous.mark;

      expect(
        grewFeatures && grewFrame && changedSigil,
        `${EVOLUTION_ORDER[index]} must add anatomy, grow the frame, and change its sigil`
      ).toBe(true);
    }
  });

  it('accumulates features forever and never drops an earlier stage grant', () => {
    let previous: readonly string[] = [];
    for (const state of EVOLUTION_ORDER) {
      const { features } = getCumulativeEvolutionUpgrade(state);
      for (const feature of previous) {
        expect(features, `${state} should keep ${feature}`).toContain(feature);
      }
      previous = features;
    }
  });

  it('never grants the same feature twice across the ladder', () => {
    const seen = new Set<string>();
    for (const state of EVOLUTION_ORDER) {
      for (const feature of getEvolutionStageUpgrade(state).grantsFeatures) {
        expect(seen.has(feature), `${feature} granted twice`).toBe(false);
        seen.add(feature);
      }
    }
  });

  it('reports only what a specific transition newly grants', () => {
    expect(getNewlyGrantedFeatures('GENETICS', 'NEURO')).toEqual(['horns']);
    expect(getNewlyGrantedFeatures('NEURO', 'QUANTUM')).toEqual(['thirdEye']);
    expect(getNewlyGrantedFeatures('QUANTUM', 'SPECIATION').sort()).toEqual(
      ['crown', 'wings'].sort()
    );
    // A save loaded straight at the apex has earned everything below it.
    expect(getNewlyGrantedFeatures(null, 'SPECIATION')).toHaveLength(4);
    expect(getNewlyGrantedFeatures('SPECIATION', 'SPECIATION')).toEqual([]);
  });

  it('keeps growth scalars monotonic and bounded', () => {
    let previousScale = 0;
    for (const state of EVOLUTION_ORDER) {
      const upgrade = getCumulativeEvolutionUpgrade(state);
      expect(upgrade.bodyScale).toBeGreaterThanOrEqual(previousScale);
      previousScale = upgrade.bodyScale;

      // Growth is definition, not gigantism: the apex stays close enough to
      // the hatchling that both fit the same stage.
      expect(upgrade.bodyScale).toBeLessThanOrEqual(1.25);
      expect(upgrade.glowBonus).toBeLessThanOrEqual(0.3);
      expect(upgrade.markIntensity).toBeGreaterThan(0);
      expect(upgrade.markIntensity).toBeLessThanOrEqual(1);
      expect(upgrade.markCount).toBeGreaterThan(0);
    }
  });

  it('falls back to the first stage for an unrecognised state', () => {
    const unknown = getCumulativeEvolutionUpgrade(
      'NOT_A_STAGE' as EvolutionState
    );
    expect(unknown.stageIndex).toBe(-1);
    expect(unknown.features).toEqual([]);
    expect(unknown.bodyScale).toBe(1);
  });

  it('describes each stage in player-facing terms', () => {
    for (const state of EVOLUTION_ORDER) {
      const lines = describeEvolutionUpgrade(state);
      expect(lines.length, state).toBeGreaterThan(0);
      for (const line of lines) expect(line.trim().length).toBeGreaterThan(0);
    }
  });
});
