import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LandingPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/landing",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/steering", () => ({
  SteeringWheel: () => null,
}));

describe("landing page navigation structure", () => {
  it("keeps nav/section ids aligned with the eight chamber model", () => {
    const { container } = render(<LandingPage />);

    const expectedNavIds = [
      "parents",
      "schools",
      "veil",
      "elevator",
      "schoolDocs",
      "investors",
      "strategy",
      "ads",
    ] as const;
    const nav = container.querySelector("nav");
    expect(nav).not.toBeNull();

    for (const id of expectedNavIds) {
      expect(container.querySelector(`section#${id}`)).not.toBeNull();
      expect(
        (nav as HTMLElement).querySelector(`a[href="#${id}"]`),
      ).not.toBeNull();
    }

    expect((nav as HTMLElement).querySelector('a[href="/pet"]')).not.toBeNull();

    expect(
      (nav as HTMLElement).querySelector('a[href="/compass"]'),
    ).not.toBeNull();

    expect(
      (nav as HTMLElement).querySelector('a[href="#compass-wheel"]'),
    ).not.toBeNull();

    expect(
      within(nav as HTMLElement).getByRole("link", { name: /school docs/i }),
    ).toBeTruthy();

    for (let chamber = 1; chamber <= 8; chamber += 1) {
      const chamberLabel = `Chamber ${String(chamber).padStart(2, "0")}`;
      const chamberMatches = screen.getAllByText(new RegExp(chamberLabel, "i"));
      expect(chamberMatches.length).toBeGreaterThan(0);

      for (const chamberMatch of chamberMatches) {
        expect(chamberMatch).toBeTruthy();
      }
    }
  });
});
