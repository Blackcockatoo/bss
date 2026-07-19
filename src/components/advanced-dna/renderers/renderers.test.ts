import { describe, expect, it } from "vitest";
import { decodeGenome, type Genome } from "@/lib/genome";
import { DEFAULT_VITALS } from "@/vitals";
import { buildDnaVisualModel } from "../dnaMapper";
import type {
  AdvancedDnaControlsState,
  AdvancedDnaMode,
  RenderFrame,
} from "../types";
import { createDnaModeRenderer } from ".";

function genome(): Genome {
  return {
    red60: Array.from({ length: 60 }, (_, index) => (index * 7 + 1) % 10),
    blue60: Array.from({ length: 60 }, (_, index) => (index * 3 + 4) % 10),
    black60: Array.from({ length: 60 }, (_, index) => (index * 9 + 2) % 10),
  };
}

function recordingContext() {
  const calls = new Map<string, number>();
  const count = (name: string) => calls.set(name, (calls.get(name) ?? 0) + 1);
  const gradient = { addColorStop: () => count("addColorStop") };
  const context = new Proxy(
    {},
    {
      get(_target, property) {
        if (
          property === "createRadialGradient" ||
          property === "createLinearGradient"
        ) {
          return () => {
            count(String(property));
            return gradient;
          };
        }
        return (..._args: unknown[]) => count(String(property));
      },
      set(_target, property) {
        count(`set:${String(property)}`);
        return true;
      },
    },
  ) as CanvasRenderingContext2D;
  return { context, calls };
}

const visualGenome = genome();
const model = buildDnaVisualModel({
  genome: visualGenome,
  traits: decodeGenome(visualGenome),
  vitals: DEFAULT_VITALS,
  mutationLog: [
    { strand: "black", index: 22, before: 1, after: visualGenome.black60[22] },
  ],
  petId: "renderer-pet",
  petName: "Renderer Pet",
  isFallback: false,
});

function controls(mode: AdvancedDnaMode): AdvancedDnaControlsState {
  return {
    mode,
    speed: 0.8,
    intensity: 0.9,
    mutationLevel: 0.82,
    particleDensity: 0.45,
    symmetry: 12,
    cameraDepth: 1,
    dimension: 4,
    playing: true,
    performanceMode: "performance",
    animationNonce: 0,
  };
}

describe("advanced DNA renderers", () => {
  it("uses a distinct drawing language for every interpretation", () => {
    const results = new Map<AdvancedDnaMode, Map<string, number>>();

    for (const mode of ["sigil", "cascade", "fourD", "vortex"] as const) {
      const { context, calls } = recordingContext();
      const renderer = createDnaModeRenderer(mode, model, 0);
      const frame: RenderFrame = {
        ctx: context,
        width: 720,
        height: 560,
        time: 4.2,
        delta: 1 / 30,
        controls: controls(mode),
        interaction: {
          yaw: 0.2,
          pitch: -0.1,
          zoom: 1,
          distortion: 0.12,
          focusGroup: 4,
          pulseStartedAt: 3.9,
          pointerX: 0.6,
          pointerY: 0.4,
        },
        performance: {
          dprCap: 1,
          densityScale: 0.5,
          blurScale: 0,
          trailAlpha: 0.24,
          recursion: 1,
          targetFps: 30,
        },
        reducedMotion: false,
      };
      renderer.render(frame);
      renderer.dispose();
      results.set(mode, calls);
    }

    expect(results.get("sigil")?.get("arc")).toBeGreaterThan(20);
    expect(results.get("cascade")?.get("bezierCurveTo")).toBeGreaterThanOrEqual(
      12,
    );
    expect(results.get("fourD")?.get("setLineDash")).toBeGreaterThan(20);
    expect(results.get("vortex")?.get("ellipse")).toBeGreaterThanOrEqual(12);
    expect(results.get("vortex")?.get("quadraticCurveTo")).toBeGreaterThan(0);

    const signatures = [...results.values()].map((calls) =>
      [
        "arc",
        "bezierCurveTo",
        "setLineDash",
        "ellipse",
        "quadraticCurveTo",
        "fillText",
      ]
        .map((key) => calls.get(key) ?? 0)
        .join(":"),
    );
    expect(new Set(signatures).size).toBe(4);
  });
});
