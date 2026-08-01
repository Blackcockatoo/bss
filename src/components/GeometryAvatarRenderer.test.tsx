import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GeometryAvatarRenderer } from "./GeometryAvatarRenderer";
import { deriveSriYantraProjectionV2 } from "@/lib/geometry/projection";

const state = vi.hoisted(() => ({
  genome: null as null | {
    red60: number[];
    blue60: number[];
    black60: number[];
  },
  petType: "geometric",
  evolution: { state: "GENETICS" } as { state: string },
}));

vi.mock("@/lib/store", () => ({
  useStore: (selector: (value: typeof state) => unknown) => selector(state),
}));

vi.mock("./SriYantraPetDisplay", () => ({
  SriYantraPetDisplay: ({
    red,
    blue,
    black,
  }: {
    red: string;
    blue: string;
    black: string;
  }) => (
    <div
      data-testid="sri-yantra"
      data-red={red}
      data-blue={blue}
      data-black={black}
    />
  ),
}));

describe("GeometryAvatarRenderer", () => {
  beforeEach(() => {
    state.genome = {
      red60: Array.from({ length: 60 }, (_, index) => index),
      blue60: Array.from({ length: 60 }, (_, index) => 59 - index),
      black60: Array.from({ length: 60 }, (_, index) => index * 7),
    };
  });

  it("projects all three live strands through the chamber-aware lens", () => {
    render(<GeometryAvatarRenderer animated={false} />);

    const renderer = screen.getByTestId("sri-yantra");
    const expected = deriveSriYantraProjectionV2(state.genome!);
    expect(renderer).toHaveAttribute("data-red", expected.strands.red);
    expect(renderer).toHaveAttribute("data-blue", expected.strands.blue);
    expect(renderer).toHaveAttribute("data-black", expected.strands.black);
    expect(
      screen.getByTestId("geometry-personality-intent"),
    ).toBeInTheDocument();
  });

  it("shows the live evolution stage on the yantra without touching the locked sprite", () => {
    state.evolution = { state: "GENETICS" };
    const hatchling = render(<GeometryAvatarRenderer animated={false} />);
    const stage = hatchling.container.querySelector(
      '[data-testid="geometry-evolution-stage"]',
    );
    expect(stage).toBeTruthy();
    expect(stage?.querySelector('[data-evolution-adornment="horns"]')).toBeNull();
    expect(stage?.querySelector('[data-evolution-mark="helix"]')).toBeTruthy();

    state.evolution = { state: "SPECIATION" };
    const apex = render(<GeometryAvatarRenderer animated={false} />);
    const apexStage = apex.container.querySelector(
      '[data-testid="geometry-evolution-stage"]',
    );
    expect(apexStage?.querySelector('[data-evolution-adornment="horns"]')).toBeTruthy();
    expect(apexStage?.querySelector('[data-evolution-adornment="crown"]')).toBeTruthy();
    expect(apexStage?.querySelector('[data-evolution-adornment="wings"]')).toBeTruthy();
    expect(apexStage?.querySelector('[data-evolution-mark="crown"]')).toBeTruthy();

    // The sprite itself must be driven by the genome alone — evolution never
    // reaches into the checksum-locked engine's strand packet.
    expect(screen.getAllByTestId("sri-yantra")[0].getAttribute("data-red")).toBe(
      screen.getAllByTestId("sri-yantra")[1].getAttribute("data-red"),
    );
  });

  it("never lends the active parent's earned stage to an offspring preview", () => {
    // BreedingChamber previews an unborn offspring via genomeOverride, which
    // deliberately detaches it from the active registry record. Without an
    // explicit stage that fell through to the live store, so a newborn
    // rendered wearing the parent's crown and wings.
    state.evolution = { state: "SPECIATION" };
    // No explicit stage: a self-contained preview must be safe by default,
    // not only when a call site remembers to pass one.
    const { container } = render(
      <GeometryAvatarRenderer
        animated={false}
        compact
        genomeOverride={state.genome!}
      />,
    );
    const stage = container.querySelector(
      '[data-testid="geometry-evolution-stage"]',
    );
    expect(stage?.querySelector('[data-evolution-adornment="crown"]')).toBeNull();
    expect(stage?.querySelector('[data-evolution-adornment="wings"]')).toBeNull();
    expect(stage?.querySelector('[data-evolution-adornment="thirdEye"]')).toBeNull();
    expect(stage?.querySelector('[data-evolution-mark="helix"]')).toBeTruthy();
  });

  it("still shows the active pet's stage when it is not a preview", () => {
    state.evolution = { state: "SPECIATION" };
    const { container } = render(<GeometryAvatarRenderer animated={false} />);
    const stage = container.querySelector(
      '[data-testid="geometry-evolution-stage"]',
    );
    expect(stage?.querySelector('[data-evolution-adornment="crown"]')).toBeTruthy();
  });

  it("keeps a preview self-contained: an explicit stage beats the live store", () => {
    state.evolution = { state: "SPECIATION" };
    const { container } = render(
      <GeometryAvatarRenderer animated={false} evolutionStateOverride="GENETICS" />,
    );
    const stage = container.querySelector(
      '[data-testid="geometry-evolution-stage"]',
    );
    // A child preview must not borrow the active parent's crown.
    expect(stage?.querySelector('[data-evolution-adornment="crown"]')).toBeNull();
    expect(stage?.querySelector('[data-evolution-mark="helix"]')).toBeTruthy();
  });
});
