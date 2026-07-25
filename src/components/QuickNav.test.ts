import { describe, expect, it } from "vitest";

import {
  CORE_QUICK_NAV_ITEMS,
  SCHOOLS_QUICK_NAV_ITEMS,
} from "@/components/QuickNav";

describe("QuickNav items", () => {
  it("keeps the core bottom nav focused on the main ladder", () => {
    const hrefs = CORE_QUICK_NAV_ITEMS.map((item) => item.href);

    expect(hrefs).toEqual([
      "/",
      "/pet",
      "/app/activities",
      "/app/wellness",
      "/schools",
      "/identity",
    ]);
    expect(hrefs).not.toContain("/moss60");
  });

  it("points the core School item at the school doorway, not the runtime", () => {
    const school = CORE_QUICK_NAV_ITEMS.find((item) => item.label === "School");
    expect(school?.href).toBe("/schools");
  });

  it("keeps the schools nav to the approved Field Mode primary destinations", () => {
    const hrefs = SCHOOLS_QUICK_NAV_ITEMS.map((item) => item.href);
    const labels = SCHOOLS_QUICK_NAV_ITEMS.map((item) => item.label);

    expect(hrefs).toEqual([
      "/schools/field",
      "/schools/field/lessons",
      "/schools/field/classroom",
      "/schools/field/guide",
      "/schools/field/safety",
    ]);
    expect(labels).toEqual([
      "Field Home",
      "Lessons",
      "Classroom",
      "Teacher Guide",
      "Safety & Privacy",
    ]);
    expect(hrefs).not.toContain("/");
    expect(hrefs).not.toContain("/pet");
    expect(hrefs).not.toContain("/app/activities");
    expect(labels).not.toContain("Explore");
    expect(labels).not.toContain("School");
  });
});
