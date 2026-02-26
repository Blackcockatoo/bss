import { create } from 'zustand';
import type { StoreApi, UseBoundStore } from 'zustand';

import type { Genome, DerivedTraits } from '../genome/types';
import type { EvolutionData } from '../evolution/types';
import {
  initializeEvolution,
  gainExperience,
  checkEvolutionEligibility,
  evolvePet,
} from '../evolution/index';
import { summarizeElementWeb } from '../genome/elementResidue';
import type {
  Achievement,
  BattleStats,
  MiniGameProgress,
  VimanaState,
} from '../progression/types';
import {
  ACHIEVEMENT_CATALOG,
  createDefaultBattleStats,
  createDefaultMiniGameProgress,
  createDefaultVimanaState,
} from '../progression/types';
import type { Vitals } from '../vitals/index';
import {
  DEFAULT_VITALS,
  applyInteraction,
  clamp,
  getVitalsAverage,
  tick as runTick,
  treatSickness,
  checkDeath,
  resetAfterDeath,
} from '../vitals/index';
import {
  createDefaultRitualProgress,
  type RitualProgress,
} from '../lib/ritual/types';
import {
  createWitnessRecord,
  type PetOntologyState,
  type WitnessRecord,
} from '../lib/witness';
import {
  type InvariantIssue,
  type SystemState,
  shouldSealSystem,
} from '../lib/system/invariants';

export type { Vitals };
export type PetType = 'geometric' | 'auralia';
export type RewardSource =
  | 'battle'
  | 'exploration'
  | 'minigame'
  | 'mirror'
  | 'ritual'
  | 'system'
  | 'vimana';

export interface MetaPetState {
  vitals: Vitals;
  genome: Genome | null;
  traits: DerivedTraits | null;
  evolution: EvolutionData;
  ritualProgress: RitualProgress;
  witness: WitnessRecord;
  petOntology: PetOntologyState;
  systemState: SystemState;
  sealedAt: number | null;
  invariantIssues: InvariantIssue[];
  essence: number;
  lastRewardSource: RewardSource | null;
  lastRewardAmount: number;
  achievements: Achievement[];
  battle: BattleStats;
  miniGames: MiniGameProgress;
  vimana: VimanaState;
  rewardHistory: RewardPayload[];
  lastReward: RewardPayload | null;
  petType: PetType;
  mirrorMode: MirrorModeState;
  lastAction: null | 'feed' | 'clean' | 'play' | 'sleep';
  lastActionAt: number;
  tickId?: ReturnType<typeof setInterval>;
  sealSystem: (issue?: InvariantIssue) => void;
  reportInvariantIssue: (issue: InvariantIssue) => void;
  setGenome: (genome: Genome, traits: DerivedTraits) => void;
  setPetType: (petType: PetType) => void;
  hydrate: (data: {
    vitals: Vitals;
    genome: Genome;
    traits: DerivedTraits;
    evolution: EvolutionData;
    ritualProgress?: RitualProgress;
    witness?: WitnessRecord;
    petOntology?: PetOntologyState;
    systemState?: SystemState;
    sealedAt?: number | null;
    invariantIssues?: InvariantIssue[];
    essence?: number;
    lastRewardSource?: RewardSource | null;
    lastRewardAmount?: number;
    achievements?: Achievement[];
    battle?: BattleStats;
    miniGames?: MiniGameProgress;
    vimana?: VimanaState;
    rewardHistory?: RewardPayload[];
    lastReward?: RewardPayload | null;
    petType?: PetType;
    mirrorMode?: MirrorModeState;
  }) => void;
  startTick: () => void;
  stopTick: () => void;
  feed: () => void;
  clean: () => void;
  play: () => void;
  sleep: () => void;
  setLastAction: (action: 'feed' | 'clean' | 'play' | 'sleep') => void;
  addEssence: (payload: { amount: number; source: RewardSource }) => void;
  tryEvolve: () => boolean;
  recordBattle: (result: 'win' | 'loss', opponent: string) => void;
  updateMiniGameScore: (game: 'memory' | 'rhythm', score: number) => void;
  recordVimanaRun: (score: number, lines: number, level: number) => void;
  recordSpaceJewblesRun: (score: number, wave: number, bossesDefeated: number, mythicDrops: number) => void;
  exploreCell: (cellId: string) => void;
  resolveAnomaly: (cellId: string) => void;
  recordReward: (payload: RewardPayloadInput) => void;
  addRitualRewards: (payload: {
    resonanceDelta: number;
    reward: {
      essenceDelta: number;
      source: 'ritual';
    };
    progress: RitualProgress;
  }) => void;
  applyReward: (payload: { essenceDelta: number; source: 'achievement' | 'battle' | 'minigame' | 'ritual' | 'system' }) => void;
  beginMirrorMode: (preset: MirrorPrivacyPreset, durationMinutes?: number) => void;
  confirmMirrorCross: () => void;
  completeMirrorMode: (outcome: MirrorOutcome, note?: string) => void;
  refreshConsent: (durationMinutes: number) => void;
}

