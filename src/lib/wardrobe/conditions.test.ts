import { describe, expect, it } from 'vitest';
import { ACHIEVEMENT_CATALOG } from '@/lib/progression/types';
import {
  HEPTACODE_ACHIEVEMENT_IDS,
  WARDROBE_CATALOG,
} from './catalog';
import {
  describeConditionProgress,
  describeUnlockCondition,
  evaluateUnlockCondition,
  formatDurationMs,
} from './conditions';
import {
  HIGH_ENERGY_THRESHOLD,
  createDefaultMetaPetProgress,
  type MetaPetProgress,
} from './progress';
import type { UnlockCondition } from './types';

function progressWith(
  mutate: (progress: MetaPetProgress) => void,
): MetaPetProgress {
  const progress = createDefaultMetaPetProgress();
  mutate(progress);
  return progress;
}

describe('evaluateUnlockCondition', () => {
  it('default conditions are always met', () => {
    const result = evaluateUnlockCondition(
      { type: 'default' },
      createDefaultMetaPetProgress(),
    );
    expect(result.met).toBe(true);
  });

  it('battle wins unlock exactly at the threshold', () => {
    const condition: UnlockCondition = { type: 'battle_wins', target: 50 };
    const below = progressWith((p) => {
      p.battle.wins = 49;
    });
    const at = progressWith((p) => {
      p.battle.wins = 50;
    });

    expect(evaluateUnlockCondition(condition, below)).toEqual({
      met: false,
      progress: 49,
      target: 50,
    });
    expect(evaluateUnlockCondition(condition, at).met).toBe(true);
  });

  it('vimana samples track collected totals', () => {
    const condition: UnlockCondition = { type: 'vimana_samples', target: 100 };
    const partial = progressWith((p) => {
      p.vimana.samplesCollected = 72;
    });
    expect(evaluateUnlockCondition(condition, partial)).toEqual({
      met: false,
      progress: 72,
      target: 100,
    });
    expect(
      evaluateUnlockCondition(
        condition,
        progressWith((p) => {
          p.vimana.samplesCollected = 100;
        }),
      ).met,
    ).toBe(true);
  });

  it('requireAllCells uses the live map size instead of the fallback', () => {
    const condition: UnlockCondition = {
      type: 'vimana_cells',
      target: 8,
      requireAllCells: true,
    };
    // Bigger live map: fallback of 8 must NOT unlock it.
    const bigMapPartial = progressWith((p) => {
      p.vimana.totalCells = 27;
      p.vimana.cellsExplored = 8;
    });
    expect(evaluateUnlockCondition(condition, bigMapPartial).met).toBe(false);
    expect(evaluateUnlockCondition(condition, bigMapPartial).target).toBe(27);

    const bigMapDone = progressWith((p) => {
      p.vimana.totalCells = 27;
      p.vimana.cellsExplored = 27;
    });
    expect(evaluateUnlockCondition(condition, bigMapDone).met).toBe(true);
  });

  it('evolution stage honours highest stage reached, not current stage', () => {
    const condition: UnlockCondition = {
      type: 'evolution_stage',
      stage: 'SPECIATION',
    };
    const regressed = progressWith((p) => {
      p.evolution.currentStage = 'NEURO';
      p.evolution.highestStageReached = 'SPECIATION';
    });
    expect(evaluateUnlockCondition(condition, regressed).met).toBe(true);
  });

  it('quantum stage also satisfied by later stages', () => {
    const condition: UnlockCondition = {
      type: 'evolution_stage',
      stage: 'QUANTUM',
    };
    const speciation = progressWith((p) => {
      p.evolution.highestStageReached = 'SPECIATION';
    });
    expect(evaluateUnlockCondition(condition, speciation).met).toBe(true);
  });

  it('achievement sets require every id when requireAll is set', () => {
    const condition: UnlockCondition = {
      type: 'achievement_set',
      achievementIds: ['a', 'b', 'c'],
      requireAll: true,
    };
    const partial = progressWith((p) => {
      p.achievements.unlockedIds = ['a', 'c'];
    });
    expect(evaluateUnlockCondition(condition, partial)).toEqual({
      met: false,
      progress: 2,
      target: 3,
    });

    const full = progressWith((p) => {
      p.achievements.unlockedIds = ['a', 'b', 'c', 'extra'];
    });
    expect(evaluateUnlockCondition(condition, full).met).toBe(true);
  });

  it('offspring counts unlock at the target', () => {
    const condition: UnlockCondition = { type: 'offspring_count', target: 5 };
    expect(
      evaluateUnlockCondition(
        condition,
        progressWith((p) => {
          p.breeding.offspringCount = 4;
        }),
      ).met,
    ).toBe(false);
    expect(
      evaluateUnlockCondition(
        condition,
        progressWith((p) => {
          p.breeding.offspringCount = 5;
        }),
      ).met,
    ).toBe(true);
  });

  it('sustained energy uses the best recorded duration', () => {
    const condition: UnlockCondition = {
      type: 'sustained_stat',
      stat: 'energy',
      minimum: HIGH_ENERGY_THRESHOLD,
      durationMs: 3_600_000,
    };
    const partial = progressWith((p) => {
      p.sustainedConditions.longestHighEnergyDurationMs = 2_538_000;
    });
    const result = evaluateUnlockCondition(condition, partial);
    expect(result.met).toBe(false);
    expect(result.progress).toBe(2_538_000);

    const done = progressWith((p) => {
      p.sustainedConditions.longestHighEnergyDurationMs = 3_600_000;
    });
    expect(evaluateUnlockCondition(condition, done).met).toBe(true);
  });

  it('composite all/any conditions combine correctly', () => {
    const composite: UnlockCondition = {
      type: 'all',
      conditions: [
        { type: 'battle_wins', target: 1 },
        { type: 'minigames_completed', target: 1 },
      ],
    };
    const oneOfTwo = progressWith((p) => {
      p.battle.wins = 1;
    });
    expect(evaluateUnlockCondition(composite, oneOfTwo)).toEqual({
      met: false,
      progress: 1,
      target: 2,
    });

    const anyCondition: UnlockCondition = { ...composite, type: 'any' };
    expect(evaluateUnlockCondition(anyCondition, oneOfTwo).met).toBe(true);
  });
});

