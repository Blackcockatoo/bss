import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createDefaultUserBondState } from "@/lib/bond";
import { createDefaultMemoryState } from "@/lib/memory";
import { WellnessDashboard } from "./WellnessDashboard";

const checkInMood = vi.fn();

vi.mock("@/lib/bond/useBond", () => ({
  useBond: () => ({
    isLoading: false,
    bond: createDefaultUserBondState(),
    memory: createDefaultMemoryState(),
    insights: [],
    resonance: "attuning",
    checkInMood,
    recordActivity: vi.fn(),
    createHabit: vi.fn(),
    completeHabit: vi.fn(),
    deleteHabit: vi.fn(),
    addReflection: vi.fn(),
    captureMilestone: vi.fn(),
    save: vi.fn(),
  }),
}));

vi.mock("./HydrationTracker", () => ({
  HydrationTracker: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="hydration-dialog" /> : null,
  HydrationQuickButton: ({ onClick }: { onClick: () => void }) => (
    <button type="button" onClick={onClick}>
      Hydration status
    </button>
  ),
}));

vi.mock("./SleepTracker", () => ({
  SleepTracker: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="sleep-dialog" /> : null,
  SleepStatusButton: ({ onClick }: { onClick: () => void }) => (
    <button type="button" onClick={onClick}>
      Sleep status
    </button>
  ),
}));

vi.mock("./AnxietyAnchor", () => ({
  AnxietyAnchor: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="grounding-dialog" /> : null,
  EmergencyGroundingButton: ({ onClick }: { onClick: () => void }) => (
    <button type="button" onClick={onClick}>
      Grounding
    </button>
  ),
}));

vi.mock("./WellnessSettings", () => ({
  WellnessSettings: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="settings-dialog" /> : null,
  WellnessSettingsButton: ({ onClick }: { onClick: () => void }) => (
    <button type="button" onClick={onClick}>
      Open settings
    </button>
  ),
}));

describe("WellnessDashboard", () => {
  it("shows the mood check-in and graph by default", () => {
    render(<WellnessDashboard />);

    expect(screen.getByText(/How are you feeling\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Mood over time/i)).toBeInTheDocument();
  });

  it("switches to the body tab and opens the hydration dialog", () => {
    render(<WellnessDashboard />);

    fireEvent.click(screen.getByRole("button", { name: /Body/i }));
    const statusButton = screen.getByRole("button", {
      name: /Hydration status/i,
    });
    expect(screen.queryByTestId("hydration-dialog")).not.toBeInTheDocument();

    fireEvent.click(statusButton);
    expect(screen.getByTestId("hydration-dialog")).toBeInTheDocument();
  });

  it("shows habits and grounding on the mind tab", () => {
    render(<WellnessDashboard />);

    fireEvent.click(screen.getByRole("button", { name: /Mind/i }));
    expect(screen.getByText(/Feeling overwhelmed\?/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Rituals/i).length).toBeGreaterThan(0);
  });

  it("shows insights and memories on the story tab", () => {
    render(<WellnessDashboard />);

    fireEvent.click(screen.getByRole("button", { name: /Story/i }));
    expect(
      screen.getByText(/What your companion has learned about you/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Bond Level/i)).toBeInTheDocument();
  });

  it("opens wellness settings from the settings tab", () => {
    render(<WellnessDashboard />);

    fireEvent.click(screen.getByRole("button", { name: /Settings/i }));
    fireEvent.click(screen.getByRole("button", { name: /Open settings/i }));
    expect(screen.getByTestId("settings-dialog")).toBeInTheDocument();
  });
});
