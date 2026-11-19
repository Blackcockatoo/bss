import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { FIELD_MODE_SESSION_STORAGE_KEY } from "@/lib/fieldMode/session";
import { useLessonProgressStore } from "@/lib/teacher-lessons";
import { FieldLessonLaunchpad } from "./FieldLessonLaunchpad";
import { EMPTY_LESSON_FILTERS } from "@/lib/schools/lessonFilters";

beforeEach(() => {
  window.localStorage.clear();
  useLessonProgressStore.getState().resetAllProgress();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  useLessonProgressStore.getState().resetAllProgress();
});

describe("Field lesson launchpad", () => {
  it("links all seven cards into the Field lesson route", async () => {
    render(<FieldLessonLaunchpad />);
    const starts = screen.getAllByRole("link", { name: /Start lesson/i });
    expect(starts).toHaveLength(7);
    for (const link of starts) {
      expect(link.getAttribute("href")).toMatch(
        /^\/schools\/field\/lessons\//,
      );
      expect(link.getAttribute("href")).not.toContain("/teachers");
    }
    await waitFor(() =>
      expect(window.localStorage.getItem(FIELD_MODE_SESSION_STORAGE_KEY)).not.toBeNull(),
    );
  });

  it("offers only the approved local evidence routes", () => {
    render(<FieldLessonLaunchpad />);
    expect(
      screen.getByRole("link", { name: /Learning Passport/i }),
    ).toHaveAttribute("href", "/schools/field/passport");
    expect(
      screen.getByRole("link", { name: /Teacher Evidence Review/i }),
    ).toHaveAttribute("href", "/schools/field/review");
  });

  it("offers one printable PDF fallback for every lesson", () => {
    render(<FieldLessonLaunchpad />);
    const printLinks = screen.getAllByRole("link", {
      name: /Print \/ save PDF fallback/i,
    });
    expect(printLinks).toHaveLength(7);
    for (const link of printLinks) {
      expect(link.getAttribute("href")).toMatch(
        /^\/schools\/field\/print\//,
      );
    }
  });

  it("filters the list from shareable query values and keeps a GET form", () => {
    render(
      <FieldLessonLaunchpad
        initialFilters={{ ...EMPTY_LESSON_FILTERS, minutes: 15 }}
      />,
    );
    const form = screen.getByRole("form", { name: /Find a lesson/i });
    expect(form).toHaveAttribute("method", "get");
    expect(form).toHaveAttribute("action", "/schools/field/lessons");
    expect(screen.getByRole("button", { name: /Show matching lessons/i })).toBeInTheDocument();
    expect(screen.getByText(/Showing 2 of 7 lessons/)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Start lesson/i })).toHaveLength(2);
  });

  it("can limit the list to paper-friendly lessons", () => {
    render(
      <FieldLessonLaunchpad
        initialFilters={{ ...EMPTY_LESSON_FILTERS, paperFriendly: true }}
      />,
    );
    expect(screen.getByText(/Showing 3 of 7 lessons/)).toBeInTheDocument();
    expect(screen.getByText("Privacy and Responsible Design")).toBeInTheDocument();
    expect(screen.queryByText("Meet the System")).not.toBeInTheDocument();
  });

  it("offers projector slides for every lesson", () => {
    render(<FieldLessonLaunchpad />);
    const slideLinks = screen.getAllByRole("link", { name: /Projector slides/i });
    expect(slideLinks).toHaveLength(7);
    for (const link of slideLinks) {
      expect(link.getAttribute("href")).toMatch(
        /^\/schools\/field\/lessons\/.+\/slides$/,
      );
    }
  });
});
