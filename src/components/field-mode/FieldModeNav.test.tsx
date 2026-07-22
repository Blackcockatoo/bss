import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FIELD_MODE_NAV_ITEMS } from "@/lib/childSafeBaseline";
import { FieldModeNav } from "./FieldModeNav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/schools/field/lessons",
}));

afterEach(cleanup);

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
