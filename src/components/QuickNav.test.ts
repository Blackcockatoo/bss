import { describe, expect, it } from "vitest";

import {
  CORE_QUICK_NAV_ITEMS,
  SCHOOLS_QUICK_NAV_ITEMS,
  TEACHER_QUICK_NAV_ITEMS,
} from "@/components/QuickNav";

describe("QuickNav items", () => {
  it("keeps the explorer bottom nav focused on the companion ladder", () => {
    const hrefs = CORE_QUICK_NAV_ITEMS.map((item) => item.href);

    expect(hrefs).toEqual(["/", "/pet", "/app/activities", "/identity"]);
    expect(hrefs).not.toContain("/moss60");
  });

  it("keeps the teacher-mode nav on the school surface plus home", () => {
    const hrefs = TEACHER_QUICK_NAV_ITEMS.map((item) => item.href);

    expect(hrefs).toEqual([
      "/",
      "/schools",
      "/school-game",
      "/schools/parents",
      "/legal/privacy",
    ]);
  });

  it("keeps the schools nav constrained to the school surface", () => {
    const hrefs = SCHOOLS_QUICK_NAV_ITEMS.map((item) => item.href);

    expect(hrefs).toEqual(["/schools", "/school-game", "/legal/privacy"]);
    expect(hrefs).not.toContain("/");
    expect(hrefs).not.toContain("/pet");
  });
});
