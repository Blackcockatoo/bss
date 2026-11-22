import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY } from "@/lib/schools/storage";

import { ClassroomTools } from "./ClassroomTools";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  window.localStorage.clear();
});

beforeEach(() => {
  window.localStorage.clear();
});

describe("classroom timer and group maker", () => {
  it("counts down from a preset and can pause or reset", () => {
    let now = 10_000;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    vi.useFakeTimers();
    render(<ClassroomTools />);

    expect(
      screen.getByRole("heading", { level: 1, name: /Classroom timer and groups/i }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "2 minutes" }));
    expect(screen.getByText("02:00")).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Play a gentle sound when time is up/i),
    ).not.toBeChecked();

    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    now += 2000;
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText("01:58")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    now += 4000;
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByText("01:58")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByText("02:00")).toBeInTheDocument();
  });

  it("makes groups from the local alias roster and does not send them anywhere", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 204 }),
    );
    window.localStorage.setItem(
      SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY,
      JSON.stringify([
        { id: "1", alias: "Pip", addedAt: 1 },
        { id: "2", alias: "Jo", addedAt: 2 },
        { id: "3", alias: "Sam", addedAt: 3 },
        { id: "4", alias: "Alex", addedAt: 4 },
      ]),
    );
    render(<ClassroomTools />);

    expect(screen.getByText(/4 aliases found on this device/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Make groups" }));
    expect(screen.getByText("Group 1")).toBeInTheDocument();
    for (const alias of ["Pip", "Jo", "Sam", "Alex"]) {
      expect(screen.getByText(alias)).toBeInTheDocument();
    }
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("can make unnamed groups from a typed number when no roster is present", () => {
    render(<ClassroomTools />);
    expect(screen.getByText(/No alias roster was found/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Number of students/i), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByLabelText(/About this many per group/i), {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Make groups" }));
    expect(screen.getByText("Student 1")).toBeInTheDocument();
    expect(screen.getByText("Student 4")).toBeInTheDocument();
    expect(screen.getByText("Group 2")).toBeInTheDocument();
  });
});
