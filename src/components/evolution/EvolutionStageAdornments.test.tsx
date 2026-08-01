import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EVOLUTION_ORDER, type EvolutionState } from "@/evolution/types";
import { EvolutionStageAdornments } from "./EvolutionStageAdornments";
import { stageTransitionEmphasis, STAGE_TRANSITION_MS } from "./useEvolutionStageTransition";

const ANCHOR = {
  headX: 200,
  headY: 145,
  headRx: 30,
  headRy: 35,
  bodyX: 200,
  bodyY: 210,
  bodyRx: 40,
  bodyRy: 60,
} as const;

function renderStage(state: EvolutionState, layer: "behind" | "front", emphasis = 0) {
  return render(
    <svg>
      <EvolutionStageAdornments
        {...ANCHOR}
        state={state}
        layer={layer}
        color="#60a5fa"
        accentColor="#2563eb"
        underlayColor="#05081A"
        emphasis={emphasis}
      />
    </svg>,
  );
}

describe("EvolutionStageAdornments", () => {
  it("reveals the stage's granted anatomy and nothing it has not earned", () => {
    const seen = EVOLUTION_ORDER.map((state) => {
      const front = renderStage(state, "front").container;
      const behind = renderStage(state, "behind").container;
      return {
        state,
        horns: Boolean(front.querySelector('[data-evolution-adornment="horns"]')),
        thirdEye: Boolean(front.querySelector('[data-evolution-adornment="thirdEye"]')),
        crown: Boolean(front.querySelector('[data-evolution-adornment="crown"]')),
        wings: Boolean(behind.querySelector('[data-evolution-adornment="wings"]')),
      };
    });

    expect(seen).toEqual([
      { state: "GENETICS", horns: false, thirdEye: false, crown: false, wings: false },
      { state: "NEURO", horns: true, thirdEye: false, crown: false, wings: false },
      { state: "QUANTUM", horns: true, thirdEye: true, crown: false, wings: false },
      { state: "SPECIATION", horns: true, thirdEye: true, crown: true, wings: true },
    ]);
  });

  it("etches a stage sigil at every stage, and a different one each time", () => {
    const marks = EVOLUTION_ORDER.map((state) =>
      renderStage(state, "front").container.querySelector("[data-evolution-mark]")
        ?.getAttribute("data-evolution-mark"),
    );
    expect(marks.every(Boolean)).toBe(true);
    expect(new Set(marks).size).toBe(EVOLUTION_ORDER.length);
  });

  it("keeps wings on the behind layer and everything else in front", () => {
    const behind = renderStage("SPECIATION", "behind").container;
    expect(behind.querySelector('[data-evolution-adornment="wings"]')).toBeTruthy();
    expect(behind.querySelector('[data-evolution-adornment="crown"]')).toBeNull();
    expect(behind.querySelector("[data-evolution-mark]")).toBeNull();
  });

  it("draws nothing on the behind layer before wings are earned", () => {
    for (const state of ["GENETICS", "NEURO", "QUANTUM"] as const) {
      const { container } = renderStage(state, "behind");
      expect(container.querySelector("g"), state).toBeNull();
    }
  });

  it("paints every mark twice so it stays legible on any body colour", () => {
    const { container } = renderStage("NEURO", "front");
    const mark = container.querySelector("[data-evolution-mark]");
    // One dark underlay pass plus one stage-coloured pass.
    expect(mark?.children).toHaveLength(2);
  });

  it("produces only finite SVG coordinates at every stage and emphasis", () => {
    for (const state of EVOLUTION_ORDER) {
      for (const emphasis of [0, 0.5, 1]) {
        for (const layer of ["behind", "front"] as const) {
          const { container } = renderStage(state, layer, emphasis);
          const markup = container.innerHTML;
          expect(markup.includes("NaN"), `${state}/${layer}@${emphasis}`).toBe(false);
          expect(markup.includes("Infinity"), `${state}/${layer}@${emphasis}`).toBe(false);
        }
      }
    }
  });
});

describe("stageTransitionEmphasis", () => {
  it("rises, holds, then settles back to nothing", () => {
    expect(stageTransitionEmphasis(0)).toBe(0);
    expect(stageTransitionEmphasis(STAGE_TRANSITION_MS * 0.4)).toBe(1);
    expect(stageTransitionEmphasis(STAGE_TRANSITION_MS)).toBe(0);
    expect(stageTransitionEmphasis(STAGE_TRANSITION_MS * 5)).toBe(0);
    expect(stageTransitionEmphasis(STAGE_TRANSITION_MS * 0.1)).toBeGreaterThan(0);
    expect(stageTransitionEmphasis(STAGE_TRANSITION_MS * 0.1)).toBeLessThan(1);
  });

  it("stays bounded for hostile inputs", () => {
    for (const value of [-100, Number.NaN, Number.POSITIVE_INFINITY]) {
      const emphasis = stageTransitionEmphasis(value);
      expect(Number.isFinite(emphasis)).toBe(true);
      expect(emphasis).toBeGreaterThanOrEqual(0);
      expect(emphasis).toBeLessThanOrEqual(1);
    }
  });

  it("keeps the signal but drops the amplitude under reduced motion", () => {
    const peak = STAGE_TRANSITION_MS * 0.4;
    const reduced = stageTransitionEmphasis(peak, true);
    expect(reduced).toBeGreaterThan(0);
    expect(reduced).toBeLessThan(stageTransitionEmphasis(peak, false));
  });
});
