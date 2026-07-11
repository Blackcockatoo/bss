import { describe, expect, it } from 'vitest';

import {
  addHabit,
  completeHabit,
  computeBondLevel,
  computePatterns,
  computeResonance,
  createDefaultUserBondState,
  recordInteraction,
  recordMoodCheckIn,
  removeHabit,
  updateResonance,
} from './index';

describe('recordMoodCheckIn', () => {
  it('appends to mood history and awards bond points', () => {
    const state = createDefaultUserBondState();

    const updated = recordMoodCheckIn(state, 'good', 'nice day');

    expect(updated.moodHistory).toHaveLength(1);
    expect(updated.moodHistory[0].mood).toBe('good');
    expect(updated.moodHistory[0].note).toBe('nice day');
    expect(updated.currentMood).toBe('good');
    expect(updated.lastMoodCheckIn).toBeGreaterThan(0);
    expect(updated.bondPoints).toBe(state.bondPoints + 5);
  });

  it('drops mood history older than 90 days', () => {
    const state = createDefaultUserBondState();
    state.moodHistory = [
      {
        id: 'old',
        mood: 'low',
        timestamp: Date.now() - 120 * 24 * 60 * 60 * 1000,
      },
    ];

    const updated = recordMoodCheckIn(state, 'great');

    expect(updated.moodHistory).toHaveLength(1);
    expect(updated.moodHistory[0].mood).toBe('great');
  });
});

describe('recordInteraction', () => {
  it('records interactions, recomputes patterns, and awards points', () => {
    let state = createDefaultUserBondState();

    state = recordInteraction(state, 'play', 30_000);
    state = recordInteraction(state, 'feed');

    expect(state.interactionHistory).toHaveLength(2);
    expect(state.patterns.activityCounts.play).toBe(1);
    expect(state.patterns.activityCounts.feed).toBe(1);
    expect(state.bondPoints).toBe(5 + 3);
    expect(state.lastInteractionAt).toBeGreaterThan(0);
  });
});

describe('computePatterns', () => {
  it('returns defaults for empty history', () => {
    const patterns = computePatterns([]);

    expect(patterns.totalVisits).toBe(0);
    expect(patterns.currentStreak).toBe(0);
  });

  it('aggregates hourly, daily, and activity distributions', () => {
    const now = Date.now();
    const patterns = computePatterns([
      { type: 'visit', timestamp: now, duration: 60_000 },
      { type: 'visit', timestamp: now - 1000, duration: 120_000 },
      { type: 'play', timestamp: now - 2000 },
    ]);

    expect(patterns.activityCounts.visit).toBe(2);
    expect(patterns.activityCounts.play).toBe(1);
    expect(patterns.avgSessionDuration).toBe(90_000);
    expect(patterns.hourlyDistribution.some(v => v > 0)).toBe(true);
  });
});

describe('habits', () => {
  it('adds up to three habits with a point bonus', () => {
    let state = createDefaultUserBondState();

    state = addHabit(state, 'Morning check-in', 'daily');
    state = addHabit(state, 'Evening wind-down', 'daily');
    state = addHabit(state, 'Weekly reflection', 'weekly');
    const capped = addHabit(state, 'One too many', 'daily');

    expect(state.habits).toHaveLength(3);
    expect(capped).toBe(state);
    expect(state.bondPoints).toBe(30);
  });

  it('completes a habit and awards points', () => {
    let state = createDefaultUserBondState();
    state = addHabit(state, 'Morning check-in', 'daily');
    const habitId = state.habits[0].id;

    const completed = completeHabit(state, habitId);

    expect(completed.habits[0].completions).toHaveLength(1);
    expect(completed.bondPoints).toBeGreaterThan(state.bondPoints);
  });

  it('ignores completing an unknown habit', () => {
    const state = createDefaultUserBondState();
    expect(completeHabit(state, 'nope')).toBe(state);
  });

  it('removes a habit', () => {
    let state = createDefaultUserBondState();
    state = addHabit(state, 'Morning check-in', 'daily');

    const removed = removeHabit(state, state.habits[0].id);

    expect(removed.habits).toHaveLength(0);
  });
});

describe('computeBondLevel', () => {
  it('maps points to levels at the documented thresholds', () => {
    expect(computeBondLevel(0)).toBe('stranger');
    expect(computeBondLevel(50)).toBe('acquaintance');
    expect(computeBondLevel(200)).toBe('companion');
    expect(computeBondLevel(500)).toBe('friend');
    expect(computeBondLevel(1000)).toBe('soulmate');
  });
});

describe('computeResonance', () => {
  it('misses the user after a long absence', () => {
    const state = createDefaultUserBondState();
    state.patterns.lastVisit = Date.now() - 72 * 60 * 60 * 1000;

    expect(computeResonance(state)).toBe('missing');
  });

  it('welcomes the user back after a day away', () => {
    const state = createDefaultUserBondState();
    state.patterns.lastVisit = Date.now() - 30 * 60 * 60 * 1000;

    expect(computeResonance(state)).toBe('welcoming');
  });

  it('turns protective when the user is struggling', () => {
    const state = createDefaultUserBondState();
    state.patterns.lastVisit = Date.now();
    state.currentMood = 'struggling';
    state.lastMoodCheckIn = Date.now();

    expect(computeResonance(state)).toBe('protective');
  });

  it('celebrates when the user is doing great', () => {
    const state = createDefaultUserBondState();
    state.patterns.lastVisit = Date.now();
    state.currentMood = 'great';
    state.lastMoodCheckIn = Date.now();

    expect(computeResonance(state)).toBe('celebratory');
  });

  it('attunes to new bonds by default', () => {
    const state = createDefaultUserBondState();
    state.patterns.lastVisit = Date.now();

    expect(computeResonance(state)).toBe('attuning');
  });

  it('stamps the resonance onto the state', () => {
    const state = createDefaultUserBondState();
    state.patterns.lastVisit = Date.now();

    const updated = updateResonance(state);

    expect(updated.resonanceState).toBe('attuning');
    expect(updated.resonanceUpdatedAt).toBeGreaterThan(0);
  });
});
