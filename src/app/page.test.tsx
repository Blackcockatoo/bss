import { render, screen, within } from "@testing-library/react";
import HomePage from "./page";

describe("landing page navigation structure", () => {
  it("keeps nav/section ids aligned with the seven chamber model", () => {
    const { container } = render(<HomePage />);

    const expectedNavIds = [
      "parents",
      "schools",
      "veil",
      "schoolDocs",
      "investors",
      "strategy",
      "ads",
    ] as const;
    const nav = container.querySelector("nav");
    expect(nav).not.toBeNull();

    for (const id of expectedNavIds) {
      expect(container.querySelector(`section#${id}`)).toBeInTheDocument();
      expect(
        (nav as HTMLElement).querySelector(`a[href="#${id}"]`),
      ).toBeInTheDocument();
    }

    expect(
      (nav as HTMLElement).querySelector('a[href="/pet"]'),
    ).toBeInTheDocument();

    expect(
      within(nav as HTMLElement).getByRole("link", { name: /school docs/i }),
    ).toBeInTheDocument();

    for (let chamber = 1; chamber <= 7; chamber += 1) {
      const chamberLabel = `Chamber ${String(chamber).padStart(2, "0")}`;
      const chamberMatches = screen.getAllByText(new RegExp(chamberLabel, "i"));
      expect(chamberMatches.length).toBeGreaterThan(0);

      for (const chamberMatch of chamberMatches) {
        expect(chamberMatch).toBeVisible();
      }
    }
  });
});
