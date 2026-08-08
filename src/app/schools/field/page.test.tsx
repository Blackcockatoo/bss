import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import FieldModePage from "@/app/schools/field/page";

afterEach(cleanup);

describe("Field Mode entry", () => {
  it("identifies the Australian Years 3–6 classroom product", () => {
    render(<FieldModePage />);
    expect(
      screen.getByRole("heading", {
        name: /Creative technology that gives attention back/i,
      }),
    ).toBeTruthy();
    expect(screen.getAllByText(/MetaPet School/i).length).toBeGreaterThan(0);

    for (const promise of [
      /Years 3–6/i,
      /Teacher-led use/i,
      /Seven short classroom lessons/i,
      /No student accounts/i,
      /No advertising or trackers/i,
      /Optional alias-only local records/i,
      /Complete Field Mode free/i,
      /Australian Curriculum alignment/i,
    ]) {
      expect(screen.getAllByText(promise).length).toBeGreaterThan(0);
    }
  });

  it("has one primary launch action into the approved Field start route", () => {
    render(<FieldModePage />);
    const action = screen.getByRole("link", {
      name: /Start teaching/i,
    });
    expect(action).toHaveAttribute("href", "/schools/field/start");
  });

  it("presents Blue $nake Studio as the maker, not the headline brand", () => {
    render(<FieldModePage />);
    const heading = screen.getByRole("heading", {
      name: /Creative technology that gives attention back/i,
    });
    expect(heading.textContent).not.toMatch(/Blue \$nake Studio/i);

    const maker = screen.getByRole("link", { name: /Blue \$nake Studio/i });
    expect(maker).toHaveAttribute("href", "https://www.bluesnakestudios.com");
  });
});
