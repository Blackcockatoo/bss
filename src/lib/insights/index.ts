/**
 * Insights System
 *
 * Analyzes user patterns and generates meaningful insights
 * about their journey and relationship with their pet.
 */

import type { UserBondState, InteractionPattern, MoodCheckIn } from '../bond';
import type { MemoryState, MemorySummary } from '../memory';
import { getMoodTrend, USER_MOOD_VALUES } from '../bond';
import { getMemorySummary } from '../memory';

export interface Insight {
  id: string;
  type: 'pattern' | 'mood' | 'streak' | 'milestone' | 'suggestion';
  title: string;
  description: string;
  icon?: string;
  priority: number; // 1-5, higher = more important
}

export interface WeeklySummary {
  weekStart: number;
  weekEnd: number;
  totalVisits: number;
  avgMood: number | null;
  moodTrend: 'improving' | 'declining' | 'stable' | 'unknown';
  habitsCompleted: number;
  streakDays: number;
  bondPointsGained: number;
  highlights: string[];
  insights: Insight[];
}

/**
 * Generate insights based on current state
 */
export function generateInsights(
  bondState: UserBondState,
  memoryState: MemoryState
): Insight[] {
  const insights: Insight[] = [];
  const { patterns, moodHistory, habits, bondLevel } = bondState;

  // Pattern insights
  const patternInsights = generatePatternInsights(patterns);
  insights.push(...patternInsights);

  // Mood insights
  const moodInsights = generateMoodInsights(moodHistory);
  insights.push(...moodInsights);

  // Streak insights
  const streakInsights = generateStreakInsights(patterns.currentStreak, patterns.longestStreak);
  insights.push(...streakInsights);

  // Habit insights
  const habitInsights = generateHabitInsights(habits);
  insights.push(...habitInsights);

  // Milestone insights
  const milestoneInsights = generateMilestoneInsights(memoryState, bondState);
  insights.push(...milestoneInsights);

  // Sort by priority (highest first)
  return insights.sort((a, b) => b.priority - a.priority).slice(0, 5);
}

/**
 * Generate insights from interaction patterns
 */
function generatePatternInsights(patterns: InteractionPattern): Insight[] {
  const insights: Insight[] = [];
  const { hourlyDistribution, dailyDistribution, activityCounts, totalVisits } = patterns;

  if (totalVisits < 5) {
    return []; // Not enough data yet
  }

  // Find peak hour
  const peakHour = hourlyDistribution.indexOf(Math.max(...hourlyDistribution));
  const timeOfDay =
    peakHour < 6 ? 'late night' :
    peakHour < 12 ? 'morning' :
    peakHour < 18 ? 'afternoon' : 'evening';

  insights.push({
    id: 'pattern-time',
    type: 'pattern',
    title: 'Your favorite time',
    description: `You usually visit in the ${timeOfDay} (around ${formatHour(peakHour)})`,
    icon: '🕐',
    priority: 2,
  });

  // Find peak day
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const peakDay = dailyDistribution.indexOf(Math.max(...dailyDistribution));

  if (totalVisits > 14) {
    insights.push({
      id: 'pattern-day',
      type: 'pattern',
      title: 'Most active day',
      description: `${days[peakDay]}s are when you visit most often`,
      icon: '📅',
      priority: 1,
    });
  }

  // Favorite activity
  const activities = Object.entries(activityCounts)
    .filter(([key]) => key !== 'visit')
    .sort((a, b) => b[1] - a[1]);

  if (activities[0]?.[1] > 3) {
    const activityLabels: Record<string, string> = {
      feed: 'feeding',
      clean: 'cleaning',
      play: 'playing',
      sleep: 'resting',
      minigame: 'playing games',
      battle: 'battling',
      explore: 'exploring',
    };
    const favorite = activityLabels[activities[0][0]] || activities[0][0];

    insights.push({
      id: 'pattern-activity',
      type: 'pattern',
      title: 'Favorite activity',
      description: `You enjoy ${favorite} the most with your companion`,
      icon: '⭐',
      priority: 2,
    });
  }

  return insights;
}

/**
 * Generate insights from mood history
 */
function generateMoodInsights(moodHistory: MoodCheckIn[]): Insight[] {
  const insights: Insight[] = [];

  if (moodHistory.length < 3) {
    return [];
  }

  const trend = getMoodTrend(moodHistory);

  if (trend === 'improving') {
    insights.push({
      id: 'mood-improving',
      type: 'mood',
      title: 'Things are looking up',
      description: 'Your mood has been improving this week',
      icon: '📈',
      priority: 4,
    });
  } else if (trend === 'declining') {
    insights.push({
      id: 'mood-declining',
      type: 'mood',
      title: 'A challenging week',
      description: 'Your mood has dipped recently. Your companion is here for you.',
      icon: '💚',
      priority: 5,
    });
  }

  // Check for patterns in mood by time of day
  const recentMoods = moodHistory.slice(-14);
  const moodByContext: Record<string, { sum: number; count: number }> = {};

  for (const checkIn of recentMoods) {
    if (!checkIn.context) continue;
    if (!moodByContext[checkIn.context]) {
      moodByContext[checkIn.context] = { sum: 0, count: 0 };
    }
    moodByContext[checkIn.context].sum += USER_MOOD_VALUES[checkIn.mood];
    moodByContext[checkIn.context].count++;
  }

  const contexts = Object.entries(moodByContext)
    .filter(([_, data]) => data.count >= 2)
    .map(([context, data]) => ({
      context,
      avg: data.sum / data.count,
    }))
    .sort((a, b) => b.avg - a.avg);

  if (contexts.length >= 2) {
    const best = contexts[0];
    if (best.avg > 3.5) {
      insights.push({
        id: 'mood-time',
        type: 'mood',
        title: 'Your best time',
        description: `You tend to feel best in the ${best.context}`,
        icon: '☀️',
        priority: 2,
      });
    }
  }

  return insights;
}

