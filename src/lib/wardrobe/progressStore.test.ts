import { beforeEach, describe, expect, it } from 'vitest';
import {
  HIGH_ENERGY_THRESHOLD,
  createDefaultMetaPetProgress,
  mergeLiveSnapshot,
  sanitizeMetaPetProgress,
  type LiveProgressSnapshot,
} from './progress';
import {
  SUSTAINED_RESUME_GRACE_MS,
  WARDROBE_PROGRESS_STORAGE_KEY,
  useWardrobeProgressStore,
} from './progressStore';

function resetProgressStore() {
  localStorage.removeItem(WARDROBE_PROGRESS_STORAGE_KEY);
  useWardrobeProgressStore.setState({
    progress: createDefaultMetaPetProgress(),
  });
}

function emptySnapshot(): LiveProgressSnapshot {
  return {
    evolutionStage: 'GENETICS',
    battle: { wins: 0, losses: 0 },
    vimana: {
      samplesCollected: 0,
      cellsExplored: 0,
      anomaliesResolved: 0,
      totalCells: 0,
      discoveredIds: [],
    },
    miniGames: { totalCompleted: 0, uniqueGamesCompleted: [] },
    achievementIds: [],
  };
}

describe('sanitizeMetaPetProgress', () => {
  it('normalizes garbage into a complete record', () => {
    expect(sanitizeMetaPetProgress(null)).toEqual(
      createDefaultMetaPetProgress(),
    );
    expect(sanitizeMetaPetProgress('corrupted')).toEqual(
      createDefaultMetaPetProgress(),
    );

    const partial = sanitizeMetaPetProgress({
      battle: { wins: '12', losses: -4 },
      vimana: { samplesCollected: 33.7 },
      achievements: { unlockedIds: ['a', 42, 'a', 'b'] },
    });
    expect(partial.battle.wins).toBe(0); // non-numeric rejected
    expect(partial.battle.losses).toBe(0); // negative rejected
    expect(partial.vimana.samplesCollected).toBe(33);
    expect(partial.achievements.unlockedIds).toEqual(['a', 'b']);
  });

  it('repairs a highest stage that lags the current stage', () => {
    const repaired = sanitizeMetaPetProgress({
      evolution: { currentStage: 'QUANTUM', highestStageReached: 'GENETICS' },
    });
    expect(repaired.evolution.highestStageReached).toBe('QUANTUM');
  });
});

describe('mergeLiveSnapshot', () => {
  it('is monotonic: a reset live store cannot erase persisted progress', () => {
    const persisted = createDefaultMetaPetProgress();
    persisted.battle.wins = 40;
    persisted.vimana.samplesCollected = 90;
    persisted.evolution.highestStageReached = 'QUANTUM';
    persisted.achievements.unlockedIds = ['battle-first-win'];

    const merged = mergeLiveSnapshot(persisted, emptySnapshot());
    expect(merged.battle.wins).toBe(40);
    expect(merged.vimana.samplesCollected).toBe(90);
    expect(merged.evolution.highestStageReached).toBe('QUANTUM');
    expect(merged.achievements.unlockedIds).toContain('battle-first-win');
  });

  it('advances counters and stage from live play', () => {
    const snapshot = emptySnapshot();
    snapshot.battle.wins = 3;
    snapshot.evolutionStage = 'NEURO';
    snapshot.vimana.discoveredIds = ['calm-1'];

    const merged = mergeLiveSnapshot(createDefaultMetaPetProgress(), snapshot);
    expect(merged.battle.wins).toBe(3);
    expect(merged.evolution.currentStage).toBe('NEURO');
    expect(merged.evolution.highestStageReached).toBe('NEURO');
    expect(merged.discoveries.discoveredIds).toContain('calm-1');
  });

  it('returns the same reference when nothing changed', () => {
    const progress = createDefaultMetaPetProgress();
    expect(mergeLiveSnapshot(progress, emptySnapshot())).toBe(progress);
  });
});

