export * from './types';
export * from './engagement';
export { useEducationStore } from './store';
export {
  hashExplorationPattern,
  hashToLearningSymbol,
  deriveStudentDNA,
  compareStudentDNA,
} from './student-dna';
export {
  QUEST_PACKS,
  QUEST_PACK_ORDER,
  buildLessonQuestSummary,
  createEmptyQuestModeCounts,
  evaluateQuestPack,
  getLessonCompletionRequirements,
  getQuestPackById,
  getQuestPackLabel,
  lessonNeedsQuestBoard,
  normalizeLessonDnaMode,
  selectQuestPack,
} from './quests';

// Re-export specific gamification types for convenience
export type {
  EduXP,
  VibeSnapshot,
  ClassEnergy,
  EduAchievement,
  EduAchievementId,
  QuickFireChallenge,
  VibeReaction,
  AchievementTier,
  LessonQuestSummary,
  QuestMode,
  QuestPackId,
} from './types';

export {
  VIBE_EMOJI,
  EDU_ACHIEVEMENTS_CATALOG,
} from './types';
