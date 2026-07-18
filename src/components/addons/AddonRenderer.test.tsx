import { fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Addon } from "@/lib/addons/types";
import { AddonRenderer } from "./AddonRenderer";

function makeAddon(overrides: Partial<Addon> = {}): Addon {
  return {
    id: "hat-1",
    name: "Test Hat",
    description: "",
    category: "headwear",
    rarity: "common",
    attachment: {
      anchorPoint: "head",
      offset: { x: 0, y: -10 },
      scale: 1,
      rotation: 0,
      followAnimation: true,
    },
    visual: { colors: { primary: "#fff" } },
    ownership: {
      ownerPublicKey: "",
      signature: "",
      issuedAt: 0,
      issuerPublicKey: "",
      issuerSignature: "",
      nonce: "",
    },
    metadata: { creator: "test", createdAt: 0 },
    ...overrides,
  };
}

beforeEach(() => {
  // jsdom/happy-dom don't implement pointer capture.
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
});

describe("AddonRenderer — Arrange Mode gating", () => {
  it("outside Arrange Mode, a tap fires onTap and never repositions", () => {
    const onTap = vi.fn();
    const onPositionChange = vi.fn();
    const { getByTestId } = render(
      <svg>
        <AddonRenderer
          addon={makeAddon()}
          draggable={false}
          onTap={onTap}
          onPositionChange={onPositionChange}
        />
      </svg>,
    );
    const root = getByTestId("addon-renderer-root");

    fireEvent.pointerDown(root, { clientX: 50, clientY: 50 });
    fireEvent.pointerUp(root, { clientX: 51, clientY: 51 });

    expect(onTap).toHaveBeenCalledTimes(1);
    expect(onPositionChange).not.toHaveBeenCalled();
  });

  it("outside Arrange Mode, a drag-like gesture does not fire onTap (travel exceeds the tap threshold)", () => {
    const onTap = vi.fn();
    const { getByTestId } = render(
      <svg>
        <AddonRenderer addon={makeAddon()} draggable={false} onTap={onTap} />
      </svg>,
    );
    const root = getByTestId("addon-renderer-root");

    fireEvent.pointerDown(root, { clientX: 50, clientY: 50 });
    fireEvent.pointerUp(root, { clientX: 90, clientY: 90 });

    expect(onTap).not.toHaveBeenCalled();
  });

  it("in Arrange Mode, dragging repositions using the stageRef-measured scale factor (no global DOM lookup)", () => {
    const onPositionChange = vi.fn();
    const stageRef = { current: null as SVGSVGElement | null };

    const { container } = render(
      <svg
        ref={(el) => {
          stageRef.current = el;
        }}
      >
        <AddonRenderer
          addon={makeAddon()}
          draggable
          positionOverride={{ x: 0, y: 0, locked: false }}
          onPositionChange={onPositionChange}
          stageRef={stageRef}
          viewBoxWidth={280}
        />
      </svg>,
    );
    const svgEl = container.querySelector("svg") as SVGSVGElement;
    svgEl.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 140, height: 140 }) as DOMRect; // half of the 280 viewBox -> scale factor 2

    const root = container.querySelector('[data-testid="addon-renderer-root"]') as SVGGElement;
    fireEvent.pointerDown(root, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(window, { clientX: 110, clientY: 105 });

    expect(onPositionChange).toHaveBeenCalledWith(20, 10); // dx=10*2, dy=5*2
  });

  it("a locked item in Arrange Mode never starts a drag", () => {
    const onPositionChange = vi.fn();
    const { getByTestId } = render(
      <svg>
        <AddonRenderer
          addon={makeAddon()}
          draggable
          positionOverride={{ x: 0, y: 0, locked: true }}
          onPositionChange={onPositionChange}
        />
      </svg>,
    );
    const root = getByTestId("addon-renderer-root");

    fireEvent.pointerDown(root, { clientX: 50, clientY: 50 });
    fireEvent.pointerMove(window, { clientX: 90, clientY: 90 });

    expect(onPositionChange).not.toHaveBeenCalled();
  });

  it("Arrange Mode controls (lock/reset) render immediately, with no hover interaction required", () => {
    const { container } = render(
      <svg>
        <AddonRenderer addon={makeAddon()} draggable positionOverride={{ x: 0, y: 0, locked: false }} />
      </svg>,
    );
    // No mouseenter/hover event fired — controls must already be present.
    expect(container.querySelector(".addon-controls")).toBeTruthy();
  });

  it("controls are absent outside Arrange Mode", () => {
    const { container } = render(
      <svg>
        <AddonRenderer addon={makeAddon()} draggable={false} />
      </svg>,
    );
    expect(container.querySelector(".addon-controls")).toBeNull();
  });
});
