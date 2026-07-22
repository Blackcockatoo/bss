import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import FieldModePage from "@/app/schools/field/page";

afterEach(cleanup);

describe("Field Mode entry", () => {
  it("identifies the Australian Years 3–6 classroom product", () => {
    render(<FieldModePage />);
    expect(
      screen.getByRole("heading", {
        name: /MetaPet Field Mode — Australian Schools/i,
      }),
    ).toBeTruthy();

    for (const promise of [
      /Years 3–6/i,
      /Teacher-led use/i,
      /Seven short classroom lessons/i,
      /No student accounts/i,
      /Alias-only classroom use/i,
      /Local device records/i,
      /Australian Curriculum alignment/i,
    ]) {
      expect(screen.getAllByText(promise).length).toBeGreaterThan(0);
    }
  });

  it("has one primary launch action into the approved Field start route", () => {
    render(<FieldModePage />);
    const action = screen.getByRole("link", { name: /Start Field Mode/i });
    expect(action).toHaveAttribute("href", "/schools/field/start");
  });
});
