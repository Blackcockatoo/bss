import { describe, expect, it } from "vitest";

import {
  CORE_QUICK_NAV_ITEMS,
  SCHOOLS_QUICK_NAV_ITEMS,
} from "@/components/QuickNav";

describe("QuickNav items", () => {
  it("keeps the core bottom nav focused on the main ladder", () => {
    const hrefs = CORE_QUICK_NAV_ITEMS.map((item) => item.href);

    expect(hrefs).toEqual(["/", "/pet", "/school-game", "/identity"]);
    expect(hrefs).not.toContain("/moss60");
  });

  it("keeps the schools nav constrained to the school surface", () => {
    const hrefs = SCHOOLS_QUICK_NAV_ITEMS.map((item) => item.href);

    expect(hrefs).toEqual(["/schools", "/school-game", "/legal/privacy"]);
    expect(hrefs).not.toContain("/");
    expect(hrefs).not.toContain("/pet");
  });
});
