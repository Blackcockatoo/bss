import { beforeEach, describe, expect, it } from "vitest";

import {
  loadJourneyProgress,
  markJourneyRouteCompleted,
  markJourneyRouteVisited,
} from "@/lib/journeyProgress";

describe("journey progress storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("marks a route as visited without completing it", () => {
    markJourneyRouteVisited("school");

    const progress = loadJourneyProgress();

    expect(progress.school.visitedAt).toEqual(expect.any(Number));
    expect(progress.school.completedAt).toBeNull();
    expect(progress.pet.visitedAt).toBeNull();
  });

  it("marks a route as completed and preserves a visit timestamp", () => {
    markJourneyRouteCompleted("identity");

    const progress = loadJourneyProgress();

    expect(progress.identity.visitedAt).toEqual(expect.any(Number));
    expect(progress.identity.completedAt).toEqual(expect.any(Number));
  });
});
