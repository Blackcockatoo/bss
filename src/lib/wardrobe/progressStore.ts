/**
 * Persistent wardrobe progress store.
 *
 * Holds the durable MetaPetProgress record (see ./progress.ts) plus the
 * sustained-energy tracker. The WardrobeSystemBridge feeds it live snapshots
 * from the gameplay store; everything here is monotonic so a reload (which
 * resets the in-memory game store) can never erase earned progress.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  HIGH_ENERGY_THRESHOLD,
  METAPET_PROGRESS_VERSION,
  createDefaultMetaPetProgress,
  mergeLiveSnapshot,
  sanitizeMetaPetProgress,
  type LiveProgressSnapshot,
  type MetaPetProgress,
} from './progress';

export const WARDROBE_PROGRESS_STORAGE_KEY = 'metapet-wardrobe-progress';

/** How often the bridge re-observes energy while the app is open. */
export const ENERGY_HEARTBEAT_MS = 30_000;

/**
 * Longest unobserved gap the sustained-energy timer survives. A quick page
 * refresh keeps the run alive; a longer absence (or a clock jump, which
 * shows up as the same gap) resets it, crediting only observed time.
 */
export const SUSTAINED_RESUME_GRACE_MS = 2 * 60 * 1000;

/** Bond/trust levels that count as recorded trust milestones. */
export const TRUST_MILESTONES: readonly number[] = [25, 50, 75, 100];

export type CareAction = 'feed' | 'clean' | 'play' | 'sleep';

interface WardrobeProgressStore {
  progress: MetaPetProgress;
  /** Folds a live game-state snapshot in, monotonically. */
  applyLiveSnapshot: (snapshot: LiveProgressSnapshot) => void;
  recordCareAction: (action: CareAction) => void;
  /** Monotonic; sourced from the Auralia guardian save's offspring list. */
  setOffspringCount: (count: number) => void;
  recordTrustLevel: (trust: number) => void;
  /**
   * Sustained high-energy tracker. Interruptions below the threshold reset
   * the active run; the best completed duration is kept forever.
   */
  observeEnergy: (energy: number, now?: number) => void;
}

export const useWardrobeProgressStore = create<WardrobeProgressStore>()(
  persist(
    (set) => ({
      progress: createDefaultMetaPetProgress(),

      applyLiveSnapshot(snapshot) {
        set((state) => {
          const next = mergeLiveSnapshot(state.progress, snapshot);
          return next === state.progress ? state : { progress: next };
        });
      },

      recordCareAction(action) {
        set((state) => {
          const care = { ...state.progress.care };
          if (action === 'feed') care.totalFeeds += 1;
          else if (action === 'clean') care.totalCleans += 1;
          else if (action === 'play') care.totalPlaySessions += 1;
          else care.totalSleepSessions += 1;
          return { progress: { ...state.progress, care } };
        });
      },

      setOffspringCount(count) {
        if (!Number.isFinite(count) || count < 0) return;
        set((state) => {
          if (count <= state.progress.breeding.offspringCount) return state;
          return {
            progress: {
              ...state.progress,
              breeding: { offspringCount: Math.floor(count) },
            },
          };
        });
      },

      recordTrustLevel(trust) {
        if (!Number.isFinite(trust)) return;
        set((state) => {
          const reached = TRUST_MILESTONES.filter(
            (milestone) => trust >= milestone,
          );
          const existing = state.progress.care.trustMilestones;
          const merged = [...new Set([...existing, ...reached])].sort(
            (a, b) => a - b,
          );
          if (merged.length === existing.length) return state;
          return {
            progress: {
              ...state.progress,
              care: { ...state.progress.care, trustMilestones: merged },
            },
          };
        });
      },

      observeEnergy(energy, now = Date.now()) {
        set((state) => {
          const previous = state.progress.sustainedConditions;
          let startedAt = previous.highEnergyStartedAt;
          let longest = previous.longestHighEnergyDurationMs;
          const lastObserved = previous.lastEnergyObservedAt;
          const isHigh = energy >= HIGH_ENERGY_THRESHOLD;

          if (lastObserved !== undefined && now < lastObserved) {
            // Clock moved backwards — restart the run rather than trusting
            // negative time.
            startedAt = isHigh ? now : undefined;
          } else {
            if (
              startedAt !== undefined &&
              lastObserved !== undefined &&
              now - lastObserved > SUSTAINED_RESUME_GRACE_MS
            ) {
              // The condition was unobserved for too long (closed app, clock
              // jump, suspended device). Credit only the time actually seen.
              longest = Math.max(
                longest,
                Math.max(0, lastObserved - startedAt),
              );
              startedAt = undefined;
            }

            if (isHigh) {
              if (startedAt === undefined) startedAt = now;
              longest = Math.max(longest, now - startedAt);
            } else if (startedAt !== undefined) {
              // Interruption: bank observed time, reset the active run.
              longest = Math.max(
                longest,
                Math.max(0, (lastObserved ?? startedAt) - startedAt),
              );
              startedAt = undefined;
            }
          }

          const sustainedConditions = {
            highEnergyStartedAt: startedAt,
            longestHighEnergyDurationMs: longest,
            lastEnergyObservedAt: now,
          };

          if (
            sustainedConditions.highEnergyStartedAt ===
              previous.highEnergyStartedAt &&
            sustainedConditions.longestHighEnergyDurationMs ===
              previous.longestHighEnergyDurationMs &&
            sustainedConditions.lastEnergyObservedAt ===
              previous.lastEnergyObservedAt
          ) {
            return state;
          }

          return { progress: { ...state.progress, sustainedConditions } };
        });
      },
    }),
    {
      name: WARDROBE_PROGRESS_STORAGE_KEY,
      version: METAPET_PROGRESS_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ progress: state.progress }),
      migrate: (persisted) => {
        const raw =
          typeof persisted === 'object' && persisted !== null
            ? (persisted as { progress?: unknown }).progress
            : undefined;
        return { progress: sanitizeMetaPetProgress(raw) };
      },
      merge: (persisted, current) => {
        const raw =
          typeof persisted === 'object' && persisted !== null
            ? (persisted as { progress?: unknown }).progress
            : undefined;
        return { ...current, progress: sanitizeMetaPetProgress(raw) };
      },
    },
  ),
);
