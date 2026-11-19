import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SCHOOLS_TEACHER_FEEDBACK_STORAGE_KEY } from "@/lib/schools/storage";

import { TeacherFeedbackForm } from "./TeacherFeedbackForm";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("private teacher feedback", () => {
  it("saves a rating locally and can copy the export", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 204 }),
    );
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: { writeText },
    });

    render(<TeacherFeedbackForm initialLessonId="meet-the-system" />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Worked well" }));
    fireEvent.change(screen.getByLabelText(/Optional short note/i), {
      target: { value: "The stop point was clear." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save on this device/i }));

    expect(screen.getByText(/Saved on this device only/)).toBeInTheDocument();
    expect(screen.getByText("The stop point was clear.")).toBeInTheDocument();
    expect(window.localStorage.getItem(SCHOOLS_TEACHER_FEEDBACK_STORAGE_KEY)).toContain(
      "worked-well",
    );
    expect(window.localStorage.getItem(SCHOOLS_TEACHER_FEEDBACK_STORAGE_KEY)).not.toMatch(
      /studentName|email/,
    );

    fireEvent.click(screen.getByRole("button", { name: /Copy or export these notes/i }));
    expect(writeText).toHaveBeenCalled();
    expect(String(writeText.mock.calls[0]?.[0])).toContain("Meet the System");
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
    vi.unstubAllGlobals();
  });
});
