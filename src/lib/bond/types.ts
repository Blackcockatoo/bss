/**
 * Bond System Types
 *
 * The bond system tracks the relationship between user and pet,
 * enabling the pet to "know" the user through:
 * - Mood check-ins (user's emotional state)
 * - Interaction patterns (when/how they engage)
 * - Habits/rituals (routines they want to build)
 */

// User mood states (5-state simple system)
export type UserMood = 'struggling' | 'low' | 'neutral' | 'good' | 'great';

export const USER_MOOD_VALUES: Record<UserMood, number> = {
  struggling: 1,
  low: 2,
  neutral: 3,
  good: 4,
  great: 5,
};

export const USER_MOOD_LABELS: Record<UserMood, string> = {
  struggling: 'Struggling',
  low: 'A bit low',
  neutral: 'Okay',
  good: 'Good',
  great: 'Great',
};

export const USER_MOOD_ICONS: Record<UserMood, string> = {
  struggling: '😔',
  low: '😕',
  neutral: '😐',
  good: '🙂',
  great: '😊',
};

// Mood check-in record
export interface MoodCheckIn {
  id: string;
  mood: UserMood;
  timestamp: number;
  note?: string; // Optional user note
  context?: 'morning' | 'afternoon' | 'evening' | 'night'; // Time context
}

// Interaction pattern types
export type InteractionType = 'visit' | 'feed' | 'clean' | 'play' | 'sleep' | 'minigame' | 'battle' | 'explore';

// Single interaction record
export interface InteractionRecord {
  type: InteractionType;
  timestamp: number;
  duration?: number; // Session duration in ms
}

// Aggregated pattern data (computed from interactions)
export interface InteractionPattern {
  // Visit frequency
  avgVisitsPerDay: number;
  lastVisit: number;
  totalVisits: number;

  // Time preferences (0-23 hours, normalized 0-1 frequency)
  hourlyDistribution: number[];

  // Day preferences (0=Sun, 6=Sat, normalized 0-1 frequency)
  dailyDistribution: number[];

  // Favorite activities
  activityCounts: Record<InteractionType, number>;

  // Session data
  avgSessionDuration: number;
  longestStreak: number; // Consecutive days
  currentStreak: number;
}

// Habit/Ritual definition
export interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly';
  targetTime?: string; // HH:MM format, optional target time
  createdAt: number;
  completions: HabitCompletion[];
}

export interface HabitCompletion {
  timestamp: number;
  onTime: boolean; // Was it completed near target time?
}

// Bond strength levels
export type BondLevel =
  | 'stranger'      // Just met
  | 'acquaintance'  // Some interaction
  | 'companion'     // Regular engagement
  | 'friend'        // Strong bond
  | 'soulmate';     // Deep connection

export const BOND_LEVEL_THRESHOLDS: Record<BondLevel, number> = {
  stranger: 0,
  acquaintance: 50,
  companion: 200,
  friend: 500,
  soulmate: 1000,
};

// Pet resonance state (how pet responds to user patterns)
export type ResonanceState =
  | 'attuning'      // Learning user patterns
  | 'protective'    // User seems stressed
  | 'playful'       // User is doing well
  | 'supportive'    // User needs gentle care
  | 'celebratory'   // User is thriving
  | 'missing'       // User hasn't visited in a while
  | 'welcoming';    // User returned after absence

// Complete user state for the bond system
export interface UserBondState {
  // Mood tracking
  moodHistory: MoodCheckIn[];
  currentMood: UserMood | null;
  lastMoodCheckIn: number | null;

  // Interaction tracking
  interactionHistory: InteractionRecord[];
  patterns: InteractionPattern;

  // Habits
  habits: Habit[];

  // Bond metrics
  bondPoints: number;
  bondLevel: BondLevel;

  // Pet resonance
  resonanceState: ResonanceState;
  resonanceUpdatedAt: number;

  // Meta
  bondStartedAt: number;
  lastInteractionAt: number;
}

// Default pattern structure
export function createDefaultPattern(): InteractionPattern {
  return {
    avgVisitsPerDay: 0,
    lastVisit: 0,
    totalVisits: 0,
    hourlyDistribution: new Array(24).fill(0),
    dailyDistribution: new Array(7).fill(0),
    activityCounts: {
      visit: 0,
      feed: 0,
      clean: 0,
      play: 0,
      sleep: 0,
      minigame: 0,
      battle: 0,
      explore: 0,
    },
    avgSessionDuration: 0,
    longestStreak: 0,
    currentStreak: 0,
  };
}

// Default user bond state
export function createDefaultUserBondState(): UserBondState {
  const now = Date.now();
  return {
    moodHistory: [],
    currentMood: null,
    lastMoodCheckIn: null,
    interactionHistory: [],
    patterns: createDefaultPattern(),
    habits: [],
    bondPoints: 0,
    bondLevel: 'stranger',
    resonanceState: 'attuning',
    resonanceUpdatedAt: now,
    bondStartedAt: now,
    lastInteractionAt: now,
  };
}
