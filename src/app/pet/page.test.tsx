import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PetPage from "@/app/pet/page";
import { saveDnaImprint } from "@/lib/dnaImprint";
import { getRouteProgression } from "@/lib/routeProgression";

const startTick = vi.fn();
const stopTick = vi.fn();
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

vi.mock("@/components/AuraliaMetaPet", () => ({
  default: () => <div data-testid="auralia-meta-pet" />,
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

vi.mock("@/lib/addons/starter", () => ({
  initializeStarterAddons: () => initializeStarterAddons(),
}));

vi.mock("@/lib/journeyProgress", () => ({
  useJourneyProgressTracker: () => ({
    progress: {},
    markCompleted: vi.fn(),
  }),
}));

vi.mock("@/lib/store", () => ({
  useStore: (
    selector: (store: { startTick: typeof startTick; stopTick: typeof stopTick }) => unknown,
  ) => selector({ startTick, stopTick }),
}));

describe("PetPage", () => {
  beforeEach(() => {
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

  it("surfaces the latest DNA imprint back on the pet route", async () => {
    render(<PetPage />);

    await waitFor(() => {
      expect(initializeStarterAddons).toHaveBeenCalled();
    });

    expect(
      screen.getByText(getRouteProgression("pet").summary),
    ).toBeInTheDocument();
    expect(screen.getByText(/Latest DNA imprint/i)).toBeInTheDocument();
    expect(screen.getByText(/Tidal Orbit/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Re-open DNA Hub/i }),
    ).toBeInTheDocument();
  });
});