/**
 * Generate streak-related insights
 */
function generateStreakInsights(currentStreak: number, longestStreak: number): Insight[] {
  const insights: Insight[] = [];

  if (currentStreak >= 3) {
    insights.push({
      id: 'streak-current',
      type: 'streak',
      title: `${currentStreak}-day streak!`,
      description: 'Keep it going! Consistency builds connection.',
      icon: '🔥',
      priority: 3,
    });
  }

  if (currentStreak > 0 && currentStreak === longestStreak && longestStreak >= 5) {
    insights.push({
      id: 'streak-record',
      type: 'streak',
      title: 'New record!',
      description: `This is your longest streak ever: ${longestStreak} days`,
      icon: '🏆',
      priority: 4,
    });
  }

  return insights;
}

/**
 * Generate habit-related insights
 */
function generateHabitInsights(habits: UserBondState['habits']): Insight[] {
  const insights: Insight[] = [];

  for (const habit of habits) {
    const recentCompletions = habit.completions.filter(
      c => c.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    const targetCount = habit.frequency === 'daily' ? 7 : 1;
    const completionRate = recentCompletions.length / targetCount;

    if (completionRate >= 0.8) {
      insights.push({
        id: `habit-success-${habit.id}`,
        type: 'pattern',
        title: `${habit.name}: Great progress!`,
        description: "You're keeping up with this habit consistently",
        icon: '✅',
        priority: 3,
      });
    } else if (recentCompletions.length === 0 && habit.completions.length > 0) {
      insights.push({
        id: `habit-reminder-${habit.id}`,
        type: 'suggestion',
        title: `Remember: ${habit.name}`,
        description: "It's been a while since you completed this habit",
        icon: '💡',
        priority: 2,
      });
    }
  }

  return insights;
}

/**
 * Generate milestone insights
 */
function generateMilestoneInsights(
  memoryState: MemoryState,
  bondState: UserBondState
): Insight[] {
  const insights: Insight[] = [];
  const summary = getMemorySummary(memoryState);

  // Days together milestones
  if (summary.totalDaysTogether === 7) {
    insights.push({
      id: 'milestone-week',
      type: 'milestone',
      title: 'One week together!',
      description: "You've been companions for a whole week",
      icon: '🎉',
      priority: 4,
    });
  } else if (summary.totalDaysTogether === 30) {
    insights.push({
      id: 'milestone-month',
      type: 'milestone',
      title: 'One month together!',
      description: "A month of memories and growth",
      icon: '🎊',
      priority: 5,
    });
  }

  // Bond level acknowledgment
  const bondMessages: Record<string, string> = {
    companion: "Your bond has grown strong. You're true companions now.",
    friend: "A deep friendship has formed between you.",
    soulmate: "The deepest bond imaginable. You truly understand each other.",
  };

  if (bondMessages[bondState.bondLevel]) {
    insights.push({
      id: `bond-${bondState.bondLevel}`,
      type: 'milestone',
      title: `Bond: ${capitalize(bondState.bondLevel)}`,
      description: bondMessages[bondState.bondLevel],
      icon: '💖',
      priority: 4,
    });
  }

  return insights;
}

/**
 * Generate weekly summary
 */
export function generateWeeklySummary(
  bondState: UserBondState,
  memoryState: MemoryState,
  previousBondPoints: number
): WeeklySummary {
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

  // Count visits this week
  const weeklyVisits = bondState.interactionHistory.filter(
    i => i.type === 'visit' && i.timestamp > weekAgo
  ).length;

  // Calculate average mood this week
  const weeklyMoods = bondState.moodHistory.filter(m => m.timestamp > weekAgo);
  const avgMood = weeklyMoods.length > 0
    ? weeklyMoods.reduce((sum, m) => sum + USER_MOOD_VALUES[m.mood], 0) / weeklyMoods.length
    : null;

  // Count habit completions
  const habitsCompleted = bondState.habits.reduce((sum, habit) => {
    return sum + habit.completions.filter(c => c.timestamp > weekAgo).length;
  }, 0);

  // Calculate bond points gained
  const bondPointsGained = bondState.bondPoints - previousBondPoints;

  // Generate highlights
  const highlights: string[] = [];
  if (bondState.patterns.currentStreak >= 7) {
    highlights.push(`Maintained a ${bondState.patterns.currentStreak}-day streak`);
  }
  if (weeklyMoods.length >= 5) {
    highlights.push('Checked in consistently with your mood');
  }
  if (habitsCompleted >= 5) {
    highlights.push('Kept up with your habits');
  }

  const insights = generateInsights(bondState, memoryState);

  return {
    weekStart: weekAgo,
    weekEnd: now,
    totalVisits: weeklyVisits,
    avgMood,
    moodTrend: getMoodTrend(bondState.moodHistory),
    habitsCompleted,
    streakDays: bondState.patterns.currentStreak,
    bondPointsGained,
    highlights,
    insights,
  };
}

/**
 * Format hour for display (e.g., "9am", "3pm")
 */
function formatHour(hour: number): string {
  if (hour === 0) return '12am';
  if (hour === 12) return '12pm';
  if (hour < 12) return `${hour}am`;
  return `${hour - 12}pm`;
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
