/**
 * Bond System - Core Logic
 *
 * Processes interactions, computes patterns, and determines how
 * the pet should respond to the user based on their relationship.
 */

import type {
  UserBondState,
  UserMood,
  MoodCheckIn,
  InteractionRecord,
  InteractionType,
  InteractionPattern,
  Habit,
  HabitCompletion,
  BondLevel,
  ResonanceState,
} from './types';
import {
  createDefaultPattern,
  createDefaultUserBondState,
  BOND_LEVEL_THRESHOLDS,
  USER_MOOD_VALUES,
} from './types';

export * from './types';

// Time constants
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const MAX_HISTORY_DAYS = 90; // Keep 90 days of detailed history

/**
 * Record a mood check-in
 */
export function recordMoodCheckIn(
  state: UserBondState,
  mood: UserMood,
  note?: string
): UserBondState {
  const now = Date.now();
  const hour = new Date(now).getHours();

  const context =
    hour < 6 ? 'night' :
    hour < 12 ? 'morning' :
    hour < 18 ? 'afternoon' : 'evening';

  const checkIn: MoodCheckIn = {
    id: generateId(),
    mood,
    timestamp: now,
    note,
    context,
  };

  // Keep only last 90 days of mood history
  const cutoff = now - MAX_HISTORY_DAYS * DAY_MS;
  const filteredHistory = state.moodHistory.filter(m => m.timestamp > cutoff);

  // Award bond points for checking in
  const bondPoints = state.bondPoints + 5;

  return {
    ...state,
    moodHistory: [...filteredHistory, checkIn],
    currentMood: mood,
    lastMoodCheckIn: now,
    bondPoints,
    bondLevel: computeBondLevel(bondPoints),
  };
}

/**
 * Record an interaction (visit, feed, play, etc.)
 */
export function recordInteraction(
  state: UserBondState,
  type: InteractionType,
  duration?: number
): UserBondState {
  const now = Date.now();

  const record: InteractionRecord = {
    type,
    timestamp: now,
    duration,
  };

  // Keep only last 90 days of interaction history
  const cutoff = now - MAX_HISTORY_DAYS * DAY_MS;
  const filteredHistory = state.interactionHistory.filter(i => i.timestamp > cutoff);
  const newHistory = [...filteredHistory, record];

  // Recompute patterns
  const patterns = computePatterns(newHistory);

  // Award bond points based on interaction type
  const pointsMap: Record<InteractionType, number> = {
    visit: 2,
    feed: 3,
    clean: 3,
    play: 5,
    sleep: 2,
    minigame: 4,
    battle: 4,
    explore: 4,
  };
  const bondPoints = state.bondPoints + (pointsMap[type] || 2);

  return {
    ...state,
    interactionHistory: newHistory,
    patterns,
    bondPoints,
    bondLevel: computeBondLevel(bondPoints),
    lastInteractionAt: now,
  };
}

/**
 * Compute interaction patterns from history
 */
export function computePatterns(history: InteractionRecord[]): InteractionPattern {
  if (history.length === 0) {
    return createDefaultPattern();
  }

  const now = Date.now();
  const hourly = new Array(24).fill(0);
  const daily = new Array(7).fill(0);
  const activityCounts: Record<InteractionType, number> = {
    visit: 0,
    feed: 0,
    clean: 0,
    play: 0,
    sleep: 0,
    minigame: 0,
    battle: 0,
    explore: 0,
  };

  let totalDuration = 0;
  let durationCount = 0;

  for (const record of history) {
    const date = new Date(record.timestamp);
    hourly[date.getHours()]++;
    daily[date.getDay()]++;
    activityCounts[record.type]++;

    if (record.duration !== undefined) {
      totalDuration += record.duration;
      durationCount++;
    }
  }

  // Normalize distributions
  const maxHourly = Math.max(...hourly, 1);
  const normalizedHourly = hourly.map(h => h / maxHourly);

  const maxDaily = Math.max(...daily, 1);
  const normalizedDaily = daily.map(d => d / maxDaily);

  // Calculate visits per day
  const visits = history.filter(h => h.type === 'visit');
  const firstVisit = visits.length > 0 ? visits[0].timestamp : now;
  const daysSinceFirst = Math.max(1, (now - firstVisit) / DAY_MS);
  const avgVisitsPerDay = visits.length / daysSinceFirst;

  // Calculate streak
  const { currentStreak, longestStreak } = computeStreak(history);

  return {
    avgVisitsPerDay,
    lastVisit: visits.length > 0 ? visits[visits.length - 1].timestamp : 0,
    totalVisits: visits.length,
    hourlyDistribution: normalizedHourly,
    dailyDistribution: normalizedDaily,
    activityCounts,
    avgSessionDuration: durationCount > 0 ? totalDuration / durationCount : 0,
    longestStreak,
    currentStreak,
  };
}

