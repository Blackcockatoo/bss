/**
 * Education Queue Types
 *
 * Types for the lesson queue, student progress tracking,
 * and Student DNA learning profiles.
 *
 * Privacy contract:
 * - Aliases only (no real names or student IDs)
 * - Hashes for exploration patterns (never raw interaction data)
 * - Analytics aggregated as counts/percentages
 * - All data localStorage-only
 */

export type FocusArea =
  | 'pattern-recognition'
  | 'sound-exploration'
  | 'geometry-creation'
  | 'reflection'
  | 'collaboration';

export type DnaMode = 'spiral' | 'mandala' | 'particles' | 'sound' | 'journey' | null;

export type LessonStatus = 'queued' | 'active' | 'paused' | 'completed';

export type SessionMode = 'teacher' | 'student';

/** A single queued lesson/activity created by a teacher */
export interface QueuedLesson {
  id: string;
  title: string;
  description: string;
  focusArea: FocusArea;
  /** Which DNA Hub mode to launch for this lesson (null = no DNA mode) */
  dnaMode: DnaMode;
  targetMinutes: number;
  /** Standards references, e.g. ['NGSS:MS-ETS1-1', 'ISTE:1.1'] */
  standardsRef: string[];
  /** Optional question shown before the activity */
  prePrompt: string | null;
  /** Optional question shown after the activity */
  postPrompt: string | null;
  /** Order in the queue (0-indexed) */
  position: number;
  createdAt: number;
}

/** Progress for a single student on a single lesson */
export interface LessonProgress {
  lessonId: string;
  /** Alias from ClassroomManager roster */
  studentAlias: string;
  status: LessonStatus;
  startedAt: number | null;
  completedAt: number | null;
  /** Total time spent in milliseconds */
  timeSpentMs: number;
  /** Student's answer to the pre-activity prompt */
  preResponse: string | null;
  /** Student's answer to the post-activity prompt */
  postResponse: string | null;
  /** Count of interactions in the DNA Hub mode */
  dnaInteractions: number;
  /** SHA-256 hash of their exploration pattern (privacy-safe) */
  patternHash: string | null;
}

/** Full education queue state */
export interface EducationQueueState {
  queue: QueuedLesson[];
  /** ID of the currently active lesson */
  activeLesson: string | null;
  lessonProgress: LessonProgress[];
  sessionMode: SessionMode;
  sessionStartedAt: number | null;
  sessionEndedAt: number | null;
  totalSessionsRun: number;
  /** Gamification extensions */
  eduXP: EduXP;
  vibeReactions: VibeSnapshot[];
  classEnergy: ClassEnergy;
  eduAchievements: EduAchievement[];
  vibeReactionCount: number;
  completedFocusAreas: Record<FocusArea, number>;
  promptResponseCount: number;
}

/** Aggregated queue analytics (no aliases exposed) */
export interface QueueAnalytics {
  totalLessons: number;
  completedLessons: number;
  activeLessons: number;
  completionRate: number;
  totalStudentsTracked: number;
  averageTimePerLessonMs: number;
  totalDnaInteractions: number;
  updatedAt: number;
}

/** Student DNA learning profile -- the metaphorical learning fingerprint */
export interface StudentDNAProfile {
  alias: string;
  /** SHA-256 hash derived from exploration interactions */
  explorationSeed: string;
  /** Normalized 0-1 affinity for each DNA Hub mode */
  modeAffinities: Record<Exclude<DnaMode, null>, number>;
  /** Derived numeric pattern from interactions */
  patternSignature: number[];
  /** Which DNA seed they gravitate toward */
  soundPreference: 'fire' | 'water' | 'earth' | null;
  /** Total patterns discovered */
  discoveryCount: number;
  /** Derived from reflection response depth (0-1) */
  reflectionDepth: number;
  /** Kid-friendly symbol derived from their pattern */
  learningSymbol: string;
  lastUpdatedAt: number;
}

/** Preset focus areas with kid-friendly labels */
export const FOCUS_AREA_LABELS: Record<FocusArea, string> = {
  'pattern-recognition': 'Find Patterns',
  'sound-exploration': 'Explore Sounds',
  'geometry-creation': 'Create Shapes',
  'reflection': 'Think & Reflect',
  'collaboration': 'Work Together',
};

/** DNA mode labels for the teacher dropdown */
export const DNA_MODE_LABELS: Record<Exclude<DnaMode, null>, string> = {
  spiral: 'DNA Helix Spiral',
  mandala: 'Sacred Mandala',
  particles: 'Particle Field',
  sound: 'Sound Temple',
  journey: 'Guided Journey',
};

