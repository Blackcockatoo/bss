import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { generateFounderCoatOfArms } from "@/lib/lineage";
import { CoatOfArmsRenderer } from "./CoatOfArmsRenderer";

describe("CoatOfArmsRenderer", () => {
  it("isolates every gradient, clip and title when shields share a page", () => {
    const coat = generateFounderCoatOfArms("one", 45);
    const { container } = render(
      <>
        <CoatOfArmsRenderer
          coatOfArms={{ ...coat, division: "per-bend" }}
          label="One shield"
        />
        <CoatOfArmsRenderer
          coatOfArms={{ ...coat, division: "per-saltire" }}
          label="Two shield"
        />
      </>,
    );
    expect(screen.getByRole("img", { name: "One shield" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Two shield" })).toBeInTheDocument();
    const ids = [...container.querySelectorAll("[id]")].map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const svg of container.querySelectorAll("svg")) {
      const markup = svg.outerHTML;
      for (const match of markup.matchAll(/url\(#([^)]*)\)/g))
        expect(svg.querySelector(`[id="${match[1]}"]`)).not.toBeNull();
    }
  });
});
