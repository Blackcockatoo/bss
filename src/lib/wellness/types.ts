/**
 * Wellness System Types
 *
 * Transforms MetaPet into an everyday wellness companion by:
 * - Syncing pet vitals with user wellness
 * - Tracking hydration, sleep, and mood
 * - Providing customizable reminder modes
 */

// Reminder mode affects how the pet communicates wellness feedback
export type ReminderMode = 'gentle' | 'direct' | 'silent';

export const REMINDER_MODE_LABELS: Record<ReminderMode, string> = {
  gentle: 'Gentle',
  direct: 'Direct',
  silent: 'Silent Mirror',
};

export const REMINDER_MODE_DESCRIPTIONS: Record<ReminderMode, string> = {
  gentle: 'Pet shows subtle visual cues when you need self-care',
  direct: 'Explicit prompts and reminders alongside pet care',
  silent: 'Pet mirrors your state silently - discover the connection',
};

// Feature toggles for wellness tracking
export interface WellnessFeatures {
  mirrorVitals: boolean;
  hydration: boolean;
  sleep: boolean;
  anxiety: boolean;
  pomodoro: boolean;
  sabbath: boolean;
  gratitude: boolean;
  savings: boolean;
  learning: boolean;
  movement: boolean;
}

// Hydration tracking
export interface HydrationEntry {
  id: string;
  timestamp: number;
  amount: number; // glasses (1 glass = ~250ml)
}

export interface HydrationState {
  entries: HydrationEntry[];
  dailyGoal: number; // default 8 glasses
  streak: number; // consecutive days hitting goal
  lastGoalHitDate: string | null; // YYYY-MM-DD
}

// Sleep tracking
export interface SleepEntry {
  id: string;
  sleepTime: number; // timestamp when went to bed
  wakeTime: number | null; // timestamp when woke up (null if still sleeping)
  quality?: 1 | 2 | 3 | 4 | 5; // optional quality rating
  notes?: string;
}

export interface SleepState {
  entries: SleepEntry[];
  dailyGoal: number; // target hours, default 7
  streak: number; // consecutive days hitting goal
  lastGoalHitDate: string | null;
  currentSleep: SleepEntry | null; // active sleep session
}

// Anxiety/Grounding session
export type AnxietyLevel = 'mild' | 'moderate' | 'intense';

export interface GroundingSession {
  id: string;
  timestamp: number;
  anxietyLevel: AnxietyLevel;
  ritualType: 'tap' | 'hold' | 'breath' | 'yantra';
  duration: number; // ms
  completedSuccessfully: boolean;
}

export interface AnxietyState {
  sessions: GroundingSession[];
  totalSessions: number;
  lastSession: number | null;
}

// Focus/Pomodoro sessions
export type FocusDuration = 25 | 45 | 60; // minutes

export interface FocusSession {
  id: string;
  startTime: number;
  duration: FocusDuration;
  completedAt: number | null;
  interrupted: boolean;
  xpEarned: number;
}

export interface FocusState {
  sessions: FocusSession[];
  currentSession: FocusSession | null;
  totalCompleted: number;
  streak: number; // consecutive days with at least one session
  lastSessionDate: string | null;
}

// Digital Sabbath
export type SabbathDuration = 1 | 4 | 8 | 24; // hours

export interface SabbathSession {
  id: string;
  startTime: number;
  targetDuration: SabbathDuration;
  completedAt: number | null;
  actualDuration: number | null; // hours
  xpEarned: number;
}

export interface SabbathState {
  sessions: SabbathSession[];
  currentSession: SabbathSession | null;
  longestCompleted: number; // hours
  totalCompleted: number;
}

// Gratitude entries
export interface GratitudeEntry {
  id: string;
  timestamp: number;
  entries: string[]; // 1-3 gratitude items
  symbolsGenerated: string[]; // heraldic charges derived from entries
}

export interface GratitudeState {
  entries: GratitudeEntry[];
  streak: number;
  lastEntryDate: string | null;
  totalEntries: number;
}

