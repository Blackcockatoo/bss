/**
 * Memory System Types
 *
 * The memory system captures and preserves the journey between
 * user and pet - significant moments, milestones, and reflections.
 */

// Types of moments that can be captured
export type MomentType =
  // Automatic milestones
  | 'first_meeting'       // Pet creation
  | 'first_feed'          // First feed interaction
  | 'first_play'          // First play interaction
  | 'evolution'           // Evolution milestone
  | 'achievement'         // Achievement unlocked
  | 'streak_milestone'    // Streak milestone (7, 14, 30, etc.)
  | 'breeding'            // Bred offspring
  | 'bond_level_up'       // Bond level increased
  // User-initiated
  | 'mood_checkin'        // Mood check-in (significant ones)
  | 'habit_completed'     // Habit completion
  | 'note'                // User-added note/reflection
  | 'photo_moment';       // Snapshot moment (future feature)

// Importance levels
export type MomentImportance = 'minor' | 'notable' | 'significant' | 'milestone';

// A single captured moment
export interface Moment {
  id: string;
  type: MomentType;
  timestamp: number;
  title: string;
  description: string;
  importance: MomentImportance;

  // Optional metadata
  metadata?: {
    evolutionState?: string;
    achievementId?: string;
    moodValue?: number;
    habitId?: string;
    streakDays?: number;
    bondLevel?: string;
    [key: string]: unknown;
  };

  // User additions
  userNote?: string;
  pinned?: boolean;
}

// Memory/journal state
export interface MemoryState {
  moments: Moment[];
  pinnedMomentIds: string[];
  firstMomentAt: number | null;
  lastMomentAt: number | null;
  totalMoments: number;
}

// Summary stats for timeline
export interface MemorySummary {
  totalDaysTogether: number;
  totalMoments: number;
  milestoneCount: number;
  evolutionCount: number;
  achievementCount: number;
  moodCheckInCount: number;
  habitCompletionCount: number;
  noteCount: number;
}

// Filter options for timeline view
export interface MemoryFilter {
  types?: MomentType[];
  importance?: MomentImportance[];
  pinnedOnly?: boolean;
  startDate?: number;
  endDate?: number;
}

// Default memory state
export function createDefaultMemoryState(): MemoryState {
  return {
    moments: [],
    pinnedMomentIds: [],
    firstMomentAt: null,
    lastMomentAt: null,
    totalMoments: 0,
  };
}

// Moment templates for common events
export const MOMENT_TEMPLATES: Record<string, Omit<Moment, 'id' | 'timestamp'>> = {
  first_meeting: {
    type: 'first_meeting',
    title: 'A new beginning',
    description: 'Your journey together has begun.',
    importance: 'milestone',
  },
  first_feed: {
    type: 'first_feed',
    title: 'First meal together',
    description: 'You shared your first feeding moment.',
    importance: 'notable',
  },
  first_play: {
    type: 'first_play',
    title: 'First playtime',
    description: 'You played together for the first time.',
    importance: 'notable',
  },
  evolution_neuro: {
    type: 'evolution',
    title: 'Neural awakening',
    description: 'Your companion evolved to the NEURO stage.',
    importance: 'milestone',
    metadata: { evolutionState: 'NEURO' },
  },
  evolution_quantum: {
    type: 'evolution',
    title: 'Quantum shift',
    description: 'Your companion evolved to the QUANTUM stage.',
    importance: 'milestone',
    metadata: { evolutionState: 'QUANTUM' },
  },
  evolution_speciation: {
    type: 'evolution',
    title: 'Speciation achieved',
    description: 'Your companion reached the final evolution stage.',
    importance: 'milestone',
    metadata: { evolutionState: 'SPECIATION' },
  },
  streak_7: {
    type: 'streak_milestone',
    title: 'One week together',
    description: 'You visited for 7 days in a row.',
    importance: 'notable',
    metadata: { streakDays: 7 },
  },
  streak_14: {
    type: 'streak_milestone',
    title: 'Two weeks strong',
    description: 'A 14-day streak of care and connection.',
    importance: 'significant',
    metadata: { streakDays: 14 },
  },
  streak_30: {
    type: 'streak_milestone',
    title: 'A month of dedication',
    description: '30 consecutive days together.',
    importance: 'milestone',
    metadata: { streakDays: 30 },
  },
  bond_acquaintance: {
    type: 'bond_level_up',
    title: 'Getting to know each other',
    description: 'Your bond has grown to Acquaintance level.',
    importance: 'notable',
    metadata: { bondLevel: 'acquaintance' },
  },
  bond_companion: {
    type: 'bond_level_up',
    title: 'True companions',
    description: 'Your bond has grown to Companion level.',
    importance: 'significant',
    metadata: { bondLevel: 'companion' },
  },
  bond_friend: {
    type: 'bond_level_up',
    title: 'A lasting friendship',
    description: 'Your bond has grown to Friend level.',
    importance: 'milestone',
    metadata: { bondLevel: 'friend' },
  },
  bond_soulmate: {
    type: 'bond_level_up',
    title: 'Soulmates',
    description: 'The deepest bond has been forged.',
    importance: 'milestone',
    metadata: { bondLevel: 'soulmate' },
  },
};
