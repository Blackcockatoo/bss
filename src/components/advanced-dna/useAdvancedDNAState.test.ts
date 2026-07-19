import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAdvancedDNAState } from "./useAdvancedDNAState";

describe("useAdvancedDNAState", () => {
  it("pauses when reduced motion becomes active but honors explicit play", () => {
    const { result, rerender } = renderHook(
      ({ reducedMotion }) => useAdvancedDNAState(reducedMotion),
      { initialProps: { reducedMotion: false } },
    );

    expect(result.current.controls.playing).toBe(true);
    rerender({ reducedMotion: true });
    expect(result.current.controls.playing).toBe(false);

    act(() => result.current.togglePlaying());
    expect(result.current.controls.playing).toBe(true);
  });
});
