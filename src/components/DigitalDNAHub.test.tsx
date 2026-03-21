import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import DigitalDNAHub from "@/components/DigitalDNAHub";

const educationStore = {
  incrementDnaInteraction: vi.fn(),
  initProgress: vi.fn(),
  recordPostResponse: vi.fn(),
  saveQuestSummary: vi.fn(),
  completeLessonWithFlair: vi.fn(),
  lessonProgress: [],
  queue: [],
};

vi.mock("@/components/PatternQuestBoard", () => ({
  PatternQuestBoard: () => <div data-testid="pattern-quest-board" />,
}));

vi.mock("@/lib/education", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/education")>("@/lib/education");

  return {
    ...actual,
    useEducationStore: (selector: (store: typeof educationStore) => unknown) =>
      selector(educationStore),
  };
});

vi.mock("tone", () => {
  class MockPolySynth {
    connect() {
      return this;
    }

    toDestination() {
      return this;
    }

    triggerAttackRelease() {}

    dispose() {}
  }

  class MockReverb {
    toDestination() {
      return this;
    }

    dispose() {}
  }

  return {
    PolySynth: MockPolySynth,
    Reverb: MockReverb,
    Synth: class MockSynth {},
    context: { state: "running" },
    start: vi.fn().mockResolvedValue(undefined),
    now: () => 0,
  };
});

describe("DigitalDNAHub", () => {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;

  beforeEach(() => {
    window.localStorage.clear();
    HTMLCanvasElement.prototype.getContext = vi.fn(function (
      this: HTMLCanvasElement,
      type: string,
    ) {
      if (type === "2d") {
        return originalGetContext.call(this, type as any);
      }

      return null;
    }) as typeof HTMLCanvasElement.prototype.getContext;
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
    vi.restoreAllMocks();
  });

  it("falls back to guided 2d modes when webgl is unavailable", () => {
    render(<DigitalDNAHub />);

    expect(screen.getByRole("button", { name: /DNA Helix/i })).toBeDisabled();
    expect(screen.getAllByText(/Guided Journey/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/3D helix unavailable on this device/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Mutation seed/i)).toBeInTheDocument();

    const soundLabButton = screen.getAllByRole("button", {
      name: /Sound Lab/i,
    })[0];
    expect(soundLabButton).not.toBeDisabled();

    fireEvent.click(soundLabButton);

    expect(screen.getAllByText(/Sound Lab/i).length).toBeGreaterThan(0);
  });
});
