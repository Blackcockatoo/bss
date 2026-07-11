import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useWellnessStore } from './store';
import { getTodayHydration, getTodaySleepHours } from './types';

describe('wellness store', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useWellnessStore.getState().reset();
  });

  describe('settings', () => {
    it('sets the reminder mode', () => {
      useWellnessStore.getState().setReminderMode('direct');
      expect(useWellnessStore.getState().reminderMode).toBe('direct');
    });

    it('toggles features', () => {
      expect(useWellnessStore.getState().enabledFeatures.gratitude).toBe(false);
      useWellnessStore.getState().toggleFeature('gratitude');
      expect(useWellnessStore.getState().enabledFeatures.gratitude).toBe(true);
      useWellnessStore.getState().toggleFeature('gratitude');
      expect(useWellnessStore.getState().enabledFeatures.gratitude).toBe(false);
    });

    it('records setup completion', () => {
      expect(useWellnessStore.getState().setupCompletedAt).toBeNull();
      useWellnessStore.getState().completeSetup();
      expect(useWellnessStore.getState().setupCompletedAt).toBeGreaterThan(0);
    });
  });

  describe('hydration', () => {
    it('logs water and totals today', () => {
      useWellnessStore.getState().logWater(2);
      useWellnessStore.getState().logWater();

      const { hydration } = useWellnessStore.getState();
      expect(hydration.entries).toHaveLength(2);
      expect(getTodayHydration(hydration)).toBe(3);
    });

    it('starts a streak when the daily goal is hit', () => {
      useWellnessStore.getState().setHydrationGoal(4);
      useWellnessStore.getState().logWater(4);

      const { hydration } = useWellnessStore.getState();
      expect(hydration.streak).toBe(1);
      expect(hydration.lastGoalHitDate).not.toBeNull();
    });

    it('does not double-count the streak on the same day', () => {
      useWellnessStore.getState().setHydrationGoal(2);
      useWellnessStore.getState().logWater(2);
      useWellnessStore.getState().logWater(2);

      expect(useWellnessStore.getState().hydration.streak).toBe(1);
    });

    it('adjusts the daily goal', () => {
      useWellnessStore.getState().setHydrationGoal(10);
      expect(useWellnessStore.getState().hydration.dailyGoal).toBe(10);
    });
  });

  describe('sleep', () => {
    it('tracks an active sleep session from start to end', () => {
      vi.useFakeTimers();
      try {
        useWellnessStore.getState().startSleep();
        expect(useWellnessStore.getState().sleep.currentSleep).not.toBeNull();

        // Starting again while sleeping is a no-op
        const current = useWellnessStore.getState().sleep.currentSleep;
        useWellnessStore.getState().startSleep();
        expect(useWellnessStore.getState().sleep.currentSleep).toBe(current);

        vi.advanceTimersByTime(8 * 60 * 60 * 1000);
        useWellnessStore.getState().endSleep(4, 'slept well');

        const { sleep } = useWellnessStore.getState();
        expect(sleep.currentSleep).toBeNull();
        expect(sleep.entries).toHaveLength(1);
        expect(sleep.entries[0].quality).toBe(4);
        expect(sleep.streak).toBe(1); // 8h >= default 7h goal
        expect(getTodaySleepHours(sleep)).toBeCloseTo(8, 1);
      } finally {
        vi.useRealTimers();
      }
    });

    it('ignores endSleep without an active session', () => {
      useWellnessStore.getState().endSleep(3);
      expect(useWellnessStore.getState().sleep.entries).toHaveLength(0);
    });

    it('logs manual sleep entries and updates the streak', () => {
      const wake = Date.now();
      const slept = wake - 9 * 60 * 60 * 1000;

      useWellnessStore.getState().logSleepManual(slept, wake, 5);

      const { sleep } = useWellnessStore.getState();
      expect(sleep.entries).toHaveLength(1);
      expect(sleep.streak).toBe(1);
    });

    it('does not grant a streak for short sleep', () => {
      const wake = Date.now();
      useWellnessStore.getState().logSleepManual(wake - 2 * 60 * 60 * 1000, wake);

      expect(useWellnessStore.getState().sleep.streak).toBe(0);
    });

    it('adjusts the sleep goal', () => {
      useWellnessStore.getState().setSleepGoal(9);
      expect(useWellnessStore.getState().sleep.dailyGoal).toBe(9);
    });
  });

  describe('grounding', () => {
    it('logs grounding sessions', () => {
      useWellnessStore
        .getState()
        .logGroundingSession('moderate', 'breath', 60_000, true);

      const { anxiety } = useWellnessStore.getState();
      expect(anxiety.sessions).toHaveLength(1);
      expect(anxiety.totalSessions).toBe(1);
      expect(anxiety.lastSession).toBeGreaterThan(0);
      expect(anxiety.sessions[0].ritualType).toBe('breath');
    });
  });

  describe('focus', () => {
    it('completes a focus session with xp and streak', () => {
      useWellnessStore.getState().startFocusSession(25);
      expect(useWellnessStore.getState().focus.currentSession).not.toBeNull();

      useWellnessStore.getState().endFocusSession(true);

      const { focus } = useWellnessStore.getState();
      expect(focus.currentSession).toBeNull();
      expect(focus.totalCompleted).toBe(1);
      expect(focus.streak).toBe(1);
      expect(focus.sessions[0].xpEarned).toBe(50);
    });

    it('marks interrupted sessions without xp', () => {
      useWellnessStore.getState().startFocusSession(45);
      useWellnessStore.getState().endFocusSession(false);

      const { focus } = useWellnessStore.getState();
      expect(focus.totalCompleted).toBe(0);
      expect(focus.sessions[0].interrupted).toBe(true);
      expect(focus.sessions[0].xpEarned).toBe(0);
    });

    it('cancels a focus session without recording it', () => {
      useWellnessStore.getState().startFocusSession(60);
      useWellnessStore.getState().cancelFocusSession();

      const { focus } = useWellnessStore.getState();
      expect(focus.currentSession).toBeNull();
      expect(focus.sessions).toHaveLength(0);
    });
  });

  describe('sabbath', () => {
    it('completes a sabbath that met its target', () => {
      vi.useFakeTimers();
      try {
        useWellnessStore.getState().startSabbath(1);
        vi.advanceTimersByTime(90 * 60 * 1000); // 1.5h
        useWellnessStore.getState().endSabbath(true);

        const { sabbath } = useWellnessStore.getState();
        expect(sabbath.currentSession).toBeNull();
        expect(sabbath.totalCompleted).toBe(1);
        expect(sabbath.longestCompleted).toBeGreaterThanOrEqual(1);
        expect(sabbath.sessions[0].xpEarned).toBe(50);
      } finally {
        vi.useRealTimers();
      }
    });

    it('records an unmet sabbath without completion credit', () => {
      useWellnessStore.getState().startSabbath(8);
      useWellnessStore.getState().endSabbath(true);

      const { sabbath } = useWellnessStore.getState();
      expect(sabbath.totalCompleted).toBe(0);
      expect(sabbath.sessions[0].xpEarned).toBe(0);
    });

    it('cancels a sabbath session', () => {
      useWellnessStore.getState().startSabbath(4);
      useWellnessStore.getState().cancelSabbath();

      expect(useWellnessStore.getState().sabbath.currentSession).toBeNull();
      expect(useWellnessStore.getState().sabbath.sessions).toHaveLength(0);
    });
  });

  describe('gratitude', () => {
    it('logs entries with generated symbols and a streak', () => {
      useWellnessStore.getState().logGratitude(['my pet', 'sunshine']);

      const { gratitude } = useWellnessStore.getState();
      expect(gratitude.entries).toHaveLength(1);
      expect(gratitude.entries[0].symbolsGenerated).toHaveLength(2);
      expect(gratitude.totalEntries).toBe(2);
      expect(gratitude.streak).toBe(1);
    });
  });

  describe('checkStreaks', () => {
    it('resets stale streaks and keeps current ones', () => {
      useWellnessStore.getState().setHydrationGoal(1);
      useWellnessStore.getState().logWater(1); // streak 1, today

      useWellnessStore.setState((state) => ({
        sleep: {
          ...state.sleep,
          streak: 4,
          lastGoalHitDate: '2020-01-01',
        },
      }));

      useWellnessStore.getState().checkStreaks();

      const state = useWellnessStore.getState();
      expect(state.hydration.streak).toBe(1);
      expect(state.sleep.streak).toBe(0);
    });
  });
});
