export * from './types';
export { useEducationStore } from './store';
export {
  hashExplorationPattern,
  hashToLearningSymbol,
  deriveStudentDNA,
  compareStudentDNA,
} from './student-dna';

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
} from './types';

export {
  VIBE_EMOJI,
  EDU_ACHIEVEMENTS_CATALOG,
} from './types';
