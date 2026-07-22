import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { generateRandomGenome, decodeGenome } from "@/lib/genome";
import { useStore } from "@/lib/store";
import {
  useLessonProgressStore,
  usePetProfileStore,
  type PetObservationCardEvidence,
} from "@/lib/teacher-lessons";
import { TeacherReview } from "./TeacherReview";

const card: PetObservationCardEvidence = {
  kind: "pet-observation-card",
  version: 1,
  lessonId: "meet-your-metapet",
  stepId: "meet-your-metapet-step-5",
  createdAt: 1,
  alias: "Pip",
  observations: { shape: "round", surface: "shiny", movement: "floaty" },
  question: "How does it see me?",
};

function seedEvidence() {
  useLessonProgressStore.getState().startLesson("meet-your-metapet");
  useLessonProgressStore
    .getState()
    .saveEvidenceEntry("meet-your-metapet-step-5", card);
  useLessonProgressStore.getState().completeLesson("meet-your-metapet");
}

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

describe("Teacher review", () => {
  it("shows lesson completion and evidence status", () => {
    seedEvidence();
    render(<TeacherReview />);
    expect(screen.getByText(/Evidence Review/i)).toBeTruthy();
    expect(screen.getByText(/1 of 7 lessons complete/i)).toBeTruthy();
    // Every lesson row renders.
    expect(screen.getByText(/1\. Meet Your Meta-Pet/)).toBeTruthy();
  });

  it("resets a single lesson's evidence", () => {
    seedEvidence();
    render(<TeacherReview />);
    // Open the Meet lesson row.
    fireEvent.click(screen.getByText(/1\. Meet Your Meta-Pet/));
    fireEvent.click(screen.getByText(/Reset this lesson's evidence/i));
    fireEvent.click(screen.getByText(/Confirm reset evidence/i));
    const record =
      useLessonProgressStore.getState().records["meet-your-metapet"];
    expect(record?.evidenceEntries["meet-your-metapet-step-5"]).toBeUndefined();
  });

  it("deletes all local lesson data WITHOUT deleting the pet", () => {
    const genome = generateRandomGenome(() => 0.3);
    useStore.getState().setGenome(genome, decodeGenome(genome));
    seedEvidence();

    render(<TeacherReview />);
    fireEvent.click(
      screen.getByRole("button", { name: /Delete Local Lesson Data/i }),
    );
    fireEvent.click(screen.getByText(/Yes, delete all lesson evidence/i));

    // Lesson data cleared…
    expect(useLessonProgressStore.getState().records).toEqual({});
    // …but the real pet is untouched.
    expect(useStore.getState().genome).toEqual(genome);
  });

  it("keeps Field review links inside the Field boundary", () => {
    seedEvidence();
    render(
      <TeacherReview
        fieldMode
        hubPath="/schools/field/lessons"
        passportPath="/schools/field/passport"
      />,
    );

    fireEvent.click(screen.getByText(/1\. Meet Your Meta-Pet/));
    expect(screen.getByRole("link", { name: /Open lesson/i })).toHaveAttribute(
      "href",
      "/schools/field/lessons/meet-your-metapet",
    );
    expect(screen.getByRole("link", { name: /Open Learning Passport/i })).toHaveAttribute(
      "href",
      "/schools/field/passport",
    );
    expect(screen.queryByText(/Applied to pet/i)).toBeNull();
  });
});
