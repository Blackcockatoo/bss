import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import {
  DEMO_PET_CONFIG,
  LESSON_DEFINITIONS,
  cloneLessonPetConfig,
  getTimingModeMeta,
  setFeatureAvailabilityOverrides,
  type LessonDefinition,
  type LessonProgressRecord,
} from "@/lib/teacher-lessons";
import { ActivityHost } from "./registry";
import type { LessonActivityProps } from "./types";

function emptyRecord(lesson: LessonDefinition): LessonProgressRecord {
  return {
    lessonId: lesson.id,
    currentStep: 0,
    completedSteps: [],
    completed: false,
    paused: false,
    startedAt: null,
    lastActiveAt: null,
    completedAt: null,
    evidence: {},
    evidenceEntries: {},
  };
}

function makeProps(
  lesson: LessonDefinition,
  stepIndex = 0,
): LessonActivityProps {
  return {
    lesson,
    step: lesson.steps[stepIndex],
    stepIndex,
    viewMode: "student",
    isPreview: false,
    presentationMode: "standard",
    timing: getTimingModeMeta("standard"),
    reducedMotion: true,
    lowPerformance: false,
    pet: {
      startingConfig: cloneLessonPetConfig(DEMO_PET_CONFIG),
      isDemo: true,
      isFallback: false,
      canPersist: false,
    },
    record: emptyRecord(lesson),
    getEvidence: () => undefined,
    saveEvidence: () => undefined,
    onAskForHelp: () => undefined,
  };
}

afterEach(() => {
  cleanup();
  setFeatureAvailabilityOverrides({});
});

describe("lesson activity registry", () => {
  it("mounts every lesson's introduce step through the host", () => {
    // Force the visualiser to its fallback so no canvas is required in tests.
    setFeatureAvailabilityOverrides({ "advanced-visualisation": false });

    for (const lesson of LESSON_DEFINITIONS) {
      const { unmount } = render(<ActivityHost {...makeProps(lesson)} />);
      // Every activity (and the fallback) frames the step with its kind label.
      expect(screen.getAllByText("Introduce").length).toBeGreaterThan(0);
      unmount();
    }
  });

  it("shows a teacher-friendly fallback when a required feature is unavailable", () => {
    setFeatureAvailabilityOverrides({ "advanced-visualisation": false });
    const patterns = LESSON_DEFINITIONS.find(
      (l) => l.id === "patterns-behind-the-pet",
    )!;
    render(<ActivityHost {...makeProps(patterns)} />);
    expect(screen.getByText(/simplified classroom example/i)).toBeTruthy();
    expect(screen.getByText(/Return to Teacher Hub/i)).toBeTruthy();
  });

  it("renders a real activity when the feature is available", () => {
    setFeatureAvailabilityOverrides({});
    const meet = LESSON_DEFINITIONS.find(
      (l) => l.id === "meet-your-metapet",
    )!;
    render(<ActivityHost {...makeProps(meet)} />);
    expect(
      screen.getByText(/Look closely at the Meta-Pet/i),
    ).toBeTruthy();
  });
});
