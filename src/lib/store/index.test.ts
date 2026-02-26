import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './index';
import { initializeEvolution } from '@/lib/evolution';
import type { Genome, DerivedTraits } from '@/lib/genome';
import { summarizeElementWeb } from '@/lib/genome';
import {
  createDefaultBattleStats,
  createDefaultMiniGameProgress,
  createDefaultVimanaState,
} from '@/lib/progression/types';

type TraitOverrides = {
  physical?: Partial<DerivedTraits['physical']>;
  personality?: Partial<DerivedTraits['personality']>;
  latent?:
    | (Partial<Omit<DerivedTraits['latent'], 'potential' | 'hiddenGenes'>> & {
        potential?: Partial<DerivedTraits['latent']['potential']>;
        hiddenGenes?: number[];
      });
  elementWeb?: Partial<DerivedTraits['elementWeb']>;
};

const createMockGenome = (seed = 0): Genome => ({
  red60: Array.from({ length: 60 }, (_, index) => (seed + index) % 7),
  blue60: Array.from({ length: 60 }, (_, index) => (seed + index + 1) % 7),
  black60: Array.from({ length: 60 }, (_, index) => (seed + index + 2) % 7),
});

const createMockTraits = (overrides: TraitOverrides = {}): DerivedTraits => {
  const baseGenome = createMockGenome();
  const base: DerivedTraits = {
    physical: {
      bodyType: 'Spherical',
      primaryColor: '#FF6B6B',
      secondaryColor: '#C44569',
      pattern: 'Solid',
      texture: 'Smooth',
      size: 1,
      proportions: { headRatio: 0.34, limbRatio: 0.33, tailRatio: 0.33 },
      features: ['Horns'],
    },
    personality: {
      temperament: 'Playful',
      energy: 80,
      social: 70,
      curiosity: 90,
      discipline: 65,
      affection: 75,
      independence: 45,
      playfulness: 85,
      loyalty: 68,
      quirks: ['Bouncy'],
    },
    latent: {
      evolutionPath: 'Light Bringer',
      rareAbilities: ['Telepathy'],
      potential: { physical: 82, mental: 78, social: 76 },
      hiddenGenes: Array.from({ length: 15 }, () => 0),
    },
    elementWeb: summarizeElementWeb(baseGenome),
  };

  const latentOverrides = overrides.latent ?? {};

  return {
    physical: { ...base.physical, ...overrides.physical },
    personality: { ...base.personality, ...overrides.personality },
    latent: {
      ...base.latent,
      ...latentOverrides,
      potential: {
        ...base.latent.potential,
        ...(latentOverrides.potential ?? {}),
      },
      hiddenGenes: latentOverrides.hiddenGenes ?? base.latent.hiddenGenes,
    },
    elementWeb: { ...base.elementWeb, ...(overrides.elementWeb ?? {}) },
  };
};

