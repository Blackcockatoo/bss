/**
 * Education Queue Store
 *
 * Zustand store with localStorage persistence for managing
 * lesson queues and student progress tracking.
 *
 * Follows the same pattern as /src/lib/wellness/store.ts
 */

import { generateMeditationPattern, validatePattern } from "@/lib/minigames";
import { PLAN_LIMITS, UNLIMITED } from "@/lib/pricing/plans";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_ENGAGEMENT_CATEGORY,
  normalizeEngagementCategory,
} from "./engagement";
import { getLessonCompletionRequirements } from "./quests";
import {
  DnaMode,
  EDU_ACHIEVEMENTS_CATALOG,
  EduAchievement,
  type EduAchievementId,
  type EducationQueueState,
  FocusArea,
  type LessonProgress,
  type LessonQuestSummary,
  type LessonStatus,
  type QueueAnalytics,
  type QueuedLesson,
  type QuickFireChallenge,
  type SessionMode,
  type VibeReaction,
  type VibeSnapshot,
  createDefaultQueueState,
} from "./types";

function getAnalyticsRetentionDays(): number {
  try {
    const raw = window.localStorage.getItem("metapet-auth");
    if (!raw) return PLAN_LIMITS.free.analyticsRetentionDays;
    const parsed = JSON.parse(raw) as {
      state?: { currentUser?: { subscription?: { planId?: "free" | "pro" } } };
    };
    const planId = parsed?.state?.currentUser?.subscription?.planId ?? "free";
    return PLAN_LIMITS[planId].analyticsRetentionDays;
  } catch {
    return PLAN_LIMITS.free.analyticsRetentionDays;
  }
}

