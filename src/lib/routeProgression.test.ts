import { describe, expect, it } from "vitest";

import {
  ROUTE_PROGRESSION_SEQUENCE,
  getRouteProgression,
} from "@/lib/routeProgression";

describe("route progression", () => {
  it("preserves the intended main ladder order", () => {
    expect(ROUTE_PROGRESSION_SEQUENCE).toEqual([
      "pet",
      "school",
      "identity",
      "dna",
    ]);
  });

  it("links identity forward into DNA and keeps MOSS60 as advanced", () => {
    const identity = getRouteProgression("identity");
    const dna = getRouteProgression("dna");

    expect(identity.next?.href).toBe("/digital-dna");
    expect(identity.advanced?.href).toBe("/app/moss60");
    expect(dna.next).toBeUndefined();
    expect(dna.advanced?.href).toBe("/app/moss60");
  });
});