describe('describeUnlockCondition', () => {
  it('generates text for every catalogue item (no hand-written drift)', () => {
    for (const item of WARDROBE_CATALOG) {
      const text = describeUnlockCondition(item.unlockCondition);
      expect(text.length).toBeGreaterThan(0);
    }
  });

  it('embeds structured targets in generated text', () => {
    expect(
      describeUnlockCondition({ type: 'battle_wins', target: 50 }),
    ).toContain('50');
    expect(
      describeUnlockCondition({
        type: 'sustained_stat',
        stat: 'energy',
        minimum: 90,
        durationMs: 3_600_000,
      }),
    ).toContain('90');
  });

  it('formats durations naturally', () => {
    expect(formatDurationMs(3_600_000)).toBe('1h');
    expect(formatDurationMs(2_538_000)).toBe('42m 18s');
    expect(formatDurationMs(0)).toBe('0s');
  });

  it('reports live progress lines for locked items', () => {
    const progress = progressWith((p) => {
      p.battle.wins = 31;
    });
    expect(
      describeConditionProgress({ type: 'battle_wins', target: 50 }, progress),
    ).toBe('31 / 50 battle wins');
  });
});

describe('wardrobe catalogue integrity', () => {
  it('has unique item ids', () => {
    const ids = WARDROBE_CATALOG.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('anchors every achievement_set condition to real achievement ids', () => {
    const known = new Set(ACHIEVEMENT_CATALOG.map((a) => a.id));
    for (const id of HEPTACODE_ACHIEVEMENT_IDS) {
      expect(known.has(id)).toBe(true);
    }
  });

  it('keeps sustained conditions within what the tracker records', () => {
    for (const item of WARDROBE_CATALOG) {
      if (item.unlockCondition.type === 'sustained_stat') {
        expect(item.unlockCondition.stat).toBe('energy');
        expect(item.unlockCondition.minimum).toBe(HIGH_ENERGY_THRESHOLD);
      }
    }
  });

  it('places every item in a valid slot with visual data', () => {
    for (const item of WARDROBE_CATALOG) {
      expect(item.visualData.color).toBeTruthy();
      expect(item.visualData.anchor).toBeTruthy();
    }
  });
});
