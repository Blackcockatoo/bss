/**
 * Bond Store
 *
 * Zustand store for managing user-pet bond state, memory,
 * and providing reactive updates to UI components.
 */

import { create } from 'zustand';
import type { StoreApi, UseBoundStore } from 'zustand';

import type {
  UserBondState,
  UserMood,
  InteractionType,
  Habit,
  ResonanceState,
} from './types';
import {
  createDefaultUserBondState,
  recordMoodCheckIn,
  recordInteraction,
  addHabit,
  completeHabit,
  removeHabit,
  updateResonance,
  computeResonance,
} from './index';

import type { MemoryState, Moment, MomentType } from '../memory';
import {
  createDefaultMemoryState,
  captureMoment,
  captureMomentFromTemplate,
  addNoteToMoment,
  createNote,
  togglePinMoment,
  hasMoment,
} from '../memory';

import { generateInsights, generateWeeklySummary, type Insight, type WeeklySummary } from '../insights';

export interface BondStoreState {
  // Core state
  petId: string | null;
  bond: UserBondState;
  memory: MemoryState;

  // Computed values (cached)
  insights: Insight[];
  resonance: ResonanceState;

  // Actions - Bond
  initialize: (petId: string, bondState?: UserBondState, memoryState?: MemoryState) => void;
  checkInMood: (mood: UserMood, note?: string) => void;
  recordVisit: (duration?: number) => void;
  recordActivity: (type: InteractionType, duration?: number) => void;
  createHabit: (name: string, frequency: 'daily' | 'weekly', description?: string, targetTime?: string) => void;
  markHabitComplete: (habitId: string) => void;
  deleteHabit: (habitId: string) => void;

  // Actions - Memory
  captureCustomMoment: (type: MomentType, title: string, description: string, importance?: Moment['importance']) => void;
  captureMilestone: (templateKey: string) => void;
  addNote: (momentId: string, note: string) => void;
  createReflection: (note: string, title?: string) => void;
  pinMoment: (momentId: string) => void;

  // Actions - Computed
  refreshInsights: () => void;
  refreshResonance: () => void;
  getWeeklySummary: (previousBondPoints?: number) => WeeklySummary;

  // Hydration
  hydrate: (bondState: UserBondState, memoryState: MemoryState) => void;
  getSnapshot: () => { bond: UserBondState; memory: MemoryState };
}

type BondStore = UseBoundStore<StoreApi<BondStoreState>>;

/**
 * Create the bond store
 */
