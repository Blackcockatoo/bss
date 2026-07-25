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

  it("presents the recommended school homepage CTA order with destination-specific labels", () => {
    render(<FieldModePage />);

    const links = [
      "Browse Lessons",
      "Open Classroom",
      "Teacher Guide",
      "Safety & Privacy",
    ].map((name) => screen.getByRole("link", { name }));

    expect(links.map((link) => link.textContent?.trim())).toEqual([
      "Browse Lessons",
      "Open Classroom",
      "Teacher Guide",
      "Safety & Privacy",
    ]);
    expect(links[0]).toHaveAttribute("href", "/schools/field/start");
    expect(links[1]).toHaveAttribute("href", "/schools/field/classroom");
    expect(links[2]).toHaveAttribute("href", "/schools/field/guide");
    expect(links[3]).toHaveAttribute("href", "/schools/field/safety");

    // No vague "Explore" CTA and no more than one destination per target.
    expect(screen.queryByRole("link", { name: /^Explore$/i })).not.toBeInTheDocument();
    const hrefs = links.map((link) => link.getAttribute("href"));
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