function getCurrentPlanLimits() {
  try {
    const raw = window.localStorage.getItem("metapet-auth");
    if (!raw) return PLAN_LIMITS.free;
    const parsed = JSON.parse(raw) as {
      state?: { currentUser?: { subscription?: { planId?: "free" | "pro" } } };
    };
    const planId = parsed?.state?.currentUser?.subscription?.planId ?? "free";
    return PLAN_LIMITS[planId];
  } catch {
    return PLAN_LIMITS.free;
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

interface CompleteLessonFlairResult {
  completed: boolean;
  missingRequirements: string[];
  newAchievements: EduAchievementId[];
}

function createLessonProgressRecord(
  lessonId: string,
  studentAlias: string,
): LessonProgress {
  return {
    lessonId,
    studentAlias,
    status: "queued",
    startedAt: null,
    completedAt: null,
    timeSpentMs: 0,
    preResponse: null,
    postResponse: null,
    dnaInteractions: 0,
    patternHash: null,
    questSummary: null,
  };
}

function updateLessonProgressRecord(
  lessonProgress: LessonProgress[],
  lessonId: string,
  studentAlias: string,
  updater: (progress: LessonProgress) => LessonProgress,
): LessonProgress[] {
  const recordIndex = lessonProgress.findIndex(
    (progress) =>
      progress.lessonId === lessonId && progress.studentAlias === studentAlias,
  );

  if (recordIndex === -1) {
    return [
      ...lessonProgress,
      updater(createLessonProgressRecord(lessonId, studentAlias)),
    ];
  }

  return lessonProgress.map((progress, index) =>
    index === recordIndex ? updater(progress) : progress,
  );
}

function findLessonProgressRecord(
  lessonProgress: LessonProgress[],
  lessonId: string,
  studentAlias: string,
): LessonProgress | undefined {
  return lessonProgress.find(
    (progress) =>
      progress.lessonId === lessonId && progress.studentAlias === studentAlias,
  );
}

function areQuestSummariesEqual(
  current: LessonQuestSummary | null,
  next: LessonQuestSummary,
): boolean {
  return (
    current?.packId === next.packId &&
    current?.requiredCoreQuests === next.requiredCoreQuests &&
    current?.completedCoreQuests === next.completedCoreQuests &&
    current?.totalCompletedQuests === next.totalCompletedQuests &&
    JSON.stringify(current?.completedQuestIds ?? []) ===
      JSON.stringify(next.completedQuestIds)
  );
}

interface EducationActions {
  // Queue management (teacher)
  addLesson: (
    lesson: Omit<QueuedLesson, "id" | "position" | "createdAt">,
  ) => void;
  removeLesson: (lessonId: string) => void;
  reorderQueue: (lessonId: string, direction: "up" | "down") => void;
  clearQueue: () => void;
  updateLesson: (
    lessonId: string,
    updates: Partial<
      Pick<
        QueuedLesson,
        | "title"
        | "description"
        | "engagementCategory"
        | "focusArea"
        | "dnaMode"
        | "targetMinutes"
        | "standardsRef"
        | "prePrompt"
        | "postPrompt"
      >
    >,
  ) => void;

  // Session flow
  setSessionMode: (mode: SessionMode) => void;
  startSession: () => void;
  endSession: () => void;
  activateLesson: (lessonId: string) => void;
  pauseLesson: (lessonId: string, studentAlias: string) => void;
  completeLesson: (
    lessonId: string,
    studentAlias: string,
  ) => { ready: boolean; missingRequirements: string[] };

  // Student progress
  initProgress: (lessonId: string, studentAlias: string) => void;
  recordPreResponse: (
    lessonId: string,
    studentAlias: string,
    response: string,
  ) => void;
  recordPostResponse: (
    lessonId: string,
    studentAlias: string,
    response: string,
  ) => void;
  incrementDnaInteraction: (lessonId: string, studentAlias: string) => void;
  recordPatternHash: (
    lessonId: string,
    studentAlias: string,
    hash: string,
  ) => void;
  saveQuestSummary: (
    lessonId: string,
    studentAlias: string,
    summary: LessonQuestSummary,
  ) => void;
  addTimeSpent: (lessonId: string, studentAlias: string, ms: number) => void;

  // Analytics
  getQueueAnalytics: () => QueueAnalytics;

  // Gamification actions
  sendVibeReaction: (lessonId: string, reaction: VibeReaction) => void;
  awardXP: (amount: number) => void;
  boostClassEnergy: (amount: number) => void;
  getClassEnergy: () => number;
  completeLessonWithFlair: (
    lessonId: string,
    studentAlias: string,
  ) => CompleteLessonFlairResult;
  checkEduAchievements: () => EduAchievementId[];
  generateQuickFire: (difficulty: number) => QuickFireChallenge;
  scoreQuickFire: (
    challengeId: string,
    userPattern: number[],
    timeMs: number,
    originalPattern: number[],
  ) => { success: boolean; xpAwarded: number };

  // Reset
  reset: () => void;
}

type EducationStore = EducationQueueState & EducationActions;

export const useEducationStore = create<EducationStore>()(
  persist(
    (set, get) => ({
      ...createDefaultQueueState(),

      // ---------- Queue management ----------

      addLesson: (lesson) =>
        set((state) => {
          const lessonLimit =
            typeof window === "undefined"
              ? PLAN_LIMITS.free.maxLessonsInQueue
              : getCurrentPlanLimits().maxLessonsInQueue;
          if (lessonLimit !== UNLIMITED && state.queue.length >= lessonLimit) {
            return state;
          }

          const newLesson: QueuedLesson = {
            ...lesson,
            engagementCategory: normalizeEngagementCategory(
              lesson.engagementCategory,
            ),
            id: generateId(),
            position: state.queue.length,
            createdAt: Date.now(),
          };
          return { queue: [...state.queue, newLesson] };
        }),

      removeLesson: (lessonId) =>
        set((state) => {
          const filtered = state.queue
            .filter((l) => l.id !== lessonId)
            .map((l, i) => ({ ...l, position: i }));
          return {
            queue: filtered,
            activeLesson:
              state.activeLesson === lessonId ? null : state.activeLesson,
            lessonProgress: state.lessonProgress.filter(
              (p) => p.lessonId !== lessonId,
            ),
          };
        }),

      reorderQueue: (lessonId, direction) =>
        set((state) => {
          const idx = state.queue.findIndex((l) => l.id === lessonId);
          if (idx === -1) return state;
          const newIdx = direction === "up" ? idx - 1 : idx + 1;
          if (newIdx < 0 || newIdx >= state.queue.length) return state;

          const newQueue = [...state.queue];
          const temp = newQueue[idx];
          newQueue[idx] = newQueue[newIdx];
          newQueue[newIdx] = temp;
          return {
            queue: newQueue.map((l, i) => ({ ...l, position: i })),
          };
        }),

      clearQueue: () =>
        set({
          queue: [],
          activeLesson: null,
          lessonProgress: [],
        }),

      updateLesson: (lessonId, updates) =>
        set((state) => ({
          queue: state.queue.map((l) =>
            l.id === lessonId
              ? {
                  ...l,
                  ...updates,
                  engagementCategory: normalizeEngagementCategory(
                    updates.engagementCategory ?? l.engagementCategory,
                  ),
                }
              : l,
          ),
        })),

      // ---------- Session flow ----------

      setSessionMode: (mode) => set({ sessionMode: mode }),

      startSession: () =>
        set((state) => ({
          sessionStartedAt: Date.now(),
          sessionEndedAt: null,
          totalSessionsRun: state.totalSessionsRun + 1,
        })),

      endSession: () =>
        set({
          sessionEndedAt: Date.now(),
          activeLesson: null,
        }),

      activateLesson: (lessonId) => set({ activeLesson: lessonId }),

      pauseLesson: (lessonId, studentAlias) =>
        set((state) => ({
          lessonProgress: updateLessonProgressRecord(
            state.lessonProgress,
            lessonId,
            studentAlias,
            (progress) => ({
              ...progress,
              status: "paused" as LessonStatus,
              startedAt: progress.startedAt ?? Date.now(),
            }),
          ),
        })),

      completeLesson: (lessonId, studentAlias) => {
        const state = get();
        const lesson = state.queue.find((entry) => entry.id === lessonId);
        const progress = findLessonProgressRecord(
          state.lessonProgress,
          lessonId,
          studentAlias,
        );
        const requirements = getLessonCompletionRequirements(lesson, progress);

        if (!requirements.ready) {
          return requirements;
        }

        set((current) => ({
          lessonProgress: updateLessonProgressRecord(
            current.lessonProgress,
            lessonId,
            studentAlias,
            (record) => ({
              ...record,
              status: "completed" as LessonStatus,
              startedAt: record.startedAt ?? Date.now(),
              completedAt: record.completedAt ?? Date.now(),
            }),
          ),
        }));

        return requirements;
      },

      // ---------- Student progress ----------

      initProgress: (lessonId, studentAlias) =>
        set((state) => {
          const exists = state.lessonProgress.some(
            (p) => p.lessonId === lessonId && p.studentAlias === studentAlias,
          );
          if (exists) return state;

          return {
            lessonProgress: [
              ...state.lessonProgress,
              createLessonProgressRecord(lessonId, studentAlias),
            ],
          };
        }),

      recordPreResponse: (lessonId, studentAlias, response) =>
        set((state) => ({
          lessonProgress: updateLessonProgressRecord(
            state.lessonProgress,
            lessonId,
            studentAlias,
            (progress) => ({
              ...progress,
              preResponse: response,
              status:
                progress.status === "completed"
                  ? progress.status
                  : ("active" as LessonStatus),
              startedAt: progress.startedAt ?? Date.now(),
            }),
          ),
          promptResponseCount: state.promptResponseCount + 1,
        })),

      recordPostResponse: (lessonId, studentAlias, response) =>
        set((state) => ({
          lessonProgress: updateLessonProgressRecord(
            state.lessonProgress,
            lessonId,
            studentAlias,
            (progress) => ({
              ...progress,
              postResponse: response,
              status:
                progress.status === "completed"
                  ? progress.status
                  : ("active" as LessonStatus),
              startedAt: progress.startedAt ?? Date.now(),
            }),
          ),
          promptResponseCount: state.promptResponseCount + 1,
        })),

      incrementDnaInteraction: (lessonId, studentAlias) =>
        set((state) => ({
          lessonProgress: updateLessonProgressRecord(
            state.lessonProgress,
            lessonId,
            studentAlias,
            (progress) => ({
              ...progress,
              dnaInteractions: progress.dnaInteractions + 1,
              status:
                progress.status === "completed"
                  ? progress.status
                  : ("active" as LessonStatus),
              startedAt: progress.startedAt ?? Date.now(),
            }),
          ),
        })),

      recordPatternHash: (lessonId, studentAlias, hash) =>
        set((state) => ({
          lessonProgress: updateLessonProgressRecord(
            state.lessonProgress,
            lessonId,
            studentAlias,
            (progress) => ({
              ...progress,
              patternHash: hash,
              startedAt: progress.startedAt ?? Date.now(),
            }),
          ),
        })),

      saveQuestSummary: (lessonId, studentAlias, summary) =>
        set((state) => ({
          lessonProgress: updateLessonProgressRecord(
            state.lessonProgress,
            lessonId,
            studentAlias,
            (progress) => {
              if (areQuestSummariesEqual(progress.questSummary, summary)) {
                return progress;
              }

              return {
                ...progress,
                questSummary: summary,
                status:
                  progress.status === "completed"
                    ? progress.status
                    : ("active" as LessonStatus),
                startedAt: progress.startedAt ?? Date.now(),
              };
            },
          ),
        })),

      addTimeSpent: (lessonId, studentAlias, ms) =>
        set((state) => ({
          lessonProgress: updateLessonProgressRecord(
            state.lessonProgress,
            lessonId,
            studentAlias,
            (progress) => ({
              ...progress,
              timeSpentMs: progress.timeSpentMs + ms,
              status:
                progress.status === "completed"
                  ? progress.status
                  : ("active" as LessonStatus),
              startedAt: progress.startedAt ?? Date.now(),
            }),
          ),
        })),

      // ---------- Local class summaries (aggregated, no aliases) ----------

      getQueueAnalytics: () => {
        const state = get();
        const retentionDays =
          typeof window === "undefined"
            ? PLAN_LIMITS.free.analyticsRetentionDays
            : getAnalyticsRetentionDays();
        const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
        const cutoff = Date.now() - retentionMs;

        const retainedProgress = state.lessonProgress.filter((progress) => {
          const timestamp = progress.completedAt ?? progress.startedAt ?? 0;
          return timestamp >= cutoff;
        });

        const completed = retainedProgress.filter(
          (p) => p.status === "completed",
        );
        const active = retainedProgress.filter((p) => p.status === "active");
        const totalTime = completed.reduce((sum, p) => sum + p.timeSpentMs, 0);
        const uniqueStudents = new Set(
          retainedProgress.map((p) => p.studentAlias),
        );

        return {
          totalLessons: state.queue.length,
          completedLessons: completed.length,
          activeLessons: active.length,
          completionRate:
            retainedProgress.length === 0
              ? 0
              : completed.length / retainedProgress.length,
          totalStudentsTracked: uniqueStudents.size,
          averageTimePerLessonMs:
            completed.length === 0 ? 0 : totalTime / completed.length,
          totalDnaInteractions: state.lessonProgress.reduce(
            (sum, p) => sum + p.dnaInteractions,
            0,
          ),
          updatedAt: Date.now(),
        };
      },

      // ---------- Gamification Actions ----------

      sendVibeReaction: (lessonId, reaction) =>
        set((state) => {
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

      awardXP: (amount) =>
        set((state) => {
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

      boostClassEnergy: (amount) =>
        set((state) => ({
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
        const decayedLevel = Math.max(
          0,
          state.classEnergy.level - elapsedMinutes * 0.5,
        );
        return Math.round(decayedLevel);
      },

      completeLessonWithFlair: (lessonId, studentAlias) => {
        const beforeCompletion = get();
        const existingProgress = findLessonProgressRecord(
          beforeCompletion.lessonProgress,
          lessonId,
          studentAlias,
        );
        const wasAlreadyCompleted = existingProgress?.status === "completed";
        const completion = get().completeLesson(lessonId, studentAlias);

        if (!completion.ready) {
          return {
            completed: false,
            missingRequirements: completion.missingRequirements,
            newAchievements: [],
          };
        }

        if (wasAlreadyCompleted) {
          return {
            completed: true,
            missingRequirements: [],
            newAchievements: [],
          };
        }

        const state = get();

        // Award 25 XP
        const newXP = state.eduXP.xp + 25;
        const newLevel = Math.floor(newXP / 100);

        // Get lesson's focus area for tracking
        const lesson = state.queue.find((l) => l.id === lessonId);
        const focusArea = lesson?.focusArea;

        // Update completed focus areas
        const newCompletedFocusAreas = { ...state.completedFocusAreas };
        if (focusArea) {
          newCompletedFocusAreas[focusArea] =
            (newCompletedFocusAreas[focusArea] || 0) + 1;
        }

        // Boost energy by 10
        const newEnergyLevel = Math.min(100, state.classEnergy.level + 10);

        set({
          eduXP: {
            xp: newXP,
            level: newLevel,
            streak: 0,
            bestStreak: 0,
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

        return {
          completed: true,
          missingRequirements: [],
          newAchievements,
        };
      },

      checkEduAchievements: () => {
        const state = get();
        const newlyUnlocked: EduAchievementId[] = [];
        const now = Date.now();

        // Build updated achievements list
        const updatedAchievements = [...state.eduAchievements];

        // Initialize achievements from catalog if empty
        if (updatedAchievements.length === 0) {
          updatedAchievements.push(
            ...EDU_ACHIEVEMENTS_CATALOG.map((a) => ({ ...a })),
          );
        }

        const findAchievement = (id: EduAchievementId) =>
          updatedAchievements.find((a) => a.id === id);

        const unlock = (id: EduAchievementId) => {
          const achievement = findAchievement(id);
          if (achievement && !achievement.unlockedAt) {
            achievement.unlockedAt = now;
            newlyUnlocked.push(id);
          }
        };

        const completedLessons = state.lessonProgress.filter(
          (p) => p.status === "completed",
        );

        // First Steps - complete first lesson
        if (completedLessons.length >= 1) {
          unlock("first-steps");
        }

        // Steady Finisher - complete within the suggested time window
        for (const progress of completedLessons) {
          const lesson = state.queue.find((l) => l.id === progress.lessonId);
          if (lesson && progress.timeSpentMs > 0) {
            const targetMs = lesson.targetMinutes * 60 * 1000;
            if (progress.timeSpentMs <= targetMs) {
              unlock("speedrunner");
              break;
            }
          }
        }

        // Big Brain - max interactions in a lesson (50+)
        const maxInteractions = Math.max(
          0,
          ...state.lessonProgress.map((p) => p.dnaInteractions),
        );
        if (maxInteractions >= 50) {
          unlock("big-brain");
        }

        // Steady Practice - 5 completed lessons
        if (completedLessons.length >= 5) {
          unlock("streak-lord");
        }

        // Vibe King - 20+ vibe reactions sent
        if (state.vibeReactionCount >= 20) {
          unlock("vibe-king");
        }

        // Class Catalyst - push class energy above 80
        if (state.classEnergy.level > 80) {
          unlock("class-catalyst");
        }

        // Pattern Master - 3 pattern-recognition lessons
        if (state.completedFocusAreas["pattern-recognition"] >= 3) {
          unlock("pattern-master");
        }

        // Reflection Sage - all prompts answered for 5 lessons
        const fullyAnswered = state.lessonProgress.filter(
          (p) => p.status === "completed" && p.preResponse && p.postResponse,
        );
        if (fullyAnswered.length >= 5) {
          unlock("reflection-sage");
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

      scoreQuickFire: (_challengeId, userPattern, _timeMs, originalPattern) => {
        const result = validatePattern(originalPattern, userPattern);

        if (result.correct) {
          const totalXP = 12 + originalPattern.length * 2;

          get().awardXP(totalXP);

          return { success: true, xpAwarded: totalXP };
        }

        return { success: false, xpAwarded: 0 };
      },

      // ---------- Reset ----------

      reset: () => set(createDefaultQueueState()),
    }),
    {
      name: "metapet-education-queue",
      version: 4,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Partial<EducationQueueState>;
        const defaults = createDefaultQueueState();
        let migrated: EducationQueueState = {
          ...defaults,
          ...state,
        } as EducationQueueState;

        if (version < 2) {
          migrated = {
            ...defaults,
            ...state,
            eduXP: state.eduXP ?? defaults.eduXP,
            vibeReactions: state.vibeReactions ?? defaults.vibeReactions,
            classEnergy: state.classEnergy ?? defaults.classEnergy,
            eduAchievements: state.eduAchievements ?? defaults.eduAchievements,
            vibeReactionCount:
              state.vibeReactionCount ?? defaults.vibeReactionCount,
            completedFocusAreas:
              state.completedFocusAreas ?? defaults.completedFocusAreas,
            promptResponseCount:
              state.promptResponseCount ?? defaults.promptResponseCount,
          } as EducationQueueState;

          migrated = {
            ...migrated,
            eduXP: {
              ...migrated.eduXP,
              streak: 0,
              bestStreak: 0,
            },
          };
        }

        if (version < 3) {
          migrated = {
            ...migrated,
            eduXP: {
              ...migrated.eduXP,
              streak: 0,
              bestStreak: 0,
            },
          } as EducationQueueState;
        }

        if (version < 4) {
          migrated = {
            ...migrated,
            queue: (migrated.queue ?? defaults.queue).map((lesson) => ({
              ...lesson,
              engagementCategory: normalizeEngagementCategory(
                lesson.engagementCategory ?? DEFAULT_ENGAGEMENT_CATEGORY,
              ),
            })),
          } as EducationQueueState;
        }

        return {
          ...migrated,
          queue: (migrated.queue ?? defaults.queue).map((lesson) => ({
            ...lesson,
            engagementCategory: normalizeEngagementCategory(
              lesson.engagementCategory,
            ),
          })),
        };
      },
    },
  ),
);