/** Learning symbols kids can recognize */
export const LEARNING_SYMBOLS = [
  'star', 'moon', 'sun', 'flower', 'tree',
  'heart', 'crown', 'crystal', 'flame', 'wave',
  'mountain', 'feather',
] as const;

export function createDefaultQueueState(): EducationQueueState {
  return {
    queue: [],
    activeLesson: null,
    lessonProgress: [],
    sessionMode: 'teacher',
    sessionStartedAt: null,
    sessionEndedAt: null,
    totalSessionsRun: 0,
    eduXP: { xp: 0, level: 0, streak: 0, bestStreak: 0, lastCompletedAt: null },
    vibeReactions: [],
    classEnergy: { level: 50, lastUpdatedAt: Date.now(), contributionCount: 0 },
    eduAchievements: [],
    vibeReactionCount: 0,
    completedFocusAreas: {
      'pattern-recognition': 0,
      'sound-exploration': 0,
      'geometry-creation': 0,
      'reflection': 0,
      'collaboration': 0,
    },
    promptResponseCount: 0,
  };
}

// ==================== GAMIFICATION TYPES ====================

/** Vibe reaction types for classroom engagement */
export type VibeReaction = 'fire' | 'brain' | 'sleeping' | 'mind-blown';

/** Emoji mappings for vibe reactions */
export const VIBE_EMOJI: Record<VibeReaction, string> = {
  fire: '🔥',
  brain: '🧠',
  sleeping: '😴',
  'mind-blown': '🤯',
};

/** XP and progression tracking */
export interface EduXP {
  xp: number;
  level: number;
  streak: number;
  bestStreak: number;
  lastCompletedAt: number | null;
}

/** A single vibe reaction snapshot */
export interface VibeSnapshot {
  lessonId: string;
  reaction: VibeReaction;
  timestamp: number;
}

/** Class-wide energy meter (0-100) */
export interface ClassEnergy {
  level: number;
  lastUpdatedAt: number;
  contributionCount: number;
}

/** Achievement IDs for education milestones */
export type EduAchievementId =
  | 'first-steps'
  | 'speedrunner'
  | 'big-brain'
  | 'streak-lord'
  | 'vibe-king'
  | 'class-catalyst'
  | 'pattern-master'
  | 'reflection-sage';

/** Achievement tier levels */
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

/** Education achievement definition */
export interface EduAchievement {
  id: EduAchievementId;
  name: string;
  description: string;
  emoji: string;
  tier: AchievementTier;
  unlockedAt: number | null;
}

/** Achievement catalog with all available achievements */
export const EDU_ACHIEVEMENTS_CATALOG: EduAchievement[] = [
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Complete your first lesson',
    emoji: '👣',
    tier: 'bronze',
    unlockedAt: null,
  },
  {
    id: 'speedrunner',
    name: 'Speedrunner',
    description: 'Finish a lesson in under 50% of target time',
    emoji: '⚡',
    tier: 'silver',
    unlockedAt: null,
  },
  {
    id: 'big-brain',
    name: 'Big Brain',
    description: 'Max out DNA interactions in a single lesson',
    emoji: '🧠',
    tier: 'gold',
    unlockedAt: null,
  },
  {
    id: 'streak-lord',
    name: 'Streak Lord',
    description: 'Complete 5 lessons in a row',
    emoji: '🔥',
    tier: 'gold',
    unlockedAt: null,
  },
  {
    id: 'vibe-king',
    name: 'Vibe King',
    description: 'Send 20+ vibe reactions',
    emoji: '👑',
    tier: 'silver',
    unlockedAt: null,
  },
  {
    id: 'class-catalyst',
    name: 'Class Catalyst',
    description: 'Push class energy above 80%',
    emoji: '💫',
    tier: 'gold',
    unlockedAt: null,
  },
  {
    id: 'pattern-master',
    name: 'Pattern Master',
    description: 'Complete 3 pattern-recognition lessons',
    emoji: '🎯',
    tier: 'silver',
    unlockedAt: null,
  },
  {
    id: 'reflection-sage',
    name: 'Reflection Sage',
    description: 'Answer all prompts for 5 lessons',
    emoji: '🔮',
    tier: 'platinum',
    unlockedAt: null,
  },
];

/** Quick-fire challenge for pattern games */
export interface QuickFireChallenge {
  id: string;
  pattern: number[];
  timeLimitMs: number;
  xpReward: number;
}