export type MirrorPhase = 'idle' | 'entering' | 'crossed' | 'returning';
export type MirrorPrivacyPreset = 'stealth' | 'standard' | 'radiant';
export type MirrorOutcome = 'anchor' | 'drift';

export interface MirrorReflection {
  id: string;
  note?: string;
  outcome: MirrorOutcome;
  moodDelta: number;
  energyDelta: number;
  timestamp: number;
  preset: MirrorPrivacyPreset;
}

export interface MirrorModeState {
  phase: MirrorPhase;
  startedAt: number | null;
  consentExpiresAt: number | null;
  preset: MirrorPrivacyPreset | null;
  presenceToken: string | null;
  lastReflection: MirrorReflection | null;
}

export interface CreateMetaPetWebStoreOptions {
  tickMs?: number;
  scheduleInterval?: typeof setInterval;
  cancelInterval?: typeof clearInterval;
  autoPauseOnVisibilityChange?: boolean;
}

type MetaPetStore = UseBoundStore<StoreApi<MetaPetState>>;

type VimanaReward = VimanaState['cells'][number]['reward'];

type AchievementMap = Map<Achievement['id'], Achievement>;

const achievementDefinitions: AchievementMap = new Map(
  ACHIEVEMENT_CATALOG.map(item => [item.id, item])
);

export interface RewardPayload {
  id: string;
  source: 'ritual' | 'achievement' | 'exploration' | 'minigame';
  title: string;
  description: string;
  reward: {
    type: 'ritual' | 'achievement' | 'exploration' | 'minigame' | 'vitals' | 'score' | 'xp';
    value: number | string | Record<string, number>;
  };
  createdAt: number;
}

export type RewardPayloadInput = Omit<RewardPayload, 'id' | 'createdAt'> & {
  createdAt?: number;
};

const REWARD_HISTORY_LIMIT = 20;

const DEFAULT_MIRROR_MODE: MirrorModeState = {
  phase: 'idle',
  startedAt: null,
  consentExpiresAt: null,
  preset: null,
  presenceToken: null,
  lastReflection: null,
};

const DEFAULT_WITNESS = createWitnessRecord('meta-pet');

function unlockAchievement(list: Achievement[], id: Achievement['id']): Achievement[] {
  if (list.some(entry => entry.id === id)) {
    return list;
  }

  const definition = achievementDefinitions.get(id);
  if (!definition) {
    return list;
  }

  return [...list, { ...definition, earnedAt: Date.now() }];
}

function unlockAchievementWithReward(list: Achievement[], id: Achievement['id']): {
  achievements: Achievement[];
  reward?: RewardPayloadInput;
} {
  if (list.some(entry => entry.id === id)) {
    return { achievements: list };
  }

  const definition = achievementDefinitions.get(id);
  if (!definition) {
    return { achievements: list };
  }

  const achievements = [...list, { ...definition, earnedAt: Date.now() }];

  return {
    achievements,
    reward: {
      source: 'achievement',
      title: 'Achievement Unlocked',
      description: `${definition.title} achieved.`,
      reward: {
        type: 'achievement',
        value: definition.title,
      },
    },
  };
}

function applyVimanaReward(reward: VimanaReward, vitals: Vitals): Vitals {
  switch (reward) {
    case 'mood':
      return { ...vitals, mood: clamp(vitals.mood + 10) };
    case 'energy':
      return { ...vitals, energy: clamp(vitals.energy + 10) };
    case 'hygiene':
      return { ...vitals, hygiene: clamp(vitals.hygiene + 12) };
    case 'mystery':
      return {
        ...vitals,
        mood: clamp(vitals.mood + 5),
        energy: clamp(vitals.energy + 5),
      };
    default:
      return vitals;
  }
}

