import { create } from 'zustand';
import type { StoreApi, UseBoundStore } from 'zustand';

import type { Genome, DerivedTraits } from '../genome/types';
import type { EvolutionData } from '../evolution/types';
import {
  initializeEvolution,
  gainExperience,
  checkEvolutionEligibility,
  applyEvolution,
  type EvolutionContext,
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
  ACHIEVEMENT_TARGETS,
  MINIGAME_ACHIEVEMENT_CHECKS,
  VIMANA_ESSENCE_REWARDS,
  computeVimanaGenomeSeed,
  createDefaultBattleStats,
  createDefaultMiniGameProgress,
  createDefaultVimanaState,
  getVimanaFieldRewardDelta,
  migrateVimanaState,
  revealVimanaNeighbors,
  scanVimanaNode,
  vimanaInfoLevel,
} from '../progression/types';
import { FLIGHT_GATE_COUNT } from '../lib/minigames/vimanaFlight';
import {
  computeGameReward,
  type MiniGameSessionResult,
} from '../lib/minigames/gameMath';
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
import { normalizePetForm, type PetForm } from '../lib/petForms';

export type { Vitals };
export type PetType = PetForm;
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
  /** Unified entry point for every game in the suite: updates progress, XP, vitals, essence, and achievements in one pass. */
  recordMiniGameResult: (result: MiniGameSessionResult) => void;
  updateMiniGameScore: (game: 'memory' | 'rhythm', score: number) => void;
  recordVimanaRun: (score: number, lines: number, level: number) => void;
  exploreCell: (
    cellId: string,
    options?: {
      /** Resonance-ring result (0-100) for this attempt; see vimanaInfoLevel. */
      scanQuality?: number;
      /** Gates threaded during the flight sequence, if travel preceded the scan. */
      flightBonus?: number;
    }
  ) => void;
  resolveAnomaly: (cellId: string) => void;
  recordBreeding: () => void;
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

type VimanaFieldType = VimanaState['nodes'][number]['fieldType'];

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

/** Snapshot the live progress signals used by evolution special conditions. */
export function buildEvolutionContext(state: {
  traits: DerivedTraits | null;
  battle: BattleStats;
  miniGames: MiniGameProgress;
  essence: number;
}): EvolutionContext {
  return {
    traits: state.traits,
    battleWins: state.battle.wins,
    miniGamesPlayed: state.miniGames.totalPlays,
    essence: state.essence,
  };
}

function applyVitalsDelta(vitals: Vitals, delta: Record<string, number>): Vitals {
  return {
    ...vitals,
    hunger: clamp(vitals.hunger + (delta.hunger ?? 0)),
    hygiene: clamp(vitals.hygiene + (delta.hygiene ?? 0)),
    mood: clamp(vitals.mood + (delta.mood ?? 0)),
    energy: clamp(vitals.energy + (delta.energy ?? 0)),
  };
}

