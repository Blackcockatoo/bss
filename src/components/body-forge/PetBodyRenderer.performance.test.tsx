import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DEFAULT_VITALS } from "@/vitals";
import {
  NEUTRAL_PERFORMANCE,
  resolveBodyPerformance,
} from "@/pet/performance";
import { interpretMovement } from "@/pet/movement";
import { DEFAULT_BODY_SPEC, PetBodyRenderer } from "./PetBodyRenderer";

const LIVING = resolveBodyPerformance({ vitals: DEFAULT_VITALS });

const BODY_CONTEXT = {
  hasWings: true,
  wingStyle: DEFAULT_BODY_SPEC.wingStyle,
  wingPurpose: DEFAULT_BODY_SPEC.wingPurpose,
  hasThirdEye: true,
  hasTailFlame: true,
  hasHorns: false,
  hasCrown: false,
} as const;

describe("PetBodyRenderer performance layer", () => {
  it("renders identically with and without a null performance prop", () => {
    const plain = render(
      <PetBodyRenderer spec={DEFAULT_BODY_SPEC} animate={false} />,
    );
    const withNull = render(
      <PetBodyRenderer
        spec={DEFAULT_BODY_SPEC}
        animate={false}
        performance={null}
        living={null}
        activeClipId={null}
      />,
    );
    // useId differs between mounts; normalise generated ids before diffing.
    const normalise = (html: string) =>
      html.replace(/body-(pattern|glow|grain)-[^"()]+/g, "body-$1-X");
    expect(normalise(withNull.container.innerHTML)).toBe(
      normalise(plain.container.innerHTML),
    );
  });

  it("never mutates the stored BodySpec, even while performing", () => {
    const spec = Object.freeze({
      ...DEFAULT_BODY_SPEC,
      features: Object.freeze([...DEFAULT_BODY_SPEC.features]),
    }) as typeof DEFAULT_BODY_SPEC;
    const snapshot = JSON.stringify(spec);
    const frame = interpretMovement("black_wing_bloom", 0.5, {
      body: BODY_CONTEXT,
      performance: LIVING,
      intensity: 1,
      reducedMotion: false,
      seed: 7,
    });
    expect(() =>
      render(
        <PetBodyRenderer
          spec={spec}
          performance={frame}
          living={LIVING}
          activeClipId="black_wing_bloom"
        />,
      ),
    ).not.toThrow();
    expect(JSON.stringify(spec)).toBe(snapshot);
  });

  it("draws phase echoes and shadow enclosure only when the frame asks", () => {
    const neutral = render(
      <PetBodyRenderer
        spec={DEFAULT_BODY_SPEC}
        performance={{ ...NEUTRAL_PERFORMANCE }}
      />,
    );
    const neutralPaths = neutral.container.querySelectorAll("path").length;

    const echoFrame = {
      ...NEUTRAL_PERFORMANCE,
      phaseEchoes: 2,
      shadowEnclosure: 0.5,
    };
    const echoed = render(
      <PetBodyRenderer spec={DEFAULT_BODY_SPEC} performance={echoFrame} />,
    );
    const echoedPaths = echoed.container.querySelectorAll("path").length;
    // Two echo silhouettes add two extra body paths.
    expect(echoedPaths).toBeGreaterThan(neutralPaths);
  });

  it("keeps the same silhouette markup between preview and performing modes", () => {
    const still = render(
      <PetBodyRenderer spec={DEFAULT_BODY_SPEC} animate={false} />,
    );
    const performing = render(
      <PetBodyRenderer
        spec={DEFAULT_BODY_SPEC}
        performance={{ ...NEUTRAL_PERFORMANCE }}
        living={LIVING}
      />,
    );
    // The inherited silhouette path (the identity) must be byte-identical.
    const silhouette = (root: HTMLElement) =>
      root.querySelector("svg g g path[fill^='url']")?.getAttribute("d") ??
      root.querySelector("svg path[fill^='url']")?.getAttribute("d");
    expect(silhouette(performing.container)).toBe(
      silhouette(still.container),
    );
  });
});
