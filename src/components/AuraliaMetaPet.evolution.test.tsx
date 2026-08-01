import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Auralia is a self-contained guardian: its form system (radiant / sage /
 * wild…) runs on its own internal stats. Evolution is the orthogonal axis it
 * shares with the other two renderers — these tests pin that the guardian
 * actually shows the stage the companion has reached.
 */

const storeState = vi.hoisted(() => ({
  evolution: { state: "GENETICS" } as { state: string },
  traits: null as unknown,
  recordMiniGameResult: () => {},
}));

vi.mock("@/lib/store", () => ({
  useStore: (selector: (value: typeof storeState) => unknown) =>
    selector(storeState),
}));

async function renderAuralia() {
  vi.resetModules();
  const mod = await import("./AuraliaMetaPet");
  return render(<mod.default />);
}

beforeEach(() => {
  window.localStorage.clear();
  storeState.evolution = { state: "GENETICS" };
  storeState.traits = null;
});

afterEach(() => {
  window.localStorage.clear();
});

describe("AuraliaMetaPet evolution integration", () => {
  it("wears the stage it has reached, growing anatomy as it climbs", async () => {
    const hatchling = await renderAuralia();
    const early = hatchling.container.querySelector(
      '[data-testid="auralia-evolution-stage"]',
    );
    expect(early).toBeTruthy();
    expect(early?.querySelector('[data-evolution-adornment="horns"]')).toBeNull();
    expect(early?.querySelector('[data-evolution-mark="helix"]')).toBeTruthy();

    storeState.evolution = { state: "SPECIATION" };
    const apex = await renderAuralia();
    const late = apex.container.querySelector(
      '[data-testid="auralia-evolution-stage"]',
    );
    expect(late?.querySelector('[data-evolution-adornment="horns"]')).toBeTruthy();
    expect(late?.querySelector('[data-evolution-adornment="thirdEye"]')).toBeTruthy();
    expect(late?.querySelector('[data-evolution-adornment="crown"]')).toBeTruthy();
    expect(late?.querySelector('[data-evolution-adornment="wings"]')).toBeTruthy();
    expect(late?.querySelector('[data-evolution-mark="crown"]')).toBeTruthy();
  });

  it("grows the orb as the stage rises, without disturbing the sigil ring", async () => {
    const scaleOf = (root: Element | null): number => {
      const transform = root?.getAttribute("transform") ?? "";
      const match = transform.match(/scale\(([\d.]+)\)/);
      return match ? Number(match[1]) : Number.NaN;
    };

    const hatchling = await renderAuralia();
    const early = scaleOf(
      hatchling.container.querySelector('[data-testid="auralia-evolution-stage"]'),
    );

    storeState.evolution = { state: "SPECIATION" };
    const apex = await renderAuralia();
    const late = scaleOf(
      apex.container.querySelector('[data-testid="auralia-evolution-stage"]'),
    );

    expect(early).toBeCloseTo(1, 3);
    expect(late).toBeGreaterThan(early);
  });
});
