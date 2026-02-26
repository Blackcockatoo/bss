/**
 * Wellness Store
 *
 * Zustand store for wellness tracking with localStorage persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  WellnessState,
  ReminderMode,
  WellnessFeatures,
  HydrationEntry,
  SleepEntry,
  GroundingSession,
  FocusSession,
  FocusDuration,
  SabbathSession,
  SabbathDuration,
  GratitudeEntry,
  AnxietyLevel,
  createDefaultWellnessState,
  getDateKey,
  getTodayHydration,
} from './types';

interface WellnessActions {
  // Settings
  setReminderMode: (mode: ReminderMode) => void;
  toggleFeature: (feature: keyof WellnessFeatures) => void;
  completeSetup: () => void;

  // Hydration
  logWater: (glasses?: number) => void;
  setHydrationGoal: (glasses: number) => void;

  // Sleep
  startSleep: () => void;
  endSleep: (quality?: 1 | 2 | 3 | 4 | 5, notes?: string) => void;
  logSleepManual: (sleepTime: number, wakeTime: number, quality?: 1 | 2 | 3 | 4 | 5) => void;
  setSleepGoal: (hours: number) => void;

  // Anxiety/Grounding
  logGroundingSession: (level: AnxietyLevel, ritualType: 'tap' | 'hold' | 'breath' | 'yantra', duration: number, completed: boolean) => void;

  // Focus/Pomodoro
  startFocusSession: (duration: FocusDuration) => void;
  endFocusSession: (completed: boolean) => void;
  cancelFocusSession: () => void;

  // Sabbath
  startSabbath: (duration: SabbathDuration) => void;
  endSabbath: (completed: boolean) => void;
  cancelSabbath: () => void;

  // Gratitude
  logGratitude: (entries: string[]) => void;

  // Utility
  checkStreaks: () => void;
  reset: () => void;
}

type WellnessStore = WellnessState & WellnessActions;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Simple hash function for gratitude -> symbols
function hashToSymbol(text: string): string {
  const symbols = ['star', 'moon', 'sun', 'flower', 'tree', 'heart', 'crown', 'key'];
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash = hash & hash;
  }
  return symbols[Math.abs(hash) % symbols.length];
}

export const useWellnessStore = create<WellnessStore>()(
  persist(
    (set, get) => ({
      ...createDefaultWellnessState(),

      // Settings
      setReminderMode: (mode) => set({ reminderMode: mode }),

      toggleFeature: (feature) => set((state) => ({
        enabledFeatures: {
          ...state.enabledFeatures,
          [feature]: !state.enabledFeatures[feature],
        },
      })),

      completeSetup: () => set({ setupCompletedAt: Date.now() }),

      // Hydration
      logWater: (glasses = 1) => set((state) => {
        const entry: HydrationEntry = {
          id: generateId(),
          timestamp: Date.now(),
          amount: glasses,
        };

        const newEntries = [...state.hydration.entries, entry];
        const todayTotal = getTodayHydration({ ...state.hydration, entries: newEntries });
        const today = getDateKey();
        const hitGoal = todayTotal >= state.hydration.dailyGoal;

        let newStreak = state.hydration.streak;
        let lastGoalHitDate = state.hydration.lastGoalHitDate;

        if (hitGoal && lastGoalHitDate !== today) {
          const yesterday = getDateKey(Date.now() - 86400000);
          if (lastGoalHitDate === yesterday) {
            newStreak += 1;
          } else if (lastGoalHitDate !== today) {
            newStreak = 1;
          }
          lastGoalHitDate = today;
        }

        return {
          hydration: {
            ...state.hydration,
            entries: newEntries,
            streak: newStreak,
            lastGoalHitDate,
          },
          lastSyncAt: Date.now(),
        };
      }),

      setHydrationGoal: (glasses) => set((state) => ({
        hydration: { ...state.hydration, dailyGoal: glasses },
      })),

      // Sleep
      startSleep: () => set((state) => {
        if (state.sleep.currentSleep) return state;

        const entry: SleepEntry = {
          id: generateId(),
          sleepTime: Date.now(),
          wakeTime: null,
        };

        return {
          sleep: {
            ...state.sleep,
            currentSleep: entry,
          },
        };
      }),

      endSleep: (quality, notes) => set((state) => {
        if (!state.sleep.currentSleep) return state;

        const completedEntry: SleepEntry = {
          ...state.sleep.currentSleep,
          wakeTime: Date.now(),
          quality,
          notes,
        };

        const sleepHours = (completedEntry.wakeTime! - completedEntry.sleepTime) / (1000 * 60 * 60);
        const hitGoal = sleepHours >= state.sleep.dailyGoal;
        const today = getDateKey();

        let newStreak = state.sleep.streak;
        let lastGoalHitDate = state.sleep.lastGoalHitDate;

        if (hitGoal && lastGoalHitDate !== today) {
          const yesterday = getDateKey(Date.now() - 86400000);
          if (lastGoalHitDate === yesterday) {
            newStreak += 1;
          } else {
            newStreak = 1;
          }
          lastGoalHitDate = today;
        }

        return {
          sleep: {
            ...state.sleep,
            entries: [...state.sleep.entries, completedEntry],
            currentSleep: null,
            streak: newStreak,
            lastGoalHitDate,
          },
          lastSyncAt: Date.now(),
        };
      }),

      logSleepManual: (sleepTime, wakeTime, quality) => set((state) => {
        const entry: SleepEntry = {
          id: generateId(),
          sleepTime,
          wakeTime,
          quality,
        };

        const sleepHours = (wakeTime - sleepTime) / (1000 * 60 * 60);
        const hitGoal = sleepHours >= state.sleep.dailyGoal;
        const wakeDate = getDateKey(wakeTime);

        let newStreak = state.sleep.streak;
        let lastGoalHitDate = state.sleep.lastGoalHitDate;

        if (hitGoal && lastGoalHitDate !== wakeDate) {
          const dayBefore = getDateKey(wakeTime - 86400000);
          if (lastGoalHitDate === dayBefore) {
            newStreak += 1;
          } else {
            newStreak = 1;
          }
          lastGoalHitDate = wakeDate;
        }

        return {
          sleep: {
            ...state.sleep,
            entries: [...state.sleep.entries, entry],
            streak: newStreak,
            lastGoalHitDate,
          },
          lastSyncAt: Date.now(),
        };
      }),

      setSleepGoal: (hours) => set((state) => ({
        sleep: { ...state.sleep, dailyGoal: hours },
      })),

      // Anxiety/Grounding
      logGroundingSession: (level, ritualType, duration, completed) => set((state) => {
        const session: GroundingSession = {
          id: generateId(),
          timestamp: Date.now(),
          anxietyLevel: level,
          ritualType,
          duration,
          completedSuccessfully: completed,
        };

        return {
          anxiety: {
            ...state.anxiety,
            sessions: [...state.anxiety.sessions, session],
            totalSessions: state.anxiety.totalSessions + 1,
            lastSession: Date.now(),
          },
          lastSyncAt: Date.now(),
        };
      }),

      // Focus/Pomodoro
      startFocusSession: (duration) => set((state) => {
        if (state.focus.currentSession) return state;

        const session: FocusSession = {
          id: generateId(),
          startTime: Date.now(),
          duration,
          completedAt: null,
          interrupted: false,
          xpEarned: 0,
        };

        return {
          focus: {
            ...state.focus,
            currentSession: session,
          },
        };
      }),

      endFocusSession: (completed) => set((state) => {
        if (!state.focus.currentSession) return state;

        const xpEarned = completed ? state.focus.currentSession.duration * 2 : 0;
        const completedSession: FocusSession = {
          ...state.focus.currentSession,
          completedAt: Date.now(),
          interrupted: !completed,
          xpEarned,
        };

        const today = getDateKey();
        let newStreak = state.focus.streak;
        let lastSessionDate = state.focus.lastSessionDate;

        if (completed) {
          if (lastSessionDate !== today) {
            const yesterday = getDateKey(Date.now() - 86400000);
            if (lastSessionDate === yesterday) {
              newStreak += 1;
            } else {
              newStreak = 1;
            }
            lastSessionDate = today;
          }
        }

        return {
          focus: {
            ...state.focus,
            sessions: [...state.focus.sessions, completedSession],
            currentSession: null,
            totalCompleted: completed ? state.focus.totalCompleted + 1 : state.focus.totalCompleted,
            streak: newStreak,
            lastSessionDate,
          },
          lastSyncAt: Date.now(),
        };
      }),

      cancelFocusSession: () => set((state) => ({
        focus: {
          ...state.focus,
          currentSession: null,
        },
      })),

      // Sabbath
      startSabbath: (duration) => set((state) => {
        if (state.sabbath.currentSession) return state;

        const session: SabbathSession = {
          id: generateId(),
          startTime: Date.now(),
          targetDuration: duration,
          completedAt: null,
          actualDuration: null,
          xpEarned: 0,
        };

        return {
          sabbath: {
            ...state.sabbath,
            currentSession: session,
          },
        };
      }),

      endSabbath: (completed) => set((state) => {
        if (!state.sabbath.currentSession) return state;

        const actualDuration = (Date.now() - state.sabbath.currentSession.startTime) / (1000 * 60 * 60);
        const targetMet = actualDuration >= state.sabbath.currentSession.targetDuration;
        const xpEarned = completed && targetMet ? state.sabbath.currentSession.targetDuration * 50 : 0;

        const completedSession: SabbathSession = {
          ...state.sabbath.currentSession,
          completedAt: Date.now(),
          actualDuration,
          xpEarned,
        };

        return {
          sabbath: {
            ...state.sabbath,
            sessions: [...state.sabbath.sessions, completedSession],
            currentSession: null,
            longestCompleted: Math.max(state.sabbath.longestCompleted, targetMet ? actualDuration : 0),
            totalCompleted: targetMet ? state.sabbath.totalCompleted + 1 : state.sabbath.totalCompleted,
          },
          lastSyncAt: Date.now(),
        };
      }),

      cancelSabbath: () => set((state) => ({
        sabbath: {
          ...state.sabbath,
          currentSession: null,
        },
      })),

      // Gratitude
      logGratitude: (entries) => set((state) => {
        const symbols = entries.map(e => hashToSymbol(e));
        const entry: GratitudeEntry = {
          id: generateId(),
          timestamp: Date.now(),
          entries,
          symbolsGenerated: symbols,
        };

        const today = getDateKey();
        let newStreak = state.gratitude.streak;
        let lastEntryDate = state.gratitude.lastEntryDate;

        if (lastEntryDate !== today) {
          const yesterday = getDateKey(Date.now() - 86400000);
          if (lastEntryDate === yesterday) {
            newStreak += 1;
          } else {
            newStreak = 1;
          }
          lastEntryDate = today;
        }

        return {
          gratitude: {
            ...state.gratitude,
            entries: [...state.gratitude.entries, entry],
            streak: newStreak,
            lastEntryDate,
            totalEntries: state.gratitude.totalEntries + entries.length,
          },
          lastSyncAt: Date.now(),
        };
      }),

      // Utility
      checkStreaks: () => set((state) => {
        const today = getDateKey();
        const yesterday = getDateKey(Date.now() - 86400000);

        // Reset streaks if more than a day has passed
        const hydrationStreak = state.hydration.lastGoalHitDate === yesterday || state.hydration.lastGoalHitDate === today
          ? state.hydration.streak
          : 0;

        const sleepStreak = state.sleep.lastGoalHitDate === yesterday || state.sleep.lastGoalHitDate === today
          ? state.sleep.streak
          : 0;

        const focusStreak = state.focus.lastSessionDate === yesterday || state.focus.lastSessionDate === today
          ? state.focus.streak
          : 0;

        const gratitudeStreak = state.gratitude.lastEntryDate === yesterday || state.gratitude.lastEntryDate === today
          ? state.gratitude.streak
          : 0;

        return {
          hydration: { ...state.hydration, streak: hydrationStreak },
          sleep: { ...state.sleep, streak: sleepStreak },
          focus: { ...state.focus, streak: focusStreak },
          gratitude: { ...state.gratitude, streak: gratitudeStreak },
        };
      }),

      reset: () => set(createDefaultWellnessState()),
    }),
    {
      name: 'metapet-wellness',
    }
  )
);
