import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { useStore } from "@/lib/store";
import {
  useLessonProgressStore,
  usePetProfileStore,
  type PetObservationCardEvidence,
} from "@/lib/teacher-lessons";
import { LearningPassport } from "./LearningPassport";

const card: PetObservationCardEvidence = {
  kind: "pet-observation-card",
  version: 1,
  lessonId: "meet-the-system",
  stepId: "meet-the-system-step-5",
  createdAt: 1,
  alias: "Pip",
  observations: { shape: "round", surface: "shiny", movement: "floaty" },
  question: "How does it see me?",
  appliedChange: {
    appliedToPet: true,
    updateType: "alias",
    appliedSummary: "Alias set to “Pip”.",
    appliedAt: 1,
  },
};

beforeEach(() => {
  window.localStorage.clear();
  useLessonProgressStore.getState().resetAllProgress();
  usePetProfileStore.getState().reset();
  useStore.setState({ genome: null, traits: null });
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  useLessonProgressStore.getState().resetAllProgress();
  usePetProfileStore.getState().reset();
  useStore.setState({ genome: null, traits: null });
});

describe("Learning Passport", () => {
  it("renders an empty passport safely", () => {
    render(<LearningPassport />);
    expect(screen.getByText(/Meta-Pet Learning Passport/i)).toBeTruthy();
    expect(screen.getByText(/No lessons completed yet/i)).toBeTruthy();
    // All seven sections present even when empty.
    expect(screen.getByText(/7\. Test, Reflect and Improve/)).toBeTruthy();
  });

  it("renders a completed section with evidence and applied changes", () => {
    usePetProfileStore.getState().setAlias("Pip");
    useLessonProgressStore.getState().startLesson("meet-the-system");
    useLessonProgressStore
      .getState()
      .saveEvidenceEntry("meet-the-system-step-5", card);
    useLessonProgressStore.getState().completeLesson("meet-the-system");

    render(<LearningPassport />);
    expect(screen.getByText(/Changes applied to the Meta-Pet/i)).toBeTruthy();
    expect(screen.getAllByText(/Alias set to/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/1 of 7 lessons complete/i)).toBeTruthy();
  });

  it("uses alias-only evidence and hides consumer pet changes in Field Mode", () => {
    usePetProfileStore.getState().setAlias("Consumer Profile Alias");
    useLessonProgressStore.getState().startLesson("meet-the-system");
    useLessonProgressStore
      .getState()
      .saveEvidenceEntry("meet-the-system-step-5", card);
    useLessonProgressStore.getState().completeLesson("meet-the-system");

    render(
      <LearningPassport
        fieldMode
        hubPath="/schools/field/lessons"
      />,
    );
    expect(screen.getAllByText("Pip").length).toBeGreaterThan(0);
    expect(screen.queryByText("Consumer Profile Alias")).toBeNull();
    expect(screen.queryByText(/Changes applied to the Meta-Pet/i)).toBeNull();
    expect(screen.getByText(/no student account or consumer pet is required/i)).toBeTruthy();
    expect(screen.getAllByRole("link")[0]).toHaveAttribute(
      "href",
      "/schools/field/lessons",
    );
  });
});
