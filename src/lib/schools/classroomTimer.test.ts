import { describe, expect, it } from "vitest";

import { formatCountdown, remainingSeconds } from "./classroomTimer";

describe("classroom timer", () => {
  it("formats and clamps remaining time", () => {
    expect(formatCountdown(2 * 60)).toBe("02:00");
    expect(formatCountdown(75)).toBe("01:15");
    expect(formatCountdown(0)).toBe("00:00");
    expect(formatCountdown(-3)).toBe("00:00");
    expect(remainingSeconds(10_000, 4_000)).toBe(6);
    expect(remainingSeconds(10_000, 12_000)).toBe(0);
  });
});
