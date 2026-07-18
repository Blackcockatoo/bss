import { describe, expect, it } from 'vitest';
import {
  CRYSTAL_HORNS_SAMPLE_TARGET,
  SACRED_HALO_BATTLE_WINS,
  STARFIELD_MINIGAME_TARGET,
} from './catalog';
import { evaluateWardrobeUnlocks } from './evaluator';
import {
  createDefaultMetaPetProgress,
  type MetaPetProgress,
} from './progress';

function progressWith(
  mutate: (progress: MetaPetProgress) => void,
): MetaPetProgress {
  const progress = createDefaultMetaPetProgress();
  mutate(progress);
  return progress;
}

const emptyInventory = { ownedItemIds: [] as string[] };

describe('evaluateWardrobeUnlocks', () => {
  it('grants only the default item on a fresh profile', () => {
    const result = evaluateWardrobeUnlocks(
      createDefaultMetaPetProgress(),
      createDefaultMetaPetProgress(),
      emptyInventory,
    );
    expect(result.newlyUnlocked).toEqual(['effect-sparkle']);
    expect(result.alreadyOwned).toEqual([]);
    expect(result.unmet.length).toBeGreaterThan(0);
  });

  it('unlocks the Sacred Halo at the battle-win threshold and not before', () => {
    const below = progressWith((p) => {
      p.battle.wins = SACRED_HALO_BATTLE_WINS - 1;
    });
    expect(
      evaluateWardrobeUnlocks(below, below, emptyInventory).newlyUnlocked,
    ).not.toContain('halo-sacred');

    const at = progressWith((p) => {
      p.battle.wins = SACRED_HALO_BATTLE_WINS;
    });
    expect(
      evaluateWardrobeUnlocks(at, at, emptyInventory).newlyUnlocked,
    ).toContain('halo-sacred');
  });

  it('unlocks Crystal Horns at the sample threshold', () => {
    const at = progressWith((p) => {
      p.vimana.samplesCollected = CRYSTAL_HORNS_SAMPLE_TARGET;
    });
    expect(
      evaluateWardrobeUnlocks(at, at, emptyInventory).newlyUnlocked,
    ).toContain('horns-crystal');
  });

  it('unlocks the Void Aura only when every live cell is explored', () => {
    const partial = progressWith((p) => {
      p.vimana.totalCells = 8;
      p.vimana.cellsExplored = 7;
    });
    expect(
      evaluateWardrobeUnlocks(partial, partial, emptyInventory).newlyUnlocked,
    ).not.toContain('aura-void');

    const complete = progressWith((p) => {
      p.vimana.totalCells = 8;
      p.vimana.cellsExplored = 8;
    });
    expect(
      evaluateWardrobeUnlocks(complete, complete, emptyInventory).newlyUnlocked,
    ).toContain('aura-void');
  });

  it('unlocks the Starfield Pattern after enough completed mini-games', () => {
    const at = progressWith((p) => {
      p.miniGames.totalCompleted = STARFIELD_MINIGAME_TARGET;
    });
    expect(
      evaluateWardrobeUnlocks(at, at, emptyInventory).newlyUnlocked,
    ).toContain('pattern-stars');
  });

  it('unlocks stage cosmetics from highest stage reached', () => {
    const quantum = progressWith((p) => {
      p.evolution.highestStageReached = 'QUANTUM';
    });
    const quantumResult = evaluateWardrobeUnlocks(
      quantum,
      quantum,
      emptyInventory,
    );
    expect(quantumResult.newlyUnlocked).toContain('effect-quantum');
    expect(quantumResult.newlyUnlocked).not.toContain('crown-gold');

    const speciation = progressWith((p) => {
      p.evolution.highestStageReached = 'SPECIATION';
    });
    expect(
      evaluateWardrobeUnlocks(speciation, speciation, emptyInventory)
        .newlyUnlocked,
    ).toContain('crown-gold');
  });

  it('unlocks the Rainbow Aura at five offspring', () => {
    const at = progressWith((p) => {
      p.breeding.offspringCount = 5;
    });
    expect(
      evaluateWardrobeUnlocks(at, at, emptyInventory).newlyUnlocked,
    ).toContain('aura-rainbow');
  });

  it('never re-grants an owned item, even when the stat later falls', () => {
    const dropped = progressWith((p) => {
      p.battle.wins = 3; // well below the halo threshold
    });
    const inventory = { ownedItemIds: ['halo-sacred', 'effect-sparkle'] };
    const result = evaluateWardrobeUnlocks(dropped, dropped, inventory);

    expect(result.alreadyOwned).toContain('halo-sacred');
    expect(result.newlyUnlocked).not.toContain('halo-sacred');
    // The evaluator has no removal channel at all.
    expect(result).not.toHaveProperty('revoked');
  });

  it('reports unmet items with progress toward their targets', () => {
    const partial = progressWith((p) => {
      p.battle.wins = 31;
    });
    const result = evaluateWardrobeUnlocks(partial, partial, emptyInventory);
    const halo = result.unmet.find((entry) => entry.itemId === 'halo-sacred');
    expect(halo).toEqual({
      itemId: 'halo-sacred',
      progress: 31,
      target: SACRED_HALO_BATTLE_WINS,
    });
  });
});