export function createBondStore(): BondStore {
  return create<BondStoreState>((set, get) => ({
    petId: null,
    bond: createDefaultUserBondState(),
    memory: createDefaultMemoryState(),
    insights: [],
    resonance: 'attuning',

    initialize(petId, bondState, memoryState) {
      const bond = bondState || createDefaultUserBondState();
      const memory = memoryState || createDefaultMemoryState();

      // Capture first meeting if this is a new bond
      let updatedMemory = memory;
      if (!hasMoment(memory, 'first_meeting')) {
        updatedMemory = captureMomentFromTemplate(memory, 'first_meeting');
      }

      const insights = generateInsights(bond, updatedMemory);
      const resonance = computeResonance(bond);

      set({
        petId,
        bond,
        memory: updatedMemory,
        insights,
        resonance,
      });
    },

    checkInMood(mood, note) {
      set(state => {
        const updatedBond = recordMoodCheckIn(state.bond, mood, note);

        // Capture significant mood moments
        let updatedMemory = state.memory;
        if (mood === 'struggling' || mood === 'great') {
          const moodLabels = {
            struggling: 'A difficult moment',
            great: 'Feeling great!',
          };
          updatedMemory = captureMoment(
            state.memory,
            'mood_checkin',
            moodLabels[mood],
            note || `Checked in feeling ${mood}`,
            { importance: 'minor', metadata: { moodValue: mood === 'great' ? 5 : 1 } }
          );
        }

        return {
          bond: updatedBond,
          memory: updatedMemory,
          resonance: computeResonance(updatedBond),
        };
      });
    },

    recordVisit(duration) {
      set(state => {
        const updatedBond = recordInteraction(state.bond, 'visit', duration);
        let updatedMemory = state.memory;

        // Check for streak milestones
        const { currentStreak } = updatedBond.patterns;
        const streakMilestones = [7, 14, 30, 60, 100];
        for (const milestone of streakMilestones) {
          if (currentStreak === milestone && !hasMoment(state.memory, `streak_${milestone}`)) {
            updatedMemory = captureMomentFromTemplate(updatedMemory, `streak_${milestone}`);
            break;
          }
        }

        // Check for bond level changes
        if (updatedBond.bondLevel !== state.bond.bondLevel) {
          const templateKey = `bond_${updatedBond.bondLevel}`;
          if (!hasMoment(state.memory, templateKey)) {
            updatedMemory = captureMomentFromTemplate(updatedMemory, templateKey);
          }
        }

        return {
          bond: updatedBond,
          memory: updatedMemory,
          resonance: computeResonance(updatedBond),
        };
      });
    },

    recordActivity(type, duration) {
      set(state => {
        const updatedBond = recordInteraction(state.bond, type, duration);
        let updatedMemory = state.memory;

        // Capture first-time activities
        const firstTimeTemplates: Partial<Record<InteractionType, string>> = {
          feed: 'first_feed',
          play: 'first_play',
        };
        const templateKey = firstTimeTemplates[type];
        if (templateKey && !hasMoment(state.memory, templateKey)) {
          updatedMemory = captureMomentFromTemplate(updatedMemory, templateKey);
        }

        return {
          bond: updatedBond,
          memory: updatedMemory,
        };
      });
    },

    createHabit(name, frequency, description, targetTime) {
      set(state => {
        const updatedBond = addHabit(state.bond, name, frequency, description, targetTime);

        // Only capture if habit was actually added (max 3)
        if (updatedBond.habits.length > state.bond.habits.length) {
          const updatedMemory = captureMoment(
            state.memory,
            'habit_completed', // Reusing type for habit creation
            `New habit: ${name}`,
            `Started tracking "${name}" as a ${frequency} ritual`,
            { importance: 'notable' }
          );
          return { bond: updatedBond, memory: updatedMemory };
        }

        return { bond: updatedBond };
      });
    },

    markHabitComplete(habitId) {
      set(state => {
        const habit = state.bond.habits.find(h => h.id === habitId);
        if (!habit) return {};

        const updatedBond = completeHabit(state.bond, habitId);
        const updatedMemory = captureMoment(
          state.memory,
          'habit_completed',
          `${habit.name} completed`,
          `Completed your ${habit.frequency} ritual`,
          { importance: 'minor', metadata: { habitId } }
        );

        return { bond: updatedBond, memory: updatedMemory };
      });
    },

    deleteHabit(habitId) {
      set(state => ({
        bond: removeHabit(state.bond, habitId),
      }));
    },

    captureCustomMoment(type, title, description, importance = 'minor') {
      set(state => ({
        memory: captureMoment(state.memory, type, title, description, { importance }),
      }));
    },

    captureMilestone(templateKey) {
      set(state => {
        if (hasMoment(state.memory, templateKey)) return {};
        return {
          memory: captureMomentFromTemplate(state.memory, templateKey),
        };
      });
    },

    addNote(momentId, note) {
      set(state => ({
        memory: addNoteToMoment(state.memory, momentId, note),
      }));
    },

    createReflection(note, title) {
      set(state => ({
        memory: createNote(state.memory, note, title),
      }));
    },

    pinMoment(momentId) {
      set(state => ({
        memory: togglePinMoment(state.memory, momentId),
      }));
    },

    refreshInsights() {
      set(state => ({
        insights: generateInsights(state.bond, state.memory),
      }));
    },

    refreshResonance() {
      set(state => ({
        bond: updateResonance(state.bond),
        resonance: computeResonance(state.bond),
      }));
    },

    getWeeklySummary(previousBondPoints = 0) {
      const { bond, memory } = get();
      return generateWeeklySummary(bond, memory, previousBondPoints);
    },

    hydrate(bondState, memoryState) {
      const insights = generateInsights(bondState, memoryState);
      const resonance = computeResonance(bondState);

      set({
        bond: bondState,
        memory: memoryState,
        insights,
        resonance,
      });
    },

    getSnapshot() {
      const { bond, memory } = get();
      return { bond, memory };
    },
  }));
}

// Default store instance
export const useBondStore = createBondStore();
