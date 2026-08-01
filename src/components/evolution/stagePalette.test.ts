import { describe, expect, it } from 'vitest';

import { EVOLUTION_ORDER } from '@/evolution/types';
import type { DerivedTraits } from '@/genome/types';
import { resolveStagePalette } from './stagePalette';

function traitsOnPath(evolutionPath: string): DerivedTraits {
  return {
    physical: {
      bodyType: 'Spherical',
      primaryColor: '#123456',
      secondaryColor: '#abcdef',
      pattern: 'Solid',
      texture: 'Matte',
      size: 1,
      proportions: { headRatio: 1, limbRatio: 1, tailRatio: 1 },
      features: [],
    },
    personality: {
      temperament: 'Calm',
      energy: 50,
      social: 50,
      curiosity: 50,
      discipline: 50,
      affection: 50,
      independence: 50,
      playfulness: 50,
      loyalty: 50,
      quirks: [],
    },
    latent: {
      evolutionPath,
      rareAbilities: [],
      potential: { physical: 50, mental: 50, social: 50 },
      hiddenGenes: [],
    },
    elementWeb: {
      usedResidues: [],
      pairSlots: [],
      frontierSlots: [],
      voidSlotsHit: [],
      coverage: 0.5,
      frontierAffinity: 0.5,
      bridgeCount: 1,
      voidDrift: 0.1,
    },
  } as DerivedTraits;
}

const HEX = /^#[0-9a-f]{6}$/i;

describe('shared stage palette', () => {
  it('returns real colours for every stage, with and without a genome', () => {
    for (const state of EVOLUTION_ORDER) {
      for (const traits of [null, traitsOnPath('Mystic Sage')]) {
        const palette = resolveStagePalette(state, traits);
        expect(palette.color, state).toMatch(HEX);
        expect(palette.accentColor, state).toMatch(HEX);
        expect(palette.glowColor, state).toMatch(HEX);
      }
    }
  });

  it('tints the apex with the genome branch, so two paths differ', () => {
    const sage = resolveStagePalette('SPECIATION', traitsOnPath('Mystic Sage'));
    const beast = resolveStagePalette('SPECIATION', traitsOnPath('Primal Beast'));
    expect(sage.color).not.toBe(beast.color);
  });

  it('never leaves an unaligned pet duller at the apex than mid-ladder', () => {
    // The `unaligned` branch's slate palette would otherwise take over the
    // apex entirely and read as a downgrade.
    const quantum = resolveStagePalette('QUANTUM', null);
    const apex = resolveStagePalette('SPECIATION', null);
    expect(apex.color).not.toBe(quantum.color);
    // Slate grey is the tell that the neutral branch leaked through.
    expect(['#94a3b8', '#64748b', '#475569']).not.toContain(apex.color);
    expect(['#94a3b8', '#64748b', '#475569']).not.toContain(apex.accentColor);
  });

  it('gives every stage a palette distinct from its neighbours', () => {
    const colors = EVOLUTION_ORDER.map(
      (state) => resolveStagePalette(state, traitsOnPath('Void Walker')).color
    );
    expect(new Set(colors).size).toBe(EVOLUTION_ORDER.length);
  });
});