describe('Store State Management', () => {
  // Reset store before each test
  beforeEach(() => {
    useStore.setState({
      vitals: {
        hunger: 50,
        hygiene: 50,
        mood: 50,
        energy: 50,
        isSick: false,
        sicknessSeverity: 0,
        sicknessType: 'none',
        deathCount: 0,
      },
      genome: null,
      traits: null,
      evolution: initializeEvolution(),
      essence: 0,
      achievements: [],
      battle: createDefaultBattleStats(),
      miniGames: createDefaultMiniGameProgress(),
      vimana: createDefaultVimanaState(),
    });
  });

  describe('Initial State', () => {
    it('should have initial vitals', () => {
      const state = useStore.getState();

      expect(state.vitals.hunger).toBeDefined();
      expect(state.vitals.hygiene).toBeDefined();
      expect(state.vitals.mood).toBeDefined();
      expect(state.vitals.energy).toBeDefined();
    });

    it('should have initialized evolution', () => {
      const state = useStore.getState();

      expect(state.evolution).toBeDefined();
      expect(state.evolution.state).toBe('GENETICS');
    });

    it('should have empty genome initially', () => {
      const state = useStore.getState();

      expect(state.genome).toBeNull();
      expect(state.traits).toBeNull();
    });

    it('should have empty achievements initially', () => {
      const state = useStore.getState();

      expect(state.achievements).toEqual([]);
    });
  });

  describe('Vitals Actions', () => {
    it('should increase hunger when feed is called', () => {
      const initialHunger = useStore.getState().vitals.hunger;

      useStore.getState().feed();

      const newHunger = useStore.getState().vitals.hunger;
      expect(newHunger).toBeGreaterThan(initialHunger);
    });

    it('should increase hygiene when clean is called', () => {
      const initialHygiene = useStore.getState().vitals.hygiene;

      useStore.getState().clean();

      const newHygiene = useStore.getState().vitals.hygiene;
      expect(newHygiene).toBeGreaterThan(initialHygiene);
    });

    it('should increase mood when play is called', () => {
      const initialMood = useStore.getState().vitals.mood;

      useStore.getState().play();

      const newMood = useStore.getState().vitals.mood;
      expect(newMood).toBeGreaterThan(initialMood);
    });

    it('should increase energy when sleep is called', () => {
      const initialEnergy = useStore.getState().vitals.energy;

      useStore.getState().sleep();

      const newEnergy = useStore.getState().vitals.energy;
      expect(newEnergy).toBeGreaterThan(initialEnergy);
    });

    it('should clamp vitals at 100', () => {
      // Set hunger very high
      useStore.setState({ vitals: { ...useStore.getState().vitals, hunger: 95 } });

      useStore.getState().feed();

      const hunger = useStore.getState().vitals.hunger;
      expect(hunger).toBeLessThanOrEqual(100);
    });
  });

  describe('Genome Management', () => {
    it('should set genome and traits', () => {
      const testGenome: Genome = createMockGenome(1);
      const testTraits: DerivedTraits = createMockTraits();

      useStore.getState().setGenome(testGenome, testTraits);

      const state = useStore.getState();
      expect(state.genome).toEqual(testGenome);
      expect(state.traits).toEqual(testTraits);
    });
  });

  describe('Evolution System', () => {
    it('should not evolve when requirements are not met', () => {
      const result = useStore.getState().tryEvolve();

      expect(result).toBe(false);
      expect(useStore.getState().evolution.state).toBe('GENETICS');
    });

    it('should evolve when requirements are met', () => {
      // Set up evolution that meets all requirements for NEURO
      // NEURO requires minLevel: 5, minInteractions: 12, minVitalsAverage: 55
      useStore.setState({
        evolution: {
          state: 'GENETICS',
          birthTime: Date.now() - 100_000_000, // Very old
          lastEvolutionTime: Date.now() - 100_000_000,
          experience: 100,
          level: 5, // NEURO requires minLevel: 5
          currentLevelXp: 0,
          totalXp: 100,
          totalInteractions: 100,
          canEvolve: true,
        },
        vitals: {
          hunger: 80,
          hygiene: 80,
          mood: 80,
          energy: 80,
          isSick: false,
          sicknessSeverity: 0,
          sicknessType: 'none',
          deathCount: 0,
        },
      });

      const result = useStore.getState().tryEvolve();

      expect(result).toBe(true);
      expect(useStore.getState().evolution.state).toBe('NEURO');
    });
  });

  describe('Battle System', () => {
    it('should record battle win', () => {
      useStore.getState().recordBattle('win', 'TestOpponent');

      const battle = useStore.getState().battle;
      expect(battle.wins).toBe(1);
      expect(battle.losses).toBe(0);
      expect(battle.lastResult).toBe('win');
      expect(battle.lastOpponent).toBe('TestOpponent');
      expect(battle.streak).toBe(1);
    });

    it('should record battle loss', () => {
      useStore.getState().recordBattle('loss', 'StrongOpponent');

      const battle = useStore.getState().battle;
      expect(battle.wins).toBe(0);
      expect(battle.losses).toBe(1);
      expect(battle.lastResult).toBe('loss');
      expect(battle.streak).toBe(0);
    });

    it('should increase energy shield on win', () => {
      // Set shield to a lower value so it can increase (default is 100, which is max)
      useStore.setState({
        battle: {
          ...useStore.getState().battle,
          energyShield: 50,
        },
      });

      const initialShield = useStore.getState().battle.energyShield;

      useStore.getState().recordBattle('win', 'Opponent1');

      const newShield = useStore.getState().battle.energyShield;
      expect(newShield).toBeGreaterThan(initialShield);
      expect(newShield).toBe(55); // 50 + 5
    });

    it('should decrease energy shield on loss', () => {
      const initialShield = useStore.getState().battle.energyShield;

      useStore.getState().recordBattle('loss', 'Opponent1');

      const newShield = useStore.getState().battle.energyShield;
      expect(newShield).toBeLessThan(initialShield);
    });

    it('should track win streak', () => {
      useStore.getState().recordBattle('win', 'Opponent1');
      useStore.getState().recordBattle('win', 'Opponent2');
      useStore.getState().recordBattle('win', 'Opponent3');

      const battle = useStore.getState().battle;
      expect(battle.streak).toBe(3);
    });

    it('should reset streak on loss', () => {
      useStore.getState().recordBattle('win', 'Opponent1');
      useStore.getState().recordBattle('win', 'Opponent2');
      useStore.getState().recordBattle('loss', 'Opponent3');

      const battle = useStore.getState().battle;
      expect(battle.streak).toBe(0);
    });

    it('should unlock achievement on first win', () => {
      useStore.getState().recordBattle('win', 'FirstOpponent');

      const achievements = useStore.getState().achievements;
      const hasFirstWin = achievements.some(a => a.id === 'battle-first-win');
      expect(hasFirstWin).toBe(true);
    });

    it('should unlock streak achievement on 3+ win streak', () => {
      useStore.getState().recordBattle('win', 'Opponent1');
      useStore.getState().recordBattle('win', 'Opponent2');
      useStore.getState().recordBattle('win', 'Opponent3');

      const achievements = useStore.getState().achievements;
      const hasStreak = achievements.some(a => a.id === 'battle-streak');
      expect(hasStreak).toBe(true);
    });
  });

  describe('Mini-Games', () => {
    it('should update memory high score', () => {
      useStore.getState().updateMiniGameScore('memory', 8);

      const miniGames = useStore.getState().miniGames;
      expect(miniGames.memoryHighScore).toBe(8);
    });

    it('should update rhythm high score', () => {
      useStore.getState().updateMiniGameScore('rhythm', 15);

      const miniGames = useStore.getState().miniGames;
      expect(miniGames.rhythmHighScore).toBe(15);
    });

    it('should only update high score if new score is higher', () => {
      useStore.getState().updateMiniGameScore('memory', 10);
      useStore.getState().updateMiniGameScore('memory', 5);

      const miniGames = useStore.getState().miniGames;
      expect(miniGames.memoryHighScore).toBe(10);
    });

    it('should update lastPlayedAt timestamp', () => {
      const before = Date.now();
      useStore.getState().updateMiniGameScore('memory', 5);
      const after = Date.now();

      const miniGames = useStore.getState().miniGames;
      expect(miniGames.lastPlayedAt).toBeGreaterThanOrEqual(before);
      expect(miniGames.lastPlayedAt).toBeLessThanOrEqual(after);
    });

    it('should unlock memory achievement at score 10', () => {
      useStore.getState().updateMiniGameScore('memory', 10);

      const achievements = useStore.getState().achievements;
      const hasMemory = achievements.some(a => a.id === 'minigame-memory');
      expect(hasMemory).toBe(true);
    });

    it('should unlock rhythm achievement at score 12', () => {
      useStore.getState().updateMiniGameScore('rhythm', 12);

      const achievements = useStore.getState().achievements;
      const hasRhythm = achievements.some(a => a.id === 'minigame-rhythm');
      expect(hasRhythm).toBe(true);
    });

    it('should unlock additional achievable mini-game milestones', () => {
      useStore.getState().updateMiniGameScore('memory', 20);
      useStore.getState().updateMiniGameScore('rhythm', 20);
      useStore.getState().recordVimanaRun(1200, 10, 5);
      useStore.getState().recordVimanaRun(1300, 11, 5);
      useStore.getState().recordVimanaRun(1400, 12, 5);
      useStore.getState().recordVimanaRun(1500, 13, 5);
      useStore.getState().recordVimanaRun(1600, 14, 5);

      const achievements = useStore.getState().achievements;
      expect(achievements.some(a => a.id === 'minigame-memory-ace')).toBe(true);
      expect(achievements.some(a => a.id === 'minigame-rhythm-ace')).toBe(true);
      expect(achievements.some(a => a.id === 'minigame-vimana-level')).toBe(true);
      expect(achievements.some(a => a.id === 'minigame-focus-streak')).toBe(true);
    });

    it('should accumulate Space Jewbles metrics across runs', () => {
      useStore.getState().recordSpaceJewblesRun(1200, 4, 1, 0);
      useStore.getState().recordSpaceJewblesRun(2200, 7, 2, 1);

      const miniGames = useStore.getState().miniGames;
      expect(miniGames.spaceJewblesRunsPlayed).toBe(2);
      expect(miniGames.spaceJewblesTotalScore).toBe(3400);
      expect(miniGames.spaceJewblesTotalWaves).toBe(11);
      expect(miniGames.spaceJewblesHighScore).toBe(2200);
      expect(miniGames.spaceJewblesMaxWave).toBe(7);
      expect(miniGames.spaceJewblesBossesDefeated).toBe(3);
      expect(miniGames.spaceJewblesMythicDrops).toBe(1);
    });

    it('should sanitize negative Space Jewbles values before updating metrics', () => {
      useStore.getState().recordSpaceJewblesRun(-100, -5, -2, -1);

      const miniGames = useStore.getState().miniGames;
      expect(miniGames.spaceJewblesLastScore).toBe(0);
      expect(miniGames.spaceJewblesLastWave).toBe(0);
      expect(miniGames.spaceJewblesBossesDefeated).toBe(0);
      expect(miniGames.spaceJewblesMythicDrops).toBe(0);
      expect(miniGames.spaceJewblesTotalScore).toBe(0);
      expect(miniGames.spaceJewblesTotalWaves).toBe(0);
    });
  });

  describe('Hydration', () => {
    it('should hydrate state from saved data', () => {
      const savedData = {
        vitals: {
          hunger: 75,
          hygiene: 85,
          mood: 90,
          energy: 65,
          isSick: false,
          sicknessSeverity: 0,
          sicknessType: 'none' as const,
          deathCount: 0,
        },
        genome: createMockGenome(2),
        traits: createMockTraits({
          physical: {
            bodyType: 'Cubic',
            primaryColor: '#4ECDC4',
            secondaryColor: '#3B3B98',
            pattern: 'Striped',
            texture: 'Fuzzy',
            size: 1.5,
            proportions: { headRatio: 0.4, limbRatio: 0.3, tailRatio: 0.3 },
            features: ['Wings'],
          },
          personality: {
            temperament: 'Calm',
            energy: 60,
            social: 80,
            curiosity: 70,
            discipline: 85,
            affection: 90,
            independence: 35,
            playfulness: 55,
            loyalty: 92,
            quirks: ['Gentle'],
          },
          latent: {
            evolutionPath: 'Harmony Guardian',
            rareAbilities: ['Healing'],
            potential: { physical: 88, mental: 90, social: 84 },
            hiddenGenes: Array.from({ length: 15 }, () => 2),
          },
        }),
        evolution: {
          state: 'NEURO' as const,
          birthTime: 1000000,
          lastEvolutionTime: 2000000,
          experience: 50,
          level: 5,
          currentLevelXp: 0,
          totalXp: 150,
          totalInteractions: 75,
          canEvolve: false,
        },
      };

      useStore.getState().hydrate(savedData);

      const state = useStore.getState();
      expect(state.vitals).toEqual(savedData.vitals);
      expect(state.genome).toEqual(savedData.genome);
      expect(state.traits).toEqual(savedData.traits);
      expect(state.evolution).toEqual(savedData.evolution);
    });

    it('should preserve tickId during hydration', () => {
      useStore.setState({ tickId: 12345 as unknown as ReturnType<typeof setInterval> });

      useStore.getState().hydrate({
        vitals: { hunger: 50, hygiene: 50, mood: 50, energy: 50, isSick: false, sicknessSeverity: 0, sicknessType: 'none' as const, deathCount: 0 },
        genome: createMockGenome(5),
        traits: createMockTraits(),
        evolution: initializeEvolution(),
      });

      expect(useStore.getState().tickId).toBe(12345);
    });
  });

  describe('Achievement System', () => {
    it('should not duplicate achievements', () => {
      useStore.getState().recordBattle('win', 'Opponent1');
      useStore.getState().recordBattle('win', 'Opponent2');

      const achievements = useStore.getState().achievements;
      const firstWinAchievements = achievements.filter(a => a.id === 'battle-first-win');
      expect(firstWinAchievements).toHaveLength(1);
    });

    it('should include earnedAt timestamp in achievement', () => {
      const before = Date.now();
      useStore.getState().recordBattle('win', 'Opponent1');
      const after = Date.now();

      const achievements = useStore.getState().achievements;
      const firstWin = achievements.find(a => a.id === 'battle-first-win');

      expect(firstWin?.earnedAt).toBeDefined();
      expect(firstWin!.earnedAt).toBeGreaterThanOrEqual(before);
      expect(firstWin!.earnedAt).toBeLessThanOrEqual(after);
    });
  });
});
