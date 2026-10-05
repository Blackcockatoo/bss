import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FIELD_MODE_NAV_ITEMS } from "@/lib/childSafeBaseline";
import { FieldModeNav } from "./FieldModeNav";

const location = vi.hoisted(() => ({ pathname: "/schools/field/lessons" }));
vi.mock("next/navigation", () => ({
  usePathname: () => location.pathname,
}));

afterEach(() => { cleanup(); location.pathname = "/schools/field/lessons"; });

describe("Field Mode navigation", () => {
  it("renders exactly the approved declarative navigation destinations", () => {
    render(<FieldModeNav />);
    const hrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));

    expect(new Set(hrefs)).toEqual(
      new Set(FIELD_MODE_NAV_ITEMS.map((item) => item.href)),
    );
  });

  it("does not expose consumer route categories", () => {
    render(<FieldModeNav />);
    const hrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href") ?? "");
    expect(hrefs.some((href) => /shop|wallet|market|breed|identity|qr|ritual|alchem|social|share/.test(href))).toBe(false);
  });
});

it("gives student activities a separate navigation without teacher destinations", () => {
  location.pathname = "/schools/field/play/meet-the-system";
  render(<FieldModeNav />);
  expect(screen.getAllByRole("link").map(link => link.getAttribute("href"))).toEqual([
    "/schools/field/play", "/schools/field/play/passport",
  ]);
  expect(screen.queryByText("Teacher Guide")).toBeNull();
  expect(screen.queryByText("Classroom")).toBeNull();
});
