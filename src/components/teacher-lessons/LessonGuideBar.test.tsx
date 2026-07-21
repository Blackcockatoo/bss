import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { LessonGuideBar } from "./LessonGuideBar";

function renderBar(overrides: Partial<Parameters<typeof LessonGuideBar>[0]> = {}) {
  const props = {
    stepNumber: 2,
    totalSteps: 5,
    canGoPrevious: true,
    canGoNext: true,
    isPaused: false,
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    onTeacherPrompt: vi.fn(),
    onStudentTask: vi.fn(),
    onWhatDoINow: vi.fn(),
    onPauseResume: vi.fn(),
    onExit: vi.fn(),
    ...overrides,
  };
  render(<LessonGuideBar {...props} />);
  return props;
}

afterEach(() => cleanup());

describe("LessonGuideBar", () => {
  it("always shows Previous, the step indicator and Next", () => {
    renderBar();
    expect(screen.getByRole("navigation", { name: /lesson controls/i })).toBeTruthy();
    // Step indicator (aria-live).
    expect(screen.getByText(/Step 2/)).toBeTruthy();
    // Previous + Next reachable as buttons.
    expect(
      screen.getByRole("button", { name: /previous/i }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: /^next|next step/i })).toBeTruthy();
  });

  it("exposes Exit Lesson and Pause via the controls", () => {
    const props = renderBar();
    // There are inline (wide) + menu (narrow) copies; click the first Exit.
    fireEvent.click(screen.getAllByRole("button", { name: /exit lesson/i })[0]);
    expect(props.onExit).toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole("button", { name: /^pause$/i })[0]);
    expect(props.onPauseResume).toHaveBeenCalled();
  });

  it("offers a More menu for narrow screens containing the secondary actions", () => {
    renderBar();
    const moreButton = screen.getByRole("button", {
      name: /more lesson controls/i,
    });
    expect(moreButton.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(moreButton);
    expect(moreButton.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("menu")).toBeTruthy();
  });

  it("shows Resume label when paused", () => {
    renderBar({ isPaused: true });
    expect(screen.getAllByRole("button", { name: /resume/i }).length).toBeGreaterThan(0);
  });

  it("disables Next on the last step", () => {
    renderBar({ canGoNext: false });
    const next = screen.getByRole("button", { name: /^next|next step/i });
    expect(next).toBeDisabled();
  });
});
