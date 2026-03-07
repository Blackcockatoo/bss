import { render, screen, within } from "@testing-library/react";
import { vi } from "vitest";
import HomePage from "./page";

// Mock Next.js navigation hooks that use React context unavailable in the test environment
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// SteeringWheel renders a Canvas-based compass that calls useRouter internally.
// Mock it at the module boundary to avoid the "multiple React copies" error
// caused by bss/node_modules having its own React version.
vi.mock("@/components/steering", () => ({
  SteeringWheel: () => null,
}));

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
      (nav as HTMLElement).querySelector('a[href="/compass"]'),
    ).toBeInTheDocument();

    expect(
      (nav as HTMLElement).querySelector('a[href="#compass-wheel"]'),
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
