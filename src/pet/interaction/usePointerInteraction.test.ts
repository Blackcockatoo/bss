import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePointerInteraction } from "./usePointerInteraction";

describe("usePointerInteraction", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("mounts idle with a neutral overlay and stable bind handlers", () => {
    const { result } = renderHook(() =>
      usePointerInteraction({ reduceMotion: false }),
    );

    expect(result.current.state).toBe("idle");
    expect(result.current.overlay).toEqual({
      leanX: 0,
      leanY: 0,
      headTiltBias: 0,
      mouthBias: 0,
      eyelidBias: 0,
      intensity: 0,
    });
    expect(typeof result.current.bind.onPointerDown).toBe("function");
    expect(typeof result.current.bind.onPointerUp).toBe("function");
  });

  it("never throws when a full pointer down/move/up cycle runs, sealed or not", () => {
    for (const sealed of [false, true]) {
      const onGesture = vi.fn();
      const { result } = renderHook(() =>
        usePointerInteraction({ reduceMotion: true, sealed, onGesture }),
      );

      const rect = { left: 0, top: 0, width: 200, height: 200 } as DOMRect;
      const target = {
        setPointerCapture: vi.fn(),
        releasePointerCapture: vi.fn(),
        getBoundingClientRect: () => rect,
      };

      expect(() => {
        act(() => {
          result.current.bind.onPointerDown({
            currentTarget: target,
            pointerId: 1,
            pointerType: "touch",
            clientX: 100,
            clientY: 100,
          } as unknown as React.PointerEvent<HTMLElement>);
          result.current.bind.onPointerMove({
            currentTarget: target,
            pointerId: 1,
            pointerType: "touch",
            clientX: 110,
            clientY: 95,
          } as unknown as React.PointerEvent<HTMLElement>);
          result.current.bind.onPointerUp({
            currentTarget: target,
            pointerId: 1,
            pointerType: "touch",
            clientX: 110,
            clientY: 95,
          } as unknown as React.PointerEvent<HTMLElement>);
        });
      }).not.toThrow();

      if (!sealed) {
        expect(target.setPointerCapture).toHaveBeenCalledWith(1);
      } else {
        expect(target.setPointerCapture).not.toHaveBeenCalled();
      }
    }
  });
});
