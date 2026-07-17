import { fireEvent, render } from "@testing-library/react";
import { useRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTouchNervousSystem, type TouchNervousSystemInputs } from "./useTouchNervousSystem";

function Harness(props: Partial<TouchNervousSystemInputs> & { onGesture?: (g: "tap" | "hold" | "swipe") => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const nervousSystem = useTouchNervousSystem({ stageRef, ...props });
  return (
    <div
      ref={stageRef}
      data-testid="stage"
      data-state={nervousSystem.state}
      style={nervousSystem.stageStyle}
      {...nervousSystem.pointerHandlers}
    />
  );
}

beforeEach(() => {
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
});

describe("useTouchNervousSystem — DOM wiring", () => {
  it("preserves normal vertical page scrolling via touch-action: pan-y", () => {
    const { getByTestId } = render(<Harness />);
    expect(getByTestId("stage")).toHaveStyle({ touchAction: "pan-y" });
  });

  it("captures the pointer on deliberate contact (pointerdown)", () => {
    const { getByTestId } = render(<Harness />);
    const stage = getByTestId("stage");
    fireEvent.pointerDown(stage, { pointerId: 1, clientX: 10, clientY: 10 });
    expect(stage.setPointerCapture).toHaveBeenCalledWith(1);
  });

  it("releases the pointer on pointerup", () => {
    const { getByTestId } = render(<Harness />);
    const stage = getByTestId("stage");
    fireEvent.pointerDown(stage, { pointerId: 2, clientX: 10, clientY: 10 });
    fireEvent.pointerUp(stage, { pointerId: 2, clientX: 11, clientY: 11 });
    expect(stage.releasePointerCapture).toHaveBeenCalledWith(2);
  });

  it("a short, low-travel press-and-release fires a tap gesture", () => {
    const onGesture = vi.fn();
    const { getByTestId } = render(<Harness onGesture={onGesture} />);
    const stage = getByTestId("stage");
    fireEvent.pointerDown(stage, { pointerId: 3, clientX: 10, clientY: 10 });
    fireEvent.pointerUp(stage, { pointerId: 3, clientX: 11, clientY: 10 });
    expect(onGesture).toHaveBeenCalledWith("tap");
  });

  it("a sealed pet ignores pointerdown entirely — no capture, no gesture", () => {
    const onGesture = vi.fn();
    const { getByTestId } = render(<Harness sealed onGesture={onGesture} />);
    const stage = getByTestId("stage");
    fireEvent.pointerDown(stage, { pointerId: 4, clientX: 10, clientY: 10 });
    fireEvent.pointerUp(stage, { pointerId: 4, clientX: 10, clientY: 10 });
    expect(stage.setPointerCapture).not.toHaveBeenCalled();
    expect(onGesture).not.toHaveBeenCalled();
  });

  it("does not throw under prefers-reduced-motion", () => {
    expect(() => render(<Harness reducedMotion />)).not.toThrow();
  });
});
