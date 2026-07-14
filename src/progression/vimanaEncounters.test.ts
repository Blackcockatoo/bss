import { describe, expect, it } from 'vitest';

import {
  VIMANA_ENCOUNTER_KINDS,
  getVimanaEncounterKind,
  isVimanaLivingRuin,
} from './vimanaEncounters';

describe('getVimanaEncounterKind', () => {
  it('is deterministic for the same node id', () => {
    expect(getVimanaEncounterKind('calm-1')).toBe(getVimanaEncounterKind('calm-1'));
  });

  it('always returns one of the four reusable encounters', () => {
    const ids = ['calm-1', 'calm-2', 'neuro-1', 'neuro-2', 'quantum-1', 'quantum-2', 'earth-1', 'earth-2'];
    for (const id of ids) {
      expect(VIMANA_ENCOUNTER_KINDS).toContain(getVimanaEncounterKind(id));
    }
  });

  it('varies across different node ids (not a constant)', () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    const kinds = new Set(ids.map(getVimanaEncounterKind));
    expect(kinds.size).toBeGreaterThan(1);
  });
});

describe('isVimanaLivingRuin', () => {
  it('is deterministic for the same node id', () => {
    expect(isVimanaLivingRuin('calm-1')).toBe(isVimanaLivingRuin('calm-1'));
  });

  it('marks roughly a quarter of a large id set as Living Ruins', () => {
    const ids = Array.from({ length: 400 }, (_, i) => `node-${i}`);
    const ruinCount = ids.filter(isVimanaLivingRuin).length;
    expect(ruinCount).toBeGreaterThan(60);
    expect(ruinCount).toBeLessThan(140);
  });
});
