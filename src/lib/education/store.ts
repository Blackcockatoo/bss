/**
 * Education Queue Store
 *
 * Zustand store with localStorage persistence for managing
 * lesson queues and student progress tracking.
 *
 * Follows the same pattern as /src/lib/wellness/store.ts
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateMeditationPattern, validatePattern } from '@/lib/minigames';
import {
  EducationQueueState,
  QueuedLesson,
  LessonProgress,
  LessonStatus,
  SessionMode,
  FocusArea,
  DnaMode,
  QueueAnalytics,
  createDefaultQueueState,
  VibeReaction,
  VibeSnapshot,
  EduAchievementId,
  EduAchievement,
  EDU_ACHIEVEMENTS_CATALOG,
  QuickFireChallenge,
} from './types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

interface CompleteLessonFlairResult {
  newAchievements: EduAchievementId[];
}

interface EducationActions {
  // Queue management (teacher)
  addLesson: (lesson: Omit<QueuedLesson, 'id' | 'position' | 'createdAt'>) => void;
  removeLesson: (lessonId: string) => void;
  reorderQueue: (lessonId: string, direction: 'up' | 'down') => void;
  clearQueue: () => void;
  updateLesson: (lessonId: string, updates: Partial<Pick<QueuedLesson, 'title' | 'description' | 'focusArea' | 'dnaMode' | 'targetMinutes' | 'standardsRef' | 'prePrompt' | 'postPrompt'>>) => void;

  // Session flow
  setSessionMode: (mode: SessionMode) => void;
  startSession: () => void;
  endSession: () => void;
  activateLesson: (lessonId: string) => void;
  pauseLesson: (lessonId: string, studentAlias: string) => void;
  completeLesson: (lessonId: string, studentAlias: string) => void;

  // Student progress
  initProgress: (lessonId: string, studentAlias: string) => void;
  recordPreResponse: (lessonId: string, studentAlias: string, response: string) => void;
  recordPostResponse: (lessonId: string, studentAlias: string, response: string) => void;
  incrementDnaInteraction: (lessonId: string, studentAlias: string) => void;
  recordPatternHash: (lessonId: string, studentAlias: string, hash: string) => void;
  addTimeSpent: (lessonId: string, studentAlias: string, ms: number) => void;

  // Analytics
  getQueueAnalytics: () => QueueAnalytics;

  // Gamification actions
  sendVibeReaction: (lessonId: string, reaction: VibeReaction) => void;
  awardXP: (amount: number) => void;
  boostClassEnergy: (amount: number) => void;
  getClassEnergy: () => number;
  completeLessonWithFlair: (lessonId: string, studentAlias: string) => CompleteLessonFlairResult;
  checkEduAchievements: () => EduAchievementId[];
  generateQuickFire: (difficulty: number) => QuickFireChallenge;
  scoreQuickFire: (challengeId: string, userPattern: number[], timeMs: number, originalPattern: number[]) => { success: boolean; xpAwarded: number };

  // Reset
  reset: () => void;
}

type EducationStore = EducationQueueState & EducationActions;

export const useEducationStore = create<EducationStore>()(
  persist(
    (set, get) => ({
      ...createDefaultQueueState(),

      // ---------- Queue management ----------

      addLesson: (lesson) => set((state) => {
        const newLesson: QueuedLesson = {
          ...lesson,
          id: generateId(),
          position: state.queue.length,
          createdAt: Date.now(),
        };
        return { queue: [...state.queue, newLesson] };
      }),

      removeLesson: (lessonId) => set((state) => {
        const filtered = state.queue
          .filter((l) => l.id !== lessonId)
          .map((l, i) => ({ ...l, position: i }));
        return {
          queue: filtered,
          activeLesson: state.activeLesson === lessonId ? null : state.activeLesson,
          lessonProgress: state.lessonProgress.filter((p) => p.lessonId !== lessonId),
        };
      }),

      reorderQueue: (lessonId, direction) => set((state) => {
        const idx = state.queue.findIndex((l) => l.id === lessonId);
        if (idx === -1) return state;
        const newIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= state.queue.length) return state;

        const newQueue = [...state.queue];
        const temp = newQueue[idx];
        newQueue[idx] = newQueue[newIdx];
        newQueue[newIdx] = temp;
        return {
          queue: newQueue.map((l, i) => ({ ...l, position: i })),
        };
      }),

      clearQueue: () => set({
        queue: [],
        activeLesson: null,
        lessonProgress: [],
      }),

      updateLesson: (lessonId, updates) => set((state) => ({
        queue: state.queue.map((l) =>
          l.id === lessonId ? { ...l, ...updates } : l
        ),
      })),

      // ---------- Session flow ----------

      setSessionMode: (mode) => set({ sessionMode: mode }),

      startSession: () => set((state) => ({
        sessionStartedAt: Date.now(),
        sessionEndedAt: null,
        totalSessionsRun: state.totalSessionsRun + 1,
      })),

      endSession: () => set({
        sessionEndedAt: Date.now(),
        activeLesson: null,
      }),

      activateLesson: (lessonId) => set({ activeLesson: lessonId }),

      pauseLesson: (lessonId, studentAlias) => set((state) => ({
        lessonProgress: state.lessonProgress.map((p) =>
          p.lessonId === lessonId && p.studentAlias === studentAlias
            ? { ...p, status: 'paused' as LessonStatus }
            : p
        ),
      })),

      completeLesson: (lessonId, studentAlias) => set((state) => ({
        lessonProgress: state.lessonProgress.map((p) =>
          p.lessonId === lessonId && p.studentAlias === studentAlias
            ? { ...p, status: 'completed' as LessonStatus, completedAt: Date.now() }
            : p
        ),
      })),

      // ---------- Student progress ----------

      initProgress: (lessonId, studentAlias) => set((state) => {
        const exists = state.lessonProgress.some(
          (p) => p.lessonId === lessonId && p.studentAlias === studentAlias
        );
        if (exists) return state;

        const progress: LessonProgress = {
          lessonId,
          studentAlias,
          status: 'queued',
          startedAt: null,
          completedAt: null,
          timeSpentMs: 0,
          preResponse: null,
          postResponse: null,
          dnaInteractions: 0,
          patternHash: null,
        };
        return { lessonProgress: [...state.lessonProgress, progress] };
      }),

      recordPreResponse: (lessonId, studentAlias, response) => set((state) => ({
        lessonProgress: state.lessonProgress.map((p) =>
          p.lessonId === lessonId && p.studentAlias === studentAlias
            ? { ...p, preResponse: response, status: 'active' as LessonStatus, startedAt: p.startedAt ?? Date.now() }
            : p
        ),
        promptResponseCount: state.promptResponseCount + 1,
      })),

      recordPostResponse: (lessonId, studentAlias, response) => set((state) => ({
        lessonProgress: state.lessonProgress.map((p) =>
          p.lessonId === lessonId && p.studentAlias === studentAlias
            ? { ...p, postResponse: response }
            : p
        ),
        promptResponseCount: state.promptResponseCount + 1,
      })),

      incrementDnaInteraction: (lessonId, studentAlias) => set((state) => ({
        lessonProgress: state.lessonProgress.map((p) =>
          p.lessonId === lessonId && p.studentAlias === studentAlias
            ? { ...p, dnaInteractions: p.dnaInteractions + 1 }
            : p
        ),
      })),

      recordPatternHash: (lessonId, studentAlias, hash) => set((state) => ({
        lessonProgress: state.lessonProgress.map((p) =>
          p.lessonId === lessonId && p.studentAlias === studentAlias
            ? { ...p, patternHash: hash }
            : p
        ),
      })),

      addTimeSpent: (lessonId, studentAlias, ms) => set((state) => ({
        lessonProgress: state.lessonProgress.map((p) =>
          p.lessonId === lessonId && p.studentAlias === studentAlias
            ? { ...p, timeSpentMs: p.timeSpentMs + ms }
            : p
        ),
      })),

      // ---------- Analytics (aggregated, no aliases) ----------

      getQueueAnalytics: () => {
        const state = get();
        const completed = state.lessonProgress.filter((p) => p.status === 'completed');
        const active = state.lessonProgress.filter((p) => p.status === 'active');
        const totalTime = completed.reduce((sum, p) => sum + p.timeSpentMs, 0);
        const uniqueStudents = new Set(state.lessonProgress.map((p) => p.studentAlias));

        return {
          totalLessons: state.queue.length,
          completedLessons: completed.length,
          activeLessons: active.length,
          completionRate: state.lessonProgress.length === 0
            ? 0
            : completed.length / state.lessonProgress.length,
          totalStudentsTracked: uniqueStudents.size,
          averageTimePerLessonMs: completed.length === 0 ? 0 : totalTime / completed.length,
          totalDnaInteractions: state.lessonProgress.reduce((sum, p) => sum + p.dnaInteractions, 0),
          updatedAt: Date.now(),
        };
      },

      // ---------- Gamification Actions ----------

      sendVibeReaction: (lessonId, reaction) => set((state) => {
        const snapshot: VibeSnapshot = {
          lessonId,
          reaction,
          timestamp: Date.now(),
        };
        // Keep only last 50 reactions
        const newReactions = [...state.vibeReactions, snapshot].slice(-50);
        const newCount = state.vibeReactionCount + 1;
        // Boost class energy by 3
        const newEnergyLevel = Math.min(100, state.classEnergy.level + 3);

        return {
          vibeReactions: newReactions,
          vibeReactionCount: newCount,
          classEnergy: {
            ...state.classEnergy,
            level: newEnergyLevel,
            contributionCount: state.classEnergy.contributionCount + 1,
            lastUpdatedAt: Date.now(),
          },
        };
      }),

      awardXP: (amount) => set((state) => {
        const newXP = state.eduXP.xp + amount;
        const newLevel = Math.floor(newXP / 100);
        return {
          eduXP: {
            ...state.eduXP,
            xp: newXP,
            level: newLevel,
          },
        };
      }),

      boostClassEnergy: (amount) => set((state) => ({
        classEnergy: {
          ...state.classEnergy,
          level: Math.min(100, state.classEnergy.level + amount),
          contributionCount: state.classEnergy.contributionCount + 1,
          lastUpdatedAt: Date.now(),
        },
      })),

      getClassEnergy: () => {
        const state = get();
        // Lazy decay: subtract elapsed_minutes * 0.5 from stored level
        const elapsedMs = Date.now() - state.classEnergy.lastUpdatedAt;
        const elapsedMinutes = elapsedMs / (1000 * 60);
        const decayedLevel = Math.max(0, state.classEnergy.level - (elapsedMinutes * 0.5));
        return Math.round(decayedLevel);
      },

      completeLessonWithFlair: (lessonId, studentAlias) => {
        const state = get();

        // Call existing completeLesson
        set((s) => ({
          lessonProgress: s.lessonProgress.map((p) =>
            p.lessonId === lessonId && p.studentAlias === studentAlias
              ? { ...p, status: 'completed' as LessonStatus, completedAt: Date.now() }
              : p
          ),
        }));

        // Award 25 XP
        const newXP = state.eduXP.xp + 25;
        const newLevel = Math.floor(newXP / 100);

        // Increment streak
        const newStreak = state.eduXP.streak + 1;
        const newBestStreak = Math.max(state.eduXP.bestStreak, newStreak);

        // Get lesson's focus area for tracking
        const lesson = state.queue.find((l) => l.id === lessonId);
        const focusArea = lesson?.focusArea;

        // Update completed focus areas
        const newCompletedFocusAreas = { ...state.completedFocusAreas };
        if (focusArea) {
          newCompletedFocusAreas[focusArea] = (newCompletedFocusAreas[focusArea] || 0) + 1;
        }

        // Boost energy by 10
        const newEnergyLevel = Math.min(100, state.classEnergy.level + 10);

        set({
          eduXP: {
            xp: newXP,
            level: newLevel,
            streak: newStreak,
            bestStreak: newBestStreak,
            lastCompletedAt: Date.now(),
          },
          classEnergy: {
            ...state.classEnergy,
            level: newEnergyLevel,
            contributionCount: state.classEnergy.contributionCount + 1,
            lastUpdatedAt: Date.now(),
          },
          completedFocusAreas: newCompletedFocusAreas,
        });

        // Check achievements
        const newAchievements = get().checkEduAchievements();

        return { newAchievements };
      },

      checkEduAchievements: () => {
        const state = get();
        const newlyUnlocked: EduAchievementId[] = [];
        const now = Date.now();

        // Build updated achievements list
        const updatedAchievements = [...state.eduAchievements];

        // Initialize achievements from catalog if empty
        if (updatedAchievements.length === 0) {
          updatedAchievements.push(...EDU_ACHIEVEMENTS_CATALOG.map(a => ({ ...a })));
        }

        const findAchievement = (id: EduAchievementId) =>
          updatedAchievements.find(a => a.id === id);

        const unlock = (id: EduAchievementId) => {
          const achievement = findAchievement(id);
          if (achievement && !achievement.unlockedAt) {
            achievement.unlockedAt = now;
            newlyUnlocked.push(id);
          }
        };

        const completedLessons = state.lessonProgress.filter(p => p.status === 'completed');

        // First Steps - complete first lesson
        if (completedLessons.length >= 1) {
          unlock('first-steps');
        }

        // Speedrunner - finish under 50% target time
        for (const progress of completedLessons) {
          const lesson = state.queue.find(l => l.id === progress.lessonId);
          if (lesson && progress.timeSpentMs > 0) {
            const targetMs = lesson.targetMinutes * 60 * 1000;
            if (progress.timeSpentMs < targetMs * 0.5) {
              unlock('speedrunner');
              break;
            }
          }
        }

        // Big Brain - max interactions in a lesson (50+)
        const maxInteractions = Math.max(0, ...state.lessonProgress.map(p => p.dnaInteractions));
        if (maxInteractions >= 50) {
          unlock('big-brain');
        }

        // Streak Lord - 5 consecutive completions
        if (state.eduXP.streak >= 5) {
          unlock('streak-lord');
        }

        // Vibe King - 20+ vibe reactions sent
        if (state.vibeReactionCount >= 20) {
          unlock('vibe-king');
        }

        // Class Catalyst - push class energy above 80
        if (state.classEnergy.level > 80) {
          unlock('class-catalyst');
        }

        // Pattern Master - 3 pattern-recognition lessons
        if (state.completedFocusAreas['pattern-recognition'] >= 3) {
          unlock('pattern-master');
        }

        // Reflection Sage - all prompts answered for 5 lessons
        const fullyAnswered = state.lessonProgress.filter(
          p => p.status === 'completed' && p.preResponse && p.postResponse
        );
        if (fullyAnswered.length >= 5) {
          unlock('reflection-sage');
        }

        if (newlyUnlocked.length > 0) {
          set({ eduAchievements: updatedAchievements });
        }

        return newlyUnlocked;
      },

      generateQuickFire: (difficulty) => {
        const patternLength = 4 + difficulty;
        const pattern = generateMeditationPattern(Date.now(), patternLength);
        const timeLimitMs = Math.max(5000, 15000 - difficulty * 2000);
        const xpReward = 10 + difficulty * 5;

        return {
          id: generateId(),
          pattern,
          timeLimitMs,
          xpReward,
        };
      },

      scoreQuickFire: (challengeId, userPattern, timeMs, originalPattern) => {
        const result = validatePattern(originalPattern, userPattern);

        if (result.correct) {
          // Award XP based on time bonus
          const baseXP = 15;
          const timeBonus = Math.floor((1 - Math.min(timeMs / 15000, 1)) * 10);
          const totalXP = baseXP + timeBonus;

          get().awardXP(totalXP);

          return { success: true, xpAwarded: totalXP };
        }

        return { success: false, xpAwarded: 0 };
      },

      // ---------- Reset ----------

      reset: () => set(createDefaultQueueState()),
    }),
    {
      name: 'metapet-education-queue',
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Partial<EducationQueueState>;
        if (version < 2) {
          // Migrate from version 1: add new gamification fields
          const defaults = createDefaultQueueState();
          return {
            ...defaults,
            ...state,
            eduXP: state.eduXP ?? defaults.eduXP,
            vibeReactions: state.vibeReactions ?? defaults.vibeReactions,
            classEnergy: state.classEnergy ?? defaults.classEnergy,
            eduAchievements: state.eduAchievements ?? defaults.eduAchievements,
            vibeReactionCount: state.vibeReactionCount ?? defaults.vibeReactionCount,
            completedFocusAreas: state.completedFocusAreas ?? defaults.completedFocusAreas,
            promptResponseCount: state.promptResponseCount ?? defaults.promptResponseCount,
          };
        }
        return state as EducationQueueState;
      },
    }
  )
);
