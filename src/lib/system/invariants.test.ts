import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type InvariantIssueType,
  createInvariantIssue,
  shouldSealSystem,
} from "./invariants";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("system invariants", () => {
  it("creates issues with the current timestamp by default", () => {
    const timestamp = 1_701_234_567_890;
    vi.spyOn(Date, "now").mockReturnValue(timestamp);

    const issue = createInvariantIssue("ambiguity", "Signal collapsed");

    expect(issue).toEqual({
      type: "ambiguity",
      message: "Signal collapsed",
      detectedAt: timestamp,
    });
  });

  it("respects an explicit timestamp override", () => {
    const issue = createInvariantIssue("contradiction", "State mismatch", 42);

    expect(issue.detectedAt).toBe(42);
  });

  it("seals when any critical issue type is present", () => {
    const types: InvariantIssueType[] = [
      "inability",
      "ambiguity",
      "contradiction",
    ];

    for (const type of types) {
      expect(
        shouldSealSystem([createInvariantIssue(type, `${type} detected`, 1)]),
      ).toBe(true);
    }
  });

  it("does not seal when no issues are present", () => {
    expect(shouldSealSystem([])).toBe(false);
  });
});
