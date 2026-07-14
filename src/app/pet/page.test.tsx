import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PetPage from "@/app/pet/page";
import { saveDnaImprint } from "@/lib/dnaImprint";
import { getRouteProgression } from "@/lib/routeProgression";

const startTick = vi.fn();
const stopTick = vi.fn();
const setPetType = vi.fn();
const initializeStarterAddons = vi.fn().mockResolvedValue({
  success: true,
  addonsCreated: 3,
});

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/PetRuntimeStage", () => ({
  PetRuntimeStage: () => <div data-testid="pet-runtime-stage" />,
}));

vi.mock("@/components/HUD", () => ({
  HUD: () => <div>HUD</div>,
  HUDAdvancedStats: () => <div>Advanced Stats</div>,
}));

vi.mock("@/components/PetResponseOverlay", () => ({
  PetResponseOverlay: () => <div data-testid="pet-response-overlay" />,
}));

vi.mock("@/components/RouteProgressionCard", () => ({
  RouteProgressionCard: () => <div data-testid="route-progression-card" />,
}));

vi.mock("@/components/RouteTutorialControls", () => ({
  RouteTutorialControls: () => <button type="button">Replay tutorial</button>,
}));

vi.mock("@/components/addons/AddonInventoryPanel", () => ({
  AddonInventoryPanel: () => <div>Addon Inventory</div>,
}));

vi.mock("@/components/addons/PetProfilePanel", () => ({
  PetProfilePanel: () => <div>Pet Profile</div>,
}));

vi.mock("@/components/EvolutionPanel", () => ({
  EvolutionPanel: () => <div data-testid="evolution-panel" />,
}));

vi.mock("@/components/WellnessSync", () => ({
  WellnessSync: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="wellness-sync" /> : null,
}));

vi.mock("@/components/RegistrationCertificate", () => ({
  RegistrationCertificate: ({ isOpen }: { isOpen?: boolean }) =>
    isOpen ? <div data-testid="registration-certificate" /> : null,
  CertificateButton: ({ onClick }: { onClick: () => void }) => (
    <button type="button" onClick={onClick}>
      View Certificate
    </button>
  ),
}));

vi.mock("@/lib/addons/starter", () => ({
  initializeStarterAddons: () => initializeStarterAddons(),
}));

vi.mock("@/lib/journeyProgress", () => ({
  useJourneyProgressTracker: () => ({
    progress: {},
    markCompleted: vi.fn(),
  }),
}));

const storeState = {
  startTick,
  stopTick,
  evolution: {
    state: "GENETICS",
    birthTime: 1710000000000,
  },
  lastAction: null,
  lastActionAt: 0,
  petType: "geometric" as const,
  setPetType,
};

vi.mock("@/lib/store", () => ({
  useStore: (selector: (store: typeof storeState) => unknown) =>
    selector(storeState),
}));

describe("PetPage", () => {
  beforeEach(() => {
    setPetType.mockReset();
    window.localStorage.clear();
    saveDnaImprint({
      selectedSeed: "blue",
      resonanceClass: "Tidal Orbit",
      liveMutationSeed: "2-4-6-8-0",
      dominantLattice: "2 circle · 4 square",
      completedMode: "sound",
      updatedAt: 1710000000000,
    });
  });

  it("surfaces the latest DNA imprint on the canonical pet route", async () => {
    render(<PetPage />);

    await waitFor(() => {
      expect(initializeStarterAddons).toHaveBeenCalled();
    });

    expect(screen.getByTestId("pet-runtime-stage")).toBeInTheDocument();
    expect(
      screen.getByText(getRouteProgression("pet").summary),
    ).toBeInTheDocument();
    expect(screen.getByText(/Latest DNA imprint/i)).toBeInTheDocument();
    expect(screen.getByText(/Tidal Orbit/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Re-open DNA Hub/i }),
    ).toBeInTheDocument();
  });

  it("switches the active body engine from the mechanics lab", async () => {
    render(<PetPage />);

    fireEvent.click(
      screen.getByRole("button", { name: /Advanced \/ Mechanics Lab/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Auralia Guardian/i }));

    expect(setPetType).toHaveBeenCalledWith("auralia");
    expect(
      screen.getByRole("link", { name: /Open Body Forge/i }),
    ).toHaveAttribute("href", "/body-forge");
  });

  it("opens the registration certificate from the advanced section", async () => {
    render(<PetPage />);

    await waitFor(() => {
      expect(initializeStarterAddons).toHaveBeenCalled();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Advanced \/ Mechanics Lab/i }),
    );
    expect(
      screen.queryByTestId("registration-certificate"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /View Certificate/i }));
    expect(
      screen.getByTestId("registration-certificate"),
    ).toBeInTheDocument();
  });

  it("toggles the evolution panel from the advanced section", async () => {
    render(<PetPage />);

    await waitFor(() => {
      expect(initializeStarterAddons).toHaveBeenCalled();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Advanced \/ Mechanics Lab/i }),
    );
    expect(screen.queryByTestId("evolution-panel")).not.toBeInTheDocument();

    const evolutionToggle = screen.getByRole("button", { name: /Evolution/i });
    fireEvent.click(evolutionToggle);
    expect(screen.getByTestId("evolution-panel")).toBeInTheDocument();

    fireEvent.click(evolutionToggle);
    expect(screen.queryByTestId("evolution-panel")).not.toBeInTheDocument();
  });
});