/**
 * Compute visit streak (consecutive days with visits)
 */
function computeStreak(history: InteractionRecord[]): { currentStreak: number; longestStreak: number } {
  const visits = history.filter(h => h.type === 'visit');
  if (visits.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Get unique days with visits
  const visitDays = new Set<string>();
  for (const visit of visits) {
    const date = new Date(visit.timestamp);
    visitDays.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
  }

  const sortedDays = Array.from(visitDays).sort();
  if (sortedDays.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  let longestStreak = 1;
  let currentStreak = 1;
  let streak = 1;

  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1]);
    const curr = new Date(sortedDays[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / DAY_MS);

    if (diffDays === 1) {
      streak++;
    } else {
      streak = 1;
    }

    longestStreak = Math.max(longestStreak, streak);
  }

  // Check if current streak is still active (visited today or yesterday)
  const lastDay = sortedDays[sortedDays.length - 1];
  const lastDate = new Date(lastDay);
  const today = new Date();
  const daysSinceLast = Math.round((today.getTime() - lastDate.getTime()) / DAY_MS);

  if (daysSinceLast <= 1) {
    currentStreak = streak;
  } else {
    currentStreak = 0;
  }

  return { currentStreak, longestStreak };
}

/**
 * Add a new habit
 */
export function addHabit(
  state: UserBondState,
  name: string,
  frequency: 'daily' | 'weekly',
  description?: string,
  targetTime?: string
): UserBondState {
  if (state.habits.length >= 3) {
    // Max 3 habits for simplicity
    return state;
  }

  const habit: Habit = {
    id: generateId(),
    name,
    description,
    frequency,
    targetTime,
    createdAt: Date.now(),
    completions: [],
  };

  return {
    ...state,
    habits: [...state.habits, habit],
    bondPoints: state.bondPoints + 10, // Bonus for creating habit
    bondLevel: computeBondLevel(state.bondPoints + 10),
  };
}

/**
 * Complete a habit
 */
export function completeHabit(state: UserBondState, habitId: string): UserBondState {
  const now = Date.now();
  const habit = state.habits.find(h => h.id === habitId);

  if (!habit) {
    return state;
  }

  // Check if on time (within 1 hour of target)
  let onTime = true;
  if (habit.targetTime) {
    const [targetHour, targetMin] = habit.targetTime.split(':').map(Number);
    const nowDate = new Date(now);
    const targetMs = targetHour * HOUR_MS + targetMin * 60 * 1000;
    const nowMs = nowDate.getHours() * HOUR_MS + nowDate.getMinutes() * 60 * 1000;
    onTime = Math.abs(nowMs - targetMs) < HOUR_MS;
  }

  const completion: HabitCompletion = {
    timestamp: now,
    onTime,
  };

  const updatedHabits = state.habits.map(h => {
    if (h.id !== habitId) return h;
    return {
      ...h,
      completions: [...h.completions.slice(-90), completion], // Keep last 90 completions
    };
  });

  // Award points (more for on-time completion)
  const points = onTime ? 8 : 5;

  return {
    ...state,
    habits: updatedHabits,
    bondPoints: state.bondPoints + points,
    bondLevel: computeBondLevel(state.bondPoints + points),
  };
}

/**
 * Remove a habit
 */
export function removeHabit(state: UserBondState, habitId: string): UserBondState {
  return {
    ...state,
    habits: state.habits.filter(h => h.id !== habitId),
  };
}

/**
 * Compute bond level from points
 */
export function computeBondLevel(points: number): BondLevel {
  if (points >= BOND_LEVEL_THRESHOLDS.soulmate) return 'soulmate';
  if (points >= BOND_LEVEL_THRESHOLDS.friend) return 'friend';
  if (points >= BOND_LEVEL_THRESHOLDS.companion) return 'companion';
  if (points >= BOND_LEVEL_THRESHOLDS.acquaintance) return 'acquaintance';
  return 'stranger';
}

