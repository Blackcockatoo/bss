"use client";

import { useEffect, useState } from "react";

import {
  ROUTE_PROGRESSION_SEQUENCE,
  type RouteProgressionKey,
} from "@/lib/routeProgression";

export type JourneyStepProgress = {
  visitedAt: number | null;
  completedAt: number | null;
};

export type JourneyProgressRecord = Record<
  RouteProgressionKey,
  JourneyStepProgress
>;

type StorageLike = Pick<Storage, "getItem" | "setItem">;

const JOURNEY_PROGRESS_STORAGE_KEY = "metapet-journey-progress-v1";
const JOURNEY_PROGRESS_EVENT = "metapet:journey-progress-updated";

function createEmptyJourneyProgress(): JourneyProgressRecord {
  return ROUTE_PROGRESSION_SEQUENCE.reduce((acc, routeKey) => {
    acc[routeKey] = {
      visitedAt: null,
      completedAt: null,
    };
    return acc;
  }, {} as JourneyProgressRecord);
}

function resolveStorage(storage?: StorageLike): StorageLike | null {
  if (storage) {
    return storage;
  }

  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function emitJourneyProgressUpdate() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(JOURNEY_PROGRESS_EVENT));
}

export function loadJourneyProgress(storage?: StorageLike) {
  const targetStorage = resolveStorage(storage);
  if (!targetStorage) {
    return createEmptyJourneyProgress();
  }

  const raw = targetStorage.getItem(JOURNEY_PROGRESS_STORAGE_KEY);
  if (!raw) {
    return createEmptyJourneyProgress();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<JourneyProgressRecord>;
    const emptyState = createEmptyJourneyProgress();

    for (const routeKey of ROUTE_PROGRESSION_SEQUENCE) {
      const nextValue = parsed[routeKey];
      if (!nextValue) {
        continue;
      }

      emptyState[routeKey] = {
        visitedAt:
          typeof nextValue.visitedAt === "number" ? nextValue.visitedAt : null,
        completedAt:
          typeof nextValue.completedAt === "number"
            ? nextValue.completedAt
            : null,
      };
    }

    return emptyState;
  } catch {
    return createEmptyJourneyProgress();
  }
}

function writeJourneyProgress(
  progress: JourneyProgressRecord,
  storage?: StorageLike,
) {
  const targetStorage = resolveStorage(storage);
  if (!targetStorage) {
    return;
  }

  targetStorage.setItem(JOURNEY_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  emitJourneyProgressUpdate();
}

export function markJourneyRouteVisited(
  routeKey: RouteProgressionKey,
  storage?: StorageLike,
) {
  const progress = loadJourneyProgress(storage);
  if (progress[routeKey].visitedAt) {
    return progress;
  }

  const nextProgress = {
    ...progress,
    [routeKey]: {
      ...progress[routeKey],
      visitedAt: Date.now(),
    },
  };

  writeJourneyProgress(nextProgress, storage);
  return nextProgress;
}

export function markJourneyRouteCompleted(
  routeKey: RouteProgressionKey,
  storage?: StorageLike,
) {
  const progress = loadJourneyProgress(storage);
  const now = Date.now();
  const nextProgress = {
    ...progress,
    [routeKey]: {
      visitedAt: progress[routeKey].visitedAt ?? now,
      completedAt: progress[routeKey].completedAt ?? now,
    },
  };

  writeJourneyProgress(nextProgress, storage);
  return nextProgress;
}

export function useJourneyProgressTracker(
  routeKey?: RouteProgressionKey,
  options: { completeOnVisit?: boolean } = {},
) {
  const [progress, setProgress] = useState<JourneyProgressRecord>(() =>
    loadJourneyProgress(),
  );

  useEffect(() => {
    const syncProgress = () => {
      setProgress(loadJourneyProgress());
    };

    syncProgress();

    window.addEventListener(JOURNEY_PROGRESS_EVENT, syncProgress);
    window.addEventListener("storage", syncProgress);

    return () => {
      window.removeEventListener(JOURNEY_PROGRESS_EVENT, syncProgress);
      window.removeEventListener("storage", syncProgress);
    };
  }, []);

  useEffect(() => {
    if (!routeKey) {
      return;
    }

    markJourneyRouteVisited(routeKey);

    if (options.completeOnVisit) {
      markJourneyRouteCompleted(routeKey);
    }
  }, [routeKey, options.completeOnVisit]);

  return {
    progress,
    markCompleted: () => {
      if (!routeKey) {
        return;
      }

      markJourneyRouteCompleted(routeKey);
    },
  };
}