function getVimanaRewardDelta(reward: VimanaReward): Record<string, number> {
  switch (reward) {
    case 'mood':
      return { mood: 10 };
    case 'energy':
      return { energy: 10 };
    case 'hygiene':
      return { hygiene: 12 };
    case 'mystery':
      return { mood: 5, energy: 5 };
    default:
      return {};
  }
}

export function createMetaPetWebStore(
  options: CreateMetaPetWebStoreOptions = {}
): MetaPetStore {
  const tickMs = options.tickMs ?? 1000;
  const scheduleInterval = options.scheduleInterval ?? setInterval;
  const cancelInterval = options.cancelInterval ?? clearInterval;
  const autoPause = options.autoPauseOnVisibilityChange ?? true;

  const useStore = create<MetaPetState>((set, get) => ({
    vitals: DEFAULT_VITALS,
    genome: null,
    traits: null,
    evolution: initializeEvolution(),
    ritualProgress: createDefaultRitualProgress(),
    witness: DEFAULT_WITNESS,
    petOntology: 'living',
    systemState: 'active',
    sealedAt: null,
    invariantIssues: [],
    essence: 0,
    lastRewardSource: null,
    lastRewardAmount: 0,
    achievements: [],
    battle: createDefaultBattleStats(),
    miniGames: createDefaultMiniGameProgress(),
    vimana: createDefaultVimanaState(),
    rewardHistory: [],
    lastReward: null,
    petType: 'geometric',
    mirrorMode: { ...DEFAULT_MIRROR_MODE },
    lastAction: null,
    lastActionAt: 0,

    sealSystem(issue) {
      set(state => {
        if (state.systemState === 'sealed') {
          return issue
            ? { invariantIssues: [...state.invariantIssues, issue] }
            : {};
        }
        const issues = issue ? [...state.invariantIssues, issue] : state.invariantIssues;
        return {
          systemState: 'sealed',
          sealedAt: issue?.detectedAt ?? Date.now(),
          invariantIssues: issues,
        };
      });

      const tickId = get().tickId;
      if (tickId) {
        cancelInterval(tickId);
        set({ tickId: undefined });
      }
    },

    reportInvariantIssue(issue) {
      set(state => {
        const issues = [...state.invariantIssues, issue];
        if (state.systemState === 'sealed') {
          return { invariantIssues: issues };
        }
        if (shouldSealSystem(issues)) {
          return {
            systemState: 'sealed',
            sealedAt: issue.detectedAt,
            invariantIssues: issues,
          };
        }
        return { invariantIssues: issues };
      });
    },

    setGenome(genome, traits) {
      if (get().systemState === 'sealed') return;
      set({ genome, traits: normalizeTraits(genome, traits) });
    },

    setPetType(petType) {
      if (get().systemState === 'sealed') return;
      set({ petType });
    },

    hydrate({
      vitals,
      genome,
      traits,
      evolution,
      ritualProgress,
      achievements,
      battle,
      miniGames,
      vimana,
      rewardHistory,
      lastReward,
      petType,
      mirrorMode,
      witness,
      petOntology,
      systemState,
      sealedAt,
      invariantIssues,
      essence,
      lastRewardSource,
      lastRewardAmount,
    }) {
      set(state => ({
        vitals: { ...DEFAULT_VITALS, ...vitals },
        genome,
        traits: normalizeTraits(genome, traits),
        evolution: { ...evolution },
        ritualProgress: ritualProgress ? { ...ritualProgress, history: [...ritualProgress.history] } : state.ritualProgress,
        witness: witness ?? state.witness,
        petOntology: petOntology ?? state.petOntology,
        systemState: (() => {
          const nextIssues = invariantIssues ? invariantIssues.map(issue => ({ ...issue })) : state.invariantIssues;
          const candidateState = systemState ?? state.systemState;
          return candidateState === 'sealed' || shouldSealSystem(nextIssues) ? 'sealed' : candidateState;
        })(),
        sealedAt: (() => {
          const nextIssues = invariantIssues ? invariantIssues.map(issue => ({ ...issue })) : state.invariantIssues;
          const candidateState = systemState ?? state.systemState;
          const resolvedSealed = candidateState === 'sealed' || shouldSealSystem(nextIssues);
          if (!resolvedSealed) return null;
          if (typeof sealedAt === 'number') return sealedAt;
          return state.sealedAt ?? Date.now();
        })(),
        invariantIssues: invariantIssues ? invariantIssues.map(issue => ({ ...issue })) : state.invariantIssues,
        essence: typeof essence === 'number' ? essence : state.essence,
        lastRewardSource: lastRewardSource ?? state.lastRewardSource,
        lastRewardAmount: typeof lastRewardAmount === 'number' ? lastRewardAmount : state.lastRewardAmount,
        achievements: achievements ? achievements.map(entry => ({ ...entry })) : state.achievements,
        battle: battle ? { ...battle } : state.battle,
        miniGames: miniGames ? { ...miniGames } : state.miniGames,
        vimana: vimana ? cloneVimanaState(vimana) : state.vimana,
        rewardHistory: rewardHistory ? rewardHistory.map(entry => ({ ...entry, reward: { ...entry.reward } })) : state.rewardHistory,
        lastReward: lastReward ?? state.lastReward,
        petType: petType ?? state.petType,
        mirrorMode: mirrorMode ? { ...mirrorMode } : state.mirrorMode,
        tickId: state.tickId,
      }));
    },

    startTick() {
      if (get().systemState === 'sealed') return;
      if (get().tickId) return;

      const id = scheduleInterval(() => {
        if (get().systemState === 'sealed') return;
        const { vitals, evolution } = get();
        const result = runTick(vitals, evolution);
        set({ vitals: result.vitals, evolution: result.evolution });
      }, tickMs);

      set({ tickId: id as ReturnType<typeof setInterval> });
    },

    stopTick() {
      const id = get().tickId;
      if (id) {
        cancelInterval(id);
        set({ tickId: undefined });
      }
    },

    setLastAction(action) {
      if (get().systemState === 'sealed') return;
      set({ lastAction: action, lastActionAt: Date.now() });
    },

    addEssence({ amount, source }) {
      if (get().systemState === 'sealed') return;
      set(state => ({
        essence: state.essence + amount,
        lastRewardSource: source,
      }));
    },

    feed() {
      if (get().systemState === 'sealed') return;
      set(state => ({
        vitals: applyInteraction(state.vitals, 'feed'),
        evolution: gainExperience(state.evolution, 5),
      }));
      get().setLastAction('feed');
    },

    clean() {
      if (get().systemState === 'sealed') return;
      set(state => ({
        vitals: applyInteraction(state.vitals, 'clean'),
        evolution: gainExperience(state.evolution, 5),
      }));
      get().setLastAction('clean');
    },

    play() {
      if (get().systemState === 'sealed') return;
      set(state => ({
        vitals: applyInteraction(state.vitals, 'play'),
        evolution: gainExperience(state.evolution, 10),
      }));
      get().setLastAction('play');
    },

    sleep() {
      if (get().systemState === 'sealed') return;
      set(state => ({
        vitals: applyInteraction(state.vitals, 'sleep'),
        evolution: gainExperience(state.evolution, 3),
      }));
      get().setLastAction('sleep');
    },

    tryEvolve() {
      if (get().systemState === 'sealed') return false;
      const { evolution, vitals } = get();
      const vitalsAvg = getVitalsAverage(vitals);
      if (checkEvolutionEligibility(evolution, vitalsAvg)) {
        const nextEvolution = evolvePet(evolution);
        set({ evolution: nextEvolution });
        return true;
      }
      return false;
    },

    recordBattle(result, opponent) {
      if (get().systemState === 'sealed') return;
      const rewardPayloads: RewardPayloadInput[] = [];
      set(state => {
        const next: BattleStats = {
          ...state.battle,
          lastResult: result,
          lastOpponent: opponent,
        };

        if (result === 'win') {
          next.wins += 1;
          next.streak += 1;
          next.energyShield = clamp(next.energyShield + 5);
        } else {
          next.losses += 1;
          next.streak = 0;
          next.energyShield = clamp(next.energyShield - 10);
        }

        let achievements = state.achievements;
        if (result === 'win') {
          const firstWin = unlockAchievementWithReward(achievements, 'battle-first-win');
          achievements = firstWin.achievements;
          if (firstWin.reward) rewardPayloads.push(firstWin.reward);
          if (next.streak >= 3) {
            const streakWin = unlockAchievementWithReward(achievements, 'battle-streak');
            achievements = streakWin.achievements;
            if (streakWin.reward) rewardPayloads.push(streakWin.reward);
          }
        }

        const update: Partial<MetaPetState> = { battle: next };
        if (achievements !== state.achievements) {
          update.achievements = achievements;
        }

        // Grant XP for battle wins
        if (result === 'win') {
          update.evolution = gainExperience(state.evolution, 15);
        }

        return update;
      });

      rewardPayloads.forEach(payload => get().recordReward(payload));
    },

    updateMiniGameScore(game, score) {
      if (get().systemState === 'sealed') return;
      const rewardPayloads: RewardPayloadInput[] = [];
      set(state => {
        const next: MiniGameProgress = {
          ...state.miniGames,
          lastPlayedAt: Date.now(),
        };

        if (game === 'memory') {
          next.memoryHighScore = Math.max(next.memoryHighScore, score);
        } else {
          next.rhythmHighScore = Math.max(next.rhythmHighScore, score);
        }

        let achievements = state.achievements;
        if (game === 'memory' && next.memoryHighScore >= 10) {
          const result = unlockAchievementWithReward(achievements, 'minigame-memory');
          achievements = result.achievements;
          if (result.reward) rewardPayloads.push(result.reward);
        }
        if (game === 'rhythm' && next.rhythmHighScore >= 12) {
          const result = unlockAchievementWithReward(achievements, 'minigame-rhythm');
          achievements = result.achievements;
          if (result.reward) rewardPayloads.push(result.reward);
        }
        if (game === 'memory' && next.memoryHighScore >= 20) {
          const result = unlockAchievementWithReward(achievements, 'minigame-memory-ace');
          achievements = result.achievements;
          if (result.reward) rewardPayloads.push(result.reward);
        }
        if (game === 'rhythm' && next.rhythmHighScore >= 20) {
          const result = unlockAchievementWithReward(achievements, 'minigame-rhythm-ace');
          achievements = result.achievements;
          if (result.reward) rewardPayloads.push(result.reward);
        }

        const update: Partial<MetaPetState> = { miniGames: next };
        if (achievements !== state.achievements) {
          update.achievements = achievements;
        }

        // Grant XP based on score (5-10 XP)
        const xpGain = Math.min(10, Math.max(5, Math.floor(score / 2)));
        update.evolution = gainExperience(state.evolution, xpGain);

        return update;
      });

      rewardPayloads.forEach(payload => get().recordReward(payload));
    },

    recordVimanaRun(score, lines, level) {
      if (get().systemState === 'sealed') return;
      const rewardPayloads: RewardPayloadInput[] = [];
      set(state => {
        const previous = state.miniGames;
        const hasProgress = lines > 0 || score > 0;

        const next: MiniGameProgress = {
          ...previous,
          focusStreak: hasProgress ? previous.focusStreak + 1 : 0,
          vimanaHighScore: Math.max(previous.vimanaHighScore, score),
          vimanaMaxLines: Math.max(previous.vimanaMaxLines, lines),
          vimanaMaxLevel: Math.max(previous.vimanaMaxLevel, level),
          vimanaLastScore: score,
          vimanaLastLines: lines,
          vimanaLastLevel: level,
          lastPlayedAt: Date.now(),
        };

        let achievements = state.achievements;
        if (next.vimanaHighScore >= 1500) {
          const result = unlockAchievementWithReward(achievements, 'minigame-vimana-score');
          achievements = result.achievements;
          if (result.reward) rewardPayloads.push(result.reward);
        }
        if (next.vimanaMaxLines >= 20) {
          const result = unlockAchievementWithReward(achievements, 'minigame-vimana-lines');
          achievements = result.achievements;
          if (result.reward) rewardPayloads.push(result.reward);
        }
        if (next.vimanaMaxLevel >= 5) {
          const result = unlockAchievementWithReward(achievements, 'minigame-vimana-level');
          achievements = result.achievements;
          if (result.reward) rewardPayloads.push(result.reward);
        }
        if (next.focusStreak >= 5) {
          const result = unlockAchievementWithReward(achievements, 'minigame-focus-streak');
          achievements = result.achievements;
          if (result.reward) rewardPayloads.push(result.reward);
        }

        const update: Partial<MetaPetState> = { miniGames: next };
        if (achievements !== state.achievements) {
          update.achievements = achievements;
        }

        // Grant XP based on performance (5-10 XP, scaled by lines and level)
        if (hasProgress) {
          const xpGain = Math.min(10, Math.max(5, Math.floor(lines / 2) + level));
          update.evolution = gainExperience(state.evolution, xpGain);
        }

        return update;
      });

      rewardPayloads.forEach(payload => get().recordReward(payload));
    },

    recordSpaceJewblesRun(score, wave, bossesDefeated, mythicDrops) {
      if (get().systemState === 'sealed') return;
      const safeScore = Math.max(0, Math.floor(score));
      const safeWave = Math.max(0, Math.floor(wave));
      const safeBossesDefeated = Math.max(0, Math.floor(bossesDefeated));
      const safeMythicDrops = Math.max(0, Math.floor(mythicDrops));
      const rewardPayloads: RewardPayloadInput[] = [];
      set(state => {
        const previous = state.miniGames;
        const hasProgress = safeScore > 0 || safeWave > 0;

        const next: MiniGameProgress = {
          ...previous,
          focusStreak: hasProgress ? previous.focusStreak + 1 : 0,
          spaceJewblesHighScore: Math.max(previous.spaceJewblesHighScore, safeScore),
          spaceJewblesMaxWave: Math.max(previous.spaceJewblesMaxWave, safeWave),
          spaceJewblesLastScore: safeScore,
          spaceJewblesLastWave: safeWave,
          spaceJewblesMythicDrops: previous.spaceJewblesMythicDrops + safeMythicDrops,
          spaceJewblesBossesDefeated: previous.spaceJewblesBossesDefeated + safeBossesDefeated,
          spaceJewblesRunsPlayed: previous.spaceJewblesRunsPlayed + 1,
          spaceJewblesTotalScore: previous.spaceJewblesTotalScore + safeScore,
          spaceJewblesTotalWaves: previous.spaceJewblesTotalWaves + safeWave,
          lastPlayedAt: Date.now(),
        };

        const achievements = state.achievements;

        const update: Partial<MetaPetState> = { miniGames: next };

        // Grant XP based on performance (5-15 XP, scaled by wave and score)
        if (hasProgress) {
          const xpGain = Math.min(15, Math.max(5, Math.floor(safeWave / 2) + Math.floor(safeScore / 1000)));
          update.evolution = gainExperience(state.evolution, xpGain);
        }

        // Boost vitals from playing
        const moodBoost = Math.min(8, Math.floor(safeWave));
        const energyCost = Math.min(5, Math.floor(safeWave / 3));
        update.vitals = {
          ...state.vitals,
          mood: clamp(state.vitals.mood + moodBoost),
          energy: clamp(state.vitals.energy - energyCost),
        };

        return update;
      });

      // Record game result as reward
      if (safeScore > 0) {
        rewardPayloads.push({
          source: 'minigame',
          title: 'Space Jewbles Run',
          description: `Reached wave ${safeWave} with ${safeScore} points.`,
          reward: {
            type: 'score',
            value: safeScore,
          },
        });
      }

      rewardPayloads.forEach(payload => get().recordReward(payload));
    },

    exploreCell(cellId) {
      if (get().systemState === 'sealed') return;
      const rewardPayloads: RewardPayloadInput[] = [];
      set(state => {
        const { vimana, vitals } = state;
        const previousCell = vimana.cells.find(cell => cell.id === cellId);
        const cells = vimana.cells.map(cell => {
          if (cell.id !== cellId) return cell;
          return {
            ...cell,
            discovered: true,
            visitedAt: Date.now(),
          };
        });

        const target = cells.find(cell => cell.id === cellId);
        let updatedVitals = vitals;
        if (target) {
          updatedVitals = applyVimanaReward(target.reward, vitals);
        }

        const anomaliesFound = cells.filter(cell => cell.anomaly && cell.discovered).length;

        let achievements = state.achievements;
        if (!previousCell?.discovered && target?.discovered) {
          const result = unlockAchievementWithReward(achievements, 'explorer-first-step');
          achievements = result.achievements;
          if (result.reward) {
            rewardPayloads.push(result.reward);
          }
        }

        if (target) {
          const rewardDelta = getVimanaRewardDelta(target.reward);
          if (Object.keys(rewardDelta).length > 0) {
            rewardPayloads.push({
              source: 'exploration',
              title: 'Field Scan Reward',
              description: `Exploration reward for ${target.label ?? target.id}.`,
              reward: {
                type: 'vitals',
                value: rewardDelta,
              },
            });
          }
        }

        const updatedVimana: VimanaState = {
          ...vimana,
          cells,
          activeCellId: cellId,
          scansPerformed: vimana.scansPerformed + 1,
          anomaliesFound,
          lastScanAt: Date.now(),
        };

        const update: Partial<MetaPetState> = {
          vitals: updatedVitals,
          vimana: updatedVimana,
        };

        if (achievements !== state.achievements) {
          update.achievements = achievements;
        }

        return update;
      });

      rewardPayloads.forEach(payload => get().recordReward(payload));
    },

    resolveAnomaly(cellId) {
      if (get().systemState === 'sealed') return;
      const rewardPayloads: RewardPayloadInput[] = [];
      set(state => {
        const { vimana, vitals } = state;
        const previousCell = vimana.cells.find(cell => cell.id === cellId);
        const cells = vimana.cells.map(cell => {
          if (cell.id !== cellId) return cell;
          if (!cell.anomaly) return cell;
          return {
            ...cell,
            anomaly: false,
            discovered: true,
            visitedAt: Date.now(),
          };
        });

        const updatedVitals = applyVimanaReward('mood', vitals);
        const anomaliesFound = cells.filter(cell => cell.anomaly && cell.discovered).length;

        let anomaliesResolved = vimana.anomaliesResolved ?? 0;
        if (previousCell?.anomaly) {
          anomaliesResolved += 1;
        }

        let achievements = state.achievements;
        if (anomaliesResolved >= 3) {
          const result = unlockAchievementWithReward(achievements, 'explorer-anomaly-hunter');
          achievements = result.achievements;
          if (result.reward) {
            rewardPayloads.push(result.reward);
          }
        }

        const update: Partial<MetaPetState> = {
          vitals: updatedVitals,
          vimana: {
            ...vimana,
            cells,
            anomaliesFound,
            anomaliesResolved,
          },
        };

        if (achievements !== state.achievements) {
          update.achievements = achievements;
        }

        rewardPayloads.push({
          source: 'exploration',
          title: 'Anomaly Resolved',
          description: 'Stabilized a Vimana anomaly.',
          reward: {
            type: 'vitals',
            value: getVimanaRewardDelta('mood'),
          },
        });

        return update;
      });

      rewardPayloads.forEach(payload => get().recordReward(payload));
    },

    recordReward(payload) {
      if (get().systemState === 'sealed') return;
      set(state => {
        const entry: RewardPayload = {
          id: generateRewardId(),
          createdAt: payload.createdAt ?? Date.now(),
          ...payload,
        };

        return {
          rewardHistory: [entry, ...state.rewardHistory].slice(0, REWARD_HISTORY_LIMIT),
          lastReward: entry,
        };
      });
    },

    addRitualRewards({ resonanceDelta, reward, progress }) {
      if (get().systemState === 'sealed') return;
      set(state => {
        const moodBoost = Math.min(8, Math.floor(resonanceDelta / 4));
        const energyBoost = Math.min(6, Math.floor(reward.essenceDelta / 2));
        const xpGain = Math.min(12, 4 + Math.floor(resonanceDelta / 3) + reward.essenceDelta);

        return {
          ritualProgress: {
            ...state.ritualProgress,
            resonance: progress.resonance,
            nectar: progress.nectar,
            streak: progress.streak,
            totalSessions: progress.totalSessions,
            lastDayKey: progress.lastDayKey,
            history: [...progress.history],
          },
          essence: state.essence + reward.essenceDelta,
          lastRewardSource: 'ritual' as RewardSource,
          lastRewardAmount: reward.essenceDelta,
          vitals: {
            ...state.vitals,
            mood: clamp(state.vitals.mood + moodBoost),
            energy: clamp(state.vitals.energy + energyBoost),
          },
          evolution: gainExperience(state.evolution, xpGain),
        };
      });

      get().recordReward({
        source: 'ritual',
        title: 'Ritual Complete',
        description: `Resonance +${resonanceDelta}, Essence +${reward.essenceDelta}.`,
        reward: {
          type: 'ritual',
          value: { resonance: resonanceDelta, essence: reward.essenceDelta },
        },
      });
    },

    applyReward({ essenceDelta }) {
      if (get().systemState === 'sealed') return;
      if (!Number.isFinite(essenceDelta) || essenceDelta === 0) return;
      set(state => ({
        essence: Math.max(0, state.essence + essenceDelta),
      }));
    },

    beginMirrorMode(preset, durationMinutes = 15) {
      if (get().systemState === 'sealed') return;
      const now = Date.now();
      set(state => ({
        mirrorMode: {
          phase: 'entering',
          startedAt: now,
          consentExpiresAt: now + durationMinutes * 60_000,
          preset,
          presenceToken: state.mirrorMode.presenceToken ?? null,
          lastReflection: state.mirrorMode.lastReflection,
        },
      }));
    },

    confirmMirrorCross() {
      if (get().systemState === 'sealed') return;
      set(state => {
        if (state.mirrorMode.phase !== 'entering') return {};
        const token = state.mirrorMode.presenceToken ?? generatePresenceToken();
        const now = Date.now();
        const consentActive =
          state.mirrorMode.consentExpiresAt === null || state.mirrorMode.consentExpiresAt > now;
        const moodBoost = consentActive ? 6 : 3;
        const energyBoost = consentActive ? 4 : 2;

        return {
          mirrorMode: {
            ...state.mirrorMode,
            phase: 'crossed',
            presenceToken: token,
          },
          vitals: {
            ...state.vitals,
            mood: clamp(state.vitals.mood + moodBoost),
            energy: clamp(state.vitals.energy + energyBoost),
          },
        };
      });
    },

    completeMirrorMode(outcome, note) {
      if (get().systemState === 'sealed') return;
      set(state => {
        if (state.mirrorMode.phase === 'idle') return {};
        const moodDelta = outcome === 'anchor' ? 8 : -6;
        const energyDelta = outcome === 'anchor' ? 5 : -8;
        const reflection: MirrorReflection = {
          id: generatePresenceToken(),
          note,
          outcome,
          moodDelta,
          energyDelta,
          timestamp: Date.now(),
          preset: state.mirrorMode.preset ?? 'standard',
        };

        return {
          mirrorMode: {
            phase: 'returning',
            startedAt: state.mirrorMode.startedAt,
            consentExpiresAt: state.mirrorMode.consentExpiresAt,
            preset: state.mirrorMode.preset,
            presenceToken: state.mirrorMode.presenceToken,
            lastReflection: reflection,
          },
          vitals: {
            ...state.vitals,
            mood: clamp(state.vitals.mood + moodDelta),
            energy: clamp(state.vitals.energy + energyDelta),
          },
        };
      });

      // Allow the phase to settle back to idle after a beat
      set(state => ({
        mirrorMode: {
          ...state.mirrorMode,
          phase: 'idle',
        },
      }));
    },

    refreshConsent(durationMinutes) {
      if (get().systemState === 'sealed') return;
      const now = Date.now();
      set(state => ({
        mirrorMode: {
          ...state.mirrorMode,
          consentExpiresAt: now + durationMinutes * 60_000,
        },
      }));
    },
  }));

  if (autoPause && typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      const store = useStore.getState();
      if (document.hidden) {
        store.stopTick();
      } else {
        store.startTick();
      }
    });
  }

  return useStore;
}

function normalizeTraits(genome: Genome, traits: DerivedTraits): DerivedTraits {
  if (traits.elementWeb) {
    return traits;
  }

  return {
    ...traits,
    elementWeb: summarizeElementWeb(genome),
  };
}

function cloneVimanaState(source: VimanaState): VimanaState {
  return {
    ...source,
    cells: source.cells.map(cell => ({ ...cell })),
  };
}

function generatePresenceToken(): string {
  const cryptoApi = typeof globalThis !== 'undefined' ? (globalThis.crypto as Crypto | undefined) : undefined;
  if (cryptoApi && 'randomUUID' in cryptoApi) {
    return cryptoApi.randomUUID();
  }

  const rand = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
  return `mirror-${rand.toString(36)}`;
}

function generateRewardId(): string {
  const cryptoApi = typeof globalThis !== 'undefined' ? (globalThis.crypto as Crypto | undefined) : undefined;
  if (cryptoApi && 'randomUUID' in cryptoApi) {
    return cryptoApi.randomUUID();
  }

  const rand = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
  return `reward-${rand.toString(36)}`;
}