/**
 * Compute pet resonance state based on user patterns and mood
 */
export function computeResonance(state: UserBondState): ResonanceState {
  const now = Date.now();
  const hoursSinceLastVisit = state.patterns.lastVisit
    ? (now - state.patterns.lastVisit) / HOUR_MS
    : 0;

  // Missing state: hasn't visited in over 48 hours
  if (hoursSinceLastVisit > 48) {
    return 'missing';
  }

  // Welcoming state: returned after 24+ hours
  if (hoursSinceLastVisit > 24 && hoursSinceLastVisit <= 48) {
    return 'welcoming';
  }

  // If we have recent mood data, use it
  if (state.currentMood && state.lastMoodCheckIn) {
    const hoursSinceMoodCheck = (now - state.lastMoodCheckIn) / HOUR_MS;

    // Only use mood if it's recent (within 12 hours)
    if (hoursSinceMoodCheck < 12) {
      const moodValue = USER_MOOD_VALUES[state.currentMood];

      if (moodValue === 1) return 'protective'; // Struggling
      if (moodValue === 2) return 'supportive'; // Low
      if (moodValue === 5) return 'celebratory'; // Great
      if (moodValue === 4) return 'playful'; // Good
    }
  }

  // Default to playful if bond is strong, attuning if new
  if (state.bondLevel === 'stranger' || state.bondLevel === 'acquaintance') {
    return 'attuning';
  }

  return 'playful';
}

/**
 * Update resonance state
 */
export function updateResonance(state: UserBondState): UserBondState {
  const resonanceState = computeResonance(state);

  return {
    ...state,
    resonanceState,
    resonanceUpdatedAt: Date.now(),
  };
}

/**
 * Get insight about user's patterns
 */
export function getPatternInsight(patterns: InteractionPattern): string {
  const { hourlyDistribution, dailyDistribution, activityCounts, currentStreak } = patterns;

  // Find peak hours
  const peakHour = hourlyDistribution.indexOf(Math.max(...hourlyDistribution));
  const timeOfDay =
    peakHour < 6 ? 'late night' :
    peakHour < 12 ? 'morning' :
    peakHour < 18 ? 'afternoon' : 'evening';

  // Find peak day
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const peakDay = dailyDistribution.indexOf(Math.max(...dailyDistribution));

  // Find favorite activity
  const activities = Object.entries(activityCounts)
    .filter(([key]) => key !== 'visit')
    .sort((a, b) => b[1] - a[1]);
  const favoriteActivity = activities[0]?.[0] || 'exploring';

  const insights: string[] = [];

  if (patterns.totalVisits > 7) {
    insights.push(`You usually visit in the ${timeOfDay}`);
  }

  if (patterns.totalVisits > 14) {
    insights.push(`${days[peakDay]}s are your most active days`);
  }

  if (activities[0]?.[1] > 5) {
    insights.push(`Your favorite activity is ${favoriteActivity}`);
  }

  if (currentStreak > 3) {
    insights.push(`You're on a ${currentStreak}-day streak!`);
  }

  return insights[0] || 'Still learning your patterns...';
}

/**
 * Get mood trend (last 7 days)
 */
export function getMoodTrend(moodHistory: MoodCheckIn[]): 'improving' | 'declining' | 'stable' | 'unknown' {
  const now = Date.now();
  const weekAgo = now - 7 * DAY_MS;
  const recentMoods = moodHistory.filter(m => m.timestamp > weekAgo);

  if (recentMoods.length < 3) {
    return 'unknown';
  }

  // Split into first half and second half
  const mid = Math.floor(recentMoods.length / 2);
  const firstHalf = recentMoods.slice(0, mid);
  const secondHalf = recentMoods.slice(mid);

  const avgFirst = firstHalf.reduce((sum, m) => sum + USER_MOOD_VALUES[m.mood], 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((sum, m) => sum + USER_MOOD_VALUES[m.mood], 0) / secondHalf.length;

  const diff = avgSecond - avgFirst;

  if (diff > 0.5) return 'improving';
  if (diff < -0.5) return 'declining';
  return 'stable';
}

/**
 * Generate a simple unique ID
 */
function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${timestamp}-${random}`;
}