function applyVimanaFieldReward(fieldType: VimanaFieldType, vitals: Vitals): Vitals {
  return applyVitalsDelta(vitals, getVimanaFieldRewardDelta(fieldType));
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
    petType: 'auralia',
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
      set({ petType: normalizePetForm(petType) });
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
        // Merge with defaults so saves from before the game-suite rebuild gain the new fields.
        miniGames: miniGames ? { ...createDefaultMiniGameProgress(), ...miniGames } : state.miniGames,
        // Runs the save-shape migration even for current saves; it is
        // idempotent and shields hydrate from stale persisted layouts.
        vimana: vimana
          ? migrateVimanaState(vimana, { genomeSeed: computeVimanaGenomeSeed(genome) })
          : state.vimana,
        rewardHistory: rewardHistory ? rewardHistory.map(entry => ({ ...entry, reward: { ...entry.reward } })) : state.rewardHistory,
        lastReward: lastReward ?? state.lastReward,
        petType: normalizePetForm(petType, state.petType),
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
        const result = runTick(vitals, evolution, buildEvolutionContext(get()));
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
      const { evolution, vitals, traits } = get();
      const vitalsAvg = getVitalsAverage(vitals);
      const context = buildEvolutionContext(get());
      if (!checkEvolutionEligibility(evolution, vitalsAvg, context)) {
        return false;
      }

      const { evolution: nextEvolution, effects } = applyEvolution(
        evolution,
        traits
      );
      if (!effects) {
        return false;
      }

      const rewardPayloads: RewardPayloadInput[] = [];
      set(state => {
        const update: Partial<MetaPetState> = { evolution: nextEvolution };

        update.vitals = {
          ...state.vitals,
          hunger: clamp(state.vitals.hunger + effects.vitalsBoost),
          hygiene: clamp(state.vitals.hygiene + effects.vitalsBoost),
          mood: clamp(state.vitals.mood + effects.vitalsBoost),
          energy: clamp(state.vitals.energy + effects.vitalsBoost),
        };

        if (effects.essenceGrant > 0) {
          update.essence = state.essence + effects.essenceGrant;
          update.lastRewardSource = 'system';
        }

        if (effects.achievementId) {
          const unlocked = unlockAchievementWithReward(
            state.achievements,
            effects.achievementId
          );
          if (unlocked.achievements !== state.achievements) {
            update.achievements = unlocked.achievements;
            if (unlocked.reward) rewardPayloads.push(unlocked.reward);
          }
        }

        return update;
      });

      rewardPayloads.forEach(payload => get().recordReward(payload));
      return true;
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
          if (next.streak >= ACHIEVEMENT_TARGETS['battle-streak']) {
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

    recordMiniGameResult(result) {
      if (get().systemState === 'sealed') return;
      const rewardPayloads: RewardPayloadInput[] = [];
      set(state => {
        const previous = state.miniGames;
        const reward = computeGameReward(result, state.evolution);
        const hasProgress = result.score > 0 || (result.lines ?? 0) > 0;

        const next: MiniGameProgress = {
          ...previous,
          focusStreak: hasProgress ? previous.focusStreak + 1 : 0,
          totalPlays: hasProgress ? previous.totalPlays + 1 : previous.totalPlays,
          lastPlayedAt: Date.now(),
        };

        switch (result.game) {
          case 'memory':
            next.memoryHighScore = Math.max(previous.memoryHighScore, result.score);
            next.shuffleBestRound = Math.max(previous.shuffleBestRound, result.roundsCompleted ?? 0);
            break;
          case 'rhythm':
            next.rhythmHighScore = Math.max(previous.rhythmHighScore, result.score);
            next.pulseBestCombo = Math.max(previous.pulseBestCombo, result.combo ?? 0);
            next.pulseBestAccuracy = Math.max(previous.pulseBestAccuracy, Math.round(result.accuracy ?? 0));
            break;
          case 'sigil':
            next.sigilHighScore = Math.max(previous.sigilHighScore, result.score);
            next.sigilBestStreak = Math.max(previous.sigilBestStreak, result.combo ?? 0);
            next.sigilTotalCorrect = previous.sigilTotalCorrect + (result.correctAnswers ?? 0);
            break;
          case 'vimana':
            next.vimanaHighScore = Math.max(previous.vimanaHighScore, result.score);
            next.vimanaMaxLines = Math.max(previous.vimanaMaxLines, result.lines ?? 0);
            next.vimanaMaxLevel = Math.max(previous.vimanaMaxLevel, result.level ?? 0);
            next.vimanaLastScore = result.score;
            next.vimanaLastLines = result.lines ?? 0;
            next.vimanaLastLevel = result.level ?? 0;
            break;
          case 'companion':
            next.companionWins = previous.companionWins + 1;
            break;
        }

        if (result.rank === 'mythic' && hasProgress) {
          next.mythicClears = previous.mythicClears + 1;
        }

        let achievements = state.achievements;
        for (const check of MINIGAME_ACHIEVEMENT_CHECKS) {
          if (check.getProgress(next) >= ACHIEVEMENT_TARGETS[check.id]) {
            const unlock = unlockAchievementWithReward(achievements, check.id);
            achievements = unlock.achievements;
            if (unlock.reward) rewardPayloads.push(unlock.reward);
          }
        }

        const update: Partial<MetaPetState> = { miniGames: next };
        if (achievements !== state.achievements) {
          update.achievements = achievements;
        }

        if (reward.xp > 0) {
          update.evolution = gainExperience(state.evolution, reward.xp);
          update.vitals = {
            ...state.vitals,
            mood: clamp(state.vitals.mood + (reward.vitals.mood ?? 0)),
            energy: clamp(state.vitals.energy + (reward.vitals.energy ?? 0)),
            hygiene: clamp(state.vitals.hygiene + (reward.vitals.hygiene ?? 0)),
          };
          if (reward.essence > 0) {
            update.essence = state.essence + reward.essence;
            update.lastRewardSource = 'minigame';
            update.lastRewardAmount = reward.essence;
          }
          rewardPayloads.push({
            source: 'minigame',
            title: 'Game Session Complete',
            description: reward.message,
            reward: {
              type: 'xp',
              value: reward.xp,
            },
          });
        }

        return update;
      });

      rewardPayloads.forEach(payload => get().recordReward(payload));
    },

    updateMiniGameScore(game, score) {
      get().recordMiniGameResult({ game, score });
    },

    recordVimanaRun(score, lines, level) {
      get().recordMiniGameResult({ game: 'vimana', score, lines, level });
    },

    exploreCell(cellId, options) {
      if (get().systemState === 'sealed') return;
      const rewardPayloads: RewardPayloadInput[] = [];
      set(state => {
        const { vimana, vitals } = state;
        const target = vimana.nodes.find(node => node.id === cellId);
        if (!target) return {};

        const now = Date.now();
        const outcome = scanVimanaNode(target, now, options?.scanQuality);
        // Scanning a field surfaces signals one route hop away; a perfect
        // resonance-ring reading reaches a second hop as its bonus.
        const hops = vimanaInfoLevel(options?.scanQuality ?? 60) === 'perfect' ? 2 : 1;
        const nodes = revealVimanaNeighbors(
          vimana.nodes.map(node => (node.id === cellId ? outcome.node : node)),
          cellId,
          hops
        );

        let updatedVitals = vitals;
        let essence = state.essence;
        let achievements = state.achievements;
        const update: Partial<MetaPetState> = {};

        // Flight-gate bonus: purely additive, never a punishment for a rough
        // flight — clamped defensively at the same cap the flight uses.
        const flightBonus = Math.max(0, Math.min(FLIGHT_GATE_COUNT, options?.flightBonus ?? 0));
        if (flightBonus > 0) {
          essence += flightBonus;
          rewardPayloads.push({
            source: 'exploration',
            title: 'Flight Bonus',
            description: `Threaded ${flightBonus} route gate${flightBonus === 1 ? '' : 's'} en route.`,
            reward: {
              type: 'vitals',
              value: { essence: flightBonus },
            },
          });
        }

        // The full first-discovery reward (vitals + essence) is granted only
        // once per node; repeat scans just deepen samples and mastery.
        if (outcome.firstDiscovery) {
          updatedVitals = applyVimanaFieldReward(outcome.node.fieldType, vitals);
          essence += VIMANA_ESSENCE_REWARDS.discovery;
          update.lastRewardSource = 'exploration';
          update.lastRewardAmount = VIMANA_ESSENCE_REWARDS.discovery;

          const result = unlockAchievementWithReward(achievements, 'explorer-first-step');
          achievements = result.achievements;
          if (result.reward) {
            rewardPayloads.push(result.reward);
          }

          rewardPayloads.push({
            source: 'exploration',
            title: 'Field Scan Reward',
            description: `First survey of ${outcome.node.label ?? outcome.node.id}.`,
            reward: {
              type: 'vitals',
              value: getVimanaFieldRewardDelta(outcome.node.fieldType),
            },
          });
        }

        const anomaliesFound = nodes.filter(
          node => node.anomaly !== null && node.anomaly.state !== 'dormant'
        ).length;

        update.vitals = updatedVitals;
        update.essence = essence;
        update.vimana = {
          ...vimana,
          nodes,
          activeNodeId: cellId,
          scansPerformed: vimana.scansPerformed + 1,
          anomaliesFound,
          lastScanAt: now,
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
        const target = vimana.nodes.find(node => node.id === cellId);
        // Only an anomaly that has been revealed by scanning can be resolved,
        // and resolving it twice is impossible by construction.
        if (!target || target.anomaly?.state !== 'active') return {};

        const now = Date.now();
        const nodes = vimana.nodes.map(node => {
          if (node.id !== cellId || !node.anomaly) return node;
          return {
            ...node,
            anomaly: { ...node.anomaly, state: 'resolved' as const },
            lastVisitedAt: now,
          };
        });

        const updatedVitals = applyVimanaFieldReward('calm', vitals);
        const anomaliesFound = nodes.filter(
          node => node.anomaly !== null && node.anomaly.state !== 'dormant'
        ).length;
        const anomaliesResolved = vimana.anomaliesResolved + 1;

        let achievements = state.achievements;
        if (anomaliesResolved >= ACHIEVEMENT_TARGETS['explorer-anomaly-hunter']) {
          const result = unlockAchievementWithReward(achievements, 'explorer-anomaly-hunter');
          achievements = result.achievements;
          if (result.reward) {
            rewardPayloads.push(result.reward);
          }
        }

        const update: Partial<MetaPetState> = {
          vitals: updatedVitals,
          essence: state.essence + VIMANA_ESSENCE_REWARDS.anomalyResolved,
          lastRewardSource: 'exploration',
          lastRewardAmount: VIMANA_ESSENCE_REWARDS.anomalyResolved,
          vimana: {
            ...vimana,
            nodes,
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
            value: getVimanaFieldRewardDelta('calm'),
          },
        });

        return update;
      });

      rewardPayloads.forEach(payload => get().recordReward(payload));
    },

    recordBreeding() {
      if (get().systemState === 'sealed') return;
      let rewardPayload: RewardPayloadInput | undefined;

      set(state => {
        const result = unlockAchievementWithReward(state.achievements, 'breeding-first');
        rewardPayload = result.reward;

        return {
          achievements: result.achievements,
          evolution: gainExperience(state.evolution, 20),
        };
      });

      if (rewardPayload) {
        get().recordReward(rewardPayload);
      }
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