describe('useWardrobeProgressStore', () => {
  beforeEach(resetProgressStore);

  it('counts care actions', () => {
    const store = useWardrobeProgressStore.getState();
    store.recordCareAction('feed');
    store.recordCareAction('feed');
    store.recordCareAction('play');

    const care = useWardrobeProgressStore.getState().progress.care;
    expect(care.totalFeeds).toBe(2);
    expect(care.totalPlaySessions).toBe(1);
  });

  it('keeps offspring count monotonic', () => {
    const store = useWardrobeProgressStore.getState();
    store.setOffspringCount(3);
    store.setOffspringCount(1); // guardian save shrank — ignore
    expect(
      useWardrobeProgressStore.getState().progress.breeding.offspringCount,
    ).toBe(3);
  });

  it('persists progress under the wardrobe storage key', () => {
    useWardrobeProgressStore.getState().recordCareAction('clean');
    const raw = localStorage.getItem(WARDROBE_PROGRESS_STORAGE_KEY);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string).state.progress.care.totalCleans).toBe(1);
  });

  describe('sustained energy tracking', () => {
    const T0 = 1_700_000_000_000;
    const high = HIGH_ENERGY_THRESHOLD;

    it('accumulates duration across continuous high-energy observations', () => {
      const store = useWardrobeProgressStore.getState();
      store.observeEnergy(high, T0);
      store.observeEnergy(high + 5, T0 + 30_000);
      store.observeEnergy(high, T0 + 60_000);

      const sustained =
        useWardrobeProgressStore.getState().progress.sustainedConditions;
      expect(sustained.highEnergyStartedAt).toBe(T0);
      expect(sustained.longestHighEnergyDurationMs).toBe(60_000);
    });

    it('resets the active run when energy drops, keeping the best duration', () => {
      const store = useWardrobeProgressStore.getState();
      store.observeEnergy(high, T0);
      store.observeEnergy(high, T0 + 45_000);
      store.observeEnergy(high - 10, T0 + 50_000); // interruption

      let sustained =
        useWardrobeProgressStore.getState().progress.sustainedConditions;
      expect(sustained.highEnergyStartedAt).toBeUndefined();
      expect(sustained.longestHighEnergyDurationMs).toBe(45_000);

      // A later, shorter run never lowers the best duration.
      store.observeEnergy(high, T0 + 100_000);
      store.observeEnergy(high, T0 + 110_000);
      sustained =
        useWardrobeProgressStore.getState().progress.sustainedConditions;
      expect(sustained.longestHighEnergyDurationMs).toBe(45_000);
    });

    it('survives a quick refresh but not a long unobserved gap', () => {
      const store = useWardrobeProgressStore.getState();
      store.observeEnergy(high, T0);
      // Quick refresh: next observation inside the grace window continues.
      store.observeEnergy(high, T0 + SUSTAINED_RESUME_GRACE_MS - 1_000);
      expect(
        useWardrobeProgressStore.getState().progress.sustainedConditions
          .highEnergyStartedAt,
      ).toBe(T0);

      // Long absence: run resets and only observed time is credited.
      store.observeEnergy(high, T0 + SUSTAINED_RESUME_GRACE_MS + 600_000);
      const sustained =
        useWardrobeProgressStore.getState().progress.sustainedConditions;
      expect(sustained.highEnergyStartedAt).toBe(
        T0 + SUSTAINED_RESUME_GRACE_MS + 600_000,
      );
      expect(sustained.longestHighEnergyDurationMs).toBe(
        SUSTAINED_RESUME_GRACE_MS - 1_000,
      );
    });

    it('does not award time when the clock moves backwards', () => {
      const store = useWardrobeProgressStore.getState();
      store.observeEnergy(high, T0);
      store.observeEnergy(high, T0 - 3_600_000); // clock rolled back
      const sustained =
        useWardrobeProgressStore.getState().progress.sustainedConditions;
      expect(sustained.longestHighEnergyDurationMs).toBe(0);
      expect(sustained.highEnergyStartedAt).toBe(T0 - 3_600_000);
    });

    it('never starts a run below the threshold', () => {
      useWardrobeProgressStore.getState().observeEnergy(high - 1, T0);
      expect(
        useWardrobeProgressStore.getState().progress.sustainedConditions
          .highEnergyStartedAt,
      ).toBeUndefined();
    });
  });
});
