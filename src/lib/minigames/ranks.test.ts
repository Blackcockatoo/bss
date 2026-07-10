import { describe, expect, it } from 'vitest';

import {
  createDefaultMiniGameProgress,
  getMasteryStars,
  getTotalMasteryStars,
} from '../../progression/types';
import { getGameDifficulty } from './gameMath';
import {
  applyRankToDifficulty,
  getGrade,
  getRankUnlockHint,
  getUnlockedRanks,
  highestUnlockedRank,
  isRankUnlocked,
  RANK_INFO,
  RANK_ORDER,
} from './ranks';

describe('rank unlock gates', () => {
  it('only calm is open for a fresh pet', () => {
    const progress = createDefaultMiniGameProgress();
    for (const game of ['memory', 'rhythm', 'sigil', 'vimana'] as const) {
      expect(getUnlockedRanks(game, progress)).toEqual(['calm']);
      expect(highestUnlockedRank(game, progress)).toBe('calm');
    }
  });

  it('unlocks memory ranks from best round', () => {
    const progress = createDefaultMiniGameProgress({ shuffleBestRound: 6 });
    expect(isRankUnlocked('memory', 'flow', progress)).toBe(true);
    expect(isRankUnlocked('memory', 'surge', progress)).toBe(true);
    expect(isRankUnlocked('memory', 'mythic', progress)).toBe(false);
  });

  it('rhythm mythic needs both accuracy and combo', () => {
    const accuracyOnly = createDefaultMiniGameProgress({ pulseBestAccuracy: 95 });
    expect(isRankUnlocked('rhythm', 'mythic', accuracyOnly)).toBe(false);
    const both = createDefaultMiniGameProgress({
      pulseBestAccuracy: 95,
      pulseBestCombo: 10,
    });
    expect(isRankUnlocked('rhythm', 'mythic', both)).toBe(true);
  });

  it('provides a human unlock hint for every locked rank', () => {
    for (const game of ['memory', 'rhythm', 'sigil', 'vimana'] as const) {
      for (const rank of ['flow', 'surge', 'mythic'] as const) {
        expect(getRankUnlockHint(game, rank).length).toBeGreaterThan(0);
      }
    }
  });

  it('score multipliers rise monotonically with rank', () => {
    const mults = RANK_ORDER.map((rank) => RANK_INFO[rank].scoreMult);
    for (let i = 1; i < mults.length; i++) {
      expect(mults[i]).toBeGreaterThan(mults[i - 1]);
    }
  });
});

describe('applyRankToDifficulty', () => {
  const base = getGameDifficulty({ state: 'NEURO', level: 5 });

  it('calm leaves the evolution baseline untouched', () => {
    expect(applyRankToDifficulty(base, 'calm')).toEqual(base);
  });

  it('mythic hardens every game beyond the baseline', () => {
    const mythic = applyRankToDifficulty(base, 'mythic');
    expect(mythic.memory.startLength).toBeGreaterThan(base.memory.startLength);
    expect(mythic.memory.showMs).toBeLessThan(base.memory.showMs);
    expect(mythic.memory.focusShards).toBe(1);
    expect(mythic.rhythm.bpm).toBeGreaterThan(base.rhythm.bpm);
    expect(mythic.rhythm.perfectWindow).toBeLessThan(base.rhythm.perfectWindow);
    expect(mythic.sigil.questions).toBeGreaterThan(base.sigil.questions);
    expect(mythic.vimana.startLevel).toBeGreaterThan(base.vimana.startLevel);
  });
});

describe('grades', () => {
  it('grades memory by rounds completed', () => {
    expect(getGrade({ game: 'memory', score: 40, roundsCompleted: 9 })).toBe('S');
    expect(getGrade({ game: 'memory', score: 10, roundsCompleted: 3 })).toBe('C');
    expect(getGrade({ game: 'memory', score: 0, roundsCompleted: 0 })).toBe('D');
  });

  it('grades rhythm and sigil by accuracy', () => {
    expect(getGrade({ game: 'rhythm', score: 30, accuracy: 95 })).toBe('S');
    expect(getGrade({ game: 'sigil', score: 90, accuracy: 100 })).toBe('S');
    expect(getGrade({ game: 'sigil', score: 50, accuracy: 75 })).toBe('B');
  });

  it('grades vimana by lines cleared', () => {
    expect(getGrade({ game: 'vimana', score: 3000, lines: 22 })).toBe('S');
    expect(getGrade({ game: 'vimana', score: 100, lines: 1 })).toBe('D');
  });
});

describe('mastery stars', () => {
  it('a fresh pet has zero stars', () => {
    expect(getTotalMasteryStars(createDefaultMiniGameProgress())).toBe(0);
  });

  it('awards stars per threshold crossed', () => {
    const progress = createDefaultMiniGameProgress({
      shuffleBestRound: 6,
      pulseBestAccuracy: 95,
      sigilTotalCorrect: 45,
      vimanaMaxLines: 8,
    });
    expect(getMasteryStars(progress, 'memory')).toBe(3);
    expect(getMasteryStars(progress, 'rhythm')).toBe(5);
    expect(getMasteryStars(progress, 'sigil')).toBe(3);
    expect(getMasteryStars(progress, 'vimana')).toBe(2);
    expect(getTotalMasteryStars(progress)).toBe(13);
  });

  it('caps at 20 stars total', () => {
    const maxed = createDefaultMiniGameProgress({
      shuffleBestRound: 99,
      pulseBestAccuracy: 100,
      sigilTotalCorrect: 999,
      vimanaMaxLines: 99,
    });
    expect(getTotalMasteryStars(maxed)).toBe(20);
  });
});
