import { describe, it, expect } from "vitest";
import { parseNumberList } from "./numberList";
describe("Live numeric editors", () => {
  it("accepts decimal whole sequences and fractional rhythms", () => {
    expect(parseNumberList("1, 3 5, 7", "sequence")).toEqual([1, 3, 5, 7]);
    expect(parseNumberList("0.25, 0.5, 1, 2", "rhythm")).toEqual([
      0.25, 0.5, 1, 2,
    ]);
  });
  it("blocks malformed, overflowing and partial drafts instead of using older numbers", () => {
    for (const text of [
      "",
      "1",
      "1, nope",
      "0x10, 2",
      "1e2, 2",
      "1, 25",
      "1, Infinity",
    ])
      expect(parseNumberList(text, "sequence")).toBeNull();
    expect(parseNumberList("1, 3", "rhythm")).toBeNull();
  });
});
