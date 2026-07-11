import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EvolutionData } from "@/evolution";
import { EvolutionPanel } from "./EvolutionPanel";

const tryEvolve = vi.fn();

let mockEvolution: EvolutionData;
const mockVitals = {
  hunger: 20,
  hygiene: 90,
  mood: 90,
  energy: 90,
  isSick: false,
  sicknessSeverity: 0,
  sicknessType: null,
  deathCount: 0,
};

vi.mock("@/lib/store", () => ({
  useStore: (
    selector: (store: {
      evolution: EvolutionData;
      vitals: typeof mockVitals;
      tryEvolve: typeof tryEvolve;
    }) => unknown,
  ) => selector({ evolution: mockEvolution, vitals: mockVitals, tryEvolve }),
}));

vi.mock("./EvolutionCeremony", () => ({
  EvolutionCeremony: ({ stage }: { stage: string }) => (
    <div data-testid="evolution-ceremony">{stage}</div>
  ),
}));

function makeEvolution(overrides: Partial<EvolutionData> = {}): EvolutionData {
  const now = Date.now();
  return {
    state: "GENETICS",
    birthTime: now - 1000,
    lastEvolutionTime: now - 1000,
    experience: 40,
    level: 5,
    currentLevelXp: 0,
    totalXp: 250,
    totalInteractions: 15,
    canEvolve: false,
    ...overrides,
  };
}

beforeEach(() => {
  tryEvolve.mockReset();
  mockEvolution = makeEvolution();
});

describe("EvolutionPanel", () => {
  it("shows the current stage and next-stage requirements", () => {
    render(<EvolutionPanel />);

    expect(screen.getByText("GENETICS")).toBeInTheDocument();
    expect(screen.getByText(/Evolution Stage 1\/4/i)).toBeInTheDocument();
    expect(screen.getByText(/Next Stage: NEURO/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Evolve Now!/i }),
    ).not.toBeInTheDocument();
  });

  it("offers evolution and fires the ceremony when eligible", () => {
    mockEvolution = makeEvolution({ canEvolve: true });
    tryEvolve.mockReturnValue(true);

    render(<EvolutionPanel />);

    const evolveButton = screen.getByRole("button", { name: /Evolve Now!/i });
    fireEvent.click(evolveButton);

    expect(tryEvolve).toHaveBeenCalledOnce();
    expect(screen.getByTestId("evolution-ceremony")).toHaveTextContent("NEURO");
  });

  it("does not fire the ceremony when evolution is rejected", () => {
    mockEvolution = makeEvolution({ canEvolve: true });
    tryEvolve.mockReturnValue(false);

    render(<EvolutionPanel />);

    fireEvent.click(screen.getByRole("button", { name: /Evolve Now!/i }));

    expect(screen.queryByTestId("evolution-ceremony")).not.toBeInTheDocument();
  });

  it("treats the final stage as complete with no next requirement", () => {
    mockEvolution = makeEvolution({ state: "SPECIATION", canEvolve: false });

    render(<EvolutionPanel />);

    expect(screen.getByText(/Evolution Stage 4\/4/i)).toBeInTheDocument();
    expect(screen.queryByText(/Next evolution/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Next Stage:/i)).not.toBeInTheDocument();
  });
});