// Complete wellness state
export interface WellnessState {
  // Settings
  reminderMode: ReminderMode;
  enabledFeatures: WellnessFeatures;

  // Tracking states
  hydration: HydrationState;
  sleep: SleepState;
  anxiety: AnxietyState;
  focus: FocusState;
  sabbath: SabbathState;
  gratitude: GratitudeState;

  // Meta
  setupCompletedAt: number | null;
  lastSyncAt: number;
}

// Default states
export function createDefaultWellnessFeatures(): WellnessFeatures {
  return {
    mirrorVitals: true,
    hydration: true,
    sleep: true,
    anxiety: true,
    pomodoro: false,
    sabbath: false,
    gratitude: false,
    savings: false,
    learning: false,
    movement: false,
  };
}

export function createDefaultHydrationState(): HydrationState {
  return {
    entries: [],
    dailyGoal: 8,
    streak: 0,
    lastGoalHitDate: null,
  };
}

export function createDefaultSleepState(): SleepState {
  return {
    entries: [],
    dailyGoal: 7,
    streak: 0,
    lastGoalHitDate: null,
    currentSleep: null,
  };
}

export function createDefaultAnxietyState(): AnxietyState {
  return {
    sessions: [],
    totalSessions: 0,
    lastSession: null,
  };
}

export function createDefaultFocusState(): FocusState {
  return {
    sessions: [],
    currentSession: null,
    totalCompleted: 0,
    streak: 0,
    lastSessionDate: null,
  };
}

export function createDefaultSabbathState(): SabbathState {
  return {
    sessions: [],
    currentSession: null,
    longestCompleted: 0,
    totalCompleted: 0,
  };
}

export function createDefaultGratitudeState(): GratitudeState {
  return {
    entries: [],
    streak: 0,
    lastEntryDate: null,
    totalEntries: 0,
  };
}

export function createDefaultWellnessState(): WellnessState {
  return {
    reminderMode: 'gentle',
    enabledFeatures: createDefaultWellnessFeatures(),
    hydration: createDefaultHydrationState(),
    sleep: createDefaultSleepState(),
    anxiety: createDefaultAnxietyState(),
    focus: createDefaultFocusState(),
    sabbath: createDefaultSabbathState(),
    gratitude: createDefaultGratitudeState(),
    setupCompletedAt: null,
    lastSyncAt: Date.now(),
  };
}

// Utility functions
export function getDateKey(timestamp: number = Date.now()): string {
  return new Date(timestamp).toISOString().split('T')[0];
}

export function getTodayHydration(state: HydrationState): number {
  const today = getDateKey();
  return state.entries
    .filter(e => getDateKey(e.timestamp) === today)
    .reduce((sum, e) => sum + e.amount, 0);
}

export function getTodaySleepHours(state: SleepState): number {
  const today = getDateKey();
  const todayEntries = state.entries.filter(e => {
    const wakeDate = e.wakeTime ? getDateKey(e.wakeTime) : null;
    return wakeDate === today;
  });

  return todayEntries.reduce((sum, e) => {
    if (!e.wakeTime) return sum;
    const hours = (e.wakeTime - e.sleepTime) / (1000 * 60 * 60);
    return sum + hours;
  }, 0);
}

// Wellness messages based on reminder mode
export interface WellnessPrompt {
  action: 'feed' | 'clean' | 'play' | 'sleep';
  gentleMessage: string;
  directMessage: string;
}

export const WELLNESS_PROMPTS: WellnessPrompt[] = [
  {
    action: 'feed',
    gentleMessage: '',
    directMessage: 'You fed your companion. Have you eaten today?',
  },
  {
    action: 'clean',
    gentleMessage: '',
    directMessage: 'Fresh and clean! How about a glass of water for yourself?',
  },
  {
    action: 'play',
    gentleMessage: '',
    directMessage: 'Playtime is important! Have you taken a break today?',
  },
  {
    action: 'sleep',
    gentleMessage: '',
    directMessage: 'Rest is healing. Are you getting enough sleep?',
  },
];
