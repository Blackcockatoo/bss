import { describe, expect, it } from "vitest";

import { QUICK_NAV_ITEMS } from "@/components/QuickNav";

describe("QuickNav items", () => {
  it("keeps the primary bottom nav focused on the main ladder", () => {
    const hrefs = QUICK_NAV_ITEMS.map((item) => item.href);

    expect(hrefs).toEqual(["/", "/pet", "/school-game", "/identity"]);
    expect(hrefs).not.toContain("/moss60");
  });
});
