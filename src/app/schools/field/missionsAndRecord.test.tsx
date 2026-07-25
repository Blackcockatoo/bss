import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import FieldMissionsPage from "@/app/schools/field/missions/page";
import FieldRecordPage from "@/app/schools/field/record/page";
import { isPathnameAllowedByPolicy } from "@/lib/childSafeBaseline";
import {
  useClassConsequencesStore,
  useFieldMissionProgressStore,
  useLessonProgressStore,
} from "@/lib/teacher-lessons";

beforeEach(() => {
  window.localStorage.clear();
  useFieldMissionProgressStore.getState().resetAll();
  useClassConsequencesStore.getState().resetAll();
  useLessonProgressStore.getState().resetAllProgress();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  useFieldMissionProgressStore.getState().resetAll();
  useClassConsequencesStore.getState().resetAll();
  useLessonProgressStore.getState().resetAllProgress();
});

describe("Field Missions page", () => {
  it("lists all eight missions with no scores or rankings", () => {
    render(<FieldMissionsPage />);
    expect(
      screen.getByRole("heading", { name: /Short investigations for any lesson/i }),
    ).toBeInTheDocument();
    for (const title of [
      "Silent Signal",
      "One Change Only",
      "Broken Loop",
      "Pet Detective",
      "Privacy Inspector",
      "Pattern Mutation",
      "Low-Tech Rescue",
      "Explain It Simply",
    ]) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
    expect(screen.queryByText(/leaderboard/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/1st place|top score|high score/i)).not.toBeInTheDocument();
  });

  it("shows the class-level state indicator, not an individual score", () => {
    render(<FieldMissionsPage />);
    expect(
      screen.getByRole("heading", { name: /Class Meta-Pet state/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/reflects the class as a whole/i),
    ).toBeInTheDocument();
  });

  it("only links to routes approved by the Field profile", () => {
    const { container } = render(<FieldMissionsPage />);
    for (const anchor of container.querySelectorAll("a[href]")) {
      const href = anchor.getAttribute("href");
      expect(href).not.toBeNull();
      expect(isPathnameAllowedByPolicy(href ?? "", "field"), href ?? "").toBe(
        true,
      );
    }
  });

  it("marking a mission complete is button-operable and updates class state", () => {
    render(<FieldMissionsPage />);
    const toggle = screen.getByRole("button", { name: /Silent Signal/i });
    fireEvent.click(toggle);
    const panel = screen.getByText(/Off-screen action:/i).closest("div")!
      .parentElement!;
    const completeButton = within(panel).getByRole("button", {
      name: /Mark mission complete/i,
    });
    fireEvent.click(completeButton);
    expect(
      within(panel).getByRole("button", { name: /Marked complete/i }),
    ).toBeDisabled();
    expect(useClassConsequencesStore.getState().values.trust).toBeGreaterThan(50);
  });
});

describe("Class Field Record page", () => {
  it("renders the no-grading class summary heading", () => {
    render(<FieldRecordPage />);
    expect(
      screen.getByRole("heading", { name: /lessons\s*\n?\s*complete/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/No student names are included/i)).toBeInTheDocument();
  });

  it("only links to routes approved by the Field profile", () => {
    const { container } = render(<FieldRecordPage />);
    for (const anchor of container.querySelectorAll("a[href]")) {
      const href = anchor.getAttribute("href");
      expect(href).not.toBeNull();
      expect(isPathnameAllowedByPolicy(href ?? "", "field"), href ?? "").toBe(
        true,
      );
    }
  });
});
