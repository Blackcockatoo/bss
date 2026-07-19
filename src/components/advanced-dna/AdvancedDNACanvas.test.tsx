import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { decodeGenome, type Genome } from "@/lib/genome";
import { DEFAULT_VITALS } from "@/vitals";
import { buildDnaVisualModel } from "./dnaMapper";
import type { AdvancedDnaControlsState } from "./types";
import { AdvancedDNACanvas } from "./AdvancedDNACanvas";

const rendererState = vi.hoisted(() => ({
  instances: [] as Array<{
    render: ReturnType<typeof vi.fn>;
    updateModel: ReturnType<typeof vi.fn>;
    reset: ReturnType<typeof vi.fn>;
    dispose: ReturnType<typeof vi.fn>;
  }>,
}));

vi.mock("./renderers", () => ({
  createDnaModeRenderer: () => {
    const instance = {
      render: vi.fn(),
      updateModel: vi.fn(),
      reset: vi.fn(),
      dispose: vi.fn(),
    };
    rendererState.instances.push(instance);
    return instance;
  },
}));

const genome: Genome = {
  red60: Array.from({ length: 60 }, (_, index) => index % 10),
  blue60: Array.from({ length: 60 }, (_, index) => (index * 3) % 10),
  black60: Array.from({ length: 60 }, (_, index) => (index * 7) % 10),
};
const model = buildDnaVisualModel({
  genome,
  traits: decodeGenome(genome),
  vitals: DEFAULT_VITALS,
  mutationLog: [],
  petId: "canvas-pet",
  petName: "Canvas Pet",
  isFallback: false,
});
const performanceProfile = {
  dprCap: 1,
  densityScale: 0.5,
  blurScale: 0,
  trailAlpha: 0.24,
  recursion: 1,
  targetFps: 30,
};

function makeControls(
  overrides: Partial<AdvancedDnaControlsState> = {},
): AdvancedDnaControlsState {
  return {
    mode: "sigil",
    speed: 1,
    intensity: 1,
    mutationLevel: 0.2,
    particleDensity: 0.5,
    symmetry: 12,
    cameraDepth: 1,
    dimension: 4,
    playing: true,
    performanceMode: "performance",
    animationNonce: 0,
    ...overrides,
  };
}

describe("AdvancedDNACanvas lifecycle", () => {
  let frames: Map<number, FrameRequestCallback>;
  let frameId: number;
  let coarsePointer: boolean;
  let originalGetContext: typeof HTMLCanvasElement.prototype.getContext;

  beforeEach(() => {
    rendererState.instances.length = 0;
    frames = new Map();
    frameId = 0;
    coarsePointer = false;
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frameId += 1;
      frames.set(frameId, callback);
      return frameId;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      frames.delete(id);
    });
    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserverMock {
        observe() {}
        disconnect() {}
      },
    );
    vi.spyOn(window, "matchMedia").mockReturnValue({
      get matches() {
        return coarsePointer;
      },
      media: "(pointer: coarse)",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 720,
      bottom: 520,
      width: 720,
      height: 520,
      toJSON: () => ({}),
    });
    originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      setTransform: vi.fn(),
    })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps exactly one animation loop through mode switches and cancels on unmount", () => {
    const { rerender, unmount } = render(
      <AdvancedDNACanvas
        model={model}
        controls={makeControls()}
        performance={performanceProfile}
        reducedMotion={false}
        resetViewToken={0}
      />,
    );

    expect(frames.size).toBe(1);
    expect(rendererState.instances).toHaveLength(1);

    rerender(
      <AdvancedDNACanvas
        model={model}
        controls={makeControls({ mode: "cascade" })}
        performance={performanceProfile}
        reducedMotion={false}
        resetViewToken={0}
      />,
    );

    expect(frames.size).toBe(1);
    expect(rendererState.instances).toHaveLength(2);
    expect(rendererState.instances[0].dispose).toHaveBeenCalledTimes(1);

    rerender(
      <AdvancedDNACanvas
        model={model}
        controls={makeControls({ mode: "cascade", playing: false })}
        performance={performanceProfile}
        reducedMotion={false}
        resetViewToken={0}
      />,
    );
    expect(frames.size).toBe(0);

    rerender(
      <AdvancedDNACanvas
        model={model}
        controls={makeControls({ mode: "cascade", playing: true })}
        performance={performanceProfile}
        reducedMotion={false}
        resetViewToken={0}
      />,
    );
    expect(frames.size).toBe(1);

    unmount();
    expect(frames.size).toBe(0);
    expect(rendererState.instances[1].dispose).toHaveBeenCalledTimes(1);
  });

  it("keeps page scrolling available until mobile touch interaction is engaged", () => {
    coarsePointer = true;
    render(
      <AdvancedDNACanvas
        model={model}
        controls={makeControls({ playing: false })}
        performance={performanceProfile}
        reducedMotion={false}
        resetViewToken={0}
      />,
    );

    const canvas = screen.getByLabelText(/visualisation of Canvas Pet's DNA/i);
    expect(canvas).toHaveStyle({ touchAction: "pan-y pinch-zoom" });

    fireEvent.click(
      screen.getByRole("button", { name: /engage touch controls/i }),
    );
    expect(canvas).toHaveStyle({ touchAction: "none" });
    expect(
      screen.getByRole("button", { name: /restore page scrolling/i }),
    ).toBeInTheDocument();
  });
});
