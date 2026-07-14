import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MOVEMENT_CLIPS } from "@/pet/movement";
import { MovementParade, PARADE_BODIES } from "./MovementParade";

describe("MovementParade dev harness", () => {
  it("cycles through the entire movement vocabulary", () => {
    render(<MovementParade />);
    const clipCount = Object.keys(MOVEMENT_CLIPS).length;
    const seen = new Set<string>();
    for (let index = 0; index < clipCount; index += 1) {
      const idNode = screen
        .getByTestId("movement-parade")
        .querySelector(".font-mono.text-\\[10px\\]");
      if (idNode?.textContent) seen.add(idNode.textContent);
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
    }
    expect(seen.size).toBe(clipCount);
  });

  it("flags wing fallbacks on wingless bodies and supports reduced motion", () => {
    render(<MovementParade />);
    // Jump to the wingless body.
    const winglessIndex = PARADE_BODIES.findIndex(
      (body) => !body.spec.features.includes("wings"),
    );
    expect(winglessIndex).toBeGreaterThanOrEqual(0);
    fireEvent.click(
      screen.getByRole("button", {
        name: PARADE_BODIES[winglessIndex].label,
      }),
    );
    // Walk to a wing-dependent clip.
    while (
      !screen
        .getByTestId("movement-parade")
        .textContent?.includes("wing_flutter")
    ) {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
    }
    expect(
      screen.getByText(/no wings — fallback active/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reduced motion" }));
    expect(
      screen.getByRole("button", { name: "Reduced motion: on" }),
    ).toBeInTheDocument();
  });

  it("exposes several representative bodies covering all wing purposes", () => {
    const purposes = new Set(
      PARADE_BODIES.filter((body) => body.spec.features.includes("wings")).map(
        (body) => body.spec.wingPurpose,
      ),
    );
    expect(purposes).toEqual(
      new Set(["flight", "attack", "attract", "defend", "decorative"]),
    );
    const styles = new Set(PARADE_BODIES.map((body) => body.spec.wingStyle));
    expect(styles.has("feather")).toBe(true);
    expect(styles.has("moth")).toBe(true);
    expect(styles.has("blade")).toBe(true);
    expect(styles.has("veil")).toBe(true);
  });
});
